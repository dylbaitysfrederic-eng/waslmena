import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import { unstable_noStore as noStore } from 'next/cache';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { db } from '@/libs/DB';
import {
  menuItemSchema,
  orderItemSchema,
  orderSchema,
  organizationSchema,
  restaurantTableSchema,
} from '@/models/Schema';

import { AutoPrintTicket } from './AutoPrintTicket';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const parseOrderId = (value: string) => {
  const orderId = Number.parseInt(value, 10);

  return Number.isNaN(orderId) ? null : orderId;
};

const formatUsdCents = (amount: number, locale: string) => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
  }).format(amount / 100);
};

const formatLocalCurrency = (
  amount: number,
  locale: string,
  localCurrencyLabel: string,
) => {
  return `${new Intl.NumberFormat(locale).format(amount)} ${localCurrencyLabel}`;
};

const formatDateTime = (date: Date, locale: string) => {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

const getOrderStatusLabelKey = (status: string) => {
  if (status === 'validated') {
    return 'status_confirmed';
  }

  if (status === 'served' || status === 'delivered') {
    return 'status_completed';
  }

  return `status_${status}`;
};

const TicketPage = async (props: {
  params: {
    locale: string;
    orderId: string;
  };
}) => {
  noStore();

  const { orgId } = await auth();
  const orderId = parseOrderId(props.params.orderId);
  const t = await getTranslations('Orders');

  if (!orgId || orderId === null) {
    notFound();
  }

  const [order] = await db
    .select({
      id: orderSchema.id,
      tableId: orderSchema.tableId,
      tableNumber: restaurantTableSchema.tableNumber,
      customerName: orderSchema.customerName,
      customerNote: orderSchema.customerNote,
      status: orderSchema.status,
      paymentMethod: orderSchema.paymentMethod,
      totalUsdCents: orderSchema.totalUsdCents,
      totalLbp: orderSchema.totalLbp,
      createdAt: orderSchema.createdAt,
      restaurantDisplayName: organizationSchema.restaurantDisplayName,
      restaurantAddress: organizationSchema.restaurantAddress,
      restaurantWhatsappNumber: organizationSchema.restaurantWhatsappNumber,
      enableWhatsappContact: organizationSchema.enableWhatsappContact,
      localCurrencyLabel: organizationSchema.localCurrencyLabel,
    })
    .from(orderSchema)
    .innerJoin(
      organizationSchema,
      eq(orderSchema.organizationId, organizationSchema.id),
    )
    .leftJoin(
      restaurantTableSchema,
      eq(orderSchema.tableId, restaurantTableSchema.id),
    )
    .where(
      and(
        eq(orderSchema.id, orderId),
        eq(orderSchema.organizationId, orgId),
      ),
    )
    .limit(1);

  if (!order) {
    notFound();
  }

  const orderItems = await db
    .select({
      orderId: orderItemSchema.orderId,
      orderItemId: orderItemSchema.id,
      quantity: orderItemSchema.quantity,
      customerNote: orderItemSchema.customerNote,
      unitPriceUsdCents: orderItemSchema.unitPriceUsdCents,
      unitPriceLbp: orderItemSchema.unitPriceLbp,
      itemName: menuItemSchema.name,
    })
    .from(orderItemSchema)
    .leftJoin(menuItemSchema, eq(orderItemSchema.menuItemId, menuItemSchema.id))
    .where(eq(orderItemSchema.orderId, order.id))
    .orderBy(orderItemSchema.id);

  const localCurrencyLabel = order.localCurrencyLabel ?? 'LL';
  const restaurantDisplayName = order.restaurantDisplayName ?? 'Restaurant';
  const orderSourceLabel = order.tableId === null
    ? t('general_menu_label')
    : order.tableNumber === null
      ? t('deleted_table')
      : t('table_label', { tableNumber: order.tableNumber });
  const orderTypeLabel = order.tableId === null
    ? t('ticket_order_type_counter')
    : t('ticket_order_type_table');
  const showWhatsapp = order.enableWhatsappContact !== false
    && Boolean(order.restaurantWhatsappNumber);
  const hasStoredTotal = order.totalUsdCents !== null || order.totalLbp !== null;
  const ticketId = `order-ticket-${order.id}`;

  return (
    <main className="min-h-screen bg-white text-black print:min-h-0">
      <style>
        {`
          @page {
            size: 80mm auto;
            margin: 4mm;
          }

          @media print {
            html,
            body {
              background: #fff !important;
              color: #000 !important;
            }
          }
        `}
      </style>
      <div className="mx-auto w-full max-w-[82mm] px-3 py-4 print:max-w-none print:p-0">
        <div className="mb-3 flex justify-center print:hidden">
          <AutoPrintTicket
            label={t('print_ticket_button')}
            ticketId={ticketId}
          />
        </div>

        <article
          id={ticketId}
          tabIndex={-1}
          className="mx-auto w-full max-w-[72mm] bg-white font-mono text-[12px] leading-tight text-black outline-none"
        >
          <header className="text-center">
            <div className="text-base font-black uppercase tracking-normal">
              {restaurantDisplayName}
            </div>
            {order.restaurantAddress && (
              <div className="mt-1 text-[11px]">{order.restaurantAddress}</div>
            )}
            {showWhatsapp && (
              <div className="mt-1 text-[11px]">
                {t('ticket_whatsapp', {
                  whatsappNumber: order.restaurantWhatsappNumber,
                })}
              </div>
            )}
          </header>

          <div className="my-3 border-t border-dashed border-black" />

          <section className="space-y-1">
            <div className="flex justify-between gap-3 text-base font-black">
              <span>{t('order_title', { orderId: order.id })}</span>
              <span>{t(getOrderStatusLabelKey(order.status))}</span>
            </div>
            <div>
              {t('ticket_sent_at')}
              {': '}
              {formatDateTime(order.createdAt, props.params.locale)}
            </div>
            <div>
              {t('ticket_order_type')}
              {': '}
              <span className="font-bold">{orderTypeLabel}</span>
            </div>
            <div>
              {orderSourceLabel}
            </div>
            <div>
              {t('payment_method_label', {
                paymentMethod: order.paymentMethod,
              })}
            </div>
            {order.customerName && (
              <div>
                {t('ticket_customer', { customerName: order.customerName })}
              </div>
            )}
          </section>

          {order.customerNote && (
            <section className="mt-3 border border-dashed border-black p-2">
              <div className="font-black">{t('ticket_order_note')}</div>
              <div className="mt-1 whitespace-pre-wrap">{order.customerNote}</div>
            </section>
          )}

          <div className="my-3 border-t border-dashed border-black" />

          <section className="space-y-3">
            {orderItems.map(item => (
              <div
                key={item.orderItemId}
                className="border-b border-black/40 pb-2 last:border-b-0 last:pb-0"
              >
                <div className="grid grid-cols-[1fr_auto] gap-3">
                  <span className="text-sm font-black">
                    {item.itemName ?? t('deleted_menu_item')}
                  </span>
                  <span className="text-right text-xl font-black">
                    {t('quantity_label', { quantity: item.quantity })}
                  </span>
                </div>
                <div className="mt-1 text-right text-[11px]">
                  {item.unitPriceUsdCents !== null && (
                    <div>
                      {formatUsdCents(item.unitPriceUsdCents, props.params.locale)}
                    </div>
                  )}
                  {item.unitPriceLbp !== null && (
                    <div>
                      {formatLocalCurrency(
                        item.unitPriceLbp,
                        props.params.locale,
                        localCurrencyLabel,
                      )}
                    </div>
                  )}
                </div>
                {item.customerNote && (
                  <div className="mt-2 border-l-4 border-black pl-2 text-[11px]">
                    <span className="font-black">{t('ticket_item_note')}</span>
                    {': '}
                    <span className="whitespace-pre-wrap">{item.customerNote}</span>
                  </div>
                )}
              </div>
            ))}
          </section>

          <div className="my-3 border-t border-dashed border-black" />

          <section className="space-y-1">
            {order.totalUsdCents !== null && (
              <div className="flex justify-between gap-3 text-base font-black">
                <span>{t('ticket_total_usd')}</span>
                <span>{formatUsdCents(order.totalUsdCents, props.params.locale)}</span>
              </div>
            )}
            {order.totalLbp !== null && (
              <div className="flex justify-between gap-3 text-base font-black">
                <span>
                  {t('ticket_total_local', { currency: localCurrencyLabel })}
                </span>
                <span>
                  {formatLocalCurrency(
                    order.totalLbp,
                    props.params.locale,
                    localCurrencyLabel,
                  )}
                </span>
              </div>
            )}
            {!hasStoredTotal && (
              <div className="font-bold">{t('no_order_total')}</div>
            )}
          </section>
        </article>
      </div>
    </main>
  );
};

export default TicketPage;

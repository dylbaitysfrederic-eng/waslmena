import { auth } from '@clerk/nextjs/server';
import { and, asc, desc, eq, gte } from 'drizzle-orm';
import { unstable_noStore as noStore } from 'next/cache';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import { FormSubmitButton } from '@/components/FormSubmitButton';
import { Button } from '@/components/ui/button';
import { DashboardSection } from '@/features/dashboard/DashboardSection';
import { TitleBar } from '@/features/dashboard/TitleBar';
import { db } from '@/libs/DB';
import {
  menuItemSchema,
  orderItemSchema,
  orderSchema,
  organizationSchema,
  restaurantTableSchema,
} from '@/models/Schema';
import { cn, getI18nPath } from '@/utils/Helpers';

import { updateOrderAction, updateOrderStatusAction } from './actions';
import { CopyTicketButton } from './CopyTicketButton';
import { OrderStatusGroups } from './OrderStatusGroups';
import { PendingOrderNotifier } from './PendingOrderNotifier';
import {
  getOrderPeriodStartDate,
  normalizeOrderPeriod,
  ORDER_PERIODS,
} from './periods';
import { PrintTicketButton } from './PrintTicketButton';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'completed',
  'cancelled',
] as const;

const NEXT_STATUS = {
  pending: 'confirmed',
  confirmed: 'preparing',
  preparing: 'ready',
  ready: 'completed',
} as const;

const ORDER_STATUS_STYLES = {
  pending: {
    section: 'border-amber-300 bg-amber-50',
    badge: 'border-amber-400 bg-amber-100 text-amber-950',
    card: 'border-amber-400 bg-amber-50/90 shadow-sm',
    statusPanel: 'border-amber-400 bg-amber-100 text-amber-950',
  },
  confirmed: {
    section: 'border-sky-300 bg-sky-50',
    badge: 'border-sky-400 bg-sky-100 text-sky-950',
    card: 'border-sky-300 bg-sky-50/90 shadow-sm',
    statusPanel: 'border-sky-400 bg-sky-100 text-sky-950',
  },
  preparing: {
    section: 'border-purple-300 bg-purple-50',
    badge: 'border-purple-400 bg-purple-100 text-purple-950',
    card: 'border-purple-300 bg-purple-50/80 shadow-sm',
    statusPanel: 'border-purple-400 bg-purple-100 text-purple-950',
  },
  ready: {
    section: 'border-green-400 bg-green-50',
    badge: 'border-green-500 bg-green-100 text-green-950',
    card: 'border-green-500 bg-green-50 shadow-sm',
    statusPanel: 'border-green-500 bg-green-100 text-green-950',
  },
  completed: {
    section: 'border-slate-200 bg-slate-50/60',
    badge: 'border-slate-200 bg-slate-100 text-slate-600',
    card: 'border-slate-200 bg-slate-50/40 opacity-85',
    statusPanel: 'border-slate-200 bg-slate-100 text-slate-600',
  },
  delivered: {
    section: 'border-slate-200 bg-slate-50/60',
    badge: 'border-slate-200 bg-slate-100 text-slate-600',
    card: 'border-slate-200 bg-slate-50/40 opacity-85',
    statusPanel: 'border-slate-200 bg-slate-100 text-slate-600',
  },
  cancelled: {
    section: 'border-red-200 bg-red-50/60',
    badge: 'border-red-300 bg-red-100 text-red-800',
    card: 'border-red-200 bg-red-50/35 opacity-85',
    statusPanel: 'border-red-300 bg-red-100 text-red-800',
  },
} as const;

const getOrderStatusStyle = (status: string) => {
  return ORDER_STATUS_STYLES[status as keyof typeof ORDER_STATUS_STYLES]
    ?? ORDER_STATUS_STYLES.pending;
};

const normalizeOrderStatus = (status: string) => {
  if (status === 'validated') {
    return 'confirmed';
  }

  if (status === 'served' || status === 'delivered') {
    return 'completed';
  }

  return status;
};

export async function generateMetadata(props: { params: { locale: string } }) {
  const t = await getTranslations({
    locale: props.params.locale,
    namespace: 'Orders',
  });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

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

const formatElapsedTime = (date: Date, now: Date, t: Awaited<ReturnType<typeof getTranslations>>) => {
  const elapsedMinutes = Math.max(
    0,
    Math.floor((now.getTime() - date.getTime()) / 60_000),
  );

  if (elapsedMinutes < 1) {
    return t('elapsed_now');
  }

  if (elapsedMinutes < 60) {
    return t('elapsed_minutes', { count: elapsedMinutes });
  }

  const elapsedHours = Math.floor(elapsedMinutes / 60);

  return t('elapsed_hours', { count: elapsedHours });
};

const RECEIPT_DIVIDER = '--------------------------------';

const getFinalStatusCompletedAt = (status: string, updatedAt: Date) => {
  return status === 'completed' || status === 'cancelled' ? updatedAt : null;
};

const OrdersPage = async (props: {
  params: { locale: string };
  searchParams?: { period?: string };
}) => {
  noStore();

  const { orgId } = await auth();
  const t = await getTranslations('Orders');
  const now = new Date();
  const selectedPeriod = normalizeOrderPeriod(props.searchParams?.period);
  const periodStartDate = getOrderPeriodStartDate(selectedPeriod, now);
  const ordersPath = getI18nPath('/dashboard/orders', props.params.locale);
  const exportPath = getI18nPath(
    '/dashboard/orders/export',
    props.params.locale,
  );

  if (!orgId) {
    return null;
  }

  const orderPeriodWhere = periodStartDate
    ? and(
      eq(orderSchema.organizationId, orgId),
      gte(orderSchema.createdAt, periodStartDate),
    )
    : eq(orderSchema.organizationId, orgId);

  const [organization] = await db
    .select({
      restaurantDisplayName: organizationSchema.restaurantDisplayName,
      restaurantAddress: organizationSchema.restaurantAddress,
      restaurantWhatsappNumber: organizationSchema.restaurantWhatsappNumber,
      restaurantLogoUrl: organizationSchema.restaurantLogoUrl,
      restaurantPrimaryColor: organizationSchema.restaurantPrimaryColor,
      restaurantAccentColor: organizationSchema.restaurantAccentColor,
      localCurrencyLabel: organizationSchema.localCurrencyLabel,
      orderVisualNotificationsEnabled:
        organizationSchema.orderVisualNotificationsEnabled,
      orderSoundNotificationsEnabled:
        organizationSchema.orderSoundNotificationsEnabled,
    })
    .from(organizationSchema)
    .where(eq(organizationSchema.id, orgId))
    .limit(1);
  const localCurrencyLabel = organization?.localCurrencyLabel ?? 'LL';
  const restaurantDisplayName = organization?.restaurantDisplayName ?? 'Restaurant';
  const restaurantAddress = organization?.restaurantAddress ?? null;
  const restaurantWhatsappNumber = organization?.restaurantWhatsappNumber ?? null;
  const restaurantLogoUrl = organization?.restaurantLogoUrl ?? null;
  const restaurantPrimaryColor = organization?.restaurantPrimaryColor ?? null;
  const restaurantAccentColor = organization?.restaurantAccentColor
    ?? restaurantPrimaryColor;
  const orderVisualNotificationsEnabled = (
    organization?.orderVisualNotificationsEnabled ?? true
  );
  const orderSoundNotificationsEnabled = (
    organization?.orderSoundNotificationsEnabled ?? false
  );

  const orders = await db
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
      updatedAt: orderSchema.updatedAt,
    })
    .from(orderSchema)
    .leftJoin(
      restaurantTableSchema,
      eq(orderSchema.tableId, restaurantTableSchema.id),
    )
    .where(orderPeriodWhere)
    .orderBy(desc(orderSchema.createdAt));

  const orderItems = await db
    .select({
      orderId: orderItemSchema.orderId,
      orderItemId: orderItemSchema.id,
      menuItemId: orderItemSchema.menuItemId,
      quantity: orderItemSchema.quantity,
      customerNote: orderItemSchema.customerNote,
      unitPriceUsdCents: orderItemSchema.unitPriceUsdCents,
      unitPriceLbp: orderItemSchema.unitPriceLbp,
      itemName: menuItemSchema.name,
    })
    .from(orderItemSchema)
    .leftJoin(menuItemSchema, eq(orderItemSchema.menuItemId, menuItemSchema.id))
    .innerJoin(orderSchema, eq(orderItemSchema.orderId, orderSchema.id))
    .where(orderPeriodWhere)
    .orderBy(orderItemSchema.id);

  const menuItems = await db
    .select({
      id: menuItemSchema.id,
      name: menuItemSchema.name,
      priceUsdCents: menuItemSchema.priceUsdCents,
      priceLbp: menuItemSchema.priceLbp,
    })
    .from(menuItemSchema)
    .where(eq(menuItemSchema.organizationId, orgId))
    .orderBy(asc(menuItemSchema.name));

  const itemsByOrderId = new Map<number, typeof orderItems>();

  for (const item of orderItems) {
    const currentItems = itemsByOrderId.get(item.orderId) ?? [];
    currentItems.push(item);
    itemsByOrderId.set(item.orderId, currentItems);
  }

  const ordersByStatus = new Map<string, typeof orders>();

  for (const status of ORDER_STATUSES) {
    ordersByStatus.set(status, []);
  }

  for (const order of orders) {
    const status = normalizeOrderStatus(order.status);
    const currentOrders = ordersByStatus.get(status) ?? [];
    currentOrders.push({
      ...order,
      status,
    });
    ordersByStatus.set(status, currentOrders);
  }
  const pendingOrders = ordersByStatus.get('pending') ?? [];
  const latestPendingOrderId = pendingOrders.reduce<number | null>(
    (latestId, order) => Math.max(latestId ?? 0, order.id),
    null,
  );

  return (
    <>
      <TitleBar
        title={t('title_bar')}
        description={t('title_bar_description')}
      />

      <DashboardSection
        title={t('list_section_title')}
        description={t('list_section_description')}
      >
        <div className="mb-5 flex flex-wrap items-center gap-2">
          {ORDER_PERIODS.map(period => (
            <Button
              key={period}
              asChild
              variant={selectedPeriod === period ? 'default' : 'outline'}
              size="sm"
            >
              <Link href={`${ordersPath}?period=${period}`}>
                {t(`period_${period}`)}
              </Link>
            </Button>
          ))}
        </div>

        <div className="mb-5 flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            {t('export_tools_label')}
          </span>
          {ORDER_PERIODS.map(period => (
            <Button
              key={period}
              asChild
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs"
            >
              <Link href={`${exportPath}?period=${period}`}>
                {t(`export_${period}`)}
              </Link>
            </Button>
          ))}
        </div>

        <div className="mb-5 flex flex-col gap-3 rounded-md border bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {t('refresh_helper')}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild>
              <Link href={`${ordersPath}?period=${selectedPeriod}`}>
                {t('refresh_button')}
              </Link>
            </Button>
          </div>
        </div>
        <div className="mb-5">
          <PendingOrderNotifier
            latestPendingOrderId={latestPendingOrderId}
            organizationId={orgId}
            pendingCount={pendingOrders.length}
            soundEnabled={orderSoundNotificationsEnabled}
            visualEnabled={orderVisualNotificationsEnabled}
          />
        </div>

        {orders.length > 0
          ? (
              <OrderStatusGroups
                collapseAllLabel={t('collapse_all_groups')}
                expandAllLabel={t('expand_all_groups')}
              >
                {ORDER_STATUSES.map((status) => {
                  const statusOrders = ordersByStatus.get(status) ?? [];
                  const isPendingSection = status === 'pending';
                  const isFinalSection = status === 'completed'
                    || status === 'cancelled';
                  const sectionStatusStyle = getOrderStatusStyle(status);

                  return (
                    <details
                      key={status}
                      data-order-status-group
                      open={!isFinalSection}
                      className="space-y-3"
                    >
                      <summary
                        className={cn(
                          'flex cursor-pointer list-none items-center justify-between rounded-md border px-4 py-3 [&::-webkit-details-marker]:hidden',
                          sectionStatusStyle.section,
                        )}
                      >
                        <div>
                          <h3 className="text-base font-semibold">
                            {t(`status_${status}`)}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {t('section_count', {
                              count: statusOrders.length,
                            })}
                          </p>
                        </div>
                        {isPendingSection && statusOrders.length > 0 && (
                          <span
                            className={cn(
                              'rounded-md border px-2 py-1 text-xs font-semibold',
                              sectionStatusStyle.badge,
                            )}
                          >
                            {t('needs_attention')}
                          </span>
                        )}
                      </summary>

                      {statusOrders.length > 0
                        ? (
                            <div className="mt-3 space-y-4">
                              {statusOrders.map((order) => {
                                const items = itemsByOrderId.get(order.id) ?? [];
                                const orderStatusStyle = getOrderStatusStyle(
                                  order.status,
                                );
                                const nextStatus = NEXT_STATUS[
                                  order.status as keyof typeof NEXT_STATUS
                                ];
                                const canCancel = order.status !== 'cancelled'
                                  && order.status !== 'completed';
                                const orderSourceLabel = order.tableId === null
                                  ? t('general_menu_label')
                                  : order.tableNumber === null
                                    ? t('deleted_table')
                                    : t('table_label', {
                                      tableNumber: order.tableNumber,
                                    });
                                const completedAt = getFinalStatusCompletedAt(
                                  order.status,
                                  order.updatedAt,
                                );
                                const hasStoredTotal = order.totalUsdCents !== null
                                  || order.totalLbp !== null;
                                const hasUsdAndLocalPrice = (
                                  item: (typeof items)[number],
                                ) => item.unitPriceUsdCents !== null
                                  && item.unitPriceLbp !== null;
                                const ticketId = `order-ticket-${order.id}`;
                                const canEdit = order.status !== 'completed'
                                  && order.status !== 'cancelled';
                                const copyTicketText = [
                                  restaurantDisplayName,
                                  ...(restaurantAddress
                                    ? [restaurantAddress]
                                    : []),
                                  ...(restaurantWhatsappNumber
                                    ? [
                                        t('ticket_whatsapp', {
                                          whatsappNumber: restaurantWhatsappNumber,
                                        }),
                                      ]
                                    : []),
                                  RECEIPT_DIVIDER,
                                  t('order_title', { orderId: order.id }),
                                  `${t('ticket_sent_at')}: ${
                                    formatDateTime(order.createdAt, props.params.locale)
                                  }`,
                                  completedAt
                                    ? `${t('ticket_completed_at')}: ${
                                      formatDateTime(completedAt, props.params.locale)
                                    }`
                                    : null,
                                  `${t('status_label')}: ${t(`status_${order.status}`)}`,
                                  t('payment_method_label', {
                                    paymentMethod: order.paymentMethod,
                                  }),
                                  orderSourceLabel,
                                  order.customerName
                                    ? t('ticket_customer', {
                                      customerName: order.customerName,
                                    })
                                    : t('no_customer_name'),
                                  ...(order.customerNote
                                    ? [
                                        `${t('ticket_order_note')}: ${order.customerNote}`,
                                      ]
                                    : []),
                                  RECEIPT_DIVIDER,
                                  t('items_label'),
                                  ...items.map((item) => {
                                    const prices = [
                                      item.unitPriceUsdCents !== null
                                        ? formatUsdCents(
                                          item.unitPriceUsdCents,
                                          props.params.locale,
                                        )
                                        : null,
                                      item.unitPriceLbp !== null
                                        ? formatLocalCurrency(
                                          item.unitPriceLbp,
                                          props.params.locale,
                                          localCurrencyLabel,
                                        )
                                        : null,
                                    ].filter(Boolean);

                                    return [
                                      t('quantity_label', {
                                        quantity: item.quantity,
                                      }),
                                      item.itemName ?? t('deleted_menu_item'),
                                      prices.length > 0 ? prices.join(' / ') : null,
                                    ].filter(Boolean).join(' - ');
                                  }),
                                  ...items
                                    .filter(item => item.customerNote)
                                    .map(item => `${t('ticket_item_note')} - ${
                                      item.itemName ?? t('deleted_menu_item')
                                    }: ${item.customerNote}`),
                                  RECEIPT_DIVIDER,
                                  ...(order.totalUsdCents !== null
                                    ? [
                                        `${t('ticket_total_usd')}: ${
                                          formatUsdCents(
                                            order.totalUsdCents,
                                            props.params.locale,
                                          )
                                        }`,
                                      ]
                                    : []),
                                  ...(order.totalLbp !== null
                                    ? [
                                        `${
                                          t('ticket_total_local', {
                                            currency: localCurrencyLabel,
                                          })
                                        }: ${
                                          formatLocalCurrency(
                                            order.totalLbp,
                                            props.params.locale,
                                            localCurrencyLabel,
                                          )
                                        }`,
                                      ]
                                    : []),
                                  !hasStoredTotal ? t('no_order_total') : null,
                                ].filter(Boolean).join('\n');

                                return (
                                  <article
                                    key={order.id}
                                    data-pending-order-id={
                                      order.status === 'pending' ? order.id : undefined
                                    }
                                    className={cn(
                                      'rounded-md border bg-background p-3 sm:p-4',
                                      orderStatusStyle.card,
                                    )}
                                  >
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                      <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                          <div className="text-lg font-semibold">
                                            {t('order_title', { orderId: order.id })}
                                          </div>
                                          <span
                                            className={cn(
                                              'rounded-md border px-2 py-1 text-xs font-semibold',
                                              orderStatusStyle.badge,
                                            )}
                                          >
                                            {t(`status_${order.status}`)}
                                          </span>
                                          <span className="rounded-md bg-background px-2 py-1 text-xs font-semibold text-muted-foreground">
                                            {formatElapsedTime(order.createdAt, now, t)}
                                          </span>
                                        </div>
                                        <div className="mt-1 text-sm text-muted-foreground">
                                          {order.customerName && (
                                            <>
                                              <span className="font-medium text-foreground">
                                                {t('customer_label', {
                                                  customerName: order.customerName,
                                                })}
                                              </span>
                                              {' · '}
                                            </>
                                          )}
                                          {orderSourceLabel}
                                          {' · '}
                                          {formatDateTime(order.createdAt, props.params.locale)}
                                        </div>
                                        {order.customerNote && (
                                          <div className="mt-3 rounded-md border bg-background p-3 text-sm">
                                            <div className="text-xs font-semibold uppercase text-muted-foreground">
                                              {t('customer_note_label')}
                                            </div>
                                            <p className="mt-1 whitespace-pre-wrap">
                                              {order.customerNote}
                                            </p>
                                          </div>
                                        )}
                                      </div>

                                      <div className="text-left sm:text-right">
                                        <div className="text-lg font-semibold">
                                          {order.totalUsdCents !== null && (
                                            <div>
                                              {formatUsdCents(
                                                order.totalUsdCents,
                                                props.params.locale,
                                              )}
                                            </div>
                                          )}
                                          {order.totalLbp !== null && (
                                            <div>
                                              {formatLocalCurrency(
                                                order.totalLbp,
                                                props.params.locale,
                                                localCurrencyLabel,
                                              )}
                                            </div>
                                          )}
                                          {!hasStoredTotal && t('no_order_total')}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                          {t('payment_method_label', {
                                            paymentMethod: order.paymentMethod,
                                          })}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_280px]">
                                      <div>
                                        <div className="mb-2 text-sm font-medium">
                                          {t('items_label')}
                                        </div>
                                        <ul className="space-y-2 text-sm">
                                          {items.map(item => (
                                            <li
                                              key={item.orderItemId}
                                              className="grid gap-2 rounded-md bg-muted px-3 py-2 sm:grid-cols-[1fr_auto]"
                                            >
                                              <div>
                                                <div>
                                                  {item.itemName ?? t('deleted_menu_item')}
                                                </div>
                                                {item.customerNote && (
                                                  <div className="mt-1 rounded-md bg-background/80 px-2 py-1 text-xs text-muted-foreground">
                                                    <span className="font-semibold text-foreground">
                                                      {t('item_note_label')}
                                                      {': '}
                                                    </span>
                                                    {item.customerNote}
                                                  </div>
                                                )}
                                              </div>
                                              <span className="text-right font-medium">
                                                <div>
                                                  {t('quantity_label', {
                                                    quantity: item.quantity,
                                                  })}
                                                </div>
                                                {item.unitPriceUsdCents !== null && (
                                                  <div className="text-xs text-muted-foreground">
                                                    {formatUsdCents(
                                                      item.unitPriceUsdCents,
                                                      props.params.locale,
                                                    )}
                                                  </div>
                                                )}
                                                {item.unitPriceLbp !== null && (
                                                  <div className="text-xs text-muted-foreground">
                                                    {formatLocalCurrency(
                                                      item.unitPriceLbp,
                                                      props.params.locale,
                                                      localCurrencyLabel,
                                                    )}
                                                  </div>
                                                )}
                                              </span>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>

                                      <div>
                                        <div className="mb-3 grid gap-2">
                                          <PrintTicketButton
                                            label={t('print_ticket_button')}
                                            ticketId={ticketId}
                                          />
                                          <CopyTicketButton
                                            copiedLabel={t('copy_ticket_success')}
                                            fallbackLabel={t('copy_ticket_fallback')}
                                            label={t('copy_ticket_button')}
                                            text={copyTicketText}
                                          />
                                        </div>

                                        <div className="mb-2 text-sm font-medium">
                                          {t('status_label')}
                                        </div>
                                        <div
                                          className={cn(
                                            'mb-3 rounded-md border px-3 py-2 text-sm font-semibold',
                                            orderStatusStyle.statusPanel,
                                          )}
                                        >
                                          {t(`status_${order.status}`)}
                                        </div>

                                        <div className="space-y-2">
                                          {nextStatus && (
                                            <form action={updateOrderStatusAction}>
                                              <input
                                                type="hidden"
                                                name="orderId"
                                                value={order.id}
                                              />
                                              <input
                                                type="hidden"
                                                name="status"
                                                value={nextStatus}
                                              />
                                              <FormSubmitButton
                                                size="lg"
                                                className="h-12 w-full"
                                                pendingLabel={t('status_update_pending')}
                                              >
                                                {t('move_to_status', {
                                                  status: t(`status_${nextStatus}`),
                                                })}
                                              </FormSubmitButton>
                                            </form>
                                          )}

                                          {canCancel && (
                                            <form action={updateOrderStatusAction}>
                                              <input
                                                type="hidden"
                                                name="orderId"
                                                value={order.id}
                                              />
                                              <input
                                                type="hidden"
                                                name="status"
                                                value="cancelled"
                                              />
                                              <FormSubmitButton
                                                variant="destructive"
                                                size="lg"
                                                className="h-12 w-full"
                                                pendingLabel={t('status_update_pending')}
                                              >
                                                {t('cancel_order_button')}
                                              </FormSubmitButton>
                                            </form>
                                          )}

                                          <div className="grid gap-2 pt-2 sm:grid-cols-2">
                                            {ORDER_STATUSES.map(manualStatus => (
                                              <form
                                                key={manualStatus}
                                                action={updateOrderStatusAction}
                                              >
                                                <input
                                                  type="hidden"
                                                  name="orderId"
                                                  value={order.id}
                                                />
                                                <input
                                                  type="hidden"
                                                  name="status"
                                                  value={manualStatus}
                                                />
                                                <FormSubmitButton
                                                  variant={
                                                    order.status === manualStatus
                                                      ? 'default'
                                                      : 'outline'
                                                  }
                                                  size="sm"
                                                  className="w-full"
                                                  pendingLabel={t('status_update_pending')}
                                                  disabled={order.status === manualStatus}
                                                >
                                                  {t(`status_${manualStatus}`)}
                                                </FormSubmitButton>
                                              </form>
                                            ))}
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {canEdit
                                      ? (
                                          <details className="mt-4 rounded-md border bg-background p-3">
                                            <summary className="cursor-pointer text-sm font-semibold">
                                              {t('edit_order_title')}
                                            </summary>
                                            <form action={updateOrderAction} className="mt-4 space-y-4">
                                              <input
                                                type="hidden"
                                                name="orderId"
                                                value={order.id}
                                              />

                                              <div className="grid gap-3 sm:grid-cols-2">
                                                <label className="grid gap-1 text-sm font-medium">
                                                  {t('edit_customer_name_label')}
                                                  <input
                                                    name="customerName"
                                                    defaultValue={order.customerName ?? ''}
                                                    maxLength={50}
                                                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                                                  />
                                                </label>

                                                <label className="grid gap-1 text-sm font-medium">
                                                  {t('edit_status_label')}
                                                  <select
                                                    name="status"
                                                    defaultValue={order.status}
                                                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                                                  >
                                                    {ORDER_STATUSES.map(editStatus => (
                                                      <option key={editStatus} value={editStatus}>
                                                        {t(`status_${editStatus}`)}
                                                      </option>
                                                    ))}
                                                  </select>
                                                </label>
                                              </div>

                                              <div className="space-y-2">
                                                <div className="text-sm font-medium">
                                                  {t('edit_items_label')}
                                                </div>
                                                {items.map(item => (
                                                  <div
                                                    key={item.orderItemId}
                                                    className="grid gap-2 rounded-md bg-muted p-3 sm:grid-cols-[1fr_120px]"
                                                  >
                                                    <div className="text-sm">
                                                      <div className="font-medium">
                                                        {item.itemName ?? t('deleted_menu_item')}
                                                      </div>
                                                      <div className="text-xs text-muted-foreground">
                                                        {item.unitPriceUsdCents !== null && (
                                                          <span>
                                                            {formatUsdCents(
                                                              item.unitPriceUsdCents,
                                                              props.params.locale,
                                                            )}
                                                          </span>
                                                        )}
                                                        {hasUsdAndLocalPrice(item) && ' · '}
                                                        {item.unitPriceLbp !== null && (
                                                          <span>
                                                            {formatLocalCurrency(
                                                              item.unitPriceLbp,
                                                              props.params.locale,
                                                              localCurrencyLabel,
                                                            )}
                                                          </span>
                                                        )}
                                                      </div>
                                                    </div>
                                                    <label className="grid gap-1 text-xs font-medium text-muted-foreground">
                                                      {t('edit_quantity_label')}
                                                      <input
                                                        name={`orderItemQuantity_${item.orderItemId}`}
                                                        type="number"
                                                        min={0}
                                                        step={1}
                                                        defaultValue={item.quantity}
                                                        className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
                                                      />
                                                    </label>
                                                  </div>
                                                ))}
                                                <p className="text-xs text-muted-foreground">
                                                  {t('edit_remove_help')}
                                                </p>
                                              </div>

                                              <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
                                                <label className="grid gap-1 text-sm font-medium">
                                                  {t('edit_add_item_label')}
                                                  <select
                                                    name="addMenuItemId"
                                                    defaultValue=""
                                                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                                                  >
                                                    <option value="">
                                                      {t('edit_add_item_placeholder')}
                                                    </option>
                                                    {menuItems.map(menuItem => (
                                                      <option key={menuItem.id} value={menuItem.id}>
                                                        {menuItem.name}
                                                      </option>
                                                    ))}
                                                  </select>
                                                </label>
                                                <label className="grid gap-1 text-sm font-medium">
                                                  {t('edit_add_quantity_label')}
                                                  <input
                                                    name="addQuantity"
                                                    type="number"
                                                    min={0}
                                                    step={1}
                                                    defaultValue={1}
                                                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                                                  />
                                                </label>
                                              </div>

                                              <FormSubmitButton pendingLabel={t('edit_save_pending')}>
                                                {t('edit_save_button')}
                                              </FormSubmitButton>
                                            </form>
                                          </details>
                                        )
                                      : (
                                          <div className="mt-4 rounded-md border border-dashed bg-muted/50 p-3 text-sm text-muted-foreground">
                                            {t('edit_locked_message')}
                                          </div>
                                        )}

                                    <div id={ticketId} className="hidden">
                                      {restaurantLogoUrl && (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                          src={restaurantLogoUrl}
                                          alt=""
                                          className="mx-auto mb-2 size-12 object-contain"
                                        />
                                      )}
                                      <div
                                        className="text-center text-lg font-bold uppercase"
                                        style={restaurantPrimaryColor
                                          ? { color: restaurantPrimaryColor }
                                          : undefined}
                                      >
                                        {restaurantDisplayName}
                                      </div>
                                      {restaurantAddress && (
                                        <div className="mt-1 text-center text-xs">
                                          {restaurantAddress}
                                        </div>
                                      )}
                                      {restaurantWhatsappNumber && (
                                        <div className="mt-1 text-center text-xs">
                                          {t('ticket_whatsapp', {
                                            whatsappNumber: restaurantWhatsappNumber,
                                          })}
                                        </div>
                                      )}

                                      <div
                                        className="my-3"
                                        data-order-ticket-divider
                                        style={restaurantAccentColor
                                          ? { borderColor: restaurantAccentColor }
                                          : undefined}
                                      />

                                      <div className="space-y-1">
                                        <div className="flex justify-between gap-3">
                                          <span>
                                            {t('order_title', { orderId: order.id })}
                                          </span>
                                          <span>{t(`status_${order.status}`)}</span>
                                        </div>
                                        <div>
                                          {t('ticket_sent_at')}
                                          {': '}
                                          {formatDateTime(order.createdAt, props.params.locale)}
                                        </div>
                                        {completedAt && (
                                          <div>
                                            {t('ticket_completed_at')}
                                            {': '}
                                            {formatDateTime(completedAt, props.params.locale)}
                                          </div>
                                        )}
                                        <div>
                                          {orderSourceLabel}
                                        </div>
                                        <div>
                                          {t('payment_method_label', {
                                            paymentMethod: order.paymentMethod,
                                          })}
                                        </div>
                                        <div>
                                          {order.customerName
                                            ? t('ticket_customer', {
                                              customerName: order.customerName,
                                            })
                                            : t('no_customer_name')}
                                        </div>
                                      </div>

                                      {order.customerNote && (
                                        <div className="mt-2">
                                          <div className="font-bold">
                                            {t('ticket_order_note')}
                                          </div>
                                          <div>{order.customerNote}</div>
                                        </div>
                                      )}

                                      <div className="my-3" data-order-ticket-divider />

                                      <div className="space-y-2">
                                        {items.map(item => (
                                          <div key={item.orderItemId}>
                                            <div className="flex justify-between gap-3">
                                              <span className="font-bold">
                                                {item.itemName ?? t('deleted_menu_item')}
                                              </span>
                                              <span>
                                                {t('quantity_label', {
                                                  quantity: item.quantity,
                                                })}
                                              </span>
                                            </div>
                                            <div className="text-right text-xs">
                                              {item.unitPriceUsdCents !== null && (
                                                <div>
                                                  {formatUsdCents(
                                                    item.unitPriceUsdCents,
                                                    props.params.locale,
                                                  )}
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
                                              <div className="mt-1 text-xs">
                                                {t('ticket_item_note')}
                                                {': '}
                                                {item.customerNote}
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>

                                      <div className="my-3" data-order-ticket-divider />

                                      {order.totalUsdCents !== null && (
                                        <div className="flex justify-between gap-3 font-bold">
                                          <span>{t('ticket_total_usd')}</span>
                                          <span>
                                            {formatUsdCents(
                                              order.totalUsdCents,
                                              props.params.locale,
                                            )}
                                          </span>
                                        </div>
                                      )}
                                      {order.totalLbp !== null && (
                                        <div className="flex justify-between gap-3 font-bold">
                                          <span>
                                            {t('ticket_total_local', {
                                              currency: localCurrencyLabel,
                                            })}
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
                                        <div>{t('no_order_total')}</div>
                                      )}
                                    </div>
                                  </article>
                                );
                              })}
                            </div>
                          )
                        : (
                            <div className="mt-3 rounded-md border border-dashed bg-background p-4 text-sm text-muted-foreground">
                              {t('empty_status_section')}
                            </div>
                          )}
                    </details>
                  );
                })}
              </OrderStatusGroups>
            )
          : (
              <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
                {t('empty_state')}
              </div>
            )}
      </DashboardSection>
    </>
  );
};

export default OrdersPage;

import { auth } from '@clerk/nextjs/server';
import { and, desc, eq, gte } from 'drizzle-orm';
import { unstable_noStore as noStore } from 'next/cache';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import { Button } from '@/components/ui/button';
import { DashboardSection } from '@/features/dashboard/DashboardSection';
import { TitleBar } from '@/features/dashboard/TitleBar';
import { db } from '@/libs/DB';
import {
  orderSchema,
  organizationSchema,
  restaurantTableSchema,
} from '@/models/Schema';
import { cn, getI18nPath } from '@/utils/Helpers';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata(props: { params: { locale: string } }) {
  const t = await getTranslations({
    locale: props.params.locale,
    namespace: 'Statistics',
  });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

const PERIODS = ['today', '7d', '30d'] as const;

type Period = typeof PERIODS[number];

const PERIOD_START_OFFSETS = {
  'today': 0,
  '7d': 6,
  '30d': 29,
} as const;

const getPeriodStart = (period: Period, now: Date) => {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - PERIOD_START_OFFSETS[period]);

  return start;
};

const getSelectedPeriod = (period?: string): Period => {
  if (PERIODS.includes(period as Period)) {
    return period as Period;
  }

  return 'today';
};

const formatDateTime = (date: Date, locale: string) => {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
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

const StatisticsPage = async (props: {
  params: { locale: string };
  searchParams?: { period?: string };
}) => {
  noStore();

  const { orgId } = await auth();
  const t = await getTranslations('Statistics');
  const now = new Date();
  const selectedPeriod = getSelectedPeriod(props.searchParams?.period);
  const thirtyDaysStart = getPeriodStart('30d', now);
  const selectedPeriodStart = getPeriodStart(selectedPeriod, now);

  if (!orgId) {
    return null;
  }

  const [organization] = await db
    .select({
      localCurrencyLabel: organizationSchema.localCurrencyLabel,
    })
    .from(organizationSchema)
    .where(eq(organizationSchema.id, orgId))
    .limit(1);
  const localCurrencyLabel = organization?.localCurrencyLabel ?? 'LL';

  const orders = await db
    .select({
      id: orderSchema.id,
      tableNumber: restaurantTableSchema.tableNumber,
      customerName: orderSchema.customerName,
      status: orderSchema.status,
      paymentMethod: orderSchema.paymentMethod,
      totalUsdCents: orderSchema.totalUsdCents,
      totalLbp: orderSchema.totalLbp,
      createdAt: orderSchema.createdAt,
    })
    .from(orderSchema)
    .leftJoin(
      restaurantTableSchema,
      eq(orderSchema.tableId, restaurantTableSchema.id),
    )
    .where(
      and(
        eq(orderSchema.organizationId, orgId),
        gte(orderSchema.createdAt, thirtyDaysStart),
      ),
    )
    .orderBy(desc(orderSchema.createdAt));

  const getPeriodSummary = (period: Period) => {
    const start = getPeriodStart(period, now);
    const periodOrders = orders.filter(order => order.createdAt >= start);
    const usdOrders = periodOrders.filter(order => order.totalUsdCents !== null);
    const lbpOrders = periodOrders.filter(order => order.totalLbp !== null);
    const totalUsdCents = usdOrders.reduce(
      (total, order) => total + (order.totalUsdCents ?? 0),
      0,
    );
    const totalLbp = lbpOrders.reduce(
      (total, order) => total + (order.totalLbp ?? 0),
      0,
    );

    return {
      period,
      orderCount: periodOrders.length,
      totalUsdCents: usdOrders.length > 0 ? totalUsdCents : null,
      totalLbp: lbpOrders.length > 0 ? totalLbp : null,
      averageUsdCents: usdOrders.length > 0
        ? Math.round(totalUsdCents / usdOrders.length)
        : null,
      averageLbp: lbpOrders.length > 0
        ? Math.round(totalLbp / lbpOrders.length)
        : null,
    };
  };

  const summaries = PERIODS.map(getPeriodSummary);
  const historyOrders = orders.filter(
    order => order.createdAt >= selectedPeriodStart,
  );

  const formatOptionalUsd = (amount: number | null) => {
    return amount === null ? t('not_available') : formatUsdCents(amount, props.params.locale);
  };

  const formatOptionalLbp = (amount: number | null) => {
    return amount === null
      ? t('not_available')
      : formatLocalCurrency(amount, props.params.locale, localCurrencyLabel);
  };

  return (
    <>
      <TitleBar
        title={t('title_bar')}
        description={t('title_bar_description')}
      />

      <DashboardSection
        title={t('overview_section_title')}
        description={t('overview_section_description')}
      >
        <div className="grid gap-4 lg:grid-cols-3">
          {summaries.map(summary => (
            <div key={summary.period} className="rounded-md border bg-background p-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">
                  {t(`period_${summary.period}`)}
                </div>
                <div className="mt-1 text-3xl font-semibold">
                  {summary.orderCount}
                </div>
                <div className="text-sm text-muted-foreground">
                  {t('orders_label')}
                </div>
              </div>

              <div className="mt-4 grid gap-2 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">{t('total_usd_label')}</span>
                  <span className="font-medium">{formatOptionalUsd(summary.totalUsdCents)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">
                    {t('total_local_label', { currency: localCurrencyLabel })}
                  </span>
                  <span className="font-medium">{formatOptionalLbp(summary.totalLbp)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">{t('average_usd_label')}</span>
                  <span className="font-medium">{formatOptionalUsd(summary.averageUsdCents)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">
                    {t('average_local_label', { currency: localCurrencyLabel })}
                  </span>
                  <span className="font-medium">{formatOptionalLbp(summary.averageLbp)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </DashboardSection>

      <DashboardSection
        title={t('history_section_title')}
        description={t('history_section_description')}
      >
        <div className="mb-5 flex flex-wrap gap-2">
          {PERIODS.map(period => (
            <Button
              key={period}
              asChild
              variant={period === selectedPeriod ? 'default' : 'outline'}
              size="sm"
            >
              <Link
                href={getI18nPath(
                  `/dashboard/statistics?period=${period}`,
                  props.params.locale,
                )}
              >
                {t(`filter_${period}`)}
              </Link>
            </Button>
          ))}
        </div>

        {historyOrders.length > 0
          ? (
              <div className="space-y-3">
                {historyOrders.map((order) => {
                  const hasUsdTotal = order.totalUsdCents !== null;
                  const hasLbpTotal = order.totalLbp !== null;

                  return (
                    <article
                      key={order.id}
                      className={cn(
                        'rounded-md border bg-background p-4',
                        order.status === 'pending' && 'border-yellow-300 bg-yellow-50',
                      )}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="text-base font-semibold">
                            {t('order_title', { orderId: order.id })}
                          </div>
                          <div className="mt-1 text-sm text-muted-foreground">
                            {order.customerName
                              ? t('customer_line', { customerName: order.customerName })
                              : t('no_customer_name')}
                          </div>
                          <div className="mt-1 text-sm text-muted-foreground">
                            {order.tableNumber
                              ? t('table_line', { tableNumber: order.tableNumber })
                              : t('deleted_table')}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 text-sm">
                          <span className="rounded-md border bg-background px-2 py-1 font-medium">
                            {t(`status_${order.status}`)}
                          </span>
                          <span className="rounded-md border bg-background px-2 py-1">
                            {formatDateTime(order.createdAt, props.params.locale)}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
                        <div>
                          <div className="text-muted-foreground">{t('payment_label')}</div>
                          <div className="font-medium">{order.paymentMethod}</div>
                        </div>
                        {hasUsdTotal && (
                          <div>
                            <div className="text-muted-foreground">{t('total_usd_label')}</div>
                            <div className="font-medium">
                              {formatUsdCents(order.totalUsdCents ?? 0, props.params.locale)}
                            </div>
                          </div>
                        )}
                        {hasLbpTotal && (
                          <div>
                            <div className="text-muted-foreground">
                              {t('total_local_label', {
                                currency: localCurrencyLabel,
                              })}
                            </div>
                            <div className="font-medium">
                              {formatLocalCurrency(
                                order.totalLbp ?? 0,
                                props.params.locale,
                                localCurrencyLabel,
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )
          : (
              <div className="rounded-md border border-dashed bg-background p-6 text-sm text-muted-foreground">
                {t('empty_history')}
              </div>
            )}
      </DashboardSection>
    </>
  );
};

export default StatisticsPage;

import { auth } from '@clerk/nextjs/server';
import { and, desc, eq, gte } from 'drizzle-orm';
import { unstable_noStore as noStore } from 'next/cache';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import { FormSubmitButton } from '@/components/FormSubmitButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DashboardSection } from '@/features/dashboard/DashboardSection';
import { TitleBar } from '@/features/dashboard/TitleBar';
import { db } from '@/libs/DB';
import {
  orderSchema,
  organizationSchema,
  restaurantTableSchema,
} from '@/models/Schema';
import { cn, getI18nPath } from '@/utils/Helpers';

import { updateFinanceSnapshotAction } from './actions';

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

const PERIODS = ['today', '7d', '30d', '365d'] as const;

type Period = typeof PERIODS[number];
type TrackedStatus = 'pending' | 'preparing' | 'served' | 'cancelled';

const PERIOD_START_OFFSETS = {
  'today': 0,
  '7d': 6,
  '30d': 29,
  '365d': 364,
} as const;

const TRACKED_STATUSES = [
  'pending',
  'preparing',
  'served',
  'cancelled',
] as const;

const FINANCE_COST_FIELDS = [
  'goods',
  'rent',
  'staff',
  'utilities',
  'other',
] as const;

type FinanceCostKey = typeof FINANCE_COST_FIELDS[number];

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

const formatUsdInputValue = (amount: number | null) => {
  return amount === null ? '' : (amount / 100).toFixed(2);
};

const getFinanceFieldSuffix = (key: FinanceCostKey) => {
  return `${key.charAt(0).toUpperCase()}${key.slice(1)}`;
};

const normalizeStatusForStats = (status: string): TrackedStatus | null => {
  if (status === 'pending') {
    return 'pending';
  }

  if (status === 'validated' || status === 'preparing' || status === 'ready') {
    return 'preparing';
  }

  if (status === 'served' || status === 'delivered') {
    return 'served';
  }

  if (status === 'cancelled') {
    return 'cancelled';
  }

  return null;
};

const StatisticsPage = async (props: {
  params: { locale: string };
  searchParams?: { finance?: string; period?: string };
}) => {
  noStore();

  const { orgId } = await auth();
  const t = await getTranslations('Statistics');
  const now = new Date();
  const selectedPeriod = getSelectedPeriod(props.searchParams?.period);
  const longestPeriodStart = getPeriodStart('365d', now);
  const selectedPeriodStart = getPeriodStart(selectedPeriod, now);

  if (!orgId) {
    return null;
  }

  const [organization] = await db
    .select({
      localCurrencyLabel: organizationSchema.localCurrencyLabel,
      financeGoodsCostUsdCents: organizationSchema.financeGoodsCostUsdCents,
      financeGoodsCostLocal: organizationSchema.financeGoodsCostLocal,
      financeRentCostUsdCents: organizationSchema.financeRentCostUsdCents,
      financeRentCostLocal: organizationSchema.financeRentCostLocal,
      financeStaffCostUsdCents: organizationSchema.financeStaffCostUsdCents,
      financeStaffCostLocal: organizationSchema.financeStaffCostLocal,
      financeUtilitiesCostUsdCents:
        organizationSchema.financeUtilitiesCostUsdCents,
      financeUtilitiesCostLocal:
        organizationSchema.financeUtilitiesCostLocal,
      financeOtherCostUsdCents: organizationSchema.financeOtherCostUsdCents,
      financeOtherCostLocal: organizationSchema.financeOtherCostLocal,
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
        gte(orderSchema.createdAt, longestPeriodStart),
      ),
    )
    .orderBy(desc(orderSchema.createdAt));

  const getPeriodSummary = (period: Period) => {
    const start = getPeriodStart(period, now);
    const periodOrders = orders.filter(order => order.createdAt >= start);
    const statusCounts = TRACKED_STATUSES.reduce(
      (counts, status) => ({
        ...counts,
        [status]: 0,
      }),
      {} as Record<TrackedStatus, number>,
    );
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

    for (const order of periodOrders) {
      const status = normalizeStatusForStats(order.status);

      if (status) {
        statusCounts[status] += 1;
      }
    }

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
      statusCounts,
    };
  };

  const summaries = PERIODS.map(getPeriodSummary);
  const monthlySummary = summaries.find(summary => summary.period === '30d')
    ?? getPeriodSummary('30d');
  const financeCosts: Record<
    FinanceCostKey,
    { local: number | null; usdCents: number | null }
  > = {
    goods: {
      usdCents: organization?.financeGoodsCostUsdCents ?? null,
      local: organization?.financeGoodsCostLocal ?? null,
    },
    rent: {
      usdCents: organization?.financeRentCostUsdCents ?? null,
      local: organization?.financeRentCostLocal ?? null,
    },
    staff: {
      usdCents: organization?.financeStaffCostUsdCents ?? null,
      local: organization?.financeStaffCostLocal ?? null,
    },
    utilities: {
      usdCents: organization?.financeUtilitiesCostUsdCents ?? null,
      local: organization?.financeUtilitiesCostLocal ?? null,
    },
    other: {
      usdCents: organization?.financeOtherCostUsdCents ?? null,
      local: organization?.financeOtherCostLocal ?? null,
    },
  };
  const totalFinanceUsdCents = FINANCE_COST_FIELDS.reduce(
    (total, key) => total + (financeCosts[key].usdCents ?? 0),
    0,
  );
  const totalFinanceLocal = FINANCE_COST_FIELDS.reduce(
    (total, key) => total + (financeCosts[key].local ?? 0),
    0,
  );
  const estimatedUsdMargin = monthlySummary.totalUsdCents === null
    && totalFinanceUsdCents === 0
    ? null
    : (monthlySummary.totalUsdCents ?? 0) - totalFinanceUsdCents;
  const estimatedLocalMargin = monthlySummary.totalLbp === null
    && totalFinanceLocal === 0
    ? null
    : (monthlySummary.totalLbp ?? 0) - totalFinanceLocal;

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
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
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

              <div className="mt-4 grid grid-cols-2 gap-2 border-t pt-4 text-sm">
                {TRACKED_STATUSES.map(status => (
                  <div key={status} className="rounded-md bg-muted/40 p-2">
                    <div className="text-xs text-muted-foreground">
                      {t(`status_count_${status}`)}
                    </div>
                    <div className="mt-1 text-lg font-semibold">
                      {summary.statusCounts[status]}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DashboardSection>

      <DashboardSection
        title={t('finance_section_title')}
        description={t('finance_section_description')}
      >
        <div id="finance" className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-md border bg-background p-4">
              <div className="text-sm font-medium text-muted-foreground">
                {t('finance_revenue_title')}
              </div>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {t('finance_revenue_help')}
              </p>
              <div className="mt-4 grid gap-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">{t('orders_label')}</span>
                  <span className="font-semibold">{monthlySummary.orderCount}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">{t('total_usd_label')}</span>
                  <span className="font-semibold">
                    {formatOptionalUsd(monthlySummary.totalUsdCents)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">
                    {t('total_local_label', { currency: localCurrencyLabel })}
                  </span>
                  <span className="font-semibold">
                    {formatOptionalLbp(monthlySummary.totalLbp)}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-md border bg-background p-4">
              <div className="text-sm font-medium text-muted-foreground">
                {t('finance_margin_title')}
              </div>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {t('finance_margin_help')}
              </p>
              <div className="mt-4 grid gap-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">{t('finance_total_costs_usd')}</span>
                  <span className="font-semibold">
                    {formatUsdCents(totalFinanceUsdCents, props.params.locale)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">
                    {t('finance_total_costs_local', {
                      currency: localCurrencyLabel,
                    })}
                  </span>
                  <span className="font-semibold">
                    {formatLocalCurrency(
                      totalFinanceLocal,
                      props.params.locale,
                      localCurrencyLabel,
                    )}
                  </span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">
                      {t('finance_estimated_margin_usd')}
                    </span>
                    <span className="font-semibold">
                      {formatOptionalUsd(estimatedUsdMargin)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">
                      {t('finance_estimated_margin_local', {
                        currency: localCurrencyLabel,
                      })}
                    </span>
                    <span className="font-semibold">
                      {formatOptionalLbp(estimatedLocalMargin)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <p className="rounded-md border border-dashed bg-background p-4 text-sm leading-6 text-muted-foreground sm:col-span-2">
              {t('finance_disclaimer')}
            </p>
          </div>

          <form
            action={updateFinanceSnapshotAction}
            className="rounded-md border bg-background p-4"
          >
            <input
              type="hidden"
              name="returnPath"
              value={getI18nPath('/dashboard/statistics', props.params.locale)}
            />
            <div>
              <h3 className="font-semibold">{t('finance_costs_form_title')}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('finance_costs_form_description')}
              </p>
            </div>
            {props.searchParams?.finance === 'saved' && (
              <div className="mt-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-950">
                {t('finance_saved_message')}
              </div>
            )}
            <div className="mt-4 grid gap-4">
              {FINANCE_COST_FIELDS.map(key => (
                <div key={key} className="grid gap-2 rounded-md border p-3">
                  <div className="text-sm font-medium">
                    {t(`finance_cost_${key}`)}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`finance-${key}-usd`}>
                        {t('finance_usd_input_label')}
                      </Label>
                      <Input
                        id={`finance-${key}-usd`}
                        name={`finance${getFinanceFieldSuffix(key)}CostUsd`}
                        type="number"
                        min={0}
                        step="0.01"
                        defaultValue={formatUsdInputValue(
                          financeCosts[key].usdCents,
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`finance-${key}-local`}>
                        {t('finance_local_input_label', {
                          currency: localCurrencyLabel,
                        })}
                      </Label>
                      <Input
                        id={`finance-${key}-local`}
                        name={`finance${getFinanceFieldSuffix(key)}CostLocal`}
                        type="number"
                        min={0}
                        step={1}
                        defaultValue={financeCosts[key].local ?? ''}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <FormSubmitButton
              pendingLabel={t('finance_save_pending')}
              className="mt-4 w-full"
            >
              {t('finance_save_button')}
            </FormSubmitButton>
          </form>
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

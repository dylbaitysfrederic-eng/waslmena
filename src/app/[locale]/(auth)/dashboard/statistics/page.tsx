import { auth } from '@clerk/nextjs/server';
import { and, desc, eq, gte, lt } from 'drizzle-orm';
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
  menuItemSchema,
  orderItemSchema,
  orderSchema,
  organizationSchema,
} from '@/models/Schema';
import { getI18nPath } from '@/utils/Helpers';
import { getLocalizedMenuText } from '@/utils/MenuTranslations';

import {
  getDefaultCustomRange,
  getOrderRange,
  normalizeOrderPeriod,
  ORDER_PAGE_RANGE_LIMIT_DAYS,
  ORDER_PERIODS,
} from '../orders/periods';
import { updateFinanceSnapshotAction } from './actions';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type FinanceCostKey = typeof FINANCE_COST_FIELDS[number];
type StatusKey = typeof STATUS_KEYS[number];

const STATUS_KEYS = [
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'completed',
  'cancelled',
] as const;

const FINANCE_COST_FIELDS = [
  'goods',
  'rent',
  'staff',
  'utilities',
  'other',
] as const;

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

const formatDateInput = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const formatUsdInputValue = (amount: number | null) => {
  return amount === null ? '' : (amount / 100).toFixed(2);
};

const getFinanceFieldSuffix = (key: FinanceCostKey) => {
  return `${key.charAt(0).toUpperCase()}${key.slice(1)}`;
};

const normalizeStatusForBreakdown = (status: string): StatusKey => {
  if (status === 'validated') {
    return 'confirmed';
  }

  if (status === 'served' || status === 'delivered') {
    return 'completed';
  }

  if (STATUS_KEYS.includes(status as StatusKey)) {
    return status as StatusKey;
  }

  return 'pending';
};

const getRangeLabelKey = (period: string) => {
  return ORDER_PERIODS.includes(period as typeof ORDER_PERIODS[number])
    ? `filter_${period}`
    : 'filter_recent';
};

const StatisticsPage = async (props: {
  params: { locale: string };
  searchParams?: {
    finance?: string;
    from?: string;
    period?: string;
    to?: string;
  };
}) => {
  noStore();

  const { orgId } = await auth();
  const t = await getTranslations('Statistics');
  const now = new Date();
  const selectedPeriod = normalizeOrderPeriod(props.searchParams?.period);
  const defaultCustomRange = getDefaultCustomRange(now);
  const selectedRange = getOrderRange(
    {
      from: props.searchParams?.from,
      period: selectedPeriod,
      to: props.searchParams?.to,
    },
    now,
    ORDER_PAGE_RANGE_LIMIT_DAYS,
  );
  const customFromValue = selectedPeriod === 'custom'
    ? selectedRange.from || defaultCustomRange.from
    : defaultCustomRange.from;
  const customToValue = selectedPeriod === 'custom'
    ? selectedRange.to || defaultCustomRange.to
    : defaultCustomRange.to;
  const statisticsPath = getI18nPath('/dashboard/statistics', props.params.locale);

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

  const rangeFilters = selectedRange.isValid && selectedRange.startDate
    ? [
        eq(orderSchema.organizationId, orgId),
        gte(orderSchema.createdAt, selectedRange.startDate),
        ...(selectedRange.endDateExclusive
          ? [lt(orderSchema.createdAt, selectedRange.endDateExclusive)]
          : []),
      ]
    : [eq(orderSchema.organizationId, orgId), gte(orderSchema.createdAt, now)];

  const orders = selectedRange.isValid && selectedRange.startDate
    ? await db
      .select({
        id: orderSchema.id,
        status: orderSchema.status,
        totalUsdCents: orderSchema.totalUsdCents,
        totalLbp: orderSchema.totalLbp,
        createdAt: orderSchema.createdAt,
      })
      .from(orderSchema)
      .where(and(...rangeFilters))
      .orderBy(desc(orderSchema.createdAt))
    : [];

  const itemRows = selectedRange.isValid && selectedRange.startDate
    ? await db
      .select({
        orderId: orderSchema.id,
        itemName: menuItemSchema.name,
        itemNameEn: menuItemSchema.nameEn,
        itemNameAr: menuItemSchema.nameAr,
        itemNameFr: menuItemSchema.nameFr,
        quantity: orderItemSchema.quantity,
        unitPriceUsdCents: orderItemSchema.unitPriceUsdCents,
        unitPriceLbp: orderItemSchema.unitPriceLbp,
      })
      .from(orderItemSchema)
      .innerJoin(orderSchema, eq(orderItemSchema.orderId, orderSchema.id))
      .leftJoin(menuItemSchema, eq(orderItemSchema.menuItemId, menuItemSchema.id))
      .where(and(...rangeFilters))
    : [];

  const orderCount = orders.length;
  const totalUsdCents = orders.reduce(
    (total, order) => total + (order.totalUsdCents ?? 0),
    0,
  );
  const totalLbp = orders.reduce(
    (total, order) => total + (order.totalLbp ?? 0),
    0,
  );
  const ordersWithUsd = orders.filter(order => order.totalUsdCents !== null);
  const ordersWithLbp = orders.filter(order => order.totalLbp !== null);
  const completedOrders = orders.filter(
    order => normalizeStatusForBreakdown(order.status) === 'completed',
  ).length;
  const cancelledOrders = orders.filter(
    order => normalizeStatusForBreakdown(order.status) === 'cancelled',
  ).length;
  const statusCounts = STATUS_KEYS.reduce(
    (counts, status) => ({ ...counts, [status]: 0 }),
    {} as Record<StatusKey, number>,
  );
  const hourCounts = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    orderCount: 0,
  }));
  const dailySalesByDate = new Map<string, {
    date: Date;
    orderCount: number;
    totalUsdCents: number;
    totalLbp: number;
  }>();

  for (const order of orders) {
    statusCounts[normalizeStatusForBreakdown(order.status)] += 1;
    hourCounts[order.createdAt.getHours()]!.orderCount += 1;

    const dateKey = formatDateInput(order.createdAt);
    const dailySales = dailySalesByDate.get(dateKey) ?? {
      date: order.createdAt,
      orderCount: 0,
      totalUsdCents: 0,
      totalLbp: 0,
    };
    dailySales.orderCount += 1;
    dailySales.totalUsdCents += order.totalUsdCents ?? 0;
    dailySales.totalLbp += order.totalLbp ?? 0;
    dailySalesByDate.set(dateKey, dailySales);
  }

  const topItemsByName = new Map<string, {
    name: string;
    quantity: number;
    totalUsdCents: number;
    totalLbp: number;
  }>();

  for (const item of itemRows) {
    const itemName = getLocalizedMenuText(
      props.params.locale,
      {
        en: item.itemNameEn,
        ar: item.itemNameAr,
        fr: item.itemNameFr,
        legacy: item.itemName,
      },
      t('deleted_menu_item'),
    );
    const currentItem = topItemsByName.get(itemName) ?? {
      name: itemName,
      quantity: 0,
      totalUsdCents: 0,
      totalLbp: 0,
    };

    currentItem.quantity += item.quantity;
    currentItem.totalUsdCents += (item.unitPriceUsdCents ?? 0) * item.quantity;
    currentItem.totalLbp += (item.unitPriceLbp ?? 0) * item.quantity;
    topItemsByName.set(itemName, currentItem);
  }

  const topItems = Array.from(topItemsByName.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10);
  const dailySales = Array.from(dailySalesByDate.values())
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  const maxHourlyOrders = Math.max(1, ...hourCounts.map(hour => hour.orderCount));
  const maxDailyOrders = Math.max(1, ...dailySales.map(day => day.orderCount));
  const hasUsdRevenue = ordersWithUsd.length > 0;
  const hasLbpRevenue = ordersWithLbp.length > 0;

  const formatOptionalUsd = (amount: number | null) => {
    return amount === null ? t('not_available') : formatUsdCents(amount, props.params.locale);
  };

  const formatOptionalLbp = (amount: number | null) => {
    return amount === null
      ? t('not_available')
      : formatLocalCurrency(amount, props.params.locale, localCurrencyLabel);
  };

  const renderMoneyLines = (usdCents: number | null, lbp: number | null) => (
    <div className="grid gap-1">
      {usdCents !== null && <span>{formatUsdCents(usdCents, props.params.locale)}</span>}
      {lbp !== null && (
        <span>{formatLocalCurrency(lbp, props.params.locale, localCurrencyLabel)}</span>
      )}
      {usdCents === null && lbp === null && (
        <span className="text-muted-foreground">{t('not_available')}</span>
      )}
    </div>
  );

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
  const estimatedUsdMargin = hasUsdRevenue || totalFinanceUsdCents > 0
    ? totalUsdCents - totalFinanceUsdCents
    : null;
  const estimatedLocalMargin = hasLbpRevenue || totalFinanceLocal > 0
    ? totalLbp - totalFinanceLocal
    : null;

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
        <div className="mb-5 grid gap-3">
          <div className="flex flex-wrap gap-2">
            {ORDER_PERIODS.map(period => (
              <Button
                key={period}
                asChild
                variant={period === selectedPeriod ? 'default' : 'outline'}
                size="sm"
              >
                <Link href={`${statisticsPath}?period=${period}`}>
                  {t(getRangeLabelKey(period))}
                </Link>
              </Button>
            ))}
          </div>

          <form className="grid gap-3 rounded-md border bg-background p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <input type="hidden" name="period" value="custom" />
            <div className="space-y-2">
              <Label htmlFor="stats-from">{t('custom_from_label')}</Label>
              <Input
                id="stats-from"
                name="from"
                type="date"
                defaultValue={customFromValue}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stats-to">{t('custom_to_label')}</Label>
              <Input
                id="stats-to"
                name="to"
                type="date"
                defaultValue={customToValue}
              />
            </div>
            <Button type="submit" variant="outline">
              {t('custom_apply_button')}
            </Button>
          </form>

          {!selectedRange.isValid && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm font-medium text-destructive">
              {t('custom_range_invalid')}
            </div>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {[
            {
              label: t('summary_total_revenue'),
              value: renderMoneyLines(
                hasUsdRevenue ? totalUsdCents : null,
                hasLbpRevenue ? totalLbp : null,
              ),
            },
            {
              label: t('summary_order_count'),
              value: orderCount,
            },
            {
              label: t('summary_average_order'),
              value: renderMoneyLines(
                ordersWithUsd.length > 0
                  ? Math.round(totalUsdCents / ordersWithUsd.length)
                  : null,
                ordersWithLbp.length > 0
                  ? Math.round(totalLbp / ordersWithLbp.length)
                  : null,
              ),
            },
            {
              label: t('summary_completed_orders'),
              value: completedOrders,
            },
            {
              label: t('summary_cancelled_orders'),
              value: cancelledOrders,
            },
          ].map(card => (
            <div key={card.label} className="wasl-panel p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {card.label}
              </div>
              <div className="mt-2 text-2xl font-semibold">
                {card.value}
              </div>
            </div>
          ))}
        </div>
      </DashboardSection>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <DashboardSection
          title={t('top_items_section_title')}
          description={t('top_items_section_description')}
        >
          {topItems.length > 0
            ? (
                <div className="grid gap-2">
                  {topItems.map((item, index) => (
                    <div
                      key={item.name}
                      className="grid gap-3 rounded-md border bg-background p-3 sm:grid-cols-[40px_1fr_auto] sm:items-center"
                    >
                      <div className="text-sm font-semibold text-muted-foreground">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-semibold">{item.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {t('top_item_quantity', { quantity: item.quantity })}
                        </div>
                      </div>
                      <div className="text-sm font-semibold sm:text-right">
                        {renderMoneyLines(
                          item.totalUsdCents > 0 ? item.totalUsdCents : null,
                          item.totalLbp > 0 ? item.totalLbp : null,
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            : (
                <div className="rounded-md border border-dashed bg-background p-6 text-sm text-muted-foreground">
                  {t('empty_top_items')}
                </div>
              )}
        </DashboardSection>

        <DashboardSection
          title={t('status_section_title')}
          description={t('status_section_description')}
        >
          <div className="grid gap-2">
            {STATUS_KEYS.map(status => (
              <div key={status} className="flex items-center justify-between gap-3 rounded-md border bg-background px-3 py-2">
                <span className="text-sm font-medium">{t(`status_${status}`)}</span>
                <span className="text-lg font-semibold">{statusCounts[status]}</span>
              </div>
            ))}
          </div>
        </DashboardSection>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <DashboardSection
          title={t('rush_hours_section_title')}
          description={t('rush_hours_section_description')}
        >
          <div className="grid gap-2">
            {hourCounts.map(hour => (
              <div key={hour.hour} className="grid grid-cols-[56px_1fr_44px] items-center gap-3 text-sm">
                <div className="font-medium text-muted-foreground">
                  {new Intl.DateTimeFormat(props.params.locale, {
                    hour: 'numeric',
                  }).format(new Date(2020, 0, 1, hour.hour))}
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary"
                    style={{
                      width: `${Math.max(
                        4,
                        (hour.orderCount / maxHourlyOrders) * 100,
                      )}%`,
                    }}
                  />
                </div>
                <div className="text-right font-semibold">{hour.orderCount}</div>
              </div>
            ))}
          </div>
        </DashboardSection>

        <DashboardSection
          title={t('daily_sales_section_title')}
          description={t('daily_sales_section_description')}
        >
          {dailySales.length > 0
            ? (
                <div className="grid gap-3">
                  {dailySales.map(day => (
                    <div key={day.date.toISOString()} className="rounded-md border bg-background p-3">
                      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                        <span className="font-semibold">
                          {new Intl.DateTimeFormat(props.params.locale, {
                            dateStyle: 'medium',
                          }).format(day.date)}
                        </span>
                        <span className="text-muted-foreground">
                          {t('daily_order_count', { count: day.orderCount })}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full bg-primary"
                          style={{
                            width: `${Math.max(
                              4,
                              (day.orderCount / maxDailyOrders) * 100,
                            )}%`,
                          }}
                        />
                      </div>
                      <div className="mt-2 text-sm font-semibold">
                        {renderMoneyLines(
                          hasUsdRevenue ? day.totalUsdCents : null,
                          hasLbpRevenue ? day.totalLbp : null,
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            : (
                <div className="rounded-md border border-dashed bg-background p-6 text-sm text-muted-foreground">
                  {t('empty_analytics')}
                </div>
              )}
        </DashboardSection>
      </div>

      <DashboardSection
        title={t('finance_section_title')}
        description={t('finance_section_description')}
      >
        <div id="finance" className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="wasl-panel p-4">
              <div className="text-sm font-medium text-muted-foreground">
                {t('finance_revenue_title')}
              </div>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {t('finance_revenue_help', {
                  period: t(getRangeLabelKey(selectedPeriod)),
                })}
              </p>
              <div className="mt-4 grid gap-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">{t('orders_label')}</span>
                  <span className="font-semibold">{orderCount}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">{t('total_usd_label')}</span>
                  <span className="font-semibold">
                    {formatOptionalUsd(hasUsdRevenue ? totalUsdCents : null)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">
                    {t('total_local_label', { currency: localCurrencyLabel })}
                  </span>
                  <span className="font-semibold">
                    {formatOptionalLbp(hasLbpRevenue ? totalLbp : null)}
                  </span>
                </div>
              </div>
            </div>

            <div className="wasl-panel p-4">
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
            className="wasl-panel p-4"
          >
            <input
              type="hidden"
              name="returnPath"
              value={statisticsPath}
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
    </>
  );
};

export default StatisticsPage;

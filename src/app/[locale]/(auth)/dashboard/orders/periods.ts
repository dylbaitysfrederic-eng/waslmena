export const ORDER_PERIODS = ['today', 'week', 'month', 'all'] as const;

export type OrderPeriod = (typeof ORDER_PERIODS)[number];

export const normalizeOrderPeriod = (period?: string): OrderPeriod => {
  return ORDER_PERIODS.includes(period as OrderPeriod)
    ? period as OrderPeriod
    : 'today';
};

export const getOrderPeriodStartDate = (period: OrderPeriod, now: Date) => {
  if (period === 'all') {
    return null;
  }

  const startDate = new Date(now);
  startDate.setHours(0, 0, 0, 0);

  if (period === 'week') {
    const day = startDate.getDay();
    const daysSinceMonday = day === 0 ? 6 : day - 1;
    startDate.setDate(startDate.getDate() - daysSinceMonday);
  }

  if (period === 'month') {
    startDate.setDate(1);
  }

  return startDate;
};

export const ORDER_PERIODS = ['recent', 'today', 'week', 'month', 'custom'] as const;

export type OrderPeriod = (typeof ORDER_PERIODS)[number];

type OrderRangeParams = {
  from?: string;
  period?: string;
  to?: string;
};

export const ORDER_PAGE_RANGE_LIMIT_DAYS = 31;
export const ORDER_EXPORT_RANGE_LIMIT_DAYS = 90;

const MS_PER_DAY = 86_400_000;

export const normalizeOrderPeriod = (period?: string): OrderPeriod => {
  return ORDER_PERIODS.includes(period as OrderPeriod)
    ? period as OrderPeriod
    : 'recent';
};

const parseDateInput = (value?: string) => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000`);

  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDateInput = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const addDays = (date: Date, days: number) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);

  return nextDate;
};

const getInclusiveDayCount = (startDate: Date, endDate: Date) => {
  const startTime = new Date(startDate);
  const endTime = new Date(endDate);

  startTime.setHours(0, 0, 0, 0);
  endTime.setHours(0, 0, 0, 0);

  return Math.floor((endTime.getTime() - startTime.getTime()) / MS_PER_DAY) + 1;
};

export const getDefaultCustomRange = (now: Date) => {
  const endDate = new Date(now);
  endDate.setHours(0, 0, 0, 0);

  const startDate = addDays(endDate, -6);

  return {
    from: formatDateInput(startDate),
    to: formatDateInput(endDate),
  };
};

export const getOrderRange = (
  params: OrderRangeParams,
  now: Date,
  maxDays: number,
) => {
  const period = normalizeOrderPeriod(params.period);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  if (period === 'custom') {
    const startDate = parseDateInput(params.from);
    const endDate = parseDateInput(params.to);

    if (!startDate || !endDate) {
      return {
        endDateExclusive: null,
        from: params.from ?? '',
        isValid: false,
        period,
        startDate: null,
        to: params.to ?? '',
      };
    }

    const dayCount = getInclusiveDayCount(startDate, endDate);
    const isValid = dayCount >= 1 && dayCount <= maxDays;

    return {
      endDateExclusive: isValid ? addDays(endDate, 1) : null,
      from: formatDateInput(startDate),
      isValid,
      period,
      startDate: isValid ? startDate : null,
      to: formatDateInput(endDate),
    };
  }

  const startDate = period === 'recent'
    ? new Date(now.getTime() - (2 * MS_PER_DAY))
    : new Date(today);

  if (period === 'week') {
    const day = startDate.getDay();
    const daysSinceMonday = day === 0 ? 6 : day - 1;
    startDate.setDate(startDate.getDate() - daysSinceMonday);
  }

  if (period === 'month') {
    startDate.setDate(1);
  }

  return {
    endDateExclusive: null,
    from: '',
    isValid: true,
    period,
    startDate,
    to: '',
  };
};

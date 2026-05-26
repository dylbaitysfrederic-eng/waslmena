export const PAYMENT_STATUSES = [
  'unpaid',
  'pending_payment',
  'paid',
  'failed',
  'refunded',
  'cancelled',
] as const;

export type PaymentStatus = typeof PAYMENT_STATUSES[number];

export const normalizePaymentStatus = (
  status: string | null | undefined,
): PaymentStatus => {
  if (PAYMENT_STATUSES.includes(status as PaymentStatus)) {
    return status as PaymentStatus;
  }

  return 'unpaid';
};

export const getPaymentStatusLabelKey = (
  status: string | null | undefined,
) => `payment_status_${normalizePaymentStatus(status)}` as const;

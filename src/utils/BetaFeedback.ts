export const BETA_FEEDBACK_CATEGORIES = [
  'order_flow',
  'menu_setup',
  'dashboard',
  'delivery',
  'tickets',
  'performance',
  'mobile',
  'other',
] as const;

export const BETA_FEEDBACK_SEVERITIES = [
  'low',
  'medium',
  'high',
  'blocker',
] as const;

export const BETA_FEEDBACK_STATUSES = [
  'new',
  'reviewed',
  'planned',
  'resolved',
  'dismissed',
] as const;

export type BetaFeedbackCategory = typeof BETA_FEEDBACK_CATEGORIES[number];
export type BetaFeedbackSeverity = typeof BETA_FEEDBACK_SEVERITIES[number];
export type BetaFeedbackStatus = typeof BETA_FEEDBACK_STATUSES[number];

export const normalizeBetaFeedbackOption = <T extends readonly string[]>(
  value: FormDataEntryValue | string | null | undefined,
  allowedValues: T,
  fallback: T[number],
) => {
  const textValue = typeof value === 'string' ? value : value?.toString();

  return allowedValues.includes(textValue ?? '') ? textValue as T[number] : fallback;
};

export const normalizeBetaFeedbackText = (
  value: FormDataEntryValue | string | null | undefined,
  maxLength: number,
) => {
  const textValue = typeof value === 'string' ? value : value?.toString() ?? '';
  const trimmedValue = textValue.trim();

  return trimmedValue.length > 0 ? trimmedValue.slice(0, maxLength) : null;
};

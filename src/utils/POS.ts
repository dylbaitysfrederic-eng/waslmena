export const POS_PROVIDERS = [
  'csv_manual',
  'foodics',
  'sapaad',
  'square',
  'toast',
  'lightspeed',
  'other',
] as const;

export const POS_SYNC_STATUSES = [
  'not_configured',
  'ready',
  'syncing',
  'success',
  'failed',
] as const;

export const POS_MAPPING_STATUSES = [
  'mapped',
  'pending',
  'conflict',
  'ignored',
] as const;

export const POS_PUSH_STATUSES = [
  'pending',
  'sent',
  'acknowledged',
  'failed',
  'ignored',
] as const;

export const POS_SYNC_TYPES = [
  'menu_import',
  'menu_export',
  'order_push',
  'status_pull',
  'availability_pull',
  'manual',
] as const;

export const POS_SYNC_LOG_STATUSES = [
  'success',
  'warning',
  'failed',
  'pending',
] as const;

export type PosProvider = typeof POS_PROVIDERS[number];
export type PosSyncStatus = typeof POS_SYNC_STATUSES[number];
export type PosPushStatus = typeof POS_PUSH_STATUSES[number];

const PROVIDER_LABELS: Record<PosProvider, string> = {
  csv_manual: 'CSV/manual',
  foodics: 'Foodics',
  sapaad: 'Sapaad',
  square: 'Square',
  toast: 'Toast',
  lightspeed: 'Lightspeed',
  other: 'Other',
};

const SYNC_STATUS_LABELS: Record<PosSyncStatus, string> = {
  not_configured: 'Not configured',
  ready: 'Ready',
  syncing: 'Syncing',
  success: 'Success',
  failed: 'Failed',
};

const PUSH_STATUS_LABELS: Record<PosPushStatus, string> = {
  pending: 'Pending',
  sent: 'Sent',
  acknowledged: 'Acknowledged',
  failed: 'Failed',
  ignored: 'Ignored',
};

const PROVIDER_DESCRIPTIONS: Record<PosProvider, string> = {
  csv_manual: 'CSV/manual bridge first. Export, compare, and reconcile operational data without provider APIs.',
  foodics: 'Future API provider placeholder. No Foodics connection is active yet.',
  sapaad: 'Future API provider placeholder. No Sapaad connection is active yet.',
  square: 'Future API provider placeholder. No Square connection is active yet.',
  toast: 'Future API provider placeholder. No Toast connection is active yet.',
  lightspeed: 'Future API provider placeholder. No Lightspeed connection is active yet.',
  other: 'Placeholder for a custom POS provider conversation.',
};

export const formatPosProvider = (provider: string | null | undefined) => {
  return PROVIDER_LABELS[provider as PosProvider] ?? PROVIDER_LABELS.csv_manual;
};

export const formatPosSyncStatus = (status: string | null | undefined) => {
  return SYNC_STATUS_LABELS[status as PosSyncStatus]
    ?? SYNC_STATUS_LABELS.not_configured;
};

export const formatPosPushStatus = (status: string | null | undefined) => {
  return PUSH_STATUS_LABELS[status as PosPushStatus] ?? PUSH_STATUS_LABELS.pending;
};

export const getPosProviderDescription = (
  provider: string | null | undefined,
) => {
  return PROVIDER_DESCRIPTIONS[provider as PosProvider]
    ?? PROVIDER_DESCRIPTIONS.csv_manual;
};

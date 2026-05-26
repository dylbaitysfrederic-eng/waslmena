export const WHATSAPP_MESSAGE_TYPES = [
  'order_confirmation',
  'order_ready',
  'out_for_delivery',
  'delivered',
  'support',
  'custom',
] as const;

export const WHATSAPP_MESSAGE_STATUSES = [
  'pending',
  'queued',
  'sent',
  'delivered',
  'read',
  'failed',
  'cancelled',
] as const;

export const WHATSAPP_PROVIDERS = [
  'meta',
  'manual',
  'internal',
] as const;

export type WhatsappMessageType = typeof WHATSAPP_MESSAGE_TYPES[number];
export type WhatsappMessageStatus = typeof WHATSAPP_MESSAGE_STATUSES[number];
export type WhatsappProvider = typeof WHATSAPP_PROVIDERS[number];

const MESSAGE_TYPE_LABELS: Record<WhatsappMessageType, string> = {
  order_confirmation: 'Order confirmation',
  order_ready: 'Order ready',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  support: 'Support',
  custom: 'Custom',
};

const MESSAGE_STATUS_LABELS: Record<WhatsappMessageStatus, string> = {
  pending: 'Pending',
  queued: 'Queued',
  sent: 'Sent',
  delivered: 'Delivered',
  read: 'Read',
  failed: 'Failed',
  cancelled: 'Cancelled',
};

const PROVIDER_LABELS: Record<WhatsappProvider, string> = {
  meta: 'Meta',
  manual: 'Manual',
  internal: 'Internal',
};

export const formatWhatsappMessageType = (messageType: string) => {
  return MESSAGE_TYPE_LABELS[messageType as WhatsappMessageType] ?? 'Custom';
};

export const formatWhatsappMessageStatus = (messageStatus: string) => {
  return MESSAGE_STATUS_LABELS[messageStatus as WhatsappMessageStatus] ?? 'Pending';
};

export const formatWhatsappProvider = (provider: string) => {
  return PROVIDER_LABELS[provider as WhatsappProvider] ?? 'Internal';
};

import { headers } from 'next/headers';

import { db } from '@/libs/DB';
import { analyticsEventSchema } from '@/models/Schema';

export type AnalyticsEventType =
  | 'menu_open'
  | 'category_view'
  | 'order_submit_success'
  | 'order_submit_failure';

type RecordAnalyticsEventInput = {
  organizationId: string;
  eventType: AnalyticsEventType;
  locale?: string | null;
  deviceType?: string | null;
  tableId?: number | null;
  categoryId?: number | null;
  orderId?: number | null;
  metadata?: Record<string, string | number | boolean | null | undefined>;
};

const MAX_METADATA_LENGTH = 500;

export const getBasicDeviceType = (userAgent: string | null | undefined) => {
  const normalizedUserAgent = userAgent?.toLowerCase() ?? '';

  if (/ipad|tablet/.test(normalizedUserAgent)) {
    return 'tablet';
  }

  if (/mobile|iphone|android/.test(normalizedUserAgent)) {
    return 'mobile';
  }

  return 'desktop';
};

export const getRequestDeviceType = () => {
  return getBasicDeviceType(headers().get('user-agent'));
};

export const recordAnalyticsEvent = async (input: RecordAnalyticsEventInput) => {
  try {
    if (!input.organizationId || !input.eventType) {
      return;
    }

    const metadata = input.metadata
      ? JSON.stringify(input.metadata).slice(0, MAX_METADATA_LENGTH)
      : null;

    await db.insert(analyticsEventSchema).values({
      organizationId: input.organizationId,
      eventType: input.eventType,
      locale: input.locale ?? null,
      deviceType: input.deviceType ?? null,
      tableId: input.tableId ?? null,
      categoryId: input.categoryId ?? null,
      orderId: input.orderId ?? null,
      metadata,
    });
  } catch (error) {
    console.error('wasl_analytics_record_failed', {
      eventType: input.eventType,
      organizationId: input.organizationId,
      message: error instanceof Error ? error.message : 'unknown',
    });
  }
};

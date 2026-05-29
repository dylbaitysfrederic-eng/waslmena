'use server';

import { and, count, eq, gte, inArray, isNull } from 'drizzle-orm';

import { db } from '@/libs/DB';
import {
  menuItemSchema,
  orderItemSchema,
  orderSchema,
  organizationSchema,
  restaurantTableSchema,
} from '@/models/Schema';
import { recordAnalyticsEvent } from '@/utils/Analytics';

type SubmitOrderInput = {
  organizationId: string;
  idempotencyKey?: string;
  tableId?: number | null;
  orderType?: 'table' | 'counter' | 'delivery';
  customerName: string;
  customerNote?: string;
  deliveryAddress?: string;
  deliveryPhone?: string;
  deliveryNotes?: string;
  locale?: string;
  deviceType?: string;
  items: {
    menuItemId: number;
    quantity: number;
    customerNote?: string;
  }[];
};

type TrackPublicMenuCategoryViewInput = {
  organizationId: string;
  categoryId: number;
  locale: string;
  deviceType: string;
};

type SubmitOrderResult =
  | {
    ok: true;
    orderId: number;
  }
  | {
    ok: false;
    reason?: 'rate_limited';
  };

type CheckPendingPublicOrderInput = {
  organizationId: string;
  idempotencyKey: string;
};

type CheckPendingPublicOrderResult =
  | {
    ok: true;
    found: true;
    orderId: number;
    status: string;
    createdAt: string;
  }
  | {
    ok: true;
    found: false;
  }
  | {
    ok: false;
  };

const normalizeCustomerNote = (value: string | undefined) => {
  const textValue = value?.trim() ?? '';

  return textValue.length > 0 ? textValue.slice(0, 200) : null;
};

const PUBLIC_ORDER_RATE_LIMIT = {
  maxOrdersPerTable: 5,
  maxGeneralOrders: 20,
  windowMs: 60 * 1000,
};

const isPublicOrderRateLimited = async (input: {
  organizationId: string;
  tableId: number | null;
}) => {
  const since = new Date(Date.now() - PUBLIC_ORDER_RATE_LIMIT.windowMs);
  const tableCondition = input.tableId === null
    ? isNull(orderSchema.tableId)
    : eq(orderSchema.tableId, input.tableId);
  const [recentOrderCount] = await db
    .select({ count: count() })
    .from(orderSchema)
    .where(
      and(
        eq(orderSchema.organizationId, input.organizationId),
        tableCondition,
        gte(orderSchema.createdAt, since),
      ),
    );

  const limit = input.tableId === null
    ? PUBLIC_ORDER_RATE_LIMIT.maxGeneralOrders
    : PUBLIC_ORDER_RATE_LIMIT.maxOrdersPerTable;

  return (recentOrderCount?.count ?? 0) >= limit;
};

const recordSubmitFailure = (
  input: SubmitOrderInput,
  reason: string,
) => {
  void recordAnalyticsEvent({
    organizationId: input.organizationId,
    eventType: 'order_submit_failure',
    locale: input.locale,
    deviceType: input.deviceType,
    tableId: input.tableId ?? null,
    metadata: { reason },
  });
};

const submitPublicOrderActionImpl = async (
  input: SubmitOrderInput,
): Promise<SubmitOrderResult> => {
  const rawIdempotencyKey = (input.idempotencyKey ?? '').toString().trim();
  const idempotencyKey = rawIdempotencyKey.length > 0 ? rawIdempotencyKey : null;

  if (idempotencyKey) {
    const [existing] = await db
      .select({ id: orderSchema.id })
      .from(orderSchema)
      .where(
        and(
          eq(orderSchema.organizationId, input.organizationId),
          eq(orderSchema.idempotencyKey, idempotencyKey),
        ),
      )
      .limit(1);

    if (existing) {
      void recordAnalyticsEvent({
        organizationId: input.organizationId,
        eventType: 'order_submit_success',
        locale: input.locale,
        deviceType: input.deviceType,
        tableId: input.tableId ?? null,
        orderId: existing.id,
        metadata: { idempotent: true },
      });
      return { ok: true, orderId: existing.id };
    }
  }
  const tableId = input.tableId === null || input.tableId === undefined
    ? null
    : Number.isInteger(input.tableId) ? input.tableId : Number.NaN;
  const customerName = input.customerName.trim();
  const customerNote = normalizeCustomerNote(input.customerNote);
  const cartItems = input.items
    .map(item => ({
      menuItemId: Number.isInteger(item.menuItemId)
        ? item.menuItemId
        : Number.NaN,
      quantity: Number.isInteger(item.quantity) ? item.quantity : Number.NaN,
      customerNote: normalizeCustomerNote(item.customerNote),
    }))
    .filter(item =>
      !Number.isNaN(item.menuItemId)
      && !Number.isNaN(item.quantity)
      && item.quantity > 0,
    );

  if (
    !input.organizationId
    || (tableId !== null && Number.isNaN(tableId))
    || customerName.length === 0
    || customerName.length > 50
    || cartItems.length === 0
  ) {
    recordSubmitFailure(input, 'invalid_payload');
    return { ok: false };
  }

  if (await isPublicOrderRateLimited({ organizationId: input.organizationId, tableId })) {
    recordSubmitFailure(input, 'rate_limited');
    return { ok: false, reason: 'rate_limited' };
  }

  if (tableId !== null) {
    const [restaurantTable] = await db
      .select({ id: restaurantTableSchema.id })
      .from(restaurantTableSchema)
      .where(
        and(
          eq(restaurantTableSchema.id, tableId),
          eq(restaurantTableSchema.organizationId, input.organizationId),
        ),
      )
      .limit(1);

    if (!restaurantTable) {
      recordSubmitFailure(input, 'invalid_table');
      return { ok: false };
    }
  }

  const rawOrderType = input.orderType?.toString().trim();
  const orderType = rawOrderType === 'delivery'
    ? 'delivery'
    : rawOrderType === 'counter'
      ? 'counter'
      : tableId !== null
        ? 'table'
        : 'counter';
  const deliveryAddress = input.deliveryAddress?.trim() ?? '';
  const deliveryPhone = input.deliveryPhone?.trim() ?? '';
  const deliveryNotes = normalizeCustomerNote(input.deliveryNotes);

  const [organizationWithDelivery] = await db
    .select({
      accessStatus: organizationSchema.accessStatus,
      accessSuspended: organizationSchema.accessSuspended,
      deliveryEnabled: organizationSchema.deliveryEnabled,
      pickupEnabled: organizationSchema.pickupEnabled,
      deliveryFeeUsdCents: organizationSchema.deliveryFeeUsdCents,
      deliveryFeeLocal: organizationSchema.deliveryFeeLocal,
      minimumOrderAmountUsdCents: organizationSchema.minimumOrderAmountUsdCents,
      minimumOrderAmountLocal: organizationSchema.minimumOrderAmountLocal,
      deliveryEstimatedTime: organizationSchema.deliveryEstimatedTime,
    })
    .from(organizationSchema)
    .where(eq(organizationSchema.id, input.organizationId))
    .limit(1);

  if (
    !organizationWithDelivery
    || organizationWithDelivery.accessStatus !== 'active'
    || organizationWithDelivery.accessSuspended
    || (orderType === 'delivery' && !organizationWithDelivery.deliveryEnabled)
    || (tableId === null && orderType === 'counter' && !organizationWithDelivery.pickupEnabled)
    || (orderType === 'delivery' && deliveryAddress.length === 0)
    || (orderType === 'delivery' && deliveryPhone.length === 0)
  ) {
    recordSubmitFailure(input, 'restaurant_unavailable_or_invalid_order_type');
    return { ok: false };
  }

  const quantityByMenuItemId = new Map<number, number>();
  const noteByMenuItemId = new Map<number, string | null>();

  for (const item of cartItems) {
    quantityByMenuItemId.set(
      item.menuItemId,
      (quantityByMenuItemId.get(item.menuItemId) ?? 0) + item.quantity,
    );
    noteByMenuItemId.set(
      item.menuItemId,
      [noteByMenuItemId.get(item.menuItemId), item.customerNote]
        .filter(Boolean)
        .join(' / ')
        .slice(0, 200) || null,
    );
  }

  const menuItemIds = [...quantityByMenuItemId.keys()];
  const availableItems = await db
    .select({
      id: menuItemSchema.id,
      priceUsdCents: menuItemSchema.priceUsdCents,
      priceLbp: menuItemSchema.priceLbp,
    })
    .from(menuItemSchema)
    .where(
      and(
        eq(menuItemSchema.organizationId, input.organizationId),
        eq(menuItemSchema.isAvailable, true),
        inArray(menuItemSchema.id, menuItemIds),
      ),
    );

  if (availableItems.length !== menuItemIds.length) {
    recordSubmitFailure(input, 'unavailable_menu_items');
    return { ok: false };
  }

  const orderItems = availableItems.map((item) => {
    const quantity = quantityByMenuItemId.get(item.id) ?? 0;

    return {
      menuItemId: item.id,
      quantity,
      customerNote: noteByMenuItemId.get(item.id) ?? null,
      unitPriceUsdCents: item.priceUsdCents,
      unitPriceLbp: item.priceLbp,
    };
  });

  const totalUsdCentsValue = orderItems.reduce(
    (total, item) => total + (item.unitPriceUsdCents ?? 0) * item.quantity,
    0,
  );
  const totalLbpValue = orderItems.reduce(
    (total, item) => total + (item.unitPriceLbp ?? 0) * item.quantity,
    0,
  );
  const hasUsdPrices = orderItems.some(item => item.unitPriceUsdCents !== null);
  const hasLbpPrices = orderItems.some(item => item.unitPriceLbp !== null);
  const totalUsdCents = hasUsdPrices ? totalUsdCentsValue : null;
  const totalLbp = hasLbpPrices ? totalLbpValue : null;
  const deliveryFeeUsdCents = orderType === 'delivery'
    ? organizationWithDelivery.deliveryFeeUsdCents
    : null;
  const deliveryFeeLocal = orderType === 'delivery'
    ? organizationWithDelivery.deliveryFeeLocal
    : null;
  const deliveryEstimatedTime = orderType === 'delivery'
    ? organizationWithDelivery.deliveryEstimatedTime
    : null;

  const orderId = await db.transaction(async (tx) => {
    const [order] = await tx
      .insert(orderSchema)
      .values({
        organizationId: input.organizationId,
        idempotencyKey: idempotencyKey ?? undefined,
        tableId,
        orderType,
        customerName,
        customerNote,
        deliveryAddress: deliveryAddress || undefined,
        deliveryPhone: deliveryPhone || undefined,
        deliveryNotes,
        deliveryFeeUsdCents: deliveryFeeUsdCents ?? undefined,
        deliveryFeeLocal: deliveryFeeLocal ?? undefined,
        deliveryEstimatedTime: deliveryEstimatedTime ?? undefined,
        status: 'pending',
        paymentMethod: 'cash',
        paymentStatus: 'unpaid',
        totalUsdCents,
        totalLbp,
      })
      .returning();

    if (!order) {
      throw new Error('Order creation failed');
    }

    await tx.insert(orderItemSchema).values(
      orderItems.map(item => ({
        orderId: order.id,
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        customerNote: item.customerNote,
        unitPriceUsdCents: item.unitPriceUsdCents,
        unitPriceLbp: item.unitPriceLbp,
      })),
    );

    return order.id;
  });

  void recordAnalyticsEvent({
    organizationId: input.organizationId,
    eventType: 'order_submit_success',
    locale: input.locale,
    deviceType: input.deviceType,
    tableId,
    orderId,
    metadata: { orderType },
  });

  return {
    ok: true,
    orderId,
  };
};

// Improve idempotency race resilience: if a concurrent insert created the
// same idempotency key, the DB may raise a unique constraint error. Catch
// that and return the existing order instead of surfacing an error.
const wrapSubmitPublicOrderAction = async (
  input: SubmitOrderInput,
): Promise<SubmitOrderResult> => {
  try {
    return await submitPublicOrderActionImpl(input);
  } catch (err: any) {
    const key = (input.idempotencyKey ?? '').toString().trim();

    if (!key) {
      throw err;
    }

    try {
      const [existing] = await db
        .select({ id: orderSchema.id })
        .from(orderSchema)
        .where(
          and(
            eq(orderSchema.organizationId, input.organizationId),
            eq(orderSchema.idempotencyKey, key),
          ),
        )
        .limit(1);

      if (existing) {
        void recordAnalyticsEvent({
          organizationId: input.organizationId,
          eventType: 'order_submit_success',
          locale: input.locale,
          deviceType: input.deviceType,
          tableId: input.tableId ?? null,
          orderId: existing.id,
          metadata: { idempotent: true },
        });
        return { ok: true, orderId: existing.id };
      }
    } catch {
      // fall through to rethrow original error
    }

    recordSubmitFailure(input, 'unexpected_error');
    throw err;
  }
};

export { wrapSubmitPublicOrderAction as submitPublicOrderAction };

export const checkPendingPublicOrderAction = async (
  input: CheckPendingPublicOrderInput,
): Promise<CheckPendingPublicOrderResult> => {
  const idempotencyKey = input.idempotencyKey?.toString().trim() ?? '';

  if (!idempotencyKey) {
    return { ok: false };
  }

  const [order] = await db
    .select({
      id: orderSchema.id,
      status: orderSchema.status,
      createdAt: orderSchema.createdAt,
    })
    .from(orderSchema)
    .where(
      and(
        eq(orderSchema.organizationId, input.organizationId),
        eq(orderSchema.idempotencyKey, idempotencyKey),
      ),
    )
    .limit(1);

  if (!order) {
    return { ok: true, found: false };
  }

  return {
    ok: true,
    found: true,
    orderId: order.id,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
  };
};

export const trackPublicMenuCategoryViewAction = async (
  input: TrackPublicMenuCategoryViewInput,
) => {
  const categoryId = Number.isInteger(input.categoryId)
    ? input.categoryId
    : Number.NaN;

  if (!input.organizationId || Number.isNaN(categoryId)) {
    return;
  }

  void recordAnalyticsEvent({
    organizationId: input.organizationId,
    eventType: 'category_view',
    locale: input.locale,
    deviceType: input.deviceType,
    categoryId,
  });
};

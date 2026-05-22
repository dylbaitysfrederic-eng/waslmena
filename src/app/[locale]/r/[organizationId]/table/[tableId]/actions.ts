'use server';

import { and, eq, inArray } from 'drizzle-orm';

import { db } from '@/libs/DB';
import {
  menuItemSchema,
  orderItemSchema,
  orderSchema,
  organizationSchema,
  restaurantTableSchema,
} from '@/models/Schema';

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
  items: {
    menuItemId: number;
    quantity: number;
    customerNote?: string;
  }[];
};

type SubmitOrderResult =
  | {
    ok: true;
    orderId: number;
  }
  | {
    ok: false;
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

export const submitPublicOrderAction = async (
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
    return { ok: false };
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
    || (orderType === 'delivery' && deliveryAddress.length === 0)
    || (orderType === 'delivery' && deliveryPhone.length === 0)
  ) {
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

  return {
    ok: true,
    orderId,
  };
};

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

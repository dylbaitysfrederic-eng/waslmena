'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { getActiveRestaurantOrganizationId } from '@/features/dashboard/RestaurantAccess';
import { db } from '@/libs/DB';
import { menuItemSchema, orderItemSchema, orderSchema } from '@/models/Schema';

const ORDERS_PATH = '/dashboard/orders';

const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'completed',
  'cancelled',
] as const;

const FINAL_ORDER_STATUSES = new Set(['completed', 'served', 'delivered', 'cancelled']);

export const updateOrderStatusAction = async (formData: FormData) => {
  const organizationId = await getActiveRestaurantOrganizationId();
  const orderId = Number.parseInt(
    formData.get('orderId')?.toString() ?? '',
    10,
  );
  const status = formData.get('status')?.toString();

  if (
    !organizationId
    || Number.isNaN(orderId)
    || !ORDER_STATUSES.includes(status as (typeof ORDER_STATUSES)[number])
  ) {
    return;
  }

  await db
    .update(orderSchema)
    .set({ status })
    .where(
      and(
        eq(orderSchema.id, orderId),
        eq(orderSchema.organizationId, organizationId),
      ),
    );

  revalidatePath(ORDERS_PATH);
};

const parsePositiveInteger = (value: FormDataEntryValue | null) => {
  const parsedValue = Number.parseInt(value?.toString() ?? '', 10);

  if (Number.isNaN(parsedValue) || parsedValue < 0) {
    return 0;
  }

  return parsedValue;
};

const normalizeOptionalText = (value: FormDataEntryValue | null) => {
  const textValue = value?.toString().trim() ?? '';

  return textValue.length > 0 ? textValue : null;
};

export const updateOrderAction = async (formData: FormData) => {
  const organizationId = await getActiveRestaurantOrganizationId();
  const orderId = Number.parseInt(
    formData.get('orderId')?.toString() ?? '',
    10,
  );
  const status = formData.get('status')?.toString();

  if (
    !organizationId
    || Number.isNaN(orderId)
    || !ORDER_STATUSES.includes(status as (typeof ORDER_STATUSES)[number])
  ) {
    return;
  }

  const [order] = await db
    .select({
      id: orderSchema.id,
      status: orderSchema.status,
    })
    .from(orderSchema)
    .where(
      and(
        eq(orderSchema.id, orderId),
        eq(orderSchema.organizationId, organizationId),
      ),
    )
    .limit(1);

  if (!order || FINAL_ORDER_STATUSES.has(order.status)) {
    return;
  }

  const currentOrderItems = await db
    .select({
      id: orderItemSchema.id,
    })
    .from(orderItemSchema)
    .where(eq(orderItemSchema.orderId, orderId));

  for (const item of currentOrderItems) {
    const quantity = parsePositiveInteger(
      formData.get(`orderItemQuantity_${item.id}`),
    );

    if (quantity <= 0) {
      await db
        .delete(orderItemSchema)
        .where(
          and(
            eq(orderItemSchema.id, item.id),
            eq(orderItemSchema.orderId, orderId),
          ),
        );
      continue;
    }

    await db
      .update(orderItemSchema)
      .set({ quantity })
      .where(
        and(
          eq(orderItemSchema.id, item.id),
          eq(orderItemSchema.orderId, orderId),
        ),
      );
  }

  const addMenuItemId = Number.parseInt(
    formData.get('addMenuItemId')?.toString() ?? '',
    10,
  );
  const addQuantity = parsePositiveInteger(formData.get('addQuantity'));

  if (!Number.isNaN(addMenuItemId) && addQuantity > 0) {
    const [menuItem] = await db
      .select({
        id: menuItemSchema.id,
        priceUsdCents: menuItemSchema.priceUsdCents,
        priceLbp: menuItemSchema.priceLbp,
      })
      .from(menuItemSchema)
      .where(
        and(
          eq(menuItemSchema.id, addMenuItemId),
          eq(menuItemSchema.organizationId, organizationId),
        ),
      )
      .limit(1);

    if (menuItem) {
      await db.insert(orderItemSchema).values({
        orderId,
        menuItemId: menuItem.id,
        quantity: addQuantity,
        unitPriceUsdCents: menuItem.priceUsdCents,
        unitPriceLbp: menuItem.priceLbp,
      });
    }
  }

  const recalculationItems = await db
    .select({
      quantity: orderItemSchema.quantity,
      unitPriceUsdCents: orderItemSchema.unitPriceUsdCents,
      unitPriceLbp: orderItemSchema.unitPriceLbp,
    })
    .from(orderItemSchema)
    .where(eq(orderItemSchema.orderId, orderId));

  const hasUsdPrices = recalculationItems.some(
    item => item.unitPriceUsdCents !== null,
  );
  const hasLocalPrices = recalculationItems.some(
    item => item.unitPriceLbp !== null,
  );
  const totalUsdCents = hasUsdPrices
    ? recalculationItems.reduce(
      (total, item) => total + (item.unitPriceUsdCents ?? 0) * item.quantity,
      0,
    )
    : null;
  const totalLbp = hasLocalPrices
    ? recalculationItems.reduce(
      (total, item) => total + (item.unitPriceLbp ?? 0) * item.quantity,
      0,
    )
    : null;

  await db
    .update(orderSchema)
    .set({
      customerName: normalizeOptionalText(formData.get('customerName')),
      status,
      totalUsdCents,
      totalLbp,
    })
    .where(
      and(
        eq(orderSchema.id, orderId),
        eq(orderSchema.organizationId, organizationId),
      ),
    );

  revalidatePath(ORDERS_PATH);
};

'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { getActiveRestaurantOrganizationId } from '@/features/dashboard/RestaurantAccess';
import { db } from '@/libs/DB';
import { restaurantTableSchema } from '@/models/Schema';

const TABLES_PATH = '/dashboard/tables';

export const createRestaurantTableAction = async (formData: FormData) => {
  const organizationId = await getActiveRestaurantOrganizationId();
  const tableNumber = Number.parseInt(
    formData.get('tableNumber')?.toString() ?? '',
    10,
  );

  if (!organizationId || Number.isNaN(tableNumber)) {
    return;
  }

  await db.insert(restaurantTableSchema).values({
    organizationId,
    tableNumber,
    qrCode: `restaurant-table-${organizationId}-${tableNumber}`,
  });

  revalidatePath(TABLES_PATH);
};

export const deleteRestaurantTableAction = async (formData: FormData) => {
  const organizationId = await getActiveRestaurantOrganizationId();
  const tableId = Number.parseInt(
    formData.get('tableId')?.toString() ?? '',
    10,
  );

  if (!organizationId || Number.isNaN(tableId)) {
    return;
  }

  await db
    .delete(restaurantTableSchema)
    .where(
      and(
        eq(restaurantTableSchema.id, tableId),
        eq(restaurantTableSchema.organizationId, organizationId),
      ),
    );

  revalidatePath(TABLES_PATH);
};

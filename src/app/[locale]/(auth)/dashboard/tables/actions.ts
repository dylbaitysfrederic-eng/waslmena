'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { getActiveRestaurantOrganizationId } from '@/features/dashboard/RestaurantAccess';
import { db } from '@/libs/DB';
import {
  orderSchema,
  organizationSchema,
  restaurantTableSchema,
} from '@/models/Schema';

const TABLES_PATH = '/dashboard/tables';
const QR_COLOR_DEFAULTS = {
  background: '#ffffff',
  foreground: '#111827',
  frame: '#111827',
};

const RESTAURANT_PROFILES = [
  'fast_food',
  'cafe',
  'casual_dining',
  'table_service',
  'shisha_lounge',
] as const;
const RESTAURANT_TEMPLATE_STYLES = [
  'fast_food',
  'cafe',
  'casual_restaurant',
  'table_service',
  'shisha_lounge',
] as const;
const ORDERING_MODES = ['table_ordering', 'counter_pickup', 'both'] as const;
const QR_MODES = ['per_table', 'general_menu', 'both'] as const;
const QR_STYLE_TEMPLATES = ['classic', 'modern', 'minimal'] as const;

const normalizeOptionalText = (value: FormDataEntryValue | null) => {
  const textValue = value?.toString().trim() ?? '';

  return textValue.length > 0 ? textValue : null;
};

const normalizeEnumValue = <T extends readonly string[]>(
  value: FormDataEntryValue | null,
  allowedValues: T,
  fallback: T[number],
) => {
  const textValue = value?.toString();

  return allowedValues.includes(textValue ?? '') ? textValue as T[number] : fallback;
};

const normalizeHexColor = (
  value: FormDataEntryValue | null,
  fallback: string,
) => {
  const textValue = value?.toString() ?? '';

  return /^#[0-9a-f]{6}$/i.test(textValue) ? textValue : fallback;
};

const isValidPublicUrl = (value: string | null) => {
  if (!value) {
    return false;
  }

  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

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

export const updateRestaurantTableAction = async (formData: FormData) => {
  const organizationId = await getActiveRestaurantOrganizationId();
  const tableId = Number.parseInt(
    formData.get('tableId')?.toString() ?? '',
    10,
  );
  const tableNumber = Number.parseInt(
    formData.get('tableNumber')?.toString() ?? '',
    10,
  );

  if (!organizationId || Number.isNaN(tableId) || Number.isNaN(tableNumber)) {
    return;
  }

  await db
    .update(restaurantTableSchema)
    .set({
      tableNumber,
      qrCode: `restaurant-table-${organizationId}-${tableNumber}`,
    })
    .where(
      and(
        eq(restaurantTableSchema.id, tableId),
        eq(restaurantTableSchema.organizationId, organizationId),
      ),
    );

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

  const [referencedOrder] = await db
    .select({ id: orderSchema.id })
    .from(orderSchema)
    .where(
      and(
        eq(orderSchema.organizationId, organizationId),
        eq(orderSchema.tableId, tableId),
      ),
    )
    .limit(1);

  if (referencedOrder) {
    redirect(`${TABLES_PATH}?tableStatus=delete_blocked`);
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

export const updateRestaurantQrSettingsAction = async (formData: FormData) => {
  const organizationId = await getActiveRestaurantOrganizationId();

  if (!organizationId) {
    return;
  }

  const restaurantLogoUrl = normalizeOptionalText(formData.get('restaurantLogoUrl'));

  await db
    .update(organizationSchema)
    .set({
      restaurantProfile: normalizeEnumValue(
        formData.get('restaurantProfile'),
        RESTAURANT_PROFILES,
        'table_service',
      ),
      restaurantTemplateStyle: normalizeEnumValue(
        formData.get('restaurantTemplateStyle'),
        RESTAURANT_TEMPLATE_STYLES,
        'casual_restaurant',
      ),
      restaurantAccentColor: normalizeHexColor(
        formData.get('restaurantAccentColor'),
        QR_COLOR_DEFAULTS.frame,
      ),
      showMenuItemImages: formData.get('showMenuItemImages') === 'on',
      orderingMode: normalizeEnumValue(
        formData.get('orderingMode'),
        ORDERING_MODES,
        'table_ordering',
      ),
      enableTableNumbers: formData.get('enableTableNumbers') === 'on',
      enableNamedTables: formData.get('enableNamedTables') === 'on',
      enableCustomerName: formData.get('enableCustomerName') === 'on',
      enableWhatsappContact: formData.get('enableWhatsappContact') === 'on',
      qrMode: normalizeEnumValue(formData.get('qrMode'), QR_MODES, 'per_table'),
      qrFrameColor: normalizeHexColor(
        formData.get('qrFrameColor'),
        QR_COLOR_DEFAULTS.frame,
      ),
      qrForegroundColor: normalizeHexColor(
        formData.get('qrForegroundColor'),
        QR_COLOR_DEFAULTS.foreground,
      ),
      qrBackgroundColor: normalizeHexColor(
        formData.get('qrBackgroundColor'),
        QR_COLOR_DEFAULTS.background,
      ),
      qrLabelText: normalizeOptionalText(formData.get('qrLabelText')),
      restaurantLogoUrl: isValidPublicUrl(restaurantLogoUrl) ? restaurantLogoUrl : null,
      qrShowRestaurantName: formData.get('qrShowRestaurantName') === 'on',
      qrShowTableNumber: formData.get('qrShowTableNumber') === 'on',
      qrStyleTemplate: normalizeEnumValue(
        formData.get('qrStyleTemplate'),
        QR_STYLE_TEMPLATES,
        'classic',
      ),
    })
    .where(eq(organizationSchema.id, organizationId));

  revalidatePath(TABLES_PATH);
};

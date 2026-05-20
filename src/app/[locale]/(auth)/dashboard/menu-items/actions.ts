'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { getActiveRestaurantOrganizationId } from '@/features/dashboard/RestaurantAccess';
import { db } from '@/libs/DB';
import { menuCategorySchema, menuItemSchema } from '@/models/Schema';
import { getMenuItemImageUrl } from '@/utils/MenuItemImageUpload';
import {
  getPrimaryMenuText,
  hasAnyMenuText,
  normalizeMenuText,
} from '@/utils/MenuTranslations';

const MENU_ITEMS_PATH = '/dashboard/menu-items';

const getReturnPath = (formData: FormData) => {
  const returnPath = formData.get('returnPath')?.toString();

  if (returnPath?.endsWith('/dashboard/menu-items')) {
    return returnPath;
  }

  return MENU_ITEMS_PATH;
};

const redirectWithError = (returnPath: string, error: string): never => {
  redirect(`${returnPath}?error=${error}`);
};

type CurrencyMode = 'usd' | 'local' | 'both';

const getCurrencyMode = (item: {
  priceUsdCents: number | null;
  priceLbp: number | null;
}): CurrencyMode | null => {
  if (item.priceUsdCents !== null && item.priceLbp !== null) {
    return 'both';
  }

  if (item.priceUsdCents !== null) {
    return 'usd';
  }

  if (item.priceLbp !== null) {
    return 'local';
  }

  return null;
};

const getExistingCurrencyMode = async (
  organizationId: string,
  excludedItemId?: number,
) => {
  const existingItems = await db
    .select({
      id: menuItemSchema.id,
      priceUsdCents: menuItemSchema.priceUsdCents,
      priceLbp: menuItemSchema.priceLbp,
    })
    .from(menuItemSchema)
    .where(eq(menuItemSchema.organizationId, organizationId));
  const modes = new Set(
    existingItems
      .filter(item => item.id !== excludedItemId)
      .map(getCurrencyMode)
      .filter((mode): mode is CurrencyMode => mode !== null),
  );

  if (modes.size === 0) {
    return null;
  }

  return modes.size === 1 ? [...modes][0]! : 'mixed';
};

const validateCurrencyMode = async (
  organizationId: string,
  returnPath: string,
  priceUsdCents: number | null,
  priceLbp: number | null,
  excludedItemId?: number,
) => {
  const itemMode = getCurrencyMode({ priceUsdCents, priceLbp });

  if (!itemMode) {
    redirectWithError(returnPath, 'missing_price');
  }

  const existingMode = await getExistingCurrencyMode(
    organizationId,
    excludedItemId,
  );

  if (existingMode === 'mixed' || (existingMode && itemMode !== existingMode)) {
    redirectWithError(returnPath, 'currency_mismatch');
  }
};

const parseOptionalPrice = (value: FormDataEntryValue | null) => {
  const textValue = value?.toString().trim();

  if (!textValue) {
    return {
      isInvalid: false,
      isNegative: false,
      value: null,
    };
  }

  const parsedValue = Number.parseInt(textValue, 10);

  if (Number.isNaN(parsedValue)) {
    return {
      isInvalid: true,
      isNegative: false,
      value: null,
    };
  }

  if (parsedValue < 0) {
    return {
      isInvalid: false,
      isNegative: true,
      value: null,
    };
  }

  return {
    isInvalid: false,
    isNegative: false,
    value: parsedValue,
  };
};

export const createMenuItemAction = async (formData: FormData) => {
  const returnPath = getReturnPath(formData);
  const organizationId = await getActiveRestaurantOrganizationId();
  const categoryId = Number.parseInt(
    formData.get('categoryId')?.toString() ?? '',
    10,
  );
  const names = {
    en: normalizeMenuText(formData.get('nameEn')),
    ar: normalizeMenuText(formData.get('nameAr')),
    fr: normalizeMenuText(formData.get('nameFr')),
  };
  const descriptions = {
    en: normalizeMenuText(formData.get('descriptionEn')),
    ar: normalizeMenuText(formData.get('descriptionAr')),
    fr: normalizeMenuText(formData.get('descriptionFr')),
  };
  const imageUrlField = formData.get('imageUrl')?.toString().trim() || null;
  let imageUrl: string | null = null;

  try {
    imageUrl = await getMenuItemImageUrl(imageUrlField, formData.get('imageFile'));
  } catch (error) {
    redirectWithError(returnPath, (error as Error)?.message || 'invalid_image_type');
  }

  const priceUsdCents = parseOptionalPrice(formData.get('priceUsdCents'));
  const priceLbp = parseOptionalPrice(formData.get('priceLbp'));
  const isAvailable = formData.get('isAvailable') === 'on';

  if (!organizationId) {
    return;
  }

  if (!hasAnyMenuText(names)) {
    redirectWithError(returnPath, 'missing_name');
  }

  if (Number.isNaN(categoryId)) {
    redirectWithError(returnPath, 'invalid_category');
  }

  if (
    priceUsdCents.isInvalid
    || priceLbp.isInvalid
  ) {
    redirectWithError(returnPath, 'invalid_price');
  }

  if (
    priceUsdCents.isNegative
    || priceLbp.isNegative
  ) {
    redirectWithError(returnPath, 'negative_price');
  }

  if (priceUsdCents.value === null && priceLbp.value === null) {
    redirectWithError(returnPath, 'missing_price');
  }

  await validateCurrencyMode(
    organizationId,
    returnPath,
    priceUsdCents.value,
    priceLbp.value,
  );

  const [category] = await db
    .select({ id: menuCategorySchema.id })
    .from(menuCategorySchema)
    .where(
      and(
        eq(menuCategorySchema.id, categoryId),
        eq(menuCategorySchema.organizationId, organizationId),
      ),
    )
    .limit(1);

  if (!category) {
    redirectWithError(returnPath, 'invalid_category');
  }

  await db.insert(menuItemSchema).values({
    organizationId,
    categoryId,
    name: getPrimaryMenuText(names, 'Untitled item'),
    nameEn: names.en,
    nameAr: names.ar,
    nameFr: names.fr,
    description: getPrimaryMenuText(descriptions, '') || null,
    descriptionEn: descriptions.en,
    descriptionAr: descriptions.ar,
    descriptionFr: descriptions.fr,
    imageUrl: imageUrl || null,
    priceUsdCents: priceUsdCents.value,
    priceLbp: priceLbp.value,
    isAvailable,
  });

  revalidatePath(MENU_ITEMS_PATH);
  revalidatePath(returnPath);
  redirect(returnPath);
};

export const updateMenuItemAction = async (formData: FormData) => {
  const returnPath = getReturnPath(formData);
  const organizationId = await getActiveRestaurantOrganizationId();
  const itemId = Number.parseInt(
    formData.get('itemId')?.toString() ?? '',
    10,
  );
  const categoryId = Number.parseInt(
    formData.get('categoryId')?.toString() ?? '',
    10,
  );
  const names = {
    en: normalizeMenuText(formData.get('nameEn')),
    ar: normalizeMenuText(formData.get('nameAr')),
    fr: normalizeMenuText(formData.get('nameFr')),
  };
  const descriptions = {
    en: normalizeMenuText(formData.get('descriptionEn')),
    ar: normalizeMenuText(formData.get('descriptionAr')),
    fr: normalizeMenuText(formData.get('descriptionFr')),
  };
  const imageUrlField = formData.get('imageUrl')?.toString().trim() || null;

  const priceUsdCents = parseOptionalPrice(formData.get('priceUsdCents'));
  const priceLbp = parseOptionalPrice(formData.get('priceLbp'));
  const isAvailable = formData.get('isAvailable') === 'on';

  if (!organizationId) {
    return;
  }

  if (Number.isNaN(itemId)) {
    redirectWithError(returnPath, 'invalid_item');
  }

  if (!hasAnyMenuText(names)) {
    redirectWithError(returnPath, 'missing_name');
  }

  if (Number.isNaN(categoryId)) {
    redirectWithError(returnPath, 'invalid_category');
  }

  if (priceUsdCents.isInvalid || priceLbp.isInvalid) {
    redirectWithError(returnPath, 'invalid_price');
  }

  if (priceUsdCents.isNegative || priceLbp.isNegative) {
    redirectWithError(returnPath, 'negative_price');
  }

  if (priceUsdCents.value === null && priceLbp.value === null) {
    redirectWithError(returnPath, 'missing_price');
  }

  const [existingItem] = await db
    .select({ imageUrl: menuItemSchema.imageUrl })
    .from(menuItemSchema)
    .where(
      and(
        eq(menuItemSchema.id, itemId),
        eq(menuItemSchema.organizationId, organizationId),
      ),
    )
    .limit(1);

  if (!existingItem) {
    redirectWithError(returnPath, 'invalid_item');
  }

  let imageUrl: string | null = null;

  try {
    imageUrl = await getMenuItemImageUrl(
      imageUrlField || existingItem?.imageUrl || null,
      formData.get('imageFile'),
    );
  } catch (error) {
    redirectWithError(returnPath, (error as Error)?.message || 'invalid_image_type');
  }

  await validateCurrencyMode(
    organizationId,
    returnPath,
    priceUsdCents.value,
    priceLbp.value,
    itemId,
  );

  const [category] = await db
    .select({ id: menuCategorySchema.id })
    .from(menuCategorySchema)
    .where(
      and(
        eq(menuCategorySchema.id, categoryId),
        eq(menuCategorySchema.organizationId, organizationId),
      ),
    )
    .limit(1);

  if (!category) {
    redirectWithError(returnPath, 'invalid_category');
  }

  await db
    .update(menuItemSchema)
    .set({
      categoryId,
      name: getPrimaryMenuText(names, 'Untitled item'),
      nameEn: names.en,
      nameAr: names.ar,
      nameFr: names.fr,
      description: getPrimaryMenuText(descriptions, '') || null,
      descriptionEn: descriptions.en,
      descriptionAr: descriptions.ar,
      descriptionFr: descriptions.fr,
      imageUrl: imageUrl || null,
      priceUsdCents: priceUsdCents.value,
      priceLbp: priceLbp.value,
      isAvailable,
    })
    .where(
      and(
        eq(menuItemSchema.id, itemId),
        eq(menuItemSchema.organizationId, organizationId),
      ),
    );

  revalidatePath(MENU_ITEMS_PATH);
  revalidatePath(returnPath);
  redirect(returnPath);
};

export const deleteMenuItemAction = async (formData: FormData) => {
  const returnPath = getReturnPath(formData);
  const organizationId = await getActiveRestaurantOrganizationId();
  const itemId = Number.parseInt(
    formData.get('itemId')?.toString() ?? '',
    10,
  );

  if (!organizationId || Number.isNaN(itemId)) {
    return;
  }

  await db
    .delete(menuItemSchema)
    .where(
      and(
        eq(menuItemSchema.id, itemId),
        eq(menuItemSchema.organizationId, organizationId),
      ),
    );

  revalidatePath(MENU_ITEMS_PATH);
  revalidatePath(returnPath);
  redirect(returnPath);
};

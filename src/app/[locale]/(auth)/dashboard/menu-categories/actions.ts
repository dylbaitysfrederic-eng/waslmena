'use server';

import { and, eq, isNull } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { getActiveRestaurantOrganizationId } from '@/features/dashboard/RestaurantAccess';
import { db } from '@/libs/DB';
import { menuCategorySchema, menuItemSchema } from '@/models/Schema';
import {
  getPrimaryMenuText,
  hasAnyMenuText,
  normalizeMenuText,
} from '@/utils/MenuTranslations';

const MENU_CATEGORIES_PATH = '/dashboard/menu-categories';

const getReturnPath = (formData: FormData) => {
  const returnPath = formData.get('returnPath')?.toString();

  if (returnPath?.endsWith('/dashboard/menu-categories')) {
    return returnPath;
  }

  return MENU_CATEGORIES_PATH;
};

const redirectWithError = (returnPath: string, error: string): never => {
  redirect(`${returnPath}?error=${error}`);
};

const getValidParentCategoryId = async (
  organizationId: string,
  parentCategoryId: number,
  currentCategoryId?: number,
) => {
  if (
    Number.isNaN(parentCategoryId)
    || parentCategoryId === currentCategoryId
  ) {
    return null;
  }

  const [parentCategory] = await db
    .select({ id: menuCategorySchema.id })
    .from(menuCategorySchema)
    .where(
      and(
        eq(menuCategorySchema.id, parentCategoryId),
        eq(menuCategorySchema.organizationId, organizationId),
        isNull(menuCategorySchema.parentCategoryId),
      ),
    )
    .limit(1);

  return parentCategory?.id ?? null;
};

export const createMenuCategoryAction = async (formData: FormData) => {
  const returnPath = getReturnPath(formData);
  const organizationId = await getActiveRestaurantOrganizationId();
  const names = {
    en: normalizeMenuText(formData.get('nameEn')),
    ar: normalizeMenuText(formData.get('nameAr')),
    fr: normalizeMenuText(formData.get('nameFr')),
  };
  const displayOrderValue = formData.get('displayOrder')?.toString() ?? '0';
  const displayOrder = Number.parseInt(displayOrderValue, 10);
  const parentCategoryIdValue = formData.get('parentCategoryId')?.toString();
  const parentCategoryId = Number.parseInt(parentCategoryIdValue ?? '', 10);

  if (!organizationId) {
    return;
  }

  if (!hasAnyMenuText(names)) {
    redirectWithError(returnPath, 'missing_name');
  }

  const validParentCategoryId = await getValidParentCategoryId(
    organizationId,
    parentCategoryId,
  );

  await db.insert(menuCategorySchema).values({
    organizationId,
    parentCategoryId: validParentCategoryId,
    name: getPrimaryMenuText(names, 'Untitled category'),
    nameEn: names.en,
    nameAr: names.ar,
    nameFr: names.fr,
    displayOrder: Number.isNaN(displayOrder) ? 0 : displayOrder,
  });

  revalidatePath(MENU_CATEGORIES_PATH);
  revalidatePath(returnPath);
  redirect(returnPath);
};

export const updateMenuCategoryAction = async (formData: FormData) => {
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
  const displayOrderValue = formData.get('displayOrder')?.toString() ?? '0';
  const displayOrder = Number.parseInt(displayOrderValue, 10);
  const parentCategoryIdValue = formData.get('parentCategoryId')?.toString();
  const parentCategoryId = Number.parseInt(parentCategoryIdValue ?? '', 10);

  if (!organizationId) {
    return;
  }

  if (!hasAnyMenuText(names)) {
    redirectWithError(returnPath, 'missing_name');
  }

  if (Number.isNaN(categoryId)) {
    return;
  }

  const validParentCategoryId = await getValidParentCategoryId(
    organizationId,
    parentCategoryId,
    categoryId,
  );

  await db
    .update(menuCategorySchema)
    .set({
      name: getPrimaryMenuText(names, 'Untitled category'),
      parentCategoryId: validParentCategoryId,
      nameEn: names.en,
      nameAr: names.ar,
      nameFr: names.fr,
      displayOrder: Number.isNaN(displayOrder) ? 0 : displayOrder,
    })
    .where(
      and(
        eq(menuCategorySchema.id, categoryId),
        eq(menuCategorySchema.organizationId, organizationId),
      ),
    );

  revalidatePath(MENU_CATEGORIES_PATH);
  revalidatePath(returnPath);
  redirect(returnPath);
};

export const deleteMenuCategoryAction = async (formData: FormData) => {
  const returnPath = getReturnPath(formData);
  const organizationId = await getActiveRestaurantOrganizationId();
  const categoryIdValue = formData.get('categoryId')?.toString();
  const categoryId = Number.parseInt(categoryIdValue ?? '', 10);

  if (!organizationId || Number.isNaN(categoryId)) {
    return;
  }

  const [childCategory] = await db
    .select({ id: menuCategorySchema.id })
    .from(menuCategorySchema)
    .where(
      and(
        eq(menuCategorySchema.parentCategoryId, categoryId),
        eq(menuCategorySchema.organizationId, organizationId),
      ),
    )
    .limit(1);

  if (childCategory) {
    redirectWithError(returnPath, 'category_in_use');
  }

  const [categoryItem] = await db
    .select({ id: menuItemSchema.id })
    .from(menuItemSchema)
    .where(
      and(
        eq(menuItemSchema.categoryId, categoryId),
        eq(menuItemSchema.organizationId, organizationId),
      ),
    )
    .limit(1);

  if (categoryItem) {
    redirectWithError(returnPath, 'category_in_use');
  }

  await db
    .delete(menuCategorySchema)
    .where(
      and(
        eq(menuCategorySchema.id, categoryId),
        eq(menuCategorySchema.organizationId, organizationId),
      ),
    );

  revalidatePath(MENU_CATEGORIES_PATH);
  revalidatePath(returnPath);
  redirect(returnPath);
};

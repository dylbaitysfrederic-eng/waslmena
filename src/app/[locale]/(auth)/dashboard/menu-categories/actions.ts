'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { getActiveRestaurantOrganizationId } from '@/features/dashboard/RestaurantAccess';
import { db } from '@/libs/DB';
import { menuCategorySchema } from '@/models/Schema';
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

  if (!organizationId) {
    return;
  }

  if (!hasAnyMenuText(names)) {
    redirectWithError(returnPath, 'missing_name');
  }

  await db.insert(menuCategorySchema).values({
    organizationId,
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

  if (!organizationId) {
    return;
  }

  if (!hasAnyMenuText(names)) {
    redirectWithError(returnPath, 'missing_name');
  }

  if (Number.isNaN(categoryId)) {
    return;
  }

  await db
    .update(menuCategorySchema)
    .set({
      name: getPrimaryMenuText(names, 'Untitled category'),
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

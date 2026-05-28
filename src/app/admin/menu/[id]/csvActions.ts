'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { assertAdmin, getAdminOrganizations } from '@/app/admin/_helpers';
import {
  importMenuCsv,
  validateMenuCsvFile,
} from '@/utils/MenuCsv';

const getReturnPath = (formData: FormData) => {
  const organizationId = formData.get('organizationId')?.toString();

  return organizationId ? `/admin/menu/${organizationId}` : '/admin/menu';
};

const redirectWithError = (returnPath: string, error: string): never => {
  redirect(`${returnPath}?status=${error}`);
};

const redirectWithMenuCsvSummary = (
  returnPath: string,
  summary: Awaited<ReturnType<typeof importMenuCsv>>,
): never => {
  const params = new URLSearchParams({
    csvCategoriesCreated: String(summary.categoriesCreated),
    csvCategoriesUpdated: String(summary.categoriesUpdated),
    csvErrors: String(summary.errors.length),
    csvItemsCreated: String(summary.itemsCreated),
    csvItemsUpdated: String(summary.itemsUpdated),
    csvSkipped: String(summary.skipped),
  });

  if (summary.errors.at(0)) {
    params.set('csvFirstError', summary.errors[0]!);
  }

  redirect(`${returnPath}?${params.toString()}`);
};

export const importAdminMenuCsvAction = async (formData: FormData) => {
  await assertAdmin();

  const organizationId = formData.get('organizationId')?.toString();
  const returnPath = getReturnPath(formData);
  const csvFile = formData.get('csvFile');

  const validOrganizationId = typeof organizationId === 'string'
    ? organizationId
    : '';

  if (validOrganizationId.length === 0) {
    redirectWithError(returnPath, 'invalid_menu_csv');
  }

  const { ids } = await getAdminOrganizations();

  if (!ids.includes(validOrganizationId)) {
    redirectWithError(returnPath, 'invalid_menu_csv');
  }

  const validationError = validateMenuCsvFile(csvFile);

  if (validationError) {
    redirectWithError(returnPath, validationError);
  }

  const csvText = await (csvFile as File).text();
  const summary = await importMenuCsv(validOrganizationId, csvText);

  revalidatePath(returnPath);
  redirectWithMenuCsvSummary(returnPath, summary);
};

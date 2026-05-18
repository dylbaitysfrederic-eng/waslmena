'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { getActiveRestaurantOrganizationId } from '@/features/dashboard/RestaurantAccess';
import { db } from '@/libs/DB';
import { organizationSchema } from '@/models/Schema';

const STATISTICS_PATH = '/dashboard/statistics';

const normalizeReturnPath = (value: FormDataEntryValue | null) => {
  const textValue = typeof value === 'string' ? value.trim() : '';

  if (textValue.endsWith(STATISTICS_PATH)) {
    return textValue;
  }

  return STATISTICS_PATH;
};

const parseOptionalAmount = (
  value: FormDataEntryValue | null,
  multiplier = 1,
) => {
  const textValue = typeof value === 'string' ? value.trim() : '';

  if (!textValue) {
    return null;
  }

  const parsedValue = Number.parseFloat(textValue);

  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    return null;
  }

  return Math.round(parsedValue * multiplier);
};

export const updateFinanceSnapshotAction = async (formData: FormData) => {
  const organizationId = await getActiveRestaurantOrganizationId();
  const returnPath = normalizeReturnPath(formData.get('returnPath'));

  if (!organizationId) {
    return;
  }

  await db
    .update(organizationSchema)
    .set({
      financeGoodsCostUsdCents: parseOptionalAmount(
        formData.get('financeGoodsCostUsd'),
        100,
      ),
      financeGoodsCostLocal: parseOptionalAmount(
        formData.get('financeGoodsCostLocal'),
      ),
      financeRentCostUsdCents: parseOptionalAmount(
        formData.get('financeRentCostUsd'),
        100,
      ),
      financeRentCostLocal: parseOptionalAmount(
        formData.get('financeRentCostLocal'),
      ),
      financeStaffCostUsdCents: parseOptionalAmount(
        formData.get('financeStaffCostUsd'),
        100,
      ),
      financeStaffCostLocal: parseOptionalAmount(
        formData.get('financeStaffCostLocal'),
      ),
      financeUtilitiesCostUsdCents: parseOptionalAmount(
        formData.get('financeUtilitiesCostUsd'),
        100,
      ),
      financeUtilitiesCostLocal: parseOptionalAmount(
        formData.get('financeUtilitiesCostLocal'),
      ),
      financeOtherCostUsdCents: parseOptionalAmount(
        formData.get('financeOtherCostUsd'),
        100,
      ),
      financeOtherCostLocal: parseOptionalAmount(
        formData.get('financeOtherCostLocal'),
      ),
    })
    .where(eq(organizationSchema.id, organizationId));

  revalidatePath(returnPath);
  redirect(`${returnPath}?finance=saved#finance`);
};

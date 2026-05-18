'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { getActiveRestaurantOrganizationId } from '@/features/dashboard/RestaurantAccess';
import { db } from '@/libs/DB';
import { organizationSchema } from '@/models/Schema';
import { RESTAURANT_THEME_MODES } from '@/utils/RestaurantTheme';

const normalizeOptionalText = (value: FormDataEntryValue | null) => {
  const textValue = typeof value === 'string' ? value.trim() : '';

  return textValue.length > 0 ? textValue : null;
};

const isValidHexColor = (value: string | null) => {
  return value === null || /^#[0-9A-F]{6}$/i.test(value);
};

const isValidUrl = (value: string | null) => {
  if (value === null) {
    return true;
  }

  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

const isValidWhatsappNumber = (value: string | null) => {
  if (value === null) {
    return true;
  }

  return /^\+?[0-9\s().-]{7,24}$/.test(value);
};

const normalizeCurrencyCode = (value: FormDataEntryValue | null) => {
  const textValue = normalizeOptionalText(value)?.toUpperCase();

  return textValue ?? null;
};

const isValidCurrencyCode = (value: string | null) => {
  return value === null || /^[A-Z]{3}$/.test(value);
};

const isValidCurrencyLabel = (value: string | null) => {
  return value === null || value.length <= 12;
};

const normalizeThemeMode = (value: FormDataEntryValue | null) => {
  const textValue = value?.toString() ?? 'day';

  return RESTAURANT_THEME_MODES.includes(
    textValue as (typeof RESTAURANT_THEME_MODES)[number],
  )
    ? textValue
    : 'day';
};

const getReturnPath = (formData: FormData) => {
  const returnPath = normalizeOptionalText(formData.get('returnPath'));

  if (returnPath?.endsWith('/dashboard/branding')) {
    return returnPath;
  }

  return '/dashboard/branding';
};

export const updateRestaurantBrandingAction = async (formData: FormData) => {
  const orgId = await getActiveRestaurantOrganizationId();

  if (!orgId) {
    return;
  }

  const returnPath = getReturnPath(formData);
  const restaurantDisplayName = normalizeOptionalText(
    formData.get('restaurantDisplayName'),
  );
  const restaurantLogoUrl = normalizeOptionalText(
    formData.get('restaurantLogoUrl'),
  );
  const restaurantPrimaryColor = normalizeOptionalText(
    formData.get('restaurantPrimaryColor'),
  );
  const restaurantAccentColor = normalizeOptionalText(
    formData.get('restaurantAccentColor'),
  );
  const restaurantThemeMode = normalizeThemeMode(
    formData.get('restaurantThemeMode'),
  );
  const restaurantWhatsappNumber = normalizeOptionalText(
    formData.get('restaurantWhatsappNumber'),
  );
  const enableWhatsappContact = formData.get('enableWhatsappContact') === 'on';
  const orderVisualNotificationsEnabled = (
    formData.get('orderVisualNotificationsEnabled') === 'on'
  );
  const orderSoundNotificationsEnabled = (
    formData.get('orderSoundNotificationsEnabled') === 'on'
  );
  const localCurrencyCode = normalizeCurrencyCode(
    formData.get('localCurrencyCode'),
  );
  const localCurrencyLabel = normalizeOptionalText(
    formData.get('localCurrencyLabel'),
  );

  if (
    !isValidUrl(restaurantLogoUrl)
    || !isValidHexColor(restaurantPrimaryColor)
    || !isValidHexColor(restaurantAccentColor)
    || !isValidWhatsappNumber(restaurantWhatsappNumber)
    || !isValidCurrencyCode(localCurrencyCode)
    || !isValidCurrencyLabel(localCurrencyLabel)
  ) {
    redirect(`${returnPath}?error=invalid_branding`);
  }

  await db
    .insert(organizationSchema)
    .values({
      id: orgId,
      restaurantDisplayName,
      restaurantLogoUrl,
      restaurantPrimaryColor,
      restaurantAccentColor,
      restaurantThemeMode,
      restaurantWhatsappNumber,
      enableWhatsappContact,
      orderVisualNotificationsEnabled,
      orderSoundNotificationsEnabled,
      localCurrencyCode,
      localCurrencyLabel,
    })
    .onConflictDoUpdate({
      target: organizationSchema.id,
      set: {
        restaurantDisplayName,
        restaurantLogoUrl,
        restaurantPrimaryColor,
        restaurantAccentColor,
        restaurantThemeMode,
        restaurantWhatsappNumber,
        enableWhatsappContact,
        orderVisualNotificationsEnabled,
        orderSoundNotificationsEnabled,
        localCurrencyCode,
        localCurrencyLabel,
      },
    });

  revalidatePath(returnPath);
  redirect(`${returnPath}?saved=1`);
};

'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { getActiveRestaurantOrganizationId } from '@/features/dashboard/RestaurantAccess';
import { db } from '@/libs/DB';
import { organizationSchema } from '@/models/Schema';
import { RESTAURANT_THEME_MODES } from '@/utils/RestaurantTheme';
import { saveWelcomeScreenImageFile } from '@/utils/WelcomeScreenImageUpload';

const WELCOME_BUTTON_POSITIONS = ['center', 'lower_center', 'bottom_center'] as const;

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

const isValidAddress = (value: string | null) => {
  return value === null || value.length <= 240;
};

const isValidWelcomeButtonLabel = (value: string | null) => {
  return value === null || value.length <= 32;
};

const normalizeThemeMode = (value: FormDataEntryValue | null) => {
  const textValue = value?.toString() ?? 'day';

  return RESTAURANT_THEME_MODES.includes(
    textValue as (typeof RESTAURANT_THEME_MODES)[number],
  )
    ? textValue
    : 'day';
};

const normalizeWelcomeButtonPosition = (value: FormDataEntryValue | null) => {
  const textValue = value?.toString() ?? 'lower_center';

  return WELCOME_BUTTON_POSITIONS.includes(
    textValue as (typeof WELCOME_BUTTON_POSITIONS)[number],
  )
    ? textValue
    : 'lower_center';
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
  const restaurantAddress = normalizeOptionalText(
    formData.get('restaurantAddress'),
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
  const welcomeScreenEnabled = formData.get('welcomeScreenEnabled') === 'on';
  const welcomeButtonLabel = normalizeOptionalText(
    formData.get('welcomeButtonLabel'),
  );
  const welcomeButtonColor = normalizeOptionalText(
    formData.get('welcomeButtonColor'),
  );
  const welcomeButtonPosition = normalizeWelcomeButtonPosition(
    formData.get('welcomeButtonPosition'),
  );
  const welcomeUseImageAccentForMenu = (
    formData.get('welcomeUseImageAccentForMenu') === 'on'
  );

  if (
    !isValidUrl(restaurantLogoUrl)
    || !isValidHexColor(restaurantPrimaryColor)
    || !isValidHexColor(restaurantAccentColor)
    || !isValidHexColor(welcomeButtonColor)
    || !isValidWhatsappNumber(restaurantWhatsappNumber)
    || !isValidAddress(restaurantAddress)
    || !isValidCurrencyCode(localCurrencyCode)
    || !isValidCurrencyLabel(localCurrencyLabel)
    || !isValidWelcomeButtonLabel(welcomeButtonLabel)
  ) {
    redirect(`${returnPath}?error=invalid_branding`);
  }

  const [existingOrganization] = await db
    .select({
      restaurantAccentColor: organizationSchema.restaurantAccentColor,
      welcomeImageAvifUrl: organizationSchema.welcomeImageAvifUrl,
      welcomeImageUrl: organizationSchema.welcomeImageUrl,
      welcomeButtonColor: organizationSchema.welcomeButtonColor,
      welcomeGeneratedAccentColor: organizationSchema.welcomeGeneratedAccentColor,
    })
    .from(organizationSchema)
    .where(eq(organizationSchema.id, orgId))
    .limit(1);
  const welcomeImageFile = formData.get('welcomeImageFile') as File | null;
  const removeWelcomeImage = formData.get('removeWelcomeImage') === 'on';
  let welcomeImageUrl = existingOrganization?.welcomeImageUrl ?? null;
  let welcomeImageAvifUrl = existingOrganization?.welcomeImageAvifUrl ?? null;
  let welcomeGeneratedAccentColor = existingOrganization?.welcomeGeneratedAccentColor ?? null;
  let nextWelcomeButtonColor = welcomeButtonColor
    ?? existingOrganization?.welcomeButtonColor
    ?? null;
  let nextRestaurantAccentColor = restaurantAccentColor;
  let nextWelcomeScreenEnabled = welcomeScreenEnabled;

  if (removeWelcomeImage) {
    welcomeImageUrl = null;
    welcomeImageAvifUrl = null;
    welcomeGeneratedAccentColor = null;
    nextWelcomeButtonColor = welcomeButtonColor;
    nextWelcomeScreenEnabled = false;
  }

  if (
    !removeWelcomeImage
    && (
      welcomeImageFile
      && welcomeImageFile.size > 0
      && typeof welcomeImageFile.arrayBuffer === 'function'
    )
  ) {
    try {
      const upload = await saveWelcomeScreenImageFile(orgId, welcomeImageFile);
      welcomeImageUrl = upload.imageUrl;
      welcomeImageAvifUrl = upload.avifUrl;
      welcomeGeneratedAccentColor = upload.accentColor;
      nextWelcomeButtonColor = existingOrganization?.welcomeButtonColor
        ? (welcomeButtonColor ?? existingOrganization.welcomeButtonColor)
        : upload.accentColor;

      if (
        !existingOrganization?.restaurantAccentColor
        && (!restaurantAccentColor || restaurantAccentColor === '#111827')
      ) {
        nextRestaurantAccentColor = upload.accentColor;
      }
    } catch {
      redirect(`${returnPath}?error=invalid_welcome_image`);
    }
  }

  if (welcomeUseImageAccentForMenu && welcomeGeneratedAccentColor) {
    nextRestaurantAccentColor = welcomeGeneratedAccentColor;
  }

  await db
    .insert(organizationSchema)
    .values({
      id: orgId,
      restaurantDisplayName,
      restaurantLogoUrl,
      restaurantAddress,
      restaurantPrimaryColor,
      restaurantAccentColor: nextRestaurantAccentColor,
      restaurantThemeMode,
      restaurantWhatsappNumber,
      enableWhatsappContact,
      welcomeScreenEnabled: nextWelcomeScreenEnabled,
      welcomeImageUrl,
      welcomeImageAvifUrl,
      welcomeButtonLabel,
      welcomeButtonColor: nextWelcomeButtonColor,
      welcomeButtonPosition,
      welcomeUseImageAccentForMenu,
      welcomeGeneratedAccentColor,
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
        restaurantAddress,
        restaurantPrimaryColor,
        restaurantAccentColor: nextRestaurantAccentColor,
        restaurantThemeMode,
        restaurantWhatsappNumber,
        enableWhatsappContact,
        welcomeScreenEnabled: nextWelcomeScreenEnabled,
        welcomeImageUrl,
        welcomeImageAvifUrl,
        welcomeButtonLabel,
        welcomeButtonColor: nextWelcomeButtonColor,
        welcomeButtonPosition,
        welcomeUseImageAccentForMenu,
        welcomeGeneratedAccentColor,
        orderVisualNotificationsEnabled,
        orderSoundNotificationsEnabled,
        localCurrencyCode,
        localCurrencyLabel,
      },
    });

  revalidatePath(returnPath);
  redirect(`${returnPath}?saved=1`);
};

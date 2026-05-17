'use server';

import { clerkClient, currentUser } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { db } from '@/libs/DB';
import {
  menuCategorySchema,
  menuItemSchema,
  organizationSchema,
  saasSettingsSchema,
} from '@/models/Schema';
import { ORG_ROLE } from '@/types/Auth';
import {
  getPrimaryMenuText,
  hasAnyMenuText,
  normalizeMenuText,
} from '@/utils/MenuTranslations';

import {
  assertAdmin,
  BILLING_CYCLES,
  MONTHLY_SUBSCRIPTION_STATUSES,
  ORDERING_MODES,
  QR_MODES,
  QR_STYLE_TEMPLATES,
  RESTAURANT_PROFILES,
  RESTAURANT_TEMPLATE_STYLES,
  SETUP_FEE_STATUSES,
  SUBSCRIPTION_PAYMENT_METHODS,
  SUBSCRIPTION_STATUSES,
} from './_helpers';

const normalizeOptionalText = (value: FormDataEntryValue | null) => {
  const textValue = typeof value === 'string' ? value.trim() : '';

  return textValue.length > 0 ? textValue : null;
};

const normalizeEnumValue = <T extends readonly string[]>(
  value: FormDataEntryValue | null,
  allowedValues: T,
  fallback: T[number],
) => {
  const textValue = normalizeOptionalText(value);

  if (!textValue) {
    return fallback;
  }

  return allowedValues.includes(textValue) ? textValue : fallback;
};

const normalizeOptionalInteger = (value: FormDataEntryValue | null) => {
  const textValue = normalizeOptionalText(value);

  if (!textValue) {
    return null;
  }

  const parsedValue = Number.parseInt(textValue, 10);

  if (Number.isNaN(parsedValue) || parsedValue < 0) {
    return null;
  }

  return parsedValue;
};

const normalizeOptionalDate = (value: FormDataEntryValue | null) => {
  const textValue = normalizeOptionalText(value);

  if (!textValue) {
    return null;
  }

  const parsedDate = new Date(`${textValue}T00:00:00.000Z`);

  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

const getOrganizationId = (formData: FormData) => {
  return normalizeOptionalText(formData.get('organizationId'));
};

const getMenuNamesFromForm = (formData: FormData) => ({
  en: normalizeMenuText(formData.get('nameEn')),
  ar: normalizeMenuText(formData.get('nameAr')),
  fr: normalizeMenuText(formData.get('nameFr')),
});

const getMenuDescriptionsFromForm = (formData: FormData) => ({
  en: normalizeMenuText(formData.get('descriptionEn')),
  ar: normalizeMenuText(formData.get('descriptionAr')),
  fr: normalizeMenuText(formData.get('descriptionFr')),
});

const revalidateAdminPaths = (...paths: string[]) => {
  revalidatePath('/admin');

  for (const path of paths) {
    revalidatePath(path);
  }
};

const normalizeEmail = (value: FormDataEntryValue | null) => {
  const email = normalizeOptionalText(value)?.toLowerCase() ?? null;

  const [localPart, domainPart, ...extraParts] = email?.split('@') ?? [];

  if (
    !email
    || !localPart
    || !domainPart
    || extraParts.length > 0
    || !domainPart.includes('.')
  ) {
    return null;
  }

  return email;
};

const isValidPublicUrl = (value: string | null) => {
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

const isValidWhatsappNumberOrUrl = (value: string | null) => {
  if (value === null) {
    return true;
  }

  if (isValidPublicUrl(value)) {
    return true;
  }

  const normalized = value.replace(/[\s()-]/g, '');
  return /^\+?\d{8,15}$/.test(normalized);
};

const QR_COLOR_DEFAULTS = {
  background: '#ffffff',
  foreground: '#111827',
  frame: '#111827',
} as const;

const normalizeHexColor = (
  value: FormDataEntryValue | null,
  fallback: string,
) => {
  const color = normalizeOptionalText(value)?.toLowerCase();

  return color && /^#[0-9a-f]{6}$/.test(color) ? color : fallback;
};

const getRelativeLuminance = (hexColor: string) => {
  const normalizedColor = hexColor.slice(1);
  const channels = [0, 2, 4].map((startIndex) => {
    const channel = Number.parseInt(
      normalizedColor.slice(startIndex, startIndex + 2),
      16,
    ) / 255;

    return channel <= 0.03928
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
};

const getContrastRatio = (firstColor: string, secondColor: string) => {
  const firstLuminance = getRelativeLuminance(firstColor);
  const secondLuminance = getRelativeLuminance(secondColor);
  const lighter = Math.max(firstLuminance, secondLuminance);
  const darker = Math.min(firstLuminance, secondLuminance);

  return (lighter + 0.05) / (darker + 0.05);
};

const getReadableQrColors = (
  foregroundColor: string,
  backgroundColor: string,
) => {
  if (getContrastRatio(foregroundColor, backgroundColor) >= 4.5) {
    return { foregroundColor, backgroundColor };
  }

  return {
    foregroundColor: QR_COLOR_DEFAULTS.foreground,
    backgroundColor: QR_COLOR_DEFAULTS.background,
  };
};

export const createAdminOnboardingAction = async (formData: FormData) => {
  await assertAdmin();

  const adminUser = await currentUser();
  const restaurantDisplayName = normalizeOptionalText(
    formData.get('restaurantDisplayName'),
  );
  const ownerEmail = normalizeEmail(formData.get('ownerEmail'));

  if (!adminUser?.id || !restaurantDisplayName || !ownerEmail) {
    redirect('/admin/onboarding?status=missing_fields');
  }

  const restaurantProfile = normalizeEnumValue(
    formData.get('restaurantProfile'),
    RESTAURANT_PROFILES,
    'table_service',
  );
  const orderingMode = normalizeEnumValue(
    formData.get('orderingMode'),
    ORDERING_MODES,
    'table_ordering',
  );
  const qrMode = normalizeEnumValue(formData.get('qrMode'), QR_MODES, 'per_table');
  const subscriptionPaymentMethod = normalizeEnumValue(
    formData.get('subscriptionPaymentMethod'),
    SUBSCRIPTION_PAYMENT_METHODS,
    'cash',
  );
  const billingCycle = normalizeEnumValue(
    formData.get('billingCycle'),
    BILLING_CYCLES,
    'monthly',
  );
  const subscriptionStatus = normalizeEnumValue(
    formData.get('subscriptionStatus'),
    SUBSCRIPTION_STATUSES,
    'trial',
  );

  let clerkOrganizationId: string | null = null;

  try {
    const client = await clerkClient();
    const clerkOrganization = await client.organizations.createOrganization({
      name: restaurantDisplayName,
      createdBy: adminUser.id,
      privateMetadata: {
        source: 'founder_admin_onboarding',
        ownerEmail,
      },
    });

    clerkOrganizationId = clerkOrganization.id;
  } catch (error) {
    console.error('Founder admin organization creation failed', error);
    redirect('/admin/onboarding?status=clerk_error');
  }

  if (!clerkOrganizationId) {
    redirect('/admin/onboarding?status=clerk_error');
  }

  await db
    .insert(organizationSchema)
    .values({
      id: clerkOrganizationId,
      restaurantDisplayName,
      restaurantProfile,
      orderingMode,
      qrMode,
      localCurrencyCode: normalizeOptionalText(formData.get('localCurrencyCode')),
      localCurrencyLabel: normalizeOptionalText(formData.get('localCurrencyLabel')),
      subscriptionPaymentMethod,
      billingCycle,
      subscriptionAmountUsd: normalizeOptionalInteger(
        formData.get('subscriptionAmountUsd'),
      ),
      subscriptionStatus,
      setupFeeAmountUsd: normalizeOptionalInteger(
        formData.get('setupFeeAmountUsd'),
      ),
      setupFeeStatus: normalizeEnumValue(
        formData.get('setupFeeStatus'),
        SETUP_FEE_STATUSES,
        'unpaid',
      ),
      monthlySubscriptionAmountUsd: normalizeOptionalInteger(
        formData.get('monthlySubscriptionAmountUsd'),
      ),
      monthlySubscriptionStatus: normalizeEnumValue(
        formData.get('monthlySubscriptionStatus'),
        MONTHLY_SUBSCRIPTION_STATUSES,
        'paused',
      ),
      nextBillingDate: normalizeOptionalDate(formData.get('nextBillingDate')),
      nextPaymentDueDate: normalizeOptionalDate(
        formData.get('nextPaymentDueDate'),
      ),
      paymentMethodNote: normalizeOptionalText(formData.get('paymentMethodNote')),
      adminNotes: `Owner invite sent to ${ownerEmail}`,
      internalAdminNotes: `Owner invite sent to ${ownerEmail}`,
    })
    .onConflictDoUpdate({
      target: organizationSchema.id,
      set: {
        restaurantDisplayName,
        restaurantProfile,
        orderingMode,
        qrMode,
        localCurrencyCode: normalizeOptionalText(formData.get('localCurrencyCode')),
        localCurrencyLabel: normalizeOptionalText(formData.get('localCurrencyLabel')),
        subscriptionPaymentMethod,
        billingCycle,
        subscriptionAmountUsd: normalizeOptionalInteger(
          formData.get('subscriptionAmountUsd'),
        ),
        subscriptionStatus,
      },
    });

  let inviteStatus = 'created';

  try {
    const client = await clerkClient();

    await client.organizations.createOrganizationInvitation({
      organizationId: clerkOrganizationId,
      inviterUserId: adminUser.id,
      emailAddress: ownerEmail,
      role: ORG_ROLE.ADMIN,
      redirectUrl: '/dashboard',
      publicMetadata: {
        source: 'founder_admin_onboarding',
      },
    });
  } catch (error) {
    inviteStatus = 'created_invite_failed';
    console.error('Founder admin owner invitation failed', error);
  }

  revalidateAdminPaths('/admin/clients', '/admin/billing', '/admin/templates');
  redirect(`/admin/onboarding?status=${inviteStatus}&organizationId=${clerkOrganizationId}`);
};

export const updateAdminClientAction = async (formData: FormData) => {
  await assertAdmin();

  const organizationId = getOrganizationId(formData);

  if (!organizationId) {
    return;
  }

  const values = {
    internalAdminNotes: normalizeOptionalText(
      formData.get('internalAdminNotes'),
    ),
    adminNotes: normalizeOptionalText(formData.get('internalAdminNotes')),
    assignedSalesperson: normalizeOptionalText(
      formData.get('assignedSalesperson'),
    ),
    renewalDate: normalizeOptionalDate(formData.get('renewalDate')),
  };

  await db
    .insert(organizationSchema)
    .values({
      id: organizationId,
      ...values,
    })
    .onConflictDoUpdate({
      target: organizationSchema.id,
      set: values,
    });

  revalidateAdminPaths('/admin/clients');
};

const getNextPaymentDueDate = (billingCycle: string) => {
  const nextDate = new Date();

  if (billingCycle === 'yearly') {
    nextDate.setFullYear(nextDate.getFullYear() + 1);
  } else {
    nextDate.setMonth(nextDate.getMonth() + 1);
  }

  return nextDate;
};

export const markClientPaymentPaidAction = async (formData: FormData) => {
  await assertAdmin();

  const organizationId = getOrganizationId(formData);
  const billingCycle = normalizeEnumValue(
    formData.get('billingCycle'),
    BILLING_CYCLES,
    'monthly',
  );

  if (!organizationId) {
    return;
  }

  const values = {
    lastPaymentDate: new Date(),
    nextPaymentDueDate: getNextPaymentDueDate(billingCycle),
    overdueSince: null,
    subscriptionStatus: 'up_to_date' as const,
  };

  await db
    .insert(organizationSchema)
    .values({
      id: organizationId,
      ...values,
    })
    .onConflictDoUpdate({
      target: organizationSchema.id,
      set: values,
    });

  revalidateAdminPaths('/admin/clients', '/admin/billing');
};

export const suspendClientAccessAction = async (formData: FormData) => {
  await assertAdmin();

  const organizationId = getOrganizationId(formData);

  if (!organizationId) {
    return;
  }

  const values = {
    accessSuspended: true,
    subscriptionStatus: 'suspended' as const,
  };

  await db
    .insert(organizationSchema)
    .values({
      id: organizationId,
      ...values,
    })
    .onConflictDoUpdate({
      target: organizationSchema.id,
      set: values,
    });

  revalidateAdminPaths('/admin/clients', '/admin/access');
};

export const restoreClientAccessAction = async (formData: FormData) => {
  await assertAdmin();

  const organizationId = getOrganizationId(formData);

  if (!organizationId) {
    return;
  }

  const values = {
    accessSuspended: false,
    subscriptionStatus: 'up_to_date' as const,
    overdueSince: null,
  };

  await db
    .insert(organizationSchema)
    .values({
      id: organizationId,
      ...values,
    })
    .onConflictDoUpdate({
      target: organizationSchema.id,
      set: values,
    });

  revalidateAdminPaths('/admin/clients', '/admin/access');
};

export const updateAdminBillingAction = async (formData: FormData) => {
  await assertAdmin();

  const organizationId = getOrganizationId(formData);

  if (!organizationId) {
    return;
  }

  const values = {
    setupFeeAmountUsd: normalizeOptionalInteger(
      formData.get('setupFeeAmountUsd'),
    ),
    setupFeeStatus: normalizeEnumValue(
      formData.get('setupFeeStatus'),
      SETUP_FEE_STATUSES,
      'unpaid',
    ),
    monthlySubscriptionAmountUsd: normalizeOptionalInteger(
      formData.get('monthlySubscriptionAmountUsd'),
    ),
    monthlySubscriptionStatus: normalizeEnumValue(
      formData.get('monthlySubscriptionStatus'),
      MONTHLY_SUBSCRIPTION_STATUSES,
      'paused',
    ),
    nextBillingDate: normalizeOptionalDate(formData.get('nextBillingDate')),
    paymentMethodNote: normalizeOptionalText(formData.get('paymentMethodNote')),
    subscriptionPaymentMethod: normalizeEnumValue(
      formData.get('subscriptionPaymentMethod'),
      SUBSCRIPTION_PAYMENT_METHODS,
      'cash',
    ),
    billingCycle: normalizeEnumValue(
      formData.get('billingCycle'),
      BILLING_CYCLES,
      'monthly',
    ),
    subscriptionAmountUsd: normalizeOptionalInteger(
      formData.get('subscriptionAmountUsd'),
    ),
    subscriptionStatus: normalizeEnumValue(
      formData.get('subscriptionStatus'),
      SUBSCRIPTION_STATUSES,
      'trial',
    ),
    lastPaymentDate: normalizeOptionalDate(formData.get('lastPaymentDate')),
    nextPaymentDueDate: normalizeOptionalDate(
      formData.get('nextPaymentDueDate'),
    ),
    overdueSince: normalizeOptionalDate(formData.get('overdueSince')),
    adminPaymentNotes: normalizeOptionalText(formData.get('adminPaymentNotes')),
  };

  await db
    .insert(organizationSchema)
    .values({
      id: organizationId,
      ...values,
    })
    .onConflictDoUpdate({
      target: organizationSchema.id,
      set: values,
    });

  revalidateAdminPaths('/admin/billing');
};

export const updateAdminAccessAction = async (formData: FormData) => {
  await assertAdmin();

  const organizationId = getOrganizationId(formData);

  if (!organizationId) {
    return;
  }

  const values = {
    accessSuspended: formData.get('accessSuspended') === 'on',
    subscriptionStatus: normalizeEnumValue(
      formData.get('subscriptionStatus'),
      SUBSCRIPTION_STATUSES,
      'trial',
    ),
    overdueSince: normalizeOptionalDate(formData.get('overdueSince')),
    adminNotes: normalizeOptionalText(formData.get('adminNotes')),
  };

  await db
    .insert(organizationSchema)
    .values({
      id: organizationId,
      ...values,
    })
    .onConflictDoUpdate({
      target: organizationSchema.id,
      set: values,
    });

  revalidateAdminPaths('/admin/access', '/dashboard');
};

export const updateAdminTemplatesAction = async (formData: FormData) => {
  await assertAdmin();

  const organizationId = getOrganizationId(formData);

  if (!organizationId) {
    return;
  }

  const qrColors = getReadableQrColors(
    normalizeHexColor(
      formData.get('qrForegroundColor'),
      QR_COLOR_DEFAULTS.foreground,
    ),
    normalizeHexColor(
      formData.get('qrBackgroundColor'),
      QR_COLOR_DEFAULTS.background,
    ),
  );

  const values = {
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
    qrForegroundColor: qrColors.foregroundColor,
    qrBackgroundColor: qrColors.backgroundColor,
    qrLabelText: normalizeOptionalText(formData.get('qrLabelText')),
    qrShowRestaurantName: formData.get('qrShowRestaurantName') === 'on',
    qrShowTableNumber: formData.get('qrShowTableNumber') === 'on',
    qrStyleTemplate: normalizeEnumValue(
      formData.get('qrStyleTemplate'),
      QR_STYLE_TEMPLATES,
      'classic',
    ),
  };

  await db
    .insert(organizationSchema)
    .values({
      id: organizationId,
      ...values,
    })
    .onConflictDoUpdate({
      target: organizationSchema.id,
      set: values,
    });

  revalidateAdminPaths('/admin/templates', '/dashboard/tables');
};

export const createAdminMenuCategoryAction = async (formData: FormData) => {
  await assertAdmin();

  const organizationId = getOrganizationId(formData);
  const names = getMenuNamesFromForm(formData);
  const displayOrder = normalizeOptionalInteger(formData.get('displayOrder')) ?? 0;

  if (!organizationId || !hasAnyMenuText(names)) {
    return;
  }

  await db.insert(menuCategorySchema).values({
    organizationId,
    name: getPrimaryMenuText(names, 'Untitled category'),
    nameEn: names.en,
    nameAr: names.ar,
    nameFr: names.fr,
    displayOrder,
  });

  revalidateAdminPaths('/admin/menu', '/dashboard/menu-categories');
};

export const updateAdminMenuCategoryAction = async (formData: FormData) => {
  await assertAdmin();

  const organizationId = getOrganizationId(formData);
  const categoryId = Number.parseInt(
    formData.get('categoryId')?.toString() ?? '',
    10,
  );
  const names = getMenuNamesFromForm(formData);
  const displayOrder = normalizeOptionalInteger(formData.get('displayOrder')) ?? 0;

  if (!organizationId || Number.isNaN(categoryId) || !hasAnyMenuText(names)) {
    return;
  }

  await db
    .update(menuCategorySchema)
    .set({
      name: getPrimaryMenuText(names, 'Untitled category'),
      nameEn: names.en,
      nameAr: names.ar,
      nameFr: names.fr,
      displayOrder,
    })
    .where(
      and(
        eq(menuCategorySchema.id, categoryId),
        eq(menuCategorySchema.organizationId, organizationId),
      ),
    );

  revalidateAdminPaths('/admin/menu', '/dashboard/menu-categories');
};

export const createAdminMenuItemAction = async (formData: FormData) => {
  await assertAdmin();

  const organizationId = getOrganizationId(formData);
  const categoryId = Number.parseInt(
    formData.get('categoryId')?.toString() ?? '',
    10,
  );
  const names = getMenuNamesFromForm(formData);
  const descriptions = getMenuDescriptionsFromForm(formData);
  const priceUsdCents = normalizeOptionalInteger(formData.get('priceUsdCents'));
  const priceLbp = normalizeOptionalInteger(formData.get('priceLbp'));

  if (
    !organizationId
    || Number.isNaN(categoryId)
    || !hasAnyMenuText(names)
    || (priceUsdCents === null && priceLbp === null)
  ) {
    return;
  }

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
    return;
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
    priceUsdCents,
    priceLbp,
    isAvailable: formData.get('isAvailable') === 'on',
  });

  revalidateAdminPaths('/admin/menu', '/dashboard/menu-items');
};

export const updateAdminMenuItemAction = async (formData: FormData) => {
  await assertAdmin();

  const organizationId = getOrganizationId(formData);
  const itemId = Number.parseInt(formData.get('itemId')?.toString() ?? '', 10);
  const categoryId = Number.parseInt(
    formData.get('categoryId')?.toString() ?? '',
    10,
  );
  const names = getMenuNamesFromForm(formData);
  const descriptions = getMenuDescriptionsFromForm(formData);
  const priceUsdCents = normalizeOptionalInteger(formData.get('priceUsdCents'));
  const priceLbp = normalizeOptionalInteger(formData.get('priceLbp'));

  if (
    !organizationId
    || Number.isNaN(itemId)
    || Number.isNaN(categoryId)
    || !hasAnyMenuText(names)
    || (priceUsdCents === null && priceLbp === null)
  ) {
    return;
  }

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
    return;
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
      priceUsdCents,
      priceLbp,
      isAvailable: formData.get('isAvailable') === 'on',
    })
    .where(
      and(
        eq(menuItemSchema.id, itemId),
        eq(menuItemSchema.organizationId, organizationId),
      ),
    );

  revalidateAdminPaths('/admin/menu', '/dashboard/menu-items');
};

export const updateAdminSettingsAction = async (formData: FormData) => {
  await assertAdmin();

  const supportEmail = normalizeEmail(formData.get('supportEmail'));
  const instagramUrl = normalizeOptionalText(formData.get('instagramUrl'));
  const whatsappNumberOrUrl = normalizeOptionalText(
    formData.get('whatsappNumberOrUrl'),
  );
  const facebookUrl = normalizeOptionalText(formData.get('facebookUrl'));

  if (
    supportEmail === null && normalizeOptionalText(formData.get('supportEmail'))
  ) {
    redirect('/admin/settings?status=invalid_email');
  }

  if (
    !isValidPublicUrl(instagramUrl)
    || !isValidWhatsappNumberOrUrl(whatsappNumberOrUrl)
    || !isValidPublicUrl(facebookUrl)
  ) {
    redirect('/admin/settings?status=invalid_url');
  }

  await db
    .insert(saasSettingsSchema)
    .values({
      id: 'social_links',
      supportEmail,
      instagramUrl,
      whatsappNumberOrUrl,
      facebookUrl,
    })
    .onConflictDoUpdate({
      target: saasSettingsSchema.id,
      set: {
        supportEmail,
        instagramUrl,
        whatsappNumberOrUrl,
        facebookUrl,
      },
    });

  revalidateAdminPaths('/admin/settings', '/', '/ar', '/fr');
  redirect('/admin/settings?status=saved');
};

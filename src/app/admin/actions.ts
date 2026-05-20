'use server';

import { clerkClient, currentUser } from '@clerk/nextjs/server';
import { and, eq, isNull } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { db } from '@/libs/DB';
import { sendEmail } from '@/libs/Email';
import { getSuspensionEmailTemplate } from '@/libs/EmailTemplates';
import {
  menuCategorySchema,
  menuItemSchema,
  organizationSchema,
  saasSettingsSchema,
} from '@/models/Schema';
import { ORG_ROLE } from '@/types/Auth';
import { getMenuItemImageUrl } from '@/utils/MenuItemImageUpload';
import {
  getPrimaryMenuText,
  hasAnyMenuText,
  normalizeMenuText,
} from '@/utils/MenuTranslations';

import {
  assertAdmin,
  BILLING_CYCLES,
  CLIENT_ACCESS_STATUSES,
  CLIENT_CATEGORIES,
  MENU_TEMPLATE_TYPES,
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

type MenuTemplateType = (typeof MENU_TEMPLATE_TYPES)[number];

type MenuTemplateCategory = {
  names: {
    en: string;
    ar: string;
    fr: string;
  };
  subcategories?: MenuTemplateCategory[];
};

const MENU_TEMPLATES: Record<MenuTemplateType, MenuTemplateCategory[]> = {
  restaurant: [
    {
      names: { en: 'Starters', ar: 'المقبلات', fr: 'Entrées' },
      subcategories: [
        { names: { en: 'Cold mezze', ar: 'مازة باردة', fr: 'Mezzés froids' } },
        { names: { en: 'Hot mezze', ar: 'مازة ساخنة', fr: 'Mezzés chauds' } },
      ],
    },
    {
      names: { en: 'Main plates', ar: 'الأطباق الرئيسية', fr: 'Plats principaux' },
      subcategories: [
        { names: { en: 'Grills', ar: 'مشاوي', fr: 'Grillades' } },
        { names: { en: 'House specials', ar: 'أطباق البيت', fr: 'Spécialités' } },
      ],
    },
    {
      names: { en: 'Drinks', ar: 'المشروبات', fr: 'Boissons' },
      subcategories: [
        { names: { en: 'Soft drinks', ar: 'مشروبات غازية', fr: 'Boissons fraîches' } },
        { names: { en: 'Hot drinks', ar: 'مشروبات ساخنة', fr: 'Boissons chaudes' } },
      ],
    },
    { names: { en: 'Desserts', ar: 'الحلويات', fr: 'Desserts' } },
  ],
  cafe: [
    {
      names: { en: 'Coffee', ar: 'القهوة', fr: 'Café' },
      subcategories: [
        { names: { en: 'Espresso bar', ar: 'إسبريسو', fr: 'Bar espresso' } },
        { names: { en: 'Iced coffee', ar: 'قهوة باردة', fr: 'Cafés glacés' } },
      ],
    },
    {
      names: { en: 'Tea and cold drinks', ar: 'الشاي والمشروبات الباردة', fr: 'Thés et boissons froides' },
    },
    {
      names: { en: 'Bakery', ar: 'المخبوزات', fr: 'Boulangerie' },
      subcategories: [
        { names: { en: 'Pastries', ar: 'معجنات', fr: 'Viennoiseries' } },
        { names: { en: 'Cakes', ar: 'كيك', fr: 'Gâteaux' } },
      ],
    },
    { names: { en: 'Light bites', ar: 'وجبات خفيفة', fr: 'Petites faims' } },
  ],
  fast_food: [
    {
      names: { en: 'Burgers and sandwiches', ar: 'برغر وساندويتش', fr: 'Burgers et sandwiches' },
      subcategories: [
        { names: { en: 'Burgers', ar: 'برغر', fr: 'Burgers' } },
        { names: { en: 'Wraps', ar: 'راب', fr: 'Wraps' } },
      ],
    },
    {
      names: { en: 'Combos', ar: 'وجبات كومبو', fr: 'Menus combo' },
    },
    {
      names: { en: 'Sides', ar: 'إضافات', fr: 'Accompagnements' },
      subcategories: [
        { names: { en: 'Fries', ar: 'بطاطا', fr: 'Frites' } },
        { names: { en: 'Sauces', ar: 'صلصات', fr: 'Sauces' } },
      ],
    },
    { names: { en: 'Drinks', ar: 'المشروبات', fr: 'Boissons' } },
  ],
  shisha_lounge: [
    {
      names: { en: 'Shisha', ar: 'الشيشة', fr: 'Chicha' },
      subcategories: [
        { names: { en: 'Classic flavors', ar: 'نكهات كلاسيكية', fr: 'Saveurs classiques' } },
        { names: { en: 'Premium mixes', ar: 'خلطات مميزة', fr: 'Mélanges premium' } },
      ],
    },
    {
      names: { en: 'Hot drinks', ar: 'مشروبات ساخنة', fr: 'Boissons chaudes' },
    },
    {
      names: { en: 'Cold drinks', ar: 'مشروبات باردة', fr: 'Boissons froides' },
    },
    { names: { en: 'Snacks', ar: 'سناكات', fr: 'Snacks' } },
  ],
};

const insertMenuTemplateCategories = async (
  organizationId: string,
  templateType: MenuTemplateType,
) => {
  const template = MENU_TEMPLATES[templateType];

  for (const [categoryIndex, category] of template.entries()) {
    const [createdCategory] = await db
      .insert(menuCategorySchema)
      .values({
        organizationId,
        name: category.names.en,
        nameEn: category.names.en,
        nameAr: category.names.ar,
        nameFr: category.names.fr,
        displayOrder: categoryIndex,
      })
      .returning();

    if (!createdCategory || !category.subcategories) {
      continue;
    }

    await db.insert(menuCategorySchema).values(
      category.subcategories.map((subcategory, subcategoryIndex) => ({
        organizationId,
        parentCategoryId: createdCategory.id,
        name: subcategory.names.en,
        nameEn: subcategory.names.en,
        nameAr: subcategory.names.ar,
        nameFr: subcategory.names.fr,
        displayOrder: subcategoryIndex,
      })),
    );
  }
};

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

const isClientAccessBlocked = (status: string) => {
  return status === 'suspended' || status === 'revoked';
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

const getValidAdminParentCategoryId = async (
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

const revalidateAdminPaths = (...paths: string[]) => {
  revalidatePath('/admin');

  for (const path of paths) {
    revalidatePath(path);
  }
};

const getAllClerkOrganizations = async () => {
  const client = await clerkClient();
  const limit = 100;
  let offset = 0;
  let totalCount = 0;
  const organizations: Array<{
    id: string;
    name: string;
  }> = [];

  do {
    const page = await client.organizations.getOrganizationList({
      limit,
      offset,
      orderBy: '+created_at',
    });

    organizations.push(...page.data.map(organization => ({
      id: organization.id,
      name: organization.name,
    })));

    totalCount = page.totalCount;
    offset += limit;
  } while (organizations.length < totalCount);

  return organizations;
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

const normalizeEmailText = (value: unknown) => {
  return typeof value === 'string' ? normalizeEmail(value) : null;
};

const getMetadataValue = (metadata: unknown, key: string) => {
  if (!metadata || typeof metadata !== 'object') {
    return null;
  }

  const value = (metadata as Record<string, unknown>)[key];

  return typeof value === 'string' ? value : null;
};

const getSuspensionEmailLocale = (metadata: unknown): 'en' | 'fr' | 'ar' => {
  const locale = getMetadataValue(metadata, 'locale');

  return locale === 'fr' || locale === 'ar' ? locale : 'en';
};

const getOrganizationOwnerEmail = async (organizationId: string) => {
  try {
    const client = await clerkClient();
    const clerkOrganization = await client.organizations.getOrganization({
      organizationId,
    });
    const metadataOwnerEmail = normalizeEmailText(
      getMetadataValue(clerkOrganization.privateMetadata, 'ownerEmail'),
    );

    if (metadataOwnerEmail) {
      return {
        email: metadataOwnerEmail,
        locale: getSuspensionEmailLocale(clerkOrganization.publicMetadata),
      };
    }

    const memberships = await client.organizations.getOrganizationMembershipList({
      organizationId,
      limit: 100,
    });
    const ownerMembership = memberships.data.find(
      membership => membership.role === ORG_ROLE.ADMIN,
    ) ?? memberships.data.at(0);
    const membershipEmail = normalizeEmailText(
      ownerMembership?.publicUserData?.identifier,
    );

    if (!membershipEmail) {
      return null;
    }

    return {
      email: membershipEmail,
      locale: getSuspensionEmailLocale(clerkOrganization.publicMetadata),
    };
  } catch (error) {
    console.error('Unable to resolve restaurant owner email', error);
    return null;
  }
};

type SuspensionOrganizationContext = {
  restaurantDisplayName: string | null;
  subscriptionStatus: string;
  monthlySubscriptionStatus: string | null;
  setupFeeStatus: string | null;
  overdueSince: Date | null;
  nextPaymentDueDate: Date | null;
};

const isBillingRelatedSuspension = (
  organization: SuspensionOrganizationContext | undefined,
) => {
  if (!organization) {
    return false;
  }

  const isPastDue = organization.nextPaymentDueDate
    ? organization.nextPaymentDueDate.getTime() < Date.now()
    : false;

  return organization.subscriptionStatus === 'overdue'
    || organization.monthlySubscriptionStatus === 'overdue'
    || organization.setupFeeStatus === 'unpaid'
    || Boolean(organization.overdueSince)
    || isPastDue;
};

const sendSuspensionNotificationEmail = async (
  organizationId: string,
  organization: SuspensionOrganizationContext | undefined,
) => {
  const owner = await getOrganizationOwnerEmail(organizationId);

  if (!owner) {
    console.warn(
      `Suspension email skipped: no owner email found for ${organizationId}`,
    );
    return;
  }

  const template = getSuspensionEmailTemplate(owner.locale, {
    restaurantName:
      organization?.restaurantDisplayName || 'your restaurant',
    billingRelated: isBillingRelatedSuspension(organization),
  });

  try {
    await sendEmail({
      to: owner.email,
      subject: template.subject,
      text: template.text,
    });
  } catch (error) {
    console.error('Suspension email failed', error);
  }
};

const getSuspensionOrganizationContext = async (organizationId: string) => {
  const [organization] = await db
    .select({
      restaurantDisplayName: organizationSchema.restaurantDisplayName,
      subscriptionStatus: organizationSchema.subscriptionStatus,
      monthlySubscriptionStatus: organizationSchema.monthlySubscriptionStatus,
      setupFeeStatus: organizationSchema.setupFeeStatus,
      overdueSince: organizationSchema.overdueSince,
      nextPaymentDueDate: organizationSchema.nextPaymentDueDate,
    })
    .from(organizationSchema)
    .where(eq(organizationSchema.id, organizationId))
    .limit(1);

  return organization;
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
  const menuTemplate = normalizeEnumValue(
    formData.get('menuTemplate'),
    MENU_TEMPLATE_TYPES,
    'restaurant',
  ) as MenuTemplateType;
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
      accessStatus: 'active',
      accessSuspended: false,
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
        accessStatus: 'active',
        accessSuspended: false,
      },
    });

  await insertMenuTemplateCategories(clerkOrganizationId, menuTemplate);

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

export const syncClerkOrganizationsAction = async () => {
  await assertAdmin();

  const [clerkOrganizations, localOrganizations] = await Promise.all([
    getAllClerkOrganizations(),
    db.select({ id: organizationSchema.id }).from(organizationSchema),
  ]);
  const localOrganizationIds = new Set(
    localOrganizations.map(organization => organization.id),
  );
  const missingOrganizations = clerkOrganizations.filter(
    organization => !localOrganizationIds.has(organization.id),
  );

  if (missingOrganizations.length > 0) {
    await db
      .insert(organizationSchema)
      .values(
        missingOrganizations.map(organization => ({
          id: organization.id,
          restaurantDisplayName: normalizeOptionalText(organization.name),
          accessStatus: 'pending',
          subscriptionStatus: 'trial',
          accessSuspended: false,
        })),
      )
      .onConflictDoNothing();
  }

  revalidateAdminPaths('/admin/clients');

  redirect(
    `/admin/clients?syncCreated=${missingOrganizations.length}&syncExisting=${clerkOrganizations.length - missingOrganizations.length}`,
  );
};

export const updateAdminClientAction = async (formData: FormData) => {
  await assertAdmin();

  const organizationId = getOrganizationId(formData);

  if (!organizationId) {
    return;
  }

  const values = {
    restaurantDisplayName: normalizeOptionalText(
      formData.get('restaurantDisplayName'),
    ),
    clientCategory: normalizeEnumValue(
      formData.get('clientCategory'),
      CLIENT_CATEGORIES,
      'restaurant',
    ),
    mainContactFirstName: normalizeOptionalText(
      formData.get('mainContactFirstName'),
    ),
    mainContactLastName: normalizeOptionalText(
      formData.get('mainContactLastName'),
    ),
    mainContactWhatsappNumber: normalizeOptionalText(
      formData.get('mainContactWhatsappNumber'),
    ),
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

  if (values.restaurantDisplayName) {
    try {
      const client = await clerkClient();

      await client.organizations.updateOrganization(organizationId, {
        name: values.restaurantDisplayName,
      });
    } catch (error) {
      console.error('Unable to update Clerk organization name', error);
    }
  }

  revalidateAdminPaths(
    '/admin/clients',
    `/admin/clients/${organizationId}`,
    '/admin/billing',
    '/admin/access',
    '/admin/templates',
    '/dashboard',
    '/dashboard/tables',
    '/dashboard/orders',
  );
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

  revalidateAdminPaths(
    '/admin/clients',
    `/admin/clients/${organizationId}`,
    '/admin/billing',
  );
};

export const suspendClientAccessAction = async (formData: FormData) => {
  await assertAdmin();

  const organizationId = getOrganizationId(formData);

  if (!organizationId) {
    return;
  }

  const organization = await getSuspensionOrganizationContext(organizationId);
  const values = {
    accessStatus: 'suspended' as const,
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

  await sendSuspensionNotificationEmail(organizationId, organization);
  revalidateAdminPaths(
    '/admin/clients',
    `/admin/clients/${organizationId}`,
    '/admin/access',
    '/dashboard',
  );
};

export const activateClientAccessAction = async (formData: FormData) => {
  await assertAdmin();

  const organizationId = getOrganizationId(formData);

  if (!organizationId) {
    return;
  }

  const values = {
    accessStatus: 'active' as const,
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

  revalidateAdminPaths(
    '/admin/clients',
    `/admin/clients/${organizationId}`,
    '/admin/access',
    '/dashboard',
  );
};

export const revokeClientAccessAction = async (formData: FormData) => {
  await assertAdmin();

  const organizationId = getOrganizationId(formData);

  if (!organizationId) {
    return;
  }

  const values = {
    accessStatus: 'revoked' as const,
    accessSuspended: true,
    subscriptionStatus: 'cancelled' as const,
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

  revalidateAdminPaths(
    '/admin/clients',
    `/admin/clients/${organizationId}`,
    '/admin/access',
    '/dashboard',
  );
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

  const previousOrganization = await db
    .select({
      accessStatus: organizationSchema.accessStatus,
      restaurantDisplayName: organizationSchema.restaurantDisplayName,
      subscriptionStatus: organizationSchema.subscriptionStatus,
      monthlySubscriptionStatus: organizationSchema.monthlySubscriptionStatus,
      setupFeeStatus: organizationSchema.setupFeeStatus,
      overdueSince: organizationSchema.overdueSince,
      nextPaymentDueDate: organizationSchema.nextPaymentDueDate,
    })
    .from(organizationSchema)
    .where(eq(organizationSchema.id, organizationId))
    .limit(1);
  const values = {
    accessStatus: normalizeEnumValue(
      formData.get('accessStatus'),
      CLIENT_ACCESS_STATUSES,
      'pending',
    ),
    subscriptionStatus: normalizeEnumValue(
      formData.get('subscriptionStatus'),
      SUBSCRIPTION_STATUSES,
      'trial',
    ),
    overdueSince: normalizeOptionalDate(formData.get('overdueSince')),
    adminNotes: normalizeOptionalText(formData.get('adminNotes')),
  };
  const accessSuspended = isClientAccessBlocked(values.accessStatus);

  await db
    .insert(organizationSchema)
    .values({
      id: organizationId,
      ...values,
      accessSuspended,
    })
    .onConflictDoUpdate({
      target: organizationSchema.id,
      set: {
        ...values,
        accessSuspended,
      },
    });

  const [previous] = previousOrganization;

  if (values.accessStatus === 'suspended' && previous?.accessStatus !== 'suspended') {
    await sendSuspensionNotificationEmail(organizationId, {
      restaurantDisplayName: previous?.restaurantDisplayName ?? null,
      subscriptionStatus: values.subscriptionStatus,
      monthlySubscriptionStatus: previous?.monthlySubscriptionStatus ?? null,
      setupFeeStatus: previous?.setupFeeStatus ?? null,
      overdueSince: values.overdueSince ?? previous?.overdueSince ?? null,
      nextPaymentDueDate: previous?.nextPaymentDueDate ?? null,
    });
  }

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
  const restaurantLogoUrl = normalizeOptionalText(formData.get('restaurantLogoUrl'));

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
    restaurantLogoUrl: isValidPublicUrl(restaurantLogoUrl) ? restaurantLogoUrl : null,
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

  revalidateAdminPaths(
    '/admin/templates',
    '/dashboard/tables',
    `/r/${organizationId}/menu`,
  );
};

export const applyAdminMenuTemplateAction = async (formData: FormData) => {
  await assertAdmin();

  const organizationId = getOrganizationId(formData);
  const menuTemplate = normalizeEnumValue(
    formData.get('menuTemplate'),
    MENU_TEMPLATE_TYPES,
    'restaurant',
  ) as MenuTemplateType;
  const replaceExistingMenu = formData.get('replaceExistingMenu') === 'on';

  if (!organizationId) {
    return;
  }

  const [existingCategories, existingItems] = await Promise.all([
    db
      .select({ id: menuCategorySchema.id })
      .from(menuCategorySchema)
      .where(eq(menuCategorySchema.organizationId, organizationId)),
    db
      .select({ id: menuItemSchema.id })
      .from(menuItemSchema)
      .where(eq(menuItemSchema.organizationId, organizationId)),
  ]);
  const hasExistingMenu = existingCategories.length > 0 || existingItems.length > 0;

  if (hasExistingMenu && !replaceExistingMenu) {
    redirect(`/admin/menu?templateStatus=confirm&organizationId=${organizationId}`);
  }

  if (replaceExistingMenu) {
    await db
      .delete(menuItemSchema)
      .where(eq(menuItemSchema.organizationId, organizationId));
    await db
      .delete(menuCategorySchema)
      .where(eq(menuCategorySchema.organizationId, organizationId));
  }

  await insertMenuTemplateCategories(organizationId, menuTemplate);

  revalidateAdminPaths(
    '/admin/menu',
    '/dashboard/menu-categories',
    `/r/${organizationId}/menu`,
  );

  redirect(`/admin/menu?templateStatus=applied&organizationId=${organizationId}`);
};

export const createAdminMenuCategoryAction = async (formData: FormData) => {
  await assertAdmin();

  const organizationId = getOrganizationId(formData);
  const parentCategoryId = Number.parseInt(
    formData.get('parentCategoryId')?.toString() ?? '',
    10,
  );
  const names = getMenuNamesFromForm(formData);
  const displayOrder = normalizeOptionalInteger(formData.get('displayOrder')) ?? 0;

  if (!organizationId || !hasAnyMenuText(names)) {
    return;
  }

  const validParentCategoryId = await getValidAdminParentCategoryId(
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
  const parentCategoryId = Number.parseInt(
    formData.get('parentCategoryId')?.toString() ?? '',
    10,
  );
  const names = getMenuNamesFromForm(formData);
  const displayOrder = normalizeOptionalInteger(formData.get('displayOrder')) ?? 0;

  if (!organizationId || Number.isNaN(categoryId) || !hasAnyMenuText(names)) {
    return;
  }

  const validParentCategoryId = await getValidAdminParentCategoryId(
    organizationId,
    parentCategoryId,
    categoryId,
  );

  await db
    .update(menuCategorySchema)
    .set({
      parentCategoryId: validParentCategoryId,
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

export const deleteAdminMenuCategoryAction = async (formData: FormData) => {
  await assertAdmin();

  const organizationId = getOrganizationId(formData);
  const categoryId = Number.parseInt(
    formData.get('categoryId')?.toString() ?? '',
    10,
  );

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
    redirect(`/admin/menu/${organizationId}?status=category_in_use`);
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
    redirect(`/admin/menu/${organizationId}?status=category_in_use`);
  }

  await db
    .delete(menuCategorySchema)
    .where(
      and(
        eq(menuCategorySchema.id, categoryId),
        eq(menuCategorySchema.organizationId, organizationId),
      ),
    );

  revalidateAdminPaths('/admin/menu', '/dashboard/menu-categories', `/r/${organizationId}/menu`);

  redirect(`/admin/menu/${organizationId}?status=category_deleted`);
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
  const imageUrlField = formData.get('imageUrl')?.toString().trim() || null;
  let imageUrl: string | null = null;

  try {
    imageUrl = await getMenuItemImageUrl(imageUrlField, formData.get('imageFile'));
  } catch (error) {
    redirect(`/admin/menu/${organizationId}?status=${(error as Error)?.message || 'invalid_image_type'}`);
  }

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
    imageUrl,
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
  const imageUrlField = formData.get('imageUrl')?.toString().trim() || null;
  let imageUrl: string | null = null;

  try {
    imageUrl = await getMenuItemImageUrl(imageUrlField, formData.get('imageFile'));
  } catch (error) {
    redirect(`/admin/menu/${organizationId}?status=${(error as Error)?.message || 'invalid_image_type'}`);
  }

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
      imageUrl,
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

export const deleteAdminMenuItemAction = async (formData: FormData) => {
  await assertAdmin();

  const organizationId = getOrganizationId(formData);
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

  revalidateAdminPaths('/admin/menu', '/dashboard/menu-items', `/r/${organizationId}/menu`);

  redirect(`/admin/menu/${organizationId}?status=item_deleted`);
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

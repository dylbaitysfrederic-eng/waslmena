import { asc, eq } from 'drizzle-orm';
import { unstable_noStore as noStore } from 'next/cache';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { db } from '@/libs/DB';
import {
  menuCategorySchema,
  menuItemSchema,
  organizationSchema,
} from '@/models/Schema';
import { cn } from '@/utils/Helpers';
import { getLocalizedMenuText } from '@/utils/MenuTranslations';
import {
  getRestaurantBrandStyle,
  getRestaurantThemeClassName,
} from '@/utils/RestaurantTheme';

import { PublicMenuCart } from '../table/[tableId]/PublicMenuCart';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type PublicGeneralMenuPageProps = {
  params: {
    locale: string;
    organizationId: string;
  };
};

const TEMPLATE_STYLES = [
  'fast_food',
  'cafe',
  'casual_restaurant',
  'table_service',
  'shisha_lounge',
] as const;

type TemplateStyle = typeof TEMPLATE_STYLES[number];

const getTemplateStyle = (value: string | null | undefined): TemplateStyle => {
  if (TEMPLATE_STYLES.includes(value as TemplateStyle)) {
    return value as TemplateStyle;
  }

  return 'casual_restaurant';
};

const TEMPLATE_CLASS_NAMES = {
  fast_food: {
    page: 'bg-red-50',
    shell: 'max-w-3xl',
    header: 'rounded-md border-2 bg-background p-4 shadow-sm',
    title: 'uppercase',
    logo: 'rounded-md',
    contactButton: 'rounded-md border-2',
  },
  cafe: {
    page: 'bg-stone-50',
    shell: 'max-w-2xl',
    header: 'rounded-md border bg-background p-4',
    title: 'font-serif',
    logo: 'rounded-full',
    contactButton: 'rounded-full',
  },
  casual_restaurant: {
    page: 'bg-background',
    shell: 'max-w-2xl',
    header: 'border-b pb-5',
    title: '',
    logo: 'rounded-md',
    contactButton: 'rounded-md',
  },
  table_service: {
    page: 'bg-slate-50',
    shell: 'max-w-3xl',
    header: 'rounded-md border bg-white p-5 shadow-sm',
    title: '',
    logo: 'rounded-md',
    contactButton: 'rounded-md border-slate-900',
  },
  shisha_lounge: {
    page: 'bg-zinc-950 text-zinc-50',
    shell: 'max-w-3xl',
    header: 'rounded-md border border-zinc-700 bg-zinc-900 p-5 shadow-sm',
    title: 'text-amber-100',
    logo: 'rounded-md border-zinc-700',
    contactButton: 'rounded-md border-amber-200 text-amber-100',
  },
} as const;

const PublicGeneralMenuPage = async (props: PublicGeneralMenuPageProps) => {
  noStore();

  const t = await getTranslations('PublicMenu');

  const [organization] = await db
    .select({
      restaurantDisplayName: organizationSchema.restaurantDisplayName,
      restaurantLogoUrl: organizationSchema.restaurantLogoUrl,
      restaurantPrimaryColor: organizationSchema.restaurantPrimaryColor,
      restaurantAccentColor: organizationSchema.restaurantAccentColor,
      restaurantThemeMode: organizationSchema.restaurantThemeMode,
      restaurantTemplateStyle: organizationSchema.restaurantTemplateStyle,
      restaurantWhatsappNumber: organizationSchema.restaurantWhatsappNumber,
      enableWhatsappContact: organizationSchema.enableWhatsappContact,
      localCurrencyLabel: organizationSchema.localCurrencyLabel,
      accessStatus: organizationSchema.accessStatus,
      accessSuspended: organizationSchema.accessSuspended,
    })
    .from(organizationSchema)
    .where(eq(organizationSchema.id, props.params.organizationId))
    .limit(1);

  if (!organization) {
    notFound();
  }

  if (organization.accessStatus !== 'active' || organization.accessSuspended) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-4 py-10">
          <div className="rounded-md border bg-card p-6 text-center">
            <LocaleSwitcher />
            <h1 className="mt-6 text-2xl font-semibold">
              {t('restaurant_unavailable_title')}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {t('restaurant_unavailable_description')}
            </p>
          </div>
        </div>
      </main>
    );
  }

  const categories = await db
    .select({
      id: menuCategorySchema.id,
      parentCategoryId: menuCategorySchema.parentCategoryId,
      name: menuCategorySchema.name,
      nameEn: menuCategorySchema.nameEn,
      nameAr: menuCategorySchema.nameAr,
      nameFr: menuCategorySchema.nameFr,
    })
    .from(menuCategorySchema)
    .where(eq(menuCategorySchema.organizationId, props.params.organizationId))
    .orderBy(
      asc(menuCategorySchema.displayOrder),
      asc(menuCategorySchema.name),
    );

  const items = await db
    .select({
      id: menuItemSchema.id,
      categoryId: menuItemSchema.categoryId,
      name: menuItemSchema.name,
      nameEn: menuItemSchema.nameEn,
      nameAr: menuItemSchema.nameAr,
      nameFr: menuItemSchema.nameFr,
      description: menuItemSchema.description,
      descriptionEn: menuItemSchema.descriptionEn,
      descriptionAr: menuItemSchema.descriptionAr,
      descriptionFr: menuItemSchema.descriptionFr,
      imageUrl: menuItemSchema.imageUrl,
      priceUsdCents: menuItemSchema.priceUsdCents,
      priceLbp: menuItemSchema.priceLbp,
      isAvailable: menuItemSchema.isAvailable,
    })
    .from(menuItemSchema)
    .where(eq(menuItemSchema.organizationId, props.params.organizationId))
    .orderBy(asc(menuItemSchema.name));

  const itemsByCategory = new Map<number, typeof items>();

  for (const item of items) {
    const categoryItems = itemsByCategory.get(item.categoryId) ?? [];
    categoryItems.push(item);
    itemsByCategory.set(item.categoryId, categoryItems);
  }

  const localizedCategories = categories.map(category => ({
    id: category.id,
    parentCategoryId: category.parentCategoryId,
    name: getLocalizedMenuText(
      props.params.locale,
      {
        en: category.nameEn,
        ar: category.nameAr,
        fr: category.nameFr,
        legacy: category.name,
      },
      category.name,
    ),
  }));
  const subcategoriesByParentId = new Map<number, typeof localizedCategories>();

  for (const category of localizedCategories) {
    if (category.parentCategoryId === null) {
      continue;
    }

    const subcategories = subcategoriesByParentId.get(category.parentCategoryId) ?? [];
    subcategories.push(category);
    subcategoriesByParentId.set(category.parentCategoryId, subcategories);
  }

  const mapMenuItems = (categoryId: number) => (
    itemsByCategory.get(categoryId) ?? []
  ).map(item => ({
    id: item.id,
    name: getLocalizedMenuText(
      props.params.locale,
      {
        en: item.nameEn,
        ar: item.nameAr,
        fr: item.nameFr,
        legacy: item.name,
      },
      item.name,
    ),
    description: getLocalizedMenuText(
      props.params.locale,
      {
        en: item.descriptionEn,
        ar: item.descriptionAr,
        fr: item.descriptionFr,
        legacy: item.description,
      },
      '',
    ) || null,
    imageUrl: item.imageUrl,
    priceUsdCents: item.priceUsdCents,
    priceLbp: item.priceLbp,
    isAvailable: item.isAvailable,
  }));

  const categoriesWithItems = localizedCategories
    .filter(category => category.parentCategoryId === null)
    .map(category => ({
      id: category.id,
      name: category.name,
      items: mapMenuItems(category.id),
      subcategories: (subcategoriesByParentId.get(category.id) ?? [])
        .map(subcategory => ({
          id: subcategory.id,
          name: subcategory.name,
          items: mapMenuItems(subcategory.id),
        }))
        .filter(subcategory => subcategory.items.length > 0),
    }))
    .filter(category =>
      category.items.length > 0 || category.subcategories.length > 0,
    );
  const templateStyle = getTemplateStyle(organization.restaurantTemplateStyle);
  const templateClassNames = TEMPLATE_CLASS_NAMES[templateStyle];
  const primaryColorStyle = organization.restaurantPrimaryColor
    ? { color: organization.restaurantPrimaryColor }
    : undefined;
  const whatsappDigits = organization.enableWhatsappContact === false
    ? null
    : organization.restaurantWhatsappNumber?.replace(/\D/g, '');
  const whatsappUrl = whatsappDigits
    ? `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(
      t('whatsapp_prefilled_message'),
    )}`
    : null;
  const localCurrencyLabel = organization.localCurrencyLabel ?? 'LL';

  return (
    <main
      className={cn(
        'min-h-screen',
        templateClassNames.page,
        getRestaurantThemeClassName(organization.restaurantThemeMode),
      )}
      style={getRestaurantBrandStyle(
        organization.restaurantPrimaryColor,
        organization.restaurantAccentColor,
      )}
    >
      <div
        className={cn(
          'mx-auto flex w-full flex-col gap-6 px-4 py-6',
          templateClassNames.shell,
        )}
      >
        <header className={cn('space-y-2', templateClassNames.header)}>
          <div className="flex justify-end">
            <LocaleSwitcher />
          </div>
          <div className="flex items-center gap-3">
            {organization.restaurantLogoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={organization.restaurantLogoUrl}
                alt=""
                className={cn(
                  'size-14 border object-cover',
                  templateClassNames.logo,
                )}
              />
            )}
            <div>
              {organization.restaurantDisplayName && (
                <p className="text-sm font-semibold text-muted-foreground">
                  {organization.restaurantDisplayName}
                </p>
              )}
              <h1
                className={cn(
                  'text-3xl font-semibold tracking-normal',
                  templateClassNames.title,
                )}
                style={primaryColorStyle}
              >
                {t('title')}
              </h1>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {t('description')}
          </p>
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className={cn(
                'inline-flex min-h-11 items-center justify-center border px-4 py-2 text-sm font-semibold text-foreground',
                templateClassNames.contactButton,
              )}
              style={organization.restaurantPrimaryColor
                ? {
                    borderColor: organization.restaurantAccentColor
                      ?? organization.restaurantPrimaryColor,
                    color: organization.restaurantPrimaryColor,
                  }
                : undefined}
            >
              {t('whatsapp_contact_button')}
            </a>
          )}
        </header>

        {categoriesWithItems.length > 0
          ? (
              <PublicMenuCart
                categories={categoriesWithItems}
                locale={props.params.locale}
                organizationId={props.params.organizationId}
                accentColor={organization.restaurantAccentColor ?? null}
                primaryColor={organization.restaurantPrimaryColor ?? null}
                tableId={null}
                orderingEnabled={false}
                templateStyle={templateStyle}
                localCurrencyLabel={localCurrencyLabel}
              />
            )
          : (
              <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
                {t('empty_state')}
              </div>
            )}
      </div>
    </main>
  );
};

export default PublicGeneralMenuPage;

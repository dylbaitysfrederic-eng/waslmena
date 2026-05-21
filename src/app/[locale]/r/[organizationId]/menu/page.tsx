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

import { PublicMenuSplash } from '../PublicMenuSplash';
import { PublicRestaurantInfo } from '../PublicRestaurantInfo';
import { PublicMenuCart } from '../table/[tableId]/PublicMenuCart';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type PublicGeneralMenuPageProps = {
  params: {
    locale: string;
    organizationId: string;
  };
  searchParams?: {
    menu?: string;
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
      restaurantAddress: organizationSchema.restaurantAddress,
      restaurantOpeningHours: organizationSchema.restaurantOpeningHours,
      restaurantInstagramUrl: organizationSchema.restaurantInstagramUrl,
      restaurantWifiName: organizationSchema.restaurantWifiName,
      restaurantWifiPassword: organizationSchema.restaurantWifiPassword,
      restaurantGoogleMapsUrl: organizationSchema.restaurantGoogleMapsUrl,
      restaurantLogoUrl: organizationSchema.restaurantLogoUrl,
      welcomeScreenEnabled: organizationSchema.welcomeScreenEnabled,
      welcomeImageAvifUrl: organizationSchema.welcomeImageAvifUrl,
      welcomeImageUrl: organizationSchema.welcomeImageUrl,
      welcomeButtonLabel: organizationSchema.welcomeButtonLabel,
      welcomeButtonColor: organizationSchema.welcomeButtonColor,
      welcomeButtonPosition: organizationSchema.welcomeButtonPosition,
      restaurantPrimaryColor: organizationSchema.restaurantPrimaryColor,
      restaurantAccentColor: organizationSchema.restaurantAccentColor,
      showMenuItemImages: organizationSchema.showMenuItemImages,
      restaurantThemeMode: organizationSchema.restaurantThemeMode,
      restaurantTemplateStyle: organizationSchema.restaurantTemplateStyle,
      restaurantWhatsappNumber: organizationSchema.restaurantWhatsappNumber,
      enableWhatsappContact: organizationSchema.enableWhatsappContact,
      localCurrencyLabel: organizationSchema.localCurrencyLabel,
      orderingMode: organizationSchema.orderingMode,
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

  if (
    props.searchParams?.menu !== '1'
    && organization.welcomeScreenEnabled
    && organization.welcomeImageUrl
  ) {
    return (
      <>
        <link
          rel="preload"
          as="image"
          href={organization.welcomeImageAvifUrl ?? organization.welcomeImageUrl}
        />
        <PublicMenuSplash
          buttonColor={
            organization.welcomeButtonColor
            ?? organization.restaurantAccentColor
            ?? organization.restaurantPrimaryColor
            ?? null
          }
          buttonLabel={organization.welcomeButtonLabel || 'Open Menu'}
          buttonPosition={organization.welcomeButtonPosition ?? 'lower_center'}
          imageAvifUrl={organization.welcomeImageAvifUrl ?? null}
          imageUrl={organization.welcomeImageUrl}
          logoUrl={organization.restaurantLogoUrl ?? null}
          menuHref={`/${props.params.locale}/r/${props.params.organizationId}/menu?menu=1`}
          restaurantName={organization.restaurantDisplayName || t('title')}
        />
      </>
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
    isAvailable: item.isAvailable !== false,
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
  const whatsappDigits = organization.enableWhatsappContact === false
    ? null
    : organization.restaurantWhatsappNumber?.replace(/\D/g, '');
  const whatsappUrl = whatsappDigits
    ? `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(
      t('whatsapp_prefilled_message'),
    )}`
    : null;
  const localCurrencyLabel = organization.localCurrencyLabel ?? 'LL';
  const orderingEnabled = organization.orderingMode === 'counter_pickup'
    || organization.orderingMode === 'both';
  const restaurantName = organization.restaurantDisplayName || t('title');

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
      <header className="sticky top-0 z-40 border-b border-zinc-900/10 bg-background/95 shadow-sm backdrop-blur-sm">
        <div
          className={cn(
            'mx-auto flex min-h-14 w-full items-center justify-between gap-3 px-4 py-3',
            templateClassNames.shell,
          )}
        >
          <div className="flex min-w-0 items-center gap-3">
            {organization.restaurantLogoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={organization.restaurantLogoUrl}
                alt=""
                className="size-10 flex-none rounded-md border object-cover"
              />
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {restaurantName}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="hidden rounded-full border px-3 py-1.5 text-xs font-semibold text-foreground sm:inline-flex"
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
            <LocaleSwitcher />
          </div>
        </div>
      </header>

      <div
        className={cn(
          'mx-auto flex w-full flex-col gap-4 px-4 py-4',
          templateClassNames.shell,
        )}
      >
        <PublicRestaurantInfo
          address={organization.restaurantAddress ?? null}
          googleMapsUrl={organization.restaurantGoogleMapsUrl ?? null}
          infoLabel={t('restaurant_info_label')}
          instagramLabel={t('instagram_label')}
          instagramUrl={organization.restaurantInstagramUrl ?? null}
          mapsLabel={t('maps_link_label')}
          openingHours={organization.restaurantOpeningHours ?? null}
          openingHoursLabel={t('opening_hours_label')}
          phone={organization.restaurantWhatsappNumber ?? null}
          phoneLabel={t('phone_label')}
          restaurantName={restaurantName}
          whatsappLabel={t('whatsapp_contact_button')}
          whatsappUrl={whatsappUrl}
          wifiLabel={t('wifi_label')}
          wifiName={organization.restaurantWifiName ?? null}
          wifiPassword={organization.restaurantWifiPassword ?? null}
          wifiPasswordLabel={t('wifi_password_label')}
        />

        {categoriesWithItems.length > 0
          ? (
              <PublicMenuCart
                categories={categoriesWithItems}
                locale={props.params.locale}
                organizationId={props.params.organizationId}
                accentColor={organization.restaurantAccentColor ?? null}
                primaryColor={organization.restaurantPrimaryColor ?? null}
                showMenuItemImages={organization.showMenuItemImages}
                tableId={null}
                orderingEnabled={orderingEnabled}
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

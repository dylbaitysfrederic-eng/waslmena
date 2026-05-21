import { and, asc, eq } from 'drizzle-orm';
import { unstable_noStore as noStore } from 'next/cache';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { db } from '@/libs/DB';
import {
  menuCategorySchema,
  menuItemSchema,
  organizationSchema,
  restaurantTableSchema,
} from '@/models/Schema';
import { cn } from '@/utils/Helpers';
import { getLocalizedMenuText } from '@/utils/MenuTranslations';
import {
  getRestaurantBrandStyle,
  getRestaurantThemeClassName,
} from '@/utils/RestaurantTheme';

import { PublicMenuSplash } from '../../PublicMenuSplash';
import { PublicRestaurantInfo } from '../../PublicRestaurantInfo';
import { PublicMenuCart } from './PublicMenuCart';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type PublicMenuPageProps = {
  params: {
    locale: string;
    organizationId: string;
    tableId: string;
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
    tableBadge: 'rounded-md bg-red-100 px-3 py-1 text-red-950',
    title: 'uppercase',
    logo: 'rounded-md',
    contactButton: 'rounded-md border-2',
    category: 'text-2xl font-black uppercase',
    list: 'divide-y-2 rounded-md border-2 bg-card',
  },
  cafe: {
    page: 'bg-stone-50',
    shell: 'max-w-2xl',
    header: 'rounded-md border bg-background p-4',
    tableBadge: 'rounded-md bg-stone-100 px-3 py-1 text-stone-800',
    title: 'font-serif',
    logo: 'rounded-full',
    contactButton: 'rounded-full',
    category: 'font-serif text-2xl font-semibold',
    list: 'divide-y rounded-lg border bg-card',
  },
  casual_restaurant: {
    page: 'bg-background',
    shell: 'max-w-2xl',
    header: 'border-b pb-5',
    tableBadge: '',
    title: '',
    logo: 'rounded-md',
    contactButton: 'rounded-md',
    category: 'text-xl font-semibold',
    list: 'divide-y rounded-md border bg-card',
  },
  table_service: {
    page: 'bg-slate-50',
    shell: 'max-w-3xl',
    header: 'rounded-md border bg-white p-5 shadow-sm',
    tableBadge: 'rounded-md border bg-white px-3 py-1 text-slate-700',
    title: '',
    logo: 'rounded-md',
    contactButton: 'rounded-md border-slate-900',
    category: 'text-xl font-semibold',
    list: 'divide-y rounded-md border bg-white shadow-sm',
  },
  shisha_lounge: {
    page: 'bg-zinc-950 text-zinc-50',
    shell: 'max-w-2xl',
    header: 'rounded-md border border-zinc-700 bg-zinc-900 p-5',
    tableBadge: 'rounded-md bg-zinc-800 px-3 py-1 text-amber-100',
    title: '',
    logo: 'rounded-md border-zinc-700',
    contactButton: 'rounded-md border-amber-300 text-amber-200',
    category: 'text-xl font-semibold text-amber-200',
    list: 'divide-y divide-zinc-700 rounded-md border border-zinc-700 bg-zinc-900',
  },
} as const;

export async function generateMetadata(props: PublicMenuPageProps) {
  const t = await getTranslations({
    locale: props.params.locale,
    namespace: 'PublicMenu',
  });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

const PublicTableMenuPage = async (props: PublicMenuPageProps) => {
  noStore();

  const t = await getTranslations('PublicMenu');
  const tableId = Number.parseInt(props.params.tableId, 10);

  if (Number.isNaN(tableId)) {
    notFound();
  }

  const [restaurantTable] = await db
    .select({
      id: restaurantTableSchema.id,
      tableNumber: restaurantTableSchema.tableNumber,
    })
    .from(restaurantTableSchema)
    .where(
      and(
        eq(restaurantTableSchema.id, tableId),
        eq(restaurantTableSchema.organizationId, props.params.organizationId),
      ),
    )
    .limit(1);

  if (!restaurantTable) {
    notFound();
  }

  const [organization] = await db
    .select({
      restaurantDisplayName: organizationSchema.restaurantDisplayName,
      restaurantAddress: organizationSchema.restaurantAddress,
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
          menuHref={`/${props.params.locale}/r/${props.params.organizationId}/table/${props.params.tableId}?menu=1`}
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
  const templateStyle = getTemplateStyle(organization?.restaurantTemplateStyle);
  const templateClassNames = TEMPLATE_CLASS_NAMES[templateStyle];
  const whatsappDigits = organization?.enableWhatsappContact === false
    ? null
    : organization?.restaurantWhatsappNumber
      ?.replace(/\D/g, '');
  const whatsappUrl = whatsappDigits
    ? `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(
      t('whatsapp_prefilled_message'),
    )}`
    : null;
  const localCurrencyLabel = organization?.localCurrencyLabel ?? 'LL';
  const orderingEnabled = organization.orderingMode === 'table_ordering'
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
            {organization?.restaurantLogoUrl && (
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
              <p className="truncate text-xs text-muted-foreground">
                {t('table_label', { tableNumber: restaurantTable.tableNumber })}
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
          infoLabel={t('restaurant_info_label')}
          mapsLabel={t('maps_link_label')}
          phone={organization.restaurantWhatsappNumber ?? null}
          phoneLabel={t('phone_label')}
          restaurantName={restaurantName}
          whatsappLabel={t('whatsapp_contact_button')}
          whatsappUrl={whatsappUrl}
        />

        {categoriesWithItems.length > 0
          ? (
              <PublicMenuCart
                categories={categoriesWithItems}
                locale={props.params.locale}
                organizationId={props.params.organizationId}
                accentColor={organization?.restaurantAccentColor ?? null}
                primaryColor={organization?.restaurantPrimaryColor ?? null}
                showMenuItemImages={organization.showMenuItemImages}
                tableId={restaurantTable.id}
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

export default PublicTableMenuPage;

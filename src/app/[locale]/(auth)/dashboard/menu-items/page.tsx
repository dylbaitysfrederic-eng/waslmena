import { auth } from '@clerk/nextjs/server';
import { asc, eq } from 'drizzle-orm';
import { unstable_noStore as noStore } from 'next/cache';
import { getTranslations } from 'next-intl/server';

import { TemplateStylePicker } from '@/app/admin/templates/TemplateStylePicker';
import { ConfirmSubmitButton } from '@/components/ConfirmSubmitButton';
import { FormSubmitButton } from '@/components/FormSubmitButton';
import { AdvancedSettingsBlock } from '@/components/layout/AdvancedSettingsBlock';
import { CreatePanel } from '@/components/layout/CreatePanel';
import { MenuItemImagePreview } from '@/components/MenuItemImagePreview';
import { MenuItemImageUploadField } from '@/components/MenuItemImageUploadField';
import { SwitchField } from '@/components/SwitchField';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DashboardSection } from '@/features/dashboard/DashboardSection';
import { TitleBar } from '@/features/dashboard/TitleBar';
import { db } from '@/libs/DB';
import {
  menuCategorySchema,
  menuItemSchema,
  organizationSchema,
} from '@/models/Schema';
import { getI18nPath } from '@/utils/Helpers';
import { getLocalizedMenuText } from '@/utils/MenuTranslations';

import {
  createMenuCategoryAction,
  deleteMenuCategoryAction,
  updateMenuCategoryAction,
} from '../menu-categories/actions';
import {
  createMenuItemAction,
  deleteMenuItemAction,
  updateMenuAppearanceAction,
  updateMenuItemAction,
} from './actions';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata(props: { params: { locale: string } }) {
  const t = await getTranslations({
    locale: props.params.locale,
    namespace: 'MenuItems',
  });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

const formatUsdCents = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount / 100);
};

const formatLocalCurrency = (amount: number, localCurrencyLabel: string) => {
  return `${new Intl.NumberFormat('en-US').format(amount)} ${localCurrencyLabel}`;
};

const VALID_FORM_ERRORS = [
  'missing_name',
  'invalid_category',
  'invalid_item',
  'invalid_price',
  'negative_price',
  'missing_price',
  'currency_mismatch',
  'invalid_image_type',
  'image_too_large',
  'category_in_use',
  'original_price_below_price',
] as const;

const MERCHANDISING_BADGES = [
  { key: 'isPopular', labelKey: 'badge_popular_label' },
  { key: 'isNew', labelKey: 'badge_new_label' },
  { key: 'isSpicy', labelKey: 'badge_spicy_label' },
  { key: 'isFeatured', labelKey: 'badge_featured_label' },
  { key: 'isPromo', labelKey: 'badge_promo_label' },
] as const;

type MenuCategoryOption = {
  id: number;
  name: string;
  nameEn: string | null;
  nameAr: string | null;
  nameFr: string | null;
  parentCategoryId: number | null;
  displayOrder: number;
};

const getCategoryLabel = (
  locale: string,
  category: Pick<MenuCategoryOption, 'name' | 'nameEn' | 'nameAr' | 'nameFr' | 'parentCategoryId'>,
) => {
  const label = getLocalizedMenuText(
    locale,
    {
      en: category.nameEn,
      ar: category.nameAr,
      fr: category.nameFr,
      legacy: category.name,
    },
    category.name,
  );

  return category.parentCategoryId === null ? label : `- ${label}`;
};

const MenuItemLanguageFields = (props: {
  baseId: string;
  t: (key: string) => string;
  values?: {
    nameEn: string | null;
    nameAr: string | null;
    nameFr: string | null;
    descriptionEn: string | null;
    descriptionAr: string | null;
    descriptionFr: string | null;
    legacyName: string;
    legacyDescription: string | null;
  };
}) => (
  <div className="grid gap-3">
    <p className="text-xs text-muted-foreground">
      {props.t('language_help')}
    </p>
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="space-y-2">
        <Label htmlFor={`${props.baseId}-name-en`}>
          {props.t('name_en_label')}
        </Label>
        <Input
          id={`${props.baseId}-name-en`}
          name="nameEn"
          defaultValue={props.values?.nameEn ?? props.values?.legacyName ?? ''}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${props.baseId}-name-ar`}>
          {props.t('name_ar_label')}
        </Label>
        <Input
          id={`${props.baseId}-name-ar`}
          name="nameAr"
          dir="rtl"
          defaultValue={props.values?.nameAr ?? ''}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${props.baseId}-name-fr`}>
          {props.t('name_fr_label')}
        </Label>
        <Input
          id={`${props.baseId}-name-fr`}
          name="nameFr"
          defaultValue={props.values?.nameFr ?? ''}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${props.baseId}-description-en`}>
          {props.t('description_en_label')}
        </Label>
        <Input
          id={`${props.baseId}-description-en`}
          name="descriptionEn"
          defaultValue={
            props.values?.descriptionEn ?? props.values?.legacyDescription ?? ''
          }
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${props.baseId}-description-ar`}>
          {props.t('description_ar_label')}
        </Label>
        <Input
          id={`${props.baseId}-description-ar`}
          name="descriptionAr"
          dir="rtl"
          defaultValue={props.values?.descriptionAr ?? ''}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${props.baseId}-description-fr`}>
          {props.t('description_fr_label')}
        </Label>
        <Input
          id={`${props.baseId}-description-fr`}
          name="descriptionFr"
          defaultValue={props.values?.descriptionFr ?? ''}
        />
      </div>
    </div>
  </div>
);

const MenuCategoryLanguageFields = (props: {
  baseId: string;
  t: (key: string) => string;
  values?: {
    nameEn: string | null;
    nameAr: string | null;
    nameFr: string | null;
    legacyName: string;
  };
}) => (
  <div className="grid gap-3">
    <p className="text-xs text-muted-foreground">
      {props.t('category_language_help')}
    </p>
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="space-y-2">
        <Label htmlFor={`${props.baseId}-name-en`}>
          {props.t('name_en_label')}
        </Label>
        <Input
          id={`${props.baseId}-name-en`}
          name="nameEn"
          defaultValue={props.values?.nameEn ?? props.values?.legacyName ?? ''}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${props.baseId}-name-ar`}>
          {props.t('name_ar_label')}
        </Label>
        <Input
          id={`${props.baseId}-name-ar`}
          name="nameAr"
          dir="rtl"
          defaultValue={props.values?.nameAr ?? ''}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${props.baseId}-name-fr`}>
          {props.t('name_fr_label')}
        </Label>
        <Input
          id={`${props.baseId}-name-fr`}
          name="nameFr"
          defaultValue={props.values?.nameFr ?? ''}
        />
      </div>
    </div>
  </div>
);

const ParentCategorySelect = (props: {
  categories: MenuCategoryOption[];
  currentCategoryId?: number;
  defaultValue?: number | null;
  id: string;
  locale: string;
  t: (key: string) => string;
}) => {
  const availableParents = props.categories.filter(category =>
    category.id !== props.currentCategoryId
    && category.parentCategoryId === null,
  );

  return (
    <div className="space-y-2">
      <Label htmlFor={props.id}>{props.t('parent_category_label')}</Label>
      <select
        id={props.id}
        name="parentCategoryId"
        defaultValue={props.defaultValue ?? ''}
        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <option value="">{props.t('parent_category_none')}</option>
        {availableParents.map(category => (
          <option key={category.id} value={category.id}>
            {getCategoryLabel(props.locale, category)}
          </option>
        ))}
      </select>
    </div>
  );
};

const MenuItemMerchandisingFields = (props: {
  baseId: string;
  localCurrencyLabel: string;
  t: (key: string, values?: Record<string, string>) => string;
  values?: {
    originalPriceUsdCents: number | null;
    originalPriceLbp: number | null;
    isPopular: boolean;
    isNew: boolean;
    isSpicy: boolean;
    isFeatured: boolean;
    isPromo: boolean;
  };
}) => (
  <div className="rounded-md border bg-muted/20 p-3">
    <div>
      <div className="text-sm font-semibold">{props.t('merchandising_title')}</div>
      <p className="mt-1 text-xs text-muted-foreground">
        {props.t('merchandising_help')}
      </p>
    </div>
    <div className="mt-3 grid gap-3 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor={`${props.baseId}-original-usd`}>
          {props.t('original_price_usd_cents_label')}
        </Label>
        <Input
          id={`${props.baseId}-original-usd`}
          name="originalPriceUsdCents"
          type="number"
          min={0}
          step={1}
          defaultValue={props.values?.originalPriceUsdCents ?? ''}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${props.baseId}-original-local`}>
          {props.t('original_price_local_label', {
            currency: props.localCurrencyLabel,
          })}
        </Label>
        <Input
          id={`${props.baseId}-original-local`}
          name="originalPriceLbp"
          type="number"
          min={0}
          step={1}
          defaultValue={props.values?.originalPriceLbp ?? ''}
        />
      </div>
    </div>
    <p className="mt-2 text-xs text-muted-foreground">
      {props.t('original_price_help')}
    </p>
    <div className="mt-3 grid gap-2 sm:grid-cols-2">
      {MERCHANDISING_BADGES.map(badge => (
        <SwitchField
          key={badge.key}
          id={`${props.baseId}-${badge.key}`}
          name={badge.key}
          label={props.t(badge.labelKey)}
          defaultChecked={props.values?.[badge.key] ?? false}
        />
      ))}
    </div>
  </div>
);

const MenuItemBadgeList = (props: {
  item: {
    isPopular: boolean;
    isNew: boolean;
    isSpicy: boolean;
    isFeatured: boolean;
    isPromo: boolean;
  };
  t: (key: string) => string;
}) => {
  const activeBadges = MERCHANDISING_BADGES.filter(
    badge => props.item[badge.key],
  );

  if (activeBadges.length === 0) {
    return null;
  }

  return (
    <div className="mt-2 flex flex-wrap gap-1">
      {activeBadges.map(badge => (
        <span
          key={badge.key}
          className="rounded-full border bg-muted/40 px-2 py-0.5 text-[11px] font-semibold text-muted-foreground"
        >
          {props.t(badge.labelKey)}
        </span>
      ))}
    </div>
  );
};

const MenuItemPriceLine = (props: {
  currentPrice: number;
  originalPrice: number | null;
  formatPrice: (amount: number) => string;
}) => (
  <div className="grid gap-0.5">
    {props.originalPrice !== null && props.originalPrice > props.currentPrice
      ? (
          <span className="text-xs text-muted-foreground line-through">
            {props.formatPrice(props.originalPrice)}
          </span>
        )
      : null}
    <span>{props.formatPrice(props.currentPrice)}</span>
  </div>
);

const MenuItemsPage = async (props: {
  params: { locale: string };
  searchParams: { error?: string };
}) => {
  noStore();

  const { orgId } = await auth();
  const t = await getTranslations('MenuItems');

  if (!orgId) {
    return null;
  }

  const formError = VALID_FORM_ERRORS.includes(
    props.searchParams.error as (typeof VALID_FORM_ERRORS)[number],
  )
    ? props.searchParams.error
    : null;

  const [organization] = await db
    .select({
      localCurrencyLabel: organizationSchema.localCurrencyLabel,
      restaurantAccentColor: organizationSchema.restaurantAccentColor,
      restaurantDisplayName: organizationSchema.restaurantDisplayName,
      restaurantTemplateStyle: organizationSchema.restaurantTemplateStyle,
      showMenuItemImages: organizationSchema.showMenuItemImages,
    })
    .from(organizationSchema)
    .where(eq(organizationSchema.id, orgId))
    .limit(1);
  const localCurrencyLabel = organization?.localCurrencyLabel ?? 'LL';

  const categories = await db
    .select({
      id: menuCategorySchema.id,
      parentCategoryId: menuCategorySchema.parentCategoryId,
      name: menuCategorySchema.name,
      nameEn: menuCategorySchema.nameEn,
      nameAr: menuCategorySchema.nameAr,
      nameFr: menuCategorySchema.nameFr,
      displayOrder: menuCategorySchema.displayOrder,
    })
    .from(menuCategorySchema)
    .where(eq(menuCategorySchema.organizationId, orgId))
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
      originalPriceUsdCents: menuItemSchema.originalPriceUsdCents,
      originalPriceLbp: menuItemSchema.originalPriceLbp,
      isPopular: menuItemSchema.isPopular,
      isNew: menuItemSchema.isNew,
      isSpicy: menuItemSchema.isSpicy,
      isFeatured: menuItemSchema.isFeatured,
      isPromo: menuItemSchema.isPromo,
      isAvailable: menuItemSchema.isAvailable,
      categoryName: menuCategorySchema.name,
      categoryNameEn: menuCategorySchema.nameEn,
      categoryNameAr: menuCategorySchema.nameAr,
      categoryNameFr: menuCategorySchema.nameFr,
    })
    .from(menuItemSchema)
    .innerJoin(
      menuCategorySchema,
      eq(menuItemSchema.categoryId, menuCategorySchema.id),
    )
    .where(eq(menuItemSchema.organizationId, orgId))
    .orderBy(
      asc(menuCategorySchema.displayOrder),
      asc(menuCategorySchema.name),
      asc(menuItemSchema.name),
    );
  const mainCategories = categories.filter(
    category => category.parentCategoryId === null,
  );
  const menuItemsReturnPath = getI18nPath(
    '/dashboard/menu-items',
    props.params.locale,
  );

  return (
    <>
      <TitleBar
        title={t('title_bar')}
        description={t('title_bar_description')}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
        <DashboardSection
          title={t('create_section_title')}
          description={t('create_section_description')}
        >
          <div className="grid gap-3">
            <CreatePanel
              title={t('create_category_title')}
              description={t('create_category_help')}
            >
              <form action={createMenuCategoryAction} className="mt-4 space-y-4">
                <input
                  type="hidden"
                  name="returnPath"
                  value={menuItemsReturnPath}
                />
                <MenuCategoryLanguageFields
                  baseId="category-create"
                  t={t}
                />
                <div className="space-y-2">
                  <Label htmlFor="category-display-order">
                    {t('display_order_label')}
                  </Label>
                  <Input
                    id="category-display-order"
                    name="displayOrder"
                    type="number"
                    defaultValue={0}
                  />
                </div>
                <FormSubmitButton pendingLabel={t('create_category_pending_button')}>
                  {t('create_category_button')}
                </FormSubmitButton>
              </form>
            </CreatePanel>

            <CreatePanel
              title={t('create_subcategory_title')}
              description={t('create_subcategory_help')}
            >
              {mainCategories.length > 0
                ? (
                    <form
                      action={createMenuCategoryAction}
                      className="mt-4 space-y-4"
                    >
                      <input
                        type="hidden"
                        name="returnPath"
                        value={menuItemsReturnPath}
                      />
                      <div className="space-y-2">
                        <Label htmlFor="subcategory-parent-category">
                          {t('parent_category_label')}
                        </Label>
                        <select
                          id="subcategory-parent-category"
                          name="parentCategoryId"
                          required
                          defaultValue=""
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          <option value="" disabled>
                            {t('parent_category_placeholder')}
                          </option>
                          {mainCategories.map(category => (
                            <option key={category.id} value={category.id}>
                              {getCategoryLabel(props.params.locale, category)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <MenuCategoryLanguageFields
                        baseId="subcategory-create"
                        t={t}
                      />
                      <div className="space-y-2">
                        <Label htmlFor="subcategory-display-order">
                          {t('display_order_label')}
                        </Label>
                        <Input
                          id="subcategory-display-order"
                          name="displayOrder"
                          type="number"
                          defaultValue={0}
                        />
                      </div>
                      <FormSubmitButton pendingLabel={t('create_category_pending_button')}>
                        {t('create_subcategory_button')}
                      </FormSubmitButton>
                    </form>
                  )
                : (
                    <div className="mt-4 rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                      {t('no_parent_categories_state')}
                    </div>
                  )}
            </CreatePanel>

            <CreatePanel
              title={t('create_item_title')}
              description={t('create_item_help')}
            >
              {categories.length > 0
                ? (
                    <form
                      action={createMenuItemAction}
                      encType="multipart/form-data"
                      className="mt-4 space-y-4"
                    >
                      <input
                        type="hidden"
                        name="returnPath"
                        value={menuItemsReturnPath}
                      />

                      {formError && (
                        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm font-medium text-destructive">
                          {t(`error_${formError}`, { currency: localCurrencyLabel })}
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="categoryId">{t('category_label')}</Label>
                        <select
                          id="categoryId"
                          name="categoryId"
                          required
                          defaultValue=""
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          <option value="" disabled>
                            {t('category_placeholder')}
                          </option>
                          {categories.map(category => (
                            <option key={category.id} value={category.id}>
                              {getCategoryLabel(props.params.locale, category)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <MenuItemLanguageFields baseId="item-create" t={t} />

                      <MenuItemImageUploadField
                        fieldId="imageUrl"
                        urlFieldName="imageUrl"
                        fileFieldName="imageFile"
                        label={t('image_url_label')}
                        helpText={t('image_url_help')}
                        placeholder={t('image_url_placeholder')}
                      />

                      <div className="space-y-2">
                        <Label htmlFor="priceUsdCents">
                          {t('price_usd_cents_label')}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {t('price_usd_cents_help')}
                        </p>
                        <Input
                          id="priceUsdCents"
                          name="priceUsdCents"
                          type="number"
                          min={0}
                          step={1}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="priceLbp">
                          {t('price_local_label', { currency: localCurrencyLabel })}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {t('price_local_help', { currency: localCurrencyLabel })}
                        </p>
                        <Input
                          id="priceLbp"
                          name="priceLbp"
                          type="number"
                          min={0}
                          step={1}
                        />
                      </div>

                      <p className="text-sm text-muted-foreground">
                        {t('price_requirement', { currency: localCurrencyLabel })}
                      </p>

                      <MenuItemMerchandisingFields
                        baseId="item-create-merchandising"
                        localCurrencyLabel={localCurrencyLabel}
                        t={t}
                      />

                      <SwitchField
                        id="isAvailable"
                        name="isAvailable"
                        label={t('is_available_label')}
                        description={t('is_available_help')}
                        defaultChecked
                      />

                      <FormSubmitButton pendingLabel={t('create_pending_button')}>
                        {t('create_button')}
                      </FormSubmitButton>
                    </form>
                  )
                : (
                    <div className="mt-4 rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                      {t('no_categories_state')}
                    </div>
                  )}
            </CreatePanel>
          </div>
        </DashboardSection>

        <div className="grid gap-6">
          <DashboardSection
            title={t('category_list_section_title')}
            description={t('category_list_section_description')}
          >
            {categories.length > 0
              ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('name_header')}</TableHead>
                          <TableHead>{t('display_order_header')}</TableHead>
                          <TableHead>{t('parent_category_header')}</TableHead>
                          <TableHead className="w-24 text-right">
                            {t('actions_header')}
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {categories.map((category) => {
                          const parentCategory = categories.find(
                            parent => parent.id === category.parentCategoryId,
                          );

                          return (
                            <TableRow key={category.id}>
                              <TableCell className="min-w-64 font-medium">
                                <div className="space-y-3">
                                  <div>
                                    {getLocalizedMenuText(
                                      props.params.locale,
                                      {
                                        en: category.nameEn,
                                        ar: category.nameAr,
                                        fr: category.nameFr,
                                        legacy: category.name,
                                      },
                                      category.name,
                                    )}
                                    <div className="mt-1 text-xs font-normal text-muted-foreground">
                                      {category.parentCategoryId === null
                                        ? t('root_category_badge')
                                        : t('subcategory_badge')}
                                    </div>
                                  </div>
                                  <details className="rounded-md border p-3">
                                    <summary className="cursor-pointer text-sm font-medium">
                                      {t('edit_button')}
                                    </summary>
                                    <form
                                      action={updateMenuCategoryAction}
                                      className="mt-3 grid gap-3"
                                    >
                                      <input
                                        type="hidden"
                                        name="returnPath"
                                        value={menuItemsReturnPath}
                                      />
                                      <input
                                        type="hidden"
                                        name="categoryId"
                                        value={category.id}
                                      />
                                      <MenuCategoryLanguageFields
                                        baseId={`category-${category.id}`}
                                        t={t}
                                        values={{
                                          nameEn: category.nameEn,
                                          nameAr: category.nameAr,
                                          nameFr: category.nameFr,
                                          legacyName: category.name,
                                        }}
                                      />
                                      <ParentCategorySelect
                                        id={`category-parent-${category.id}`}
                                        categories={categories}
                                        currentCategoryId={category.id}
                                        defaultValue={category.parentCategoryId}
                                        locale={props.params.locale}
                                        t={t}
                                      />
                                      <div className="space-y-2">
                                        <Label htmlFor={`category-order-${category.id}`}>
                                          {t('display_order_label')}
                                        </Label>
                                        <Input
                                          id={`category-order-${category.id}`}
                                          name="displayOrder"
                                          type="number"
                                          defaultValue={category.displayOrder}
                                        />
                                      </div>
                                      <FormSubmitButton
                                        pendingLabel={t('update_pending_button')}
                                        size="sm"
                                      >
                                        {t('update_button')}
                                      </FormSubmitButton>
                                    </form>
                                  </details>
                                </div>
                              </TableCell>
                              <TableCell>{category.displayOrder}</TableCell>
                              <TableCell>
                                {parentCategory
                                  ? getLocalizedMenuText(
                                    props.params.locale,
                                    {
                                      en: parentCategory.nameEn,
                                      ar: parentCategory.nameAr,
                                      fr: parentCategory.nameFr,
                                      legacy: parentCategory.name,
                                    },
                                    parentCategory.name,
                                  )
                                  : t('parent_category_none')}
                              </TableCell>
                              <TableCell className="text-right">
                                <form action={deleteMenuCategoryAction}>
                                  <input
                                    type="hidden"
                                    name="returnPath"
                                    value={menuItemsReturnPath}
                                  />
                                  <input
                                    type="hidden"
                                    name="categoryId"
                                    value={category.id}
                                  />
                                  <ConfirmSubmitButton
                                    confirmMessage={t('delete_category_confirm')}
                                    pendingLabel={t('delete_pending_button')}
                                    variant="destructive"
                                    size="sm"
                                  >
                                    {t('delete_button')}
                                  </ConfirmSubmitButton>
                                </form>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )
              : (
                  <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
                    {t('empty_categories_state')}
                  </div>
                )}
          </DashboardSection>

          <DashboardSection
            title={t('list_section_title')}
            description={t('list_section_description')}
          >
            {items.length > 0
              ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('name_header')}</TableHead>
                          <TableHead>{t('category_header')}</TableHead>
                          <TableHead>{t('price_header')}</TableHead>
                          <TableHead>{t('availability_header')}</TableHead>
                          <TableHead className="w-24 text-right">
                            {t('actions_header')}
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map(item => (
                          <TableRow key={item.id}>
                            <TableCell className="min-w-72 font-medium">
                              <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                  {item.imageUrl && (
                                    <MenuItemImagePreview
                                      src={item.imageUrl}
                                      alt={getLocalizedMenuText(
                                        props.params.locale,
                                        {
                                          en: item.nameEn,
                                          ar: item.nameAr,
                                          fr: item.nameFr,
                                          legacy: item.name,
                                        },
                                        item.name,
                                      )}
                                      className="size-14"
                                    />
                                  )}
                                  <div>
                                    <div>
                                      {getLocalizedMenuText(
                                        props.params.locale,
                                        {
                                          en: item.nameEn,
                                          ar: item.nameAr,
                                          fr: item.nameFr,
                                          legacy: item.name,
                                        },
                                        item.name,
                                      )}
                                    </div>
                                    {item.imageUrl && (
                                      <div className="mt-1 max-w-72 truncate text-xs text-muted-foreground">
                                        {item.imageUrl}
                                      </div>
                                    )}
                                    <MenuItemBadgeList item={item} t={t} />
                                  </div>
                                </div>
                                <details className="rounded-md border p-3">
                                  <summary className="cursor-pointer text-sm font-medium">
                                    {t('edit_button')}
                                  </summary>
                                  <form
                                    action={updateMenuItemAction}
                                    encType="multipart/form-data"
                                    className="mt-3 grid gap-3"
                                  >
                                    <input
                                      type="hidden"
                                      name="returnPath"
                                      value={getI18nPath(
                                        '/dashboard/menu-items',
                                        props.params.locale,
                                      )}
                                    />
                                    <input
                                      type="hidden"
                                      name="itemId"
                                      value={item.id}
                                    />
                                    <div className="space-y-2">
                                      <Label htmlFor={`item-category-${item.id}`}>
                                        {t('category_label')}
                                      </Label>
                                      <select
                                        id={`item-category-${item.id}`}
                                        name="categoryId"
                                        defaultValue={item.categoryId}
                                        required
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                      >
                                        {categories.map(category => (
                                          <option key={category.id} value={category.id}>
                                            {getCategoryLabel(props.params.locale, category)}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                    <MenuItemLanguageFields
                                      baseId={`item-${item.id}`}
                                      t={t}
                                      values={{
                                        nameEn: item.nameEn,
                                        nameAr: item.nameAr,
                                        nameFr: item.nameFr,
                                        descriptionEn: item.descriptionEn,
                                        descriptionAr: item.descriptionAr,
                                        descriptionFr: item.descriptionFr,
                                        legacyName: item.name,
                                        legacyDescription: item.description,
                                      }}
                                    />
                                    <MenuItemImageUploadField
                                      fieldId={`item-image-${item.id}`}
                                      urlFieldName="imageUrl"
                                      fileFieldName="imageFile"
                                      label={t('image_url_label')}
                                      helpText={t('image_url_help')}
                                      placeholder={t('image_url_placeholder')}
                                      currentImageUrl={item.imageUrl}
                                    />
                                    <div className="space-y-2">
                                      <Label htmlFor={`item-usd-${item.id}`}>
                                        {t('price_usd_cents_label')}
                                      </Label>
                                      <p className="text-xs text-muted-foreground">
                                        {t('price_usd_cents_help')}
                                      </p>
                                      <Input
                                        id={`item-usd-${item.id}`}
                                        name="priceUsdCents"
                                        type="number"
                                        min={0}
                                        step={1}
                                        defaultValue={item.priceUsdCents ?? ''}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor={`item-lbp-${item.id}`}>
                                        {t('price_local_label', {
                                          currency: localCurrencyLabel,
                                        })}
                                      </Label>
                                      <Input
                                        id={`item-lbp-${item.id}`}
                                        name="priceLbp"
                                        type="number"
                                        min={0}
                                        step={1}
                                        defaultValue={item.priceLbp ?? ''}
                                      />
                                    </div>
                                    <MenuItemMerchandisingFields
                                      baseId={`item-${item.id}-merchandising`}
                                      localCurrencyLabel={localCurrencyLabel}
                                      t={t}
                                      values={{
                                        originalPriceUsdCents: item.originalPriceUsdCents,
                                        originalPriceLbp: item.originalPriceLbp,
                                        isPopular: item.isPopular,
                                        isNew: item.isNew,
                                        isSpicy: item.isSpicy,
                                        isFeatured: item.isFeatured,
                                        isPromo: item.isPromo,
                                      }}
                                    />
                                    <SwitchField
                                      id={`item-available-${item.id}`}
                                      name="isAvailable"
                                      label={t('is_available_label')}
                                      description={t('is_available_help')}
                                      defaultChecked={item.isAvailable}
                                    />
                                    <FormSubmitButton
                                      pendingLabel={t('update_pending_button')}
                                      size="sm"
                                    >
                                      {t('update_button')}
                                    </FormSubmitButton>
                                  </form>
                                </details>
                              </div>
                            </TableCell>
                            <TableCell>
                              {getLocalizedMenuText(
                                props.params.locale,
                                {
                                  en: item.categoryNameEn,
                                  ar: item.categoryNameAr,
                                  fr: item.categoryNameFr,
                                  legacy: item.categoryName,
                                },
                                item.categoryName,
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                {item.priceUsdCents !== null && (
                                  <MenuItemPriceLine
                                    currentPrice={item.priceUsdCents}
                                    originalPrice={item.originalPriceUsdCents}
                                    formatPrice={formatUsdCents}
                                  />
                                )}
                                {item.priceLbp !== null && (
                                  <MenuItemPriceLine
                                    currentPrice={item.priceLbp}
                                    originalPrice={item.originalPriceLbp}
                                    formatPrice={
                                      amount => formatLocalCurrency(
                                        amount,
                                        localCurrencyLabel,
                                      )
                                    }
                                  />
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {item.isAvailable
                                ? t('available_status')
                                : t('unavailable_status')}
                            </TableCell>
                            <TableCell className="text-right">
                              <form action={deleteMenuItemAction}>
                                <input
                                  type="hidden"
                                  name="returnPath"
                                  value={getI18nPath(
                                    '/dashboard/menu-items',
                                    props.params.locale,
                                  )}
                                />
                                <input
                                  type="hidden"
                                  name="itemId"
                                  value={item.id}
                                />
                                <ConfirmSubmitButton
                                  confirmMessage={t('delete_confirm')}
                                  pendingLabel={t('delete_pending_button')}
                                  variant="destructive"
                                  size="sm"
                                >
                                  {t('delete_button')}
                                </ConfirmSubmitButton>
                              </form>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )
              : (
                  <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
                    {t('empty_state')}
                  </div>
                )}
          </DashboardSection>
        </div>
      </div>

      <AdvancedSettingsBlock
        title={t('advanced_appearance_title')}
        description={t('advanced_appearance_description')}
      >
        <form action={updateMenuAppearanceAction} className="grid gap-4">
          <label className="grid gap-1 text-xs font-medium text-muted-foreground md:max-w-sm">
            {t('public_menu_accent_color_label')}
            <input
              name="restaurantAccentColor"
              type="color"
              defaultValue={organization?.restaurantAccentColor ?? '#111827'}
              className="h-9 w-full rounded-md border border-input bg-background p-1"
            />
          </label>
          <SwitchField
            id="show-menu-item-images"
            name="showMenuItemImages"
            label={t('show_menu_item_images_label')}
            description={t('show_menu_item_images_help')}
            defaultChecked={organization?.showMenuItemImages ?? true}
          />
          <TemplateStylePicker
            defaultValue={organization?.restaurantTemplateStyle}
            localCurrencyLabel={localCurrencyLabel}
            organizationId={orgId}
            restaurantName={organization?.restaurantDisplayName ?? 'Restaurant'}
          />
          <FormSubmitButton pendingLabel={t('appearance_save_pending')} size="sm">
            {t('appearance_save_button')}
          </FormSubmitButton>
        </form>
      </AdvancedSettingsBlock>
    </>
  );
};

export default MenuItemsPage;

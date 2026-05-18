import { auth } from '@clerk/nextjs/server';
import { asc, eq } from 'drizzle-orm';
import { unstable_noStore as noStore } from 'next/cache';
import { getTranslations } from 'next-intl/server';

import { ConfirmSubmitButton } from '@/components/ConfirmSubmitButton';
import { FormSubmitButton } from '@/components/FormSubmitButton';
import { MenuItemImagePreview } from '@/components/MenuItemImagePreview';
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
  createMenuItemAction,
  deleteMenuItemAction,
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
] as const;

type MenuCategoryOption = {
  id: number;
  name: string;
  nameEn: string | null;
  nameAr: string | null;
  nameFr: string | null;
  parentCategoryId: number | null;
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
          {categories.length > 0
            ? (
                <form action={createMenuItemAction} className="space-y-4">
                  <input
                    type="hidden"
                    name="returnPath"
                    value={getI18nPath(
                      '/dashboard/menu-items',
                      props.params.locale,
                    )}
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

                  <div className="space-y-2">
                    <Label htmlFor="imageUrl">{t('image_url_label')}</Label>
                    <p className="text-xs text-muted-foreground">
                      {t('image_url_help')}
                    </p>
                    <Input
                      id="imageUrl"
                      name="imageUrl"
                      type="url"
                      placeholder={t('image_url_placeholder')}
                    />
                  </div>

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

                  <SwitchField
                    id="isAvailable"
                    name="isAvailable"
                    label={t('is_available_label')}
                    defaultChecked
                  />

                  <FormSubmitButton pendingLabel={t('create_pending_button')}>
                    {t('create_button')}
                  </FormSubmitButton>
                </form>
              )
            : (
                <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
                  {t('no_categories_state')}
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
                                </div>
                              </div>
                              <details className="rounded-md border p-3">
                                <summary className="cursor-pointer text-sm font-medium">
                                  {t('edit_button')}
                                </summary>
                                <form
                                  action={updateMenuItemAction}
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
                                  <div className="space-y-2">
                                    <Label htmlFor={`item-image-${item.id}`}>
                                      {t('image_url_label')}
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                      {t('image_url_help')}
                                    </p>
                                    <Input
                                      id={`item-image-${item.id}`}
                                      name="imageUrl"
                                      type="url"
                                      defaultValue={item.imageUrl ?? ''}
                                      placeholder={t('image_url_placeholder')}
                                    />
                                    {item.imageUrl && (
                                      <div className="flex items-center gap-3 rounded-md border bg-muted/40 p-2">
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
                                          className="size-16"
                                        />
                                        <p className="min-w-0 truncate text-xs text-muted-foreground">
                                          {item.imageUrl}
                                        </p>
                                      </div>
                                    )}
                                  </div>
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
                                  <SwitchField
                                    id={`item-available-${item.id}`}
                                    name="isAvailable"
                                    label={t('is_available_label')}
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
                                <div>{formatUsdCents(item.priceUsdCents)}</div>
                              )}
                              {item.priceLbp !== null && (
                                <div>
                                  {formatLocalCurrency(item.priceLbp, localCurrencyLabel)}
                                </div>
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
    </>
  );
};

export default MenuItemsPage;

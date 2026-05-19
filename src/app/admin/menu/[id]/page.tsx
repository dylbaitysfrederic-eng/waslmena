import { asc, eq } from 'drizzle-orm';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ConfirmSubmitButton } from '@/components/ConfirmSubmitButton';
import { FormSubmitButton } from '@/components/FormSubmitButton';
import { MenuItemImageUploadField } from '@/components/MenuItemImageUploadField';
import { db } from '@/libs/DB';
import { menuCategorySchema, menuItemSchema } from '@/models/Schema';
import { getLocalizedMenuText } from '@/utils/MenuTranslations';

import {
  formatAdminLabel,
  getAdminOrganizations,
  MENU_TEMPLATE_TYPES,
} from '../../_helpers';
import {
  applyAdminMenuTemplateAction,
  createAdminMenuCategoryAction,
  createAdminMenuItemAction,
  deleteAdminMenuCategoryAction,
  deleteAdminMenuItemAction,
  updateAdminMenuCategoryAction,
  updateAdminMenuItemAction,
} from '../../actions';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const inputClassName = 'h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground';
const textareaClassName = 'min-h-20 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground';

const MultilingualNameFields = (props: {
  idPrefix: string;
  values?: {
    nameEn: string | null;
    nameAr: string | null;
    nameFr: string | null;
    legacyName: string;
  };
}) => (
  <div className="grid gap-3 sm:grid-cols-3">
    <label className="grid gap-1 text-xs font-medium text-muted-foreground">
      English name
      <input
        name="nameEn"
        defaultValue={props.values?.nameEn ?? props.values?.legacyName ?? ''}
        className={inputClassName}
      />
    </label>
    <label className="grid gap-1 text-xs font-medium text-muted-foreground">
      Arabic name
      <input
        name="nameAr"
        dir="rtl"
        defaultValue={props.values?.nameAr ?? ''}
        className={inputClassName}
      />
    </label>
    <label className="grid gap-1 text-xs font-medium text-muted-foreground">
      French name
      <input
        name="nameFr"
        defaultValue={props.values?.nameFr ?? ''}
        className={inputClassName}
      />
    </label>
    <span className="sr-only">{props.idPrefix}</span>
  </div>
);

const MultilingualItemFields = (props: {
  idPrefix: string;
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
    <MultilingualNameFields
      idPrefix={`${props.idPrefix}-name`}
      values={props.values}
    />
    <div className="grid gap-3 sm:grid-cols-3">
      <label className="grid gap-1 text-xs font-medium text-muted-foreground">
        English description
        <textarea
          name="descriptionEn"
          defaultValue={
            props.values?.descriptionEn ?? props.values?.legacyDescription ?? ''
          }
          className={textareaClassName}
        />
      </label>
      <label className="grid gap-1 text-xs font-medium text-muted-foreground">
        Arabic description
        <textarea
          name="descriptionAr"
          dir="rtl"
          defaultValue={props.values?.descriptionAr ?? ''}
          className={textareaClassName}
        />
      </label>
      <label className="grid gap-1 text-xs font-medium text-muted-foreground">
        French description
        <textarea
          name="descriptionFr"
          defaultValue={props.values?.descriptionFr ?? ''}
          className={textareaClassName}
        />
      </label>
    </div>
  </div>
);

const formatUsdCents = (amount: number | null) => {
  if (amount === null) {
    return '';
  }

  return String(amount);
};

const AdminMenuDetailPage = async (props: {
  params: { id: string };
  searchParams?: {
    templateStatus?: string;
    status?: string;
  };
}) => {
  const { ids, organizationRecords } = await getAdminOrganizations();

  if (!ids.includes(props.params.id)) {
    notFound();
  }

  const organizationId = props.params.id;
  const organization = organizationRecords.get(organizationId);

  const [categories, items] = await Promise.all([
    db
      .select()
      .from(menuCategorySchema)
      .where(eq(menuCategorySchema.organizationId, organizationId))
      .orderBy(
        asc(menuCategorySchema.displayOrder),
        asc(menuCategorySchema.name),
      ),
    db
      .select()
      .from(menuItemSchema)
      .where(eq(menuItemSchema.organizationId, organizationId))
      .orderBy(asc(menuItemSchema.name)),
  ]);

  const organizationCategories = categories;
  const rootCategories = organizationCategories.filter(
    category => category.parentCategoryId === null,
  );
  const mainCategories = organizationCategories.filter(
    category => category.parentCategoryId === null,
  );
  const organizationItems = items;
  const localCurrencyLabel = organization?.localCurrencyLabel ?? 'LL';
  const templateStatus = props.searchParams?.templateStatus ?? null;
  let statusMessage: string | null = null;

  if (props.searchParams?.status === 'invalid_image_type') {
    statusMessage = 'Uploaded image must be JPG, PNG, or WEBP.';
  } else if (props.searchParams?.status === 'image_too_large') {
    statusMessage = 'Uploaded image must be 300 KB or smaller.';
  } else if (props.searchParams?.status === 'category_in_use') {
    statusMessage = 'This category can’t be deleted while it has subcategories or items assigned.';
  } else if (props.searchParams?.status === 'category_deleted') {
    statusMessage = 'Category deleted.';
  } else if (props.searchParams?.status === 'item_deleted') {
    statusMessage = 'Item deleted.';
  }

  return (
    <section className="grid gap-4">
      <div className="rounded-md bg-background p-5">
        <Link
          href="/admin/menu"
          className="text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          Back to menu setup
        </Link>
        <h2 className="mt-4 text-xl font-semibold">
          {organization?.restaurantDisplayName || 'Unnamed restaurant'}
        </h2>
        <code className="mt-1 block text-xs text-muted-foreground">
          {organizationId}
        </code>
      </div>

      <div className="grid gap-4 rounded-md bg-background p-5">
        {statusMessage && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {statusMessage}
          </div>
        )}
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h3 className="font-semibold">Menu management</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Configure categories and menu items for this restaurant.
            </p>
          </div>
          <Link
            href={`/en/r/${organizationId}/menu`}
            className="w-fit rounded-md border border-input bg-background px-3 py-2 text-xs font-semibold hover:bg-muted"
          >
            Preview customer menu
          </Link>
        </div>

        {templateStatus === 'confirm' && (
          <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm font-medium text-amber-950">
            This restaurant already has menu data. Tick the replacement
            checkbox before applying a starter template.
          </div>
        )}

        {templateStatus === 'applied' && (
          <div className="rounded-md border border-green-300 bg-green-50 p-3 text-sm font-medium text-green-950">
            Starter menu template applied.
          </div>
        )}

        <form action={applyAdminMenuTemplateAction} className="grid gap-3 rounded-md border p-4">
          <input type="hidden" name="organizationId" value={organizationId} />
          <div>
            <div className="font-medium">Apply starter menu template</div>
            <p className="text-xs text-muted-foreground">
              Creates category and subcategory structure only. Restaurant
              users can add items and prices later from their dashboard.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <label className="grid gap-1 text-xs font-medium text-muted-foreground">
              Template
              <select name="menuTemplate" defaultValue="restaurant" className={inputClassName}>
                {MENU_TEMPLATE_TYPES.map(template => (
                  <option key={template} value={template}>
                    {formatAdminLabel(template)}
                  </option>
                ))}
              </select>
            </label>
            <FormSubmitButton pendingLabel="Applying..." size="sm">
              Apply template
            </FormSubmitButton>
          </div>
          {organizationCategories.length > 0 || organizationItems.length > 0
            ? (
                <label className="flex items-start gap-2 text-xs font-medium text-muted-foreground">
                  <input
                    name="replaceExistingMenu"
                    type="checkbox"
                    className="mt-0.5 size-4"
                  />
                  Replace existing categories and items with this starter
                  structure.
                </label>
              )
            : null}
        </form>

        {organizationCategories.length > 0 && (
          <div className="rounded-md border bg-muted/30 p-4">
            <div className="font-medium">Customer menu structure preview</div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {mainCategories.map(category => (
                <div key={category.id} className="rounded-md border bg-background p-3">
                  <div className="font-semibold">
                    {getLocalizedMenuText(
                      'en',
                      {
                        en: category.nameEn,
                        ar: category.nameAr,
                        fr: category.nameFr,
                        legacy: category.name,
                      },
                      category.name,
                    )}
                  </div>
                  <div className="mt-2 grid gap-1 text-xs text-muted-foreground">
                    {organizationCategories
                      .filter(subcategory =>
                        subcategory.parentCategoryId === category.id,
                      )
                      .map(subcategory => (
                        <div key={subcategory.id}>
                          {getLocalizedMenuText(
                            'en',
                            {
                              en: subcategory.nameEn,
                              ar: subcategory.nameAr,
                              fr: subcategory.nameFr,
                              legacy: subcategory.name,
                            },
                            subcategory.name,
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <form action={createAdminMenuCategoryAction} className="grid gap-3 rounded-md border p-4">
          <input type="hidden" name="organizationId" value={organizationId} />
          <div>
            <div className="font-medium">Add category</div>
            <p className="text-xs text-muted-foreground">
              At least one translated name is required.
            </p>
          </div>
          <MultilingualNameFields idPrefix={`category-create-${organizationId}`} />
          <label className="grid gap-1 text-xs font-medium text-muted-foreground">
            Parent category
            <select name="parentCategoryId" className={inputClassName} defaultValue="">
              <option value="">Root category</option>
              {rootCategories.map(category => (
                <option key={category.id} value={category.id}>
                  {getLocalizedMenuText(
                    'en',
                    {
                      en: category.nameEn,
                      ar: category.nameAr,
                      fr: category.nameFr,
                      legacy: category.name,
                    },
                    category.name,
                  )}
                </option>
              ))}
            </select>
          </label>
          <FormSubmitButton pendingLabel="Creating..." size="sm">
            Create category
          </FormSubmitButton>
        </form>

        {organizationCategories.length > 0 && (
          <div className="grid gap-3">
            <h4 className="font-medium">Categories</h4>
            {organizationCategories.map((category) => {
              const parentCategory = organizationCategories.find(
                parent => parent.id === category.parentCategoryId,
              );

              return (
                <div key={category.id}>
                  <form
                    action={updateAdminMenuCategoryAction}
                    className="grid gap-3 rounded-md border p-4"
                  >
                    <input type="hidden" name="organizationId" value={organizationId} />
                    <input type="hidden" name="categoryId" value={category.id} />
                    <div>
                      <div className="font-medium">
                        {getLocalizedMenuText(
                          'en',
                          {
                            en: category.nameEn,
                            ar: category.nameAr,
                            fr: category.nameFr,
                            legacy: category.name,
                          },
                          category.name,
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {category.parentCategoryId === null
                          ? 'Root category'
                          : `Subcategory of ${getLocalizedMenuText(
                            'en',
                            {
                              en: parentCategory?.nameEn,
                              ar: parentCategory?.nameAr,
                              fr: parentCategory?.nameFr,
                              legacy: parentCategory?.name,
                            },
                            parentCategory?.name ?? '',
                          )}`}
                      </div>
                    </div>
                    <MultilingualNameFields
                      idPrefix={`category-${category.id}`}
                      values={{
                        nameEn: category.nameEn,
                        nameAr: category.nameAr,
                        nameFr: category.nameFr,
                        legacyName: category.name,
                      }}
                    />
                    <label className="grid gap-1 text-xs font-medium text-muted-foreground">
                      Parent category
                      <select
                        name="parentCategoryId"
                        defaultValue={category.parentCategoryId ?? ''}
                        className={inputClassName}
                      >
                        <option value="">Root category</option>
                        {rootCategories
                          .filter(rootCategory => rootCategory.id !== category.id)
                          .map(rootCategory => (
                            <option key={rootCategory.id} value={rootCategory.id}>
                              {getLocalizedMenuText(
                                'en',
                                {
                                  en: rootCategory.nameEn,
                                  ar: rootCategory.nameAr,
                                  fr: rootCategory.nameFr,
                                  legacy: rootCategory.name,
                                },
                                rootCategory.name,
                              )}
                            </option>
                          ))}
                      </select>
                    </label>
                    <label className="grid gap-1 text-xs font-medium text-muted-foreground sm:max-w-40">
                      Display order
                      <input
                        name="displayOrder"
                        type="number"
                        defaultValue={category.displayOrder}
                        className={inputClassName}
                      />
                    </label>
                    <FormSubmitButton pendingLabel="Saving..." size="sm">
                      Save category
                    </FormSubmitButton>
                  </form>
                  <form action={deleteAdminMenuCategoryAction} className="mt-2">
                    <input type="hidden" name="organizationId" value={organizationId} />
                    <input type="hidden" name="categoryId" value={category.id} />
                    <ConfirmSubmitButton
                      confirmMessage="Are you sure you want to delete this category?"
                      pendingLabel="Deleting..."
                      variant="destructive"
                      size="sm"
                    >
                      Delete category
                    </ConfirmSubmitButton>
                  </form>
                </div>
              );
            })}
          </div>
        )}

        {organizationCategories.length > 0 && (
          <form
            action={createAdminMenuItemAction}
            encType="multipart/form-data"
            className="grid gap-3 rounded-md border p-4"
          >
            <input type="hidden" name="organizationId" value={organizationId} />
            <div>
              <div className="font-medium">Add menu item</div>
              <p className="text-xs text-muted-foreground">
                At least one translated item name and one price are required.
              </p>
            </div>
            <label className="grid gap-1 text-xs font-medium text-muted-foreground">
              Category
              <select name="categoryId" className={inputClassName} required>
                {organizationCategories.map(category => (
                  <option key={category.id} value={category.id}>
                    {getLocalizedMenuText(
                      'en',
                      {
                        en: category.nameEn,
                        ar: category.nameAr,
                        fr: category.nameFr,
                        legacy: category.name,
                      },
                      category.name,
                    )}
                  </option>
                ))}
              </select>
            </label>
            <MultilingualItemFields idPrefix={`item-create-${organizationId}`} />
            <MenuItemImageUploadField
              fieldId="new-item-image"
              urlFieldName="imageUrl"
              fileFieldName="imageFile"
              label="Image URL (optional)"
              helpText="Optional. Use a public image URL or upload a lightweight image file."
              placeholder="https://example.com/image.jpg"
            />
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="grid gap-1 text-xs font-medium text-muted-foreground">
                USD cents
                <input name="priceUsdCents" type="number" min={0} className={inputClassName} />
              </label>
              <label className="grid gap-1 text-xs font-medium text-muted-foreground">
                {localCurrencyLabel}
                <input name="priceLbp" type="number" min={0} className={inputClassName} />
              </label>
              <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <input name="isAvailable" type="checkbox" defaultChecked className="size-4" />
                Available
              </label>
            </div>
            <FormSubmitButton pendingLabel="Creating..." size="sm">
              Create item
            </FormSubmitButton>
          </form>
        )}

        {organizationItems.length > 0 && (
          <div className="grid gap-3">
            <h4 className="font-medium">Menu items</h4>
            {organizationItems.map(item => (
              <div key={item.id}>
                <form
                  action={updateAdminMenuItemAction}
                  encType="multipart/form-data"
                  className="grid gap-3 rounded-md border p-4"
                >
                  <input type="hidden" name="organizationId" value={organizationId} />
                  <input type="hidden" name="itemId" value={item.id} />
                  <div className="font-medium">
                    {getLocalizedMenuText(
                      'en',
                      {
                        en: item.nameEn,
                        ar: item.nameAr,
                        fr: item.nameFr,
                        legacy: item.name,
                      },
                      item.name,
                    )}
                  </div>
                  <label className="grid gap-1 text-xs font-medium text-muted-foreground">
                    Category
                    <select
                      name="categoryId"
                      defaultValue={item.categoryId}
                      className={inputClassName}
                      required
                    >
                      {organizationCategories.map(category => (
                        <option key={category.id} value={category.id}>
                          {getLocalizedMenuText(
                            'en',
                            {
                              en: category.nameEn,
                              ar: category.nameAr,
                              fr: category.nameFr,
                              legacy: category.name,
                            },
                            category.name,
                          )}
                        </option>
                      ))}
                    </select>
                  </label>
                  <MultilingualItemFields
                    idPrefix={`item-${item.id}`}
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
                    label="Image URL (optional)"
                    helpText="Optional. Use a public image URL or upload a lightweight image file."
                    placeholder="https://example.com/image.jpg"
                    currentImageUrl={item.imageUrl}
                  />
                  <div className="grid gap-3 sm:grid-cols-3">
                    <label className="grid gap-1 text-xs font-medium text-muted-foreground">
                      USD cents
                      <input
                        name="priceUsdCents"
                        type="number"
                        min={0}
                        defaultValue={formatUsdCents(item.priceUsdCents)}
                        className={inputClassName}
                      />
                    </label>
                    <label className="grid gap-1 text-xs font-medium text-muted-foreground">
                      {localCurrencyLabel}
                      <input
                        name="priceLbp"
                        type="number"
                        min={0}
                        defaultValue={item.priceLbp ?? ''}
                        className={inputClassName}
                      />
                    </label>
                    <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <input
                        name="isAvailable"
                        type="checkbox"
                        defaultChecked={item.isAvailable}
                        className="size-4"
                      />
                      Available
                    </label>
                  </div>
                  <FormSubmitButton pendingLabel="Saving..." size="sm">
                    Save item
                  </FormSubmitButton>
                </form>
                <form action={deleteAdminMenuItemAction} className="mt-2">
                  <input type="hidden" name="organizationId" value={organizationId} />
                  <input type="hidden" name="itemId" value={item.id} />
                  <ConfirmSubmitButton
                    confirmMessage="Are you sure you want to delete this item?"
                    pendingLabel="Deleting..."
                    variant="destructive"
                    size="sm"
                  >
                    Delete item
                  </ConfirmSubmitButton>
                </form>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default AdminMenuDetailPage;

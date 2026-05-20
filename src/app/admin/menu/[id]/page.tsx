import { asc, eq } from 'drizzle-orm';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ConfirmSubmitButton } from '@/components/ConfirmSubmitButton';
import { FormSubmitButton } from '@/components/FormSubmitButton';
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

const selectClassName = 'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';
const textareaClassName = 'min-h-20 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';

type MenuCategoryRow = typeof menuCategorySchema.$inferSelect;

const getCategoryName = (
  category: Pick<MenuCategoryRow, 'name' | 'nameEn' | 'nameAr' | 'nameFr'>,
) => getLocalizedMenuText(
  'en',
  {
    en: category.nameEn,
    ar: category.nameAr,
    fr: category.nameFr,
    legacy: category.name,
  },
  category.name,
);

const getCategoryOptionLabel = (
  category: Pick<MenuCategoryRow, 'name' | 'nameEn' | 'nameAr' | 'nameFr' | 'parentCategoryId'>,
) => {
  const label = getCategoryName(category);

  return category.parentCategoryId === null ? label : `- ${label}`;
};

const formatUsdCents = (amount: number | null) => {
  if (amount === null) {
    return '';
  }

  return String(amount);
};

const formatUsdDisplay = (amount: number | null) => {
  if (amount === null) {
    return null;
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount / 100);
};

const formatLocalCurrency = (
  amount: number | null,
  localCurrencyLabel: string,
) => {
  if (amount === null) {
    return null;
  }

  return `${new Intl.NumberFormat('en-US').format(amount)} ${localCurrencyLabel}`;
};

const AdminSection = (props: {
  children: React.ReactNode;
  description?: string;
  title: string;
}) => (
  <section className="rounded-md bg-background p-5">
    <div className="mb-4">
      <h3 className="font-semibold">{props.title}</h3>
      {props.description && (
        <p className="mt-1 text-sm text-muted-foreground">
          {props.description}
        </p>
      )}
    </div>
    {props.children}
  </section>
);

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
    <div className="space-y-2">
      <Label htmlFor={`${props.idPrefix}-name-en`}>English name</Label>
      <Input
        id={`${props.idPrefix}-name-en`}
        name="nameEn"
        defaultValue={props.values?.nameEn ?? props.values?.legacyName ?? ''}
      />
    </div>
    <div className="space-y-2">
      <Label htmlFor={`${props.idPrefix}-name-ar`}>Arabic name</Label>
      <Input
        id={`${props.idPrefix}-name-ar`}
        name="nameAr"
        dir="rtl"
        defaultValue={props.values?.nameAr ?? ''}
      />
    </div>
    <div className="space-y-2">
      <Label htmlFor={`${props.idPrefix}-name-fr`}>French name</Label>
      <Input
        id={`${props.idPrefix}-name-fr`}
        name="nameFr"
        defaultValue={props.values?.nameFr ?? ''}
      />
    </div>
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
      <div className="space-y-2">
        <Label htmlFor={`${props.idPrefix}-description-en`}>
          English description
        </Label>
        <textarea
          id={`${props.idPrefix}-description-en`}
          name="descriptionEn"
          defaultValue={
            props.values?.descriptionEn ?? props.values?.legacyDescription ?? ''
          }
          className={textareaClassName}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${props.idPrefix}-description-ar`}>
          Arabic description
        </Label>
        <textarea
          id={`${props.idPrefix}-description-ar`}
          name="descriptionAr"
          dir="rtl"
          defaultValue={props.values?.descriptionAr ?? ''}
          className={textareaClassName}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${props.idPrefix}-description-fr`}>
          French description
        </Label>
        <textarea
          id={`${props.idPrefix}-description-fr`}
          name="descriptionFr"
          defaultValue={props.values?.descriptionFr ?? ''}
          className={textareaClassName}
        />
      </div>
    </div>
  </div>
);

const CategoryParentSelect = (props: {
  categories: MenuCategoryRow[];
  currentCategoryId?: number;
  defaultValue?: number | null;
  id: string;
}) => {
  const availableParents = props.categories.filter(category =>
    category.id !== props.currentCategoryId
    && category.parentCategoryId === null,
  );

  return (
    <div className="space-y-2">
      <Label htmlFor={props.id}>Parent category</Label>
      <select
        id={props.id}
        name="parentCategoryId"
        className={selectClassName}
        defaultValue={props.defaultValue ?? ''}
      >
        <option value="">Root category</option>
        {availableParents.map(category => (
          <option key={category.id} value={category.id}>
            {getCategoryName(category)}
          </option>
        ))}
      </select>
    </div>
  );
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
    <section className="grid gap-6">
      <div className="rounded-md bg-background p-5">
        <Link
          href="/admin/menu"
          className="text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          Back to menu setup
        </Link>
        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-xl font-semibold">
              {organization?.restaurantDisplayName || 'Unnamed restaurant'}
            </h2>
            <code className="mt-1 block text-xs text-muted-foreground">
              {organizationId}
            </code>
          </div>
          <Link
            href={`/en/r/${organizationId}/menu`}
            className="w-fit rounded-md border border-input bg-background px-3 py-2 text-xs font-semibold hover:bg-muted"
          >
            Preview customer menu
          </Link>
        </div>
      </div>

      {statusMessage && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {statusMessage}
        </div>
      )}

      <AdminSection
        title="Starter template"
        description="Apply a starter menu structure for this restaurant."
      >
        <div className="grid gap-4 lg:grid-cols-[minmax(0,380px)_1fr]">
          <form
            action={applyAdminMenuTemplateAction}
            className="space-y-4"
          >
            <input type="hidden" name="organizationId" value={organizationId} />
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
            <div>
              <div className="font-medium">Apply starter menu template</div>
              <p className="text-xs text-muted-foreground">
                Creates category and subcategory structure only. Restaurant
                users can add items and prices later from their dashboard.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="menuTemplate">Template</Label>
              <select
                id="menuTemplate"
                name="menuTemplate"
                defaultValue="restaurant"
                className={selectClassName}
              >
                {MENU_TEMPLATE_TYPES.map(template => (
                  <option key={template} value={template}>
                    {formatAdminLabel(template)}
                  </option>
                ))}
              </select>
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
            <FormSubmitButton pendingLabel="Applying...">
              Apply template
            </FormSubmitButton>
          </form>

          {organizationCategories.length > 0
            ? (
                <div className="rounded-md border bg-muted/30 p-4">
                  <div className="font-medium">Customer menu structure preview</div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {mainCategories.map(category => (
                      <div key={category.id} className="rounded-md border bg-background p-3">
                        <div className="font-semibold">
                          {getCategoryName(category)}
                        </div>
                        <div className="mt-2 grid gap-1 text-xs text-muted-foreground">
                          {organizationCategories
                            .filter(subcategory =>
                              subcategory.parentCategoryId === category.id,
                            )
                            .map(subcategory => (
                              <div key={subcategory.id}>
                                {getCategoryName(subcategory)}
                              </div>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            : (
                <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
                  Apply a starter template or create categories to preview the
                  customer menu structure.
                </div>
              )}
        </div>
      </AdminSection>

      <AdminSection
        title="Categories"
        description="Create and update the category structure for this restaurant."
      >
        <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_1fr]">
          <form action={createAdminMenuCategoryAction} className="space-y-4">
            <input type="hidden" name="organizationId" value={organizationId} />
            <div>
              <div className="font-medium">Add category</div>
              <p className="text-xs text-muted-foreground">
                At least one translated name is required.
              </p>
            </div>
            <MultilingualNameFields idPrefix={`category-create-${organizationId}`} />
            <CategoryParentSelect
              id="category-parent-create"
              categories={organizationCategories}
            />
            <FormSubmitButton pendingLabel="Creating...">
              Create category
            </FormSubmitButton>
          </form>

          {organizationCategories.length > 0
            ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Display order</TableHead>
                        <TableHead>Parent</TableHead>
                        <TableHead className="w-24 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {organizationCategories.map((category) => {
                        const parentCategory = organizationCategories.find(
                          parent => parent.id === category.parentCategoryId,
                        );

                        return (
                          <TableRow key={category.id}>
                            <TableCell className="min-w-64 font-medium">
                              <div className="space-y-3">
                                <div>
                                  {getCategoryName(category)}
                                  <div className="mt-1 text-xs font-normal text-muted-foreground">
                                    {category.parentCategoryId === null
                                      ? 'Root category'
                                      : `Subcategory of ${parentCategory ? getCategoryName(parentCategory) : ''}`}
                                  </div>
                                </div>
                                <details className="rounded-md border p-3">
                                  <summary className="cursor-pointer text-sm font-medium">
                                    Edit
                                  </summary>
                                  <form
                                    action={updateAdminMenuCategoryAction}
                                    className="mt-3 grid gap-3"
                                  >
                                    <input type="hidden" name="organizationId" value={organizationId} />
                                    <input type="hidden" name="categoryId" value={category.id} />
                                    <MultilingualNameFields
                                      idPrefix={`category-${category.id}`}
                                      values={{
                                        nameEn: category.nameEn,
                                        nameAr: category.nameAr,
                                        nameFr: category.nameFr,
                                        legacyName: category.name,
                                      }}
                                    />
                                    <CategoryParentSelect
                                      id={`category-parent-${category.id}`}
                                      categories={organizationCategories}
                                      currentCategoryId={category.id}
                                      defaultValue={category.parentCategoryId}
                                    />
                                    <div className="space-y-2 sm:max-w-40">
                                      <Label htmlFor={`category-order-${category.id}`}>
                                        Display order
                                      </Label>
                                      <Input
                                        id={`category-order-${category.id}`}
                                        name="displayOrder"
                                        type="number"
                                        defaultValue={category.displayOrder}
                                      />
                                    </div>
                                    <FormSubmitButton pendingLabel="Saving..." size="sm">
                                      Save category
                                    </FormSubmitButton>
                                  </form>
                                </details>
                              </div>
                            </TableCell>
                            <TableCell>{category.displayOrder}</TableCell>
                            <TableCell>
                              {parentCategory ? getCategoryName(parentCategory) : 'Root category'}
                            </TableCell>
                            <TableCell className="text-right">
                              <form action={deleteAdminMenuCategoryAction}>
                                <input type="hidden" name="organizationId" value={organizationId} />
                                <input type="hidden" name="categoryId" value={category.id} />
                                <ConfirmSubmitButton
                                  confirmMessage="Are you sure you want to delete this category?"
                                  pendingLabel="Deleting..."
                                  variant="destructive"
                                  size="sm"
                                >
                                  Delete
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
                  No categories yet.
                </div>
              )}
        </div>
      </AdminSection>

      <AdminSection
        title="Menu items"
        description="Create and update menu items, availability, prices, and images."
      >
        <div className="grid gap-6 xl:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
          {organizationCategories.length > 0
            ? (
                <form
                  action={createAdminMenuItemAction}
                  encType="multipart/form-data"
                  className="space-y-4"
                >
                  <input type="hidden" name="organizationId" value={organizationId} />
                  <div>
                    <div className="font-medium">Add menu item</div>
                    <p className="text-xs text-muted-foreground">
                      At least one translated item name and one price are required.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="item-category-create">Category</Label>
                    <select
                      id="item-category-create"
                      name="categoryId"
                      className={selectClassName}
                      required
                    >
                      {organizationCategories.map(category => (
                        <option key={category.id} value={category.id}>
                          {getCategoryOptionLabel(category)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <MultilingualItemFields idPrefix={`item-create-${organizationId}`} />
                  <MenuItemImageUploadField
                    fieldId="new-item-image"
                    urlFieldName="imageUrl"
                    fileFieldName="imageFile"
                    label="Image (optional)"
                    helpText="Optional. Upload a lightweight image file."
                    placeholder="https://example.com/image.jpg"
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="item-usd-create">USD cents</Label>
                      <Input
                        id="item-usd-create"
                        name="priceUsdCents"
                        type="number"
                        min={0}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="item-local-create">{localCurrencyLabel}</Label>
                      <Input
                        id="item-local-create"
                        name="priceLbp"
                        type="number"
                        min={0}
                      />
                    </div>
                  </div>
                  <SwitchField
                    id="item-available-create"
                    name="isAvailable"
                    label="Available for customer orders"
                    description="Unavailable items remain visible but cannot be ordered."
                    defaultChecked
                  />
                  <FormSubmitButton pendingLabel="Creating...">
                    Create item
                  </FormSubmitButton>
                </form>
              )
            : (
                <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
                  Create at least one category before adding menu items.
                </div>
              )}

          {organizationItems.length > 0
            ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Availability</TableHead>
                        <TableHead className="w-24 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {organizationItems.map((item) => {
                        const itemCategory = organizationCategories.find(
                          category => category.id === item.categoryId,
                        );

                        return (
                          <TableRow key={item.id}>
                            <TableCell className="min-w-72 font-medium">
                              <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                  {item.imageUrl && (
                                    <MenuItemImagePreview
                                      src={item.imageUrl}
                                      alt={getLocalizedMenuText(
                                        'en',
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
                                    {item.imageUrl && (
                                      <div className="mt-1 max-w-72 truncate text-xs text-muted-foreground">
                                        {item.imageUrl}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <details className="rounded-md border p-3">
                                  <summary className="cursor-pointer text-sm font-medium">
                                    Edit
                                  </summary>
                                  <form
                                    action={updateAdminMenuItemAction}
                                    encType="multipart/form-data"
                                    className="mt-3 grid gap-3"
                                  >
                                    <input type="hidden" name="organizationId" value={organizationId} />
                                    <input type="hidden" name="itemId" value={item.id} />
                                    <div className="space-y-2">
                                      <Label htmlFor={`item-category-${item.id}`}>
                                        Category
                                      </Label>
                                      <select
                                        id={`item-category-${item.id}`}
                                        name="categoryId"
                                        defaultValue={item.categoryId}
                                        className={selectClassName}
                                        required
                                      >
                                        {organizationCategories.map(category => (
                                          <option key={category.id} value={category.id}>
                                            {getCategoryOptionLabel(category)}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
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
                                      label="Image (optional)"
                                      helpText="Optional. Upload a lightweight image file."
                                      placeholder="https://example.com/image.jpg"
                                      currentImageUrl={item.imageUrl}
                                    />
                                    <div className="grid gap-3 sm:grid-cols-2">
                                      <div className="space-y-2">
                                        <Label htmlFor={`item-usd-${item.id}`}>
                                          USD cents
                                        </Label>
                                        <Input
                                          id={`item-usd-${item.id}`}
                                          name="priceUsdCents"
                                          type="number"
                                          min={0}
                                          defaultValue={formatUsdCents(item.priceUsdCents)}
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`item-local-${item.id}`}>
                                          {localCurrencyLabel}
                                        </Label>
                                        <Input
                                          id={`item-local-${item.id}`}
                                          name="priceLbp"
                                          type="number"
                                          min={0}
                                          defaultValue={item.priceLbp ?? ''}
                                        />
                                      </div>
                                    </div>
                                    <SwitchField
                                      id={`item-available-${item.id}`}
                                      name="isAvailable"
                                      label="Available for customer orders"
                                      description="Unavailable items remain visible but cannot be ordered."
                                      defaultChecked={item.isAvailable}
                                    />
                                    <FormSubmitButton pendingLabel="Saving..." size="sm">
                                      Save item
                                    </FormSubmitButton>
                                  </form>
                                </details>
                              </div>
                            </TableCell>
                            <TableCell>
                              {itemCategory ? getCategoryName(itemCategory) : 'Unknown category'}
                            </TableCell>
                            <TableCell>
                              <div className="grid gap-1 text-sm">
                                {formatUsdDisplay(item.priceUsdCents) && (
                                  <div>{formatUsdDisplay(item.priceUsdCents)}</div>
                                )}
                                {formatLocalCurrency(item.priceLbp, localCurrencyLabel) && (
                                  <div>
                                    {formatLocalCurrency(item.priceLbp, localCurrencyLabel)}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {item.isAvailable ? 'Available' : 'Unavailable'}
                            </TableCell>
                            <TableCell className="text-right">
                              <form action={deleteAdminMenuItemAction}>
                                <input type="hidden" name="organizationId" value={organizationId} />
                                <input type="hidden" name="itemId" value={item.id} />
                                <ConfirmSubmitButton
                                  confirmMessage="Are you sure you want to delete this item?"
                                  pendingLabel="Deleting..."
                                  variant="destructive"
                                  size="sm"
                                >
                                  Delete
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
                  No menu items yet.
                </div>
              )}
        </div>
      </AdminSection>
    </section>
  );
};

export default AdminMenuDetailPage;

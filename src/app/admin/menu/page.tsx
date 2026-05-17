import { asc } from 'drizzle-orm';

import { FormSubmitButton } from '@/components/FormSubmitButton';
import { db } from '@/libs/DB';
import { menuCategorySchema, menuItemSchema } from '@/models/Schema';
import { getLocalizedMenuText } from '@/utils/MenuTranslations';

import { getAdminOrganizations } from '../_helpers';
import {
  createAdminMenuCategoryAction,
  createAdminMenuItemAction,
  updateAdminMenuCategoryAction,
  updateAdminMenuItemAction,
} from '../actions';

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

const AdminMenuPage = async () => {
  const { ids, organizationRecords } = await getAdminOrganizations();
  const [categories, items] = await Promise.all([
    db
      .select()
      .from(menuCategorySchema)
      .orderBy(
        asc(menuCategorySchema.organizationId),
        asc(menuCategorySchema.displayOrder),
        asc(menuCategorySchema.name),
      ),
    db
      .select()
      .from(menuItemSchema)
      .orderBy(asc(menuItemSchema.organizationId), asc(menuItemSchema.name)),
  ]);

  return (
    <section className="grid gap-4">
      <div className="rounded-md bg-background p-5">
        <h2 className="text-xl font-semibold">Menu setup</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Configure starter categories and menu items for restaurants during founder
          onboarding. Restaurant teams can continue managing the same multilingual
          fields from their dashboard.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Fill at least one language for every category or item name. The public
          menu uses the guest locale first, then falls back to another available
          language.
        </p>
      </div>

      {ids.map((organizationId) => {
        const organization = organizationRecords.get(organizationId);
        const organizationCategories = categories.filter(
          category => category.organizationId === organizationId,
        );
        const organizationItems = items.filter(
          item => item.organizationId === organizationId,
        );
        const localCurrencyLabel = organization?.localCurrencyLabel ?? 'LL';

        return (
          <div key={organizationId} className="grid gap-4 rounded-md bg-background p-5">
            <div>
              <h3 className="font-semibold">
                {organization?.restaurantDisplayName || 'Unnamed restaurant'}
              </h3>
              <code className="text-xs text-muted-foreground">{organizationId}</code>
            </div>

            <form action={createAdminMenuCategoryAction} className="grid gap-3 rounded-md border p-4">
              <input type="hidden" name="organizationId" value={organizationId} />
              <div>
                <div className="font-medium">Add category</div>
                <p className="text-xs text-muted-foreground">
                  At least one translated name is required.
                </p>
              </div>
              <MultilingualNameFields idPrefix={`category-create-${organizationId}`} />
              <label className="grid gap-1 text-xs font-medium text-muted-foreground sm:max-w-40">
                Display order
                <input
                  name="displayOrder"
                  type="number"
                  defaultValue={organizationCategories.length}
                  className={inputClassName}
                />
              </label>
              <FormSubmitButton pendingLabel="Creating..." size="sm">
                Create category
              </FormSubmitButton>
            </form>

            {organizationCategories.length > 0 && (
              <div className="grid gap-3">
                <h4 className="font-medium">Categories</h4>
                {organizationCategories.map(category => (
                  <form
                    key={category.id}
                    action={updateAdminMenuCategoryAction}
                    className="grid gap-3 rounded-md border p-4"
                  >
                    <input type="hidden" name="organizationId" value={organizationId} />
                    <input type="hidden" name="categoryId" value={category.id} />
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
                    <MultilingualNameFields
                      idPrefix={`category-${category.id}`}
                      values={{
                        nameEn: category.nameEn,
                        nameAr: category.nameAr,
                        nameFr: category.nameFr,
                        legacyName: category.name,
                      }}
                    />
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
                ))}
              </div>
            )}

            {organizationCategories.length > 0 && (
              <form action={createAdminMenuItemAction} className="grid gap-3 rounded-md border p-4">
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
                  <form
                    key={item.id}
                    action={updateAdminMenuItemAction}
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
                ))}
              </div>
            )}
          </div>
        );
      })}

      {ids.length === 0 && (
        <div className="rounded-md bg-background p-8 text-center text-sm text-muted-foreground">
          No restaurant clients found yet.
        </div>
      )}
    </section>
  );
};

export default AdminMenuPage;

import { auth } from '@clerk/nextjs/server';
import { asc, eq } from 'drizzle-orm';
import { unstable_noStore as noStore } from 'next/cache';
import { getTranslations } from 'next-intl/server';

import { ConfirmSubmitButton } from '@/components/ConfirmSubmitButton';
import { FormSubmitButton } from '@/components/FormSubmitButton';
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
import { menuCategorySchema } from '@/models/Schema';
import { getI18nPath } from '@/utils/Helpers';
import { getLocalizedMenuText } from '@/utils/MenuTranslations';

import {
  createMenuCategoryAction,
  deleteMenuCategoryAction,
  updateMenuCategoryAction,
} from './actions';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata(props: { params: { locale: string } }) {
  const t = await getTranslations({
    locale: props.params.locale,
    namespace: 'MenuCategories',
  });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

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
    </div>
  </div>
);

const VALID_FORM_ERRORS = ['missing_name'] as const;

const MenuCategoriesPage = async (props: {
  params: { locale: string };
  searchParams: { error?: string };
}) => {
  noStore();

  const { orgId } = await auth();
  const t = await getTranslations('MenuCategories');

  if (!orgId) {
    return null;
  }

  const returnPath = getI18nPath('/dashboard/menu-categories', props.params.locale);
  const formError = VALID_FORM_ERRORS.includes(
    props.searchParams.error as (typeof VALID_FORM_ERRORS)[number],
  )
    ? props.searchParams.error
    : null;

  const categories = await db
    .select({
      id: menuCategorySchema.id,
      name: menuCategorySchema.name,
      nameEn: menuCategorySchema.nameEn,
      nameAr: menuCategorySchema.nameAr,
      nameFr: menuCategorySchema.nameFr,
      displayOrder: menuCategorySchema.displayOrder,
      createdAt: menuCategorySchema.createdAt,
    })
    .from(menuCategorySchema)
    .where(eq(menuCategorySchema.organizationId, orgId))
    .orderBy(
      asc(menuCategorySchema.displayOrder),
      asc(menuCategorySchema.name),
    );

  return (
    <>
      <TitleBar
        title={t('title_bar')}
        description={t('title_bar_description')}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_1fr]">
        <DashboardSection
          title={t('create_section_title')}
          description={t('create_section_description')}
        >
          <form action={createMenuCategoryAction} className="space-y-4">
            <input type="hidden" name="returnPath" value={returnPath} />
            {formError && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm font-medium text-destructive">
                {t(`error_${formError}`)}
              </div>
            )}
            <MenuCategoryLanguageFields baseId="category-create" t={t} />

            <div className="space-y-2">
              <Label htmlFor="displayOrder">{t('display_order_label')}</Label>
              <Input
                id="displayOrder"
                name="displayOrder"
                type="number"
                defaultValue={0}
                required
              />
            </div>

            <FormSubmitButton pendingLabel={t('create_pending_button')}>
              {t('create_button')}
            </FormSubmitButton>
          </form>
        </DashboardSection>

        <DashboardSection
          title={t('list_section_title')}
          description={t('list_section_description')}
        >
          {categories.length > 0
            ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('name_header')}</TableHead>
                        <TableHead>{t('display_order_header')}</TableHead>
                        <TableHead>{t('created_at_header')}</TableHead>
                        <TableHead className="w-24 text-right">
                          {t('actions_header')}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categories.map(category => (
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
                              </div>
                              <details className="rounded-md border p-3">
                                <summary className="cursor-pointer text-sm font-medium">
                                  {t('edit_button')}
                                </summary>
                                <form
                                  action={updateMenuCategoryAction}
                                  className="mt-3 space-y-3"
                                >
                                  <input
                                    type="hidden"
                                    name="returnPath"
                                    value={returnPath}
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
                                  <div className="space-y-2">
                                    <Label htmlFor={`category-order-${category.id}`}>
                                      {t('display_order_label')}
                                    </Label>
                                    <Input
                                      id={`category-order-${category.id}`}
                                      name="displayOrder"
                                      type="number"
                                      defaultValue={category.displayOrder}
                                      required
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
                            {new Intl.DateTimeFormat(undefined, {
                              dateStyle: 'medium',
                            }).format(category.createdAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            <form action={deleteMenuCategoryAction}>
                              <input
                                type="hidden"
                                name="returnPath"
                                value={returnPath}
                              />
                              <input
                                type="hidden"
                                name="categoryId"
                                value={category.id}
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

export default MenuCategoriesPage;

import { auth } from '@clerk/nextjs/server';
import { asc, eq } from 'drizzle-orm';
import { unstable_noStore as noStore } from 'next/cache';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import { QrCustomizationFields } from '@/app/admin/templates/QrCustomizationFields';
import { TemplateStylePicker } from '@/app/admin/templates/TemplateStylePicker';
import { ConfirmSubmitButton } from '@/components/ConfirmSubmitButton';
import { FormSubmitButton } from '@/components/FormSubmitButton';
import { SwitchField } from '@/components/SwitchField';
import { Button } from '@/components/ui/button';
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
import { organizationSchema, restaurantTableSchema } from '@/models/Schema';

import {
  createRestaurantTableAction,
  deleteRestaurantTableAction,
  updateRestaurantQrSettingsAction,
  updateRestaurantTableAction,
} from './actions';
import { TableQrCode } from './TableQrCode';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata(props: { params: { locale: string } }) {
  const t = await getTranslations({
    locale: props.params.locale,
    namespace: 'RestaurantTables',
  });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

const RESTAURANT_PROFILES = [
  'fast_food',
  'cafe',
  'casual_dining',
  'table_service',
  'shisha_lounge',
] as const;
const ORDERING_MODES = ['table_ordering', 'counter_pickup', 'both'] as const;
const QR_MODES = ['per_table', 'general_menu', 'both'] as const;

const formatSettingLabel = (value: string) => value
  .split('_')
  .map(part => part.charAt(0).toUpperCase() + part.slice(1))
  .join(' ');

const selectClassName = 'h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground';

const RestaurantTablesPage = async (props: {
  params: { locale: string };
  searchParams?: { tableStatus?: string };
}) => {
  noStore();

  const { orgId } = await auth();
  const t = await getTranslations('RestaurantTables');

  if (!orgId) {
    return null;
  }

  const [tables, organizationRows] = await Promise.all([
    db
      .select({
        id: restaurantTableSchema.id,
        tableNumber: restaurantTableSchema.tableNumber,
        qrCode: restaurantTableSchema.qrCode,
      })
      .from(restaurantTableSchema)
      .where(eq(restaurantTableSchema.organizationId, orgId))
      .orderBy(asc(restaurantTableSchema.tableNumber)),
    db
      .select({
        restaurantDisplayName: organizationSchema.restaurantDisplayName,
        restaurantLogoUrl: organizationSchema.restaurantLogoUrl,
        restaurantAccentColor: organizationSchema.restaurantAccentColor,
        showMenuItemImages: organizationSchema.showMenuItemImages,
        localCurrencyLabel: organizationSchema.localCurrencyLabel,
        restaurantProfile: organizationSchema.restaurantProfile,
        restaurantTemplateStyle: organizationSchema.restaurantTemplateStyle,
        orderingMode: organizationSchema.orderingMode,
        enableTableNumbers: organizationSchema.enableTableNumbers,
        enableNamedTables: organizationSchema.enableNamedTables,
        enableCustomerName: organizationSchema.enableCustomerName,
        enableWhatsappContact: organizationSchema.enableWhatsappContact,
        qrMode: organizationSchema.qrMode,
        qrFrameColor: organizationSchema.qrFrameColor,
        qrForegroundColor: organizationSchema.qrForegroundColor,
        qrBackgroundColor: organizationSchema.qrBackgroundColor,
        qrLabelText: organizationSchema.qrLabelText,
        qrShowRestaurantName: organizationSchema.qrShowRestaurantName,
        qrShowTableNumber: organizationSchema.qrShowTableNumber,
        qrStyleTemplate: organizationSchema.qrStyleTemplate,
      })
      .from(organizationSchema)
      .where(eq(organizationSchema.id, orgId))
      .limit(1),
  ]);
  const organization = organizationRows.at(0);
  const qrMode = organization?.qrMode ?? 'per_table';
  const showGeneralQr = qrMode === 'general_menu' || qrMode === 'both';
  const showPerTableQr = qrMode === 'per_table' || qrMode === 'both';
  const generalMenuUrl = `/${props.params.locale}/r/${orgId}/menu`;

  return (
    <>
      <TitleBar
        title={t('title_bar')}
        description={t('title_bar_description')}
      />

      {props.searchParams?.tableStatus === 'delete_blocked' && (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-950">
          {t('delete_blocked_message')}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_1fr]">
        <DashboardSection
          title={t('create_section_title')}
          description={t('create_section_description')}
        >
          <form action={createRestaurantTableAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tableNumber">{t('table_number_label')}</Label>
              <Input
                id="tableNumber"
                name="tableNumber"
                type="number"
                min={1}
                step={1}
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
          <div className="grid gap-5">
            {showGeneralQr && (
              <div className="mx-auto box-border grid w-full max-w-lg gap-6 rounded-md border bg-background p-4 sm:p-5">
                <div className="flex w-full justify-center">
                  <TableQrCode
                    backgroundColor={organization?.qrBackgroundColor ?? '#ffffff'}
                    foregroundColor={organization?.qrForegroundColor ?? '#111827'}
                    frameColor={organization?.qrFrameColor ?? '#111827'}
                    labelText={organization?.qrLabelText ?? 'Scan menu'}
                    logoUrl={organization?.restaurantLogoUrl ?? null}
                    publicMenuUrl={generalMenuUrl}
                    restaurantName={
                      organization?.restaurantDisplayName ?? 'Restaurant'
                    }
                    showRestaurantName={
                      organization?.qrShowRestaurantName ?? true
                    }
                    showTableNumber={false}
                    styleTemplate={organization?.qrStyleTemplate ?? 'classic'}
                    tableNumber={null}
                    downloadLabel={t('download_qr_code_button')}
                    downloadFileName="general-menu-qr.png"
                    qrCodeTitle={t('general_qr_code_title')}
                  />
                </div>
                <div className="space-y-2">
                  <h3 className="text-base font-semibold">
                    {t('general_qr_section_title')}
                  </h3>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {t('general_qr_section_description')}
                  </p>
                </div>
                <div className="grid gap-2">
                  <Input
                    value={generalMenuUrl}
                    readOnly
                    aria-label={t('public_menu_url_label')}
                    className="w-full truncate font-mono text-xs"
                  />
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link href={generalMenuUrl}>
                      {t('open_public_menu_link')}
                    </Link>
                  </Button>
                </div>
              </div>
            )}

            {tables.length > 0
              ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('table_number_header')}</TableHead>
                          <TableHead>{t('qr_code_header')}</TableHead>
                          <TableHead>{t('qr_preview_header')}</TableHead>
                          <TableHead>{t('public_menu_url_header')}</TableHead>
                          <TableHead className="w-24 text-right">
                            {t('actions_header')}
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tables.map((table) => {
                          const publicMenuUrl = `/${props.params.locale}/r/${orgId}/table/${table.id}`;

                          return (
                            <TableRow key={table.id}>
                              <TableCell className="font-medium">
                                <div>{table.tableNumber}</div>
                                <details className="mt-2 rounded-md border p-2">
                                  <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
                                    {t('edit_table_summary')}
                                  </summary>
                                  <form
                                    action={updateRestaurantTableAction}
                                    className="mt-2 grid gap-2"
                                  >
                                    <input
                                      type="hidden"
                                      name="tableId"
                                      value={table.id}
                                    />
                                    <Label htmlFor={`table-number-${table.id}`}>
                                      {t('table_number_label')}
                                    </Label>
                                    <Input
                                      id={`table-number-${table.id}`}
                                      name="tableNumber"
                                      type="number"
                                      min={1}
                                      step={1}
                                      defaultValue={table.tableNumber}
                                      required
                                    />
                                    <FormSubmitButton
                                      pendingLabel={t('edit_pending_button')}
                                      size="sm"
                                    >
                                      {t('edit_button')}
                                    </FormSubmitButton>
                                  </form>
                                </details>
                              </TableCell>
                              <TableCell>
                                <code className="break-all rounded bg-muted px-2 py-1 text-xs">
                                  {table.qrCode ?? t('empty_qr_code')}
                                </code>
                              </TableCell>
                              <TableCell>
                                <TableQrCode
                                  backgroundColor={
                                    organization?.qrBackgroundColor ?? '#ffffff'
                                  }
                                  foregroundColor={
                                    organization?.qrForegroundColor ?? '#111827'
                                  }
                                  frameColor={organization?.qrFrameColor ?? '#111827'}
                                  labelText={organization?.qrLabelText ?? 'Scan to order'}
                                  logoUrl={organization?.restaurantLogoUrl ?? null}
                                  publicMenuUrl={publicMenuUrl}
                                  restaurantName={
                                    organization?.restaurantDisplayName ?? 'Restaurant'
                                  }
                                  showRestaurantName={
                                    organization?.qrShowRestaurantName ?? true
                                  }
                                  showTableNumber={
                                    organization?.qrShowTableNumber ?? true
                                  }
                                  styleTemplate={
                                    organization?.qrStyleTemplate ?? 'classic'
                                  }
                                  tableNumber={table.tableNumber}
                                  downloadLabel={t('download_qr_code_button')}
                                  downloadFileName={`table-${table.tableNumber}-menu-qr.png`}
                                  qrCodeTitle={t('qr_code_title', {
                                    tableNumber: table.tableNumber,
                                  })}
                                />
                              </TableCell>
                              <TableCell>
                                <div className="grid min-w-0 gap-2 sm:min-w-64">
                                  <Input
                                    value={publicMenuUrl}
                                    readOnly
                                    aria-label={t('public_menu_url_label')}
                                    className="min-w-0 truncate font-mono text-xs"
                                  />
                                  <Button asChild variant="outline" size="sm">
                                    <Link href={publicMenuUrl}>
                                      {t('open_public_menu_link')}
                                    </Link>
                                  </Button>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <form action={deleteRestaurantTableAction}>
                                  <input
                                    type="hidden"
                                    name="tableId"
                                    value={table.id}
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
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )
              : (
                  <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
                    {showPerTableQr ? t('empty_state') : t('general_menu_no_tables')}
                  </div>
                )}
          </div>
        </DashboardSection>
      </div>

      <details className="rounded-md border bg-background p-5">
        <summary className="cursor-pointer font-semibold">
          {t('advanced_section_title')}
        </summary>
        <p className="mt-2 text-sm text-muted-foreground">
          {t('advanced_section_description')}
        </p>
        <form action={updateRestaurantQrSettingsAction} className="mt-5 grid gap-5">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-1 text-xs font-medium text-muted-foreground">
              {t('restaurant_profile_label')}
              <select
                name="restaurantProfile"
                defaultValue={organization?.restaurantProfile ?? 'table_service'}
                className={selectClassName}
              >
                {RESTAURANT_PROFILES.map(profile => (
                  <option key={profile} value={profile}>
                    {formatSettingLabel(profile)}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-xs font-medium text-muted-foreground">
              {t('ordering_mode_label')}
              <select
                name="orderingMode"
                defaultValue={organization?.orderingMode ?? 'table_ordering'}
                className={selectClassName}
              >
                {ORDERING_MODES.map(mode => (
                  <option key={mode} value={mode}>
                    {formatSettingLabel(mode)}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-xs font-medium text-muted-foreground">
              {t('qr_mode_label')}
              <select
                name="qrMode"
                defaultValue={organization?.qrMode ?? 'per_table'}
                className={selectClassName}
              >
                {QR_MODES.map(mode => (
                  <option key={mode} value={mode}>
                    {formatSettingLabel(mode)}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-xs font-medium text-muted-foreground">
              {t('public_menu_accent_color_label')}
              <input
                name="restaurantAccentColor"
                type="color"
                defaultValue={organization?.restaurantAccentColor ?? '#111827'}
                className="h-9 w-full rounded-md border border-input bg-background p-1"
              />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <SwitchField
              id="enable-table-numbers"
              name="enableTableNumbers"
              label={t('enable_table_numbers_label')}
              description={t('enable_table_numbers_help')}
              defaultChecked={organization?.enableTableNumbers ?? true}
            />
            <SwitchField
              id="enable-named-tables"
              name="enableNamedTables"
              label={t('enable_named_tables_label')}
              description={t('enable_named_tables_help')}
              defaultChecked={organization?.enableNamedTables ?? false}
            />
            <SwitchField
              id="enable-customer-name"
              name="enableCustomerName"
              label={t('enable_customer_name_label')}
              description={t('enable_customer_name_help')}
              defaultChecked={organization?.enableCustomerName ?? true}
            />
            <SwitchField
              id="enable-whatsapp-contact"
              name="enableWhatsappContact"
              label={t('enable_whatsapp_contact_label')}
              description={t('enable_whatsapp_contact_help')}
              defaultChecked={organization?.enableWhatsappContact ?? true}
            />
            <SwitchField
              id="show-menu-item-images"
              name="showMenuItemImages"
              label={t('show_menu_item_images_label')}
              description={t('show_menu_item_images_help')}
              defaultChecked={organization?.showMenuItemImages ?? true}
            />
          </div>

          <QrCustomizationFields
            defaultBackgroundColor={organization?.qrBackgroundColor}
            defaultForegroundColor={organization?.qrForegroundColor}
            defaultFrameColor={organization?.qrFrameColor}
            defaultLabelText={organization?.qrLabelText}
            defaultLogoUrl={organization?.restaurantLogoUrl}
            defaultShowRestaurantName={organization?.qrShowRestaurantName}
            defaultShowTableNumber={organization?.qrShowTableNumber}
            defaultStyleTemplate={organization?.qrStyleTemplate}
            organizationId={orgId}
            restaurantName={organization?.restaurantDisplayName ?? 'Restaurant'}
          />

          <TemplateStylePicker
            defaultValue={organization?.restaurantTemplateStyle}
            localCurrencyLabel={organization?.localCurrencyLabel ?? 'LL'}
            organizationId={orgId}
            restaurantName={organization?.restaurantDisplayName ?? 'Restaurant'}
          />

          <FormSubmitButton pendingLabel={t('advanced_save_pending')} size="sm">
            {t('advanced_save_button')}
          </FormSubmitButton>
        </form>
      </details>
    </>
  );
};

export default RestaurantTablesPage;

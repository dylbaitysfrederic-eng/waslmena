import { auth } from '@clerk/nextjs/server';
import { asc, eq } from 'drizzle-orm';
import { unstable_noStore as noStore } from 'next/cache';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import { ConfirmSubmitButton } from '@/components/ConfirmSubmitButton';
import { FormSubmitButton } from '@/components/FormSubmitButton';
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

const RestaurantTablesPage = async (props: { params: { locale: string } }) => {
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

      <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_1fr]">
        {showPerTableQr && (
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
        )}

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

            {showPerTableQr && tables.length > 0
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
                                {table.tableNumber}
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
              : showPerTableQr
                ? (
                    <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
                      {t('empty_state')}
                    </div>
                  )
                : (
                    <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
                      {t('general_menu_no_tables')}
                    </div>
                  )}
          </div>
        </DashboardSection>
      </div>
    </>
  );
};

export default RestaurantTablesPage;

import { asc, eq } from 'drizzle-orm';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ConfirmSubmitButton } from '@/components/ConfirmSubmitButton';
import { FormSubmitButton } from '@/components/FormSubmitButton';
import { AdvancedSettingsBlock } from '@/components/layout/AdvancedSettingsBlock';
import { ManagementSection } from '@/components/layout/ManagementSection';
import { SettingsSection } from '@/components/layout/SettingsSection';
import { QRCodeCard } from '@/components/QRCodeCard';
import { SecondaryActionButton } from '@/components/SecondaryActionButton';
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
import { restaurantTableSchema } from '@/models/Schema';

import {
  formatAdminLabel,
  getAdminOrganizations,
  ORDERING_MODES,
  QR_MODES,
  RESTAURANT_PROFILES,
} from '../../_helpers';
import {
  createAdminRestaurantTableAction,
  deleteAdminRestaurantTableAction,
  updateAdminRestaurantTableAction,
  updateAdminTemplatesAction,
} from '../../actions';
import { QrCustomizationFields } from '../QrCustomizationFields';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const profileDescriptions: Record<(typeof RESTAURANT_PROFILES)[number], string> = {
  fast_food: 'Fast ordering flow for quick-service restaurants.',
  cafe: 'Lightweight setup for cafes, drinks, pastries, and casual service.',
  casual_dining: 'Balanced setup for restaurants with menu browsing and table service.',
  table_service: 'Full table-service profile with table-based ordering.',
  shisha_lounge: 'Setup for lounges with table service and longer customer sessions.',
};

const orderingModeDescriptions: Record<(typeof ORDERING_MODES)[number], string> = {
  table_ordering: 'Guests order from a table-specific QR code.',
  counter_pickup: 'Guests browse and order for pickup at the counter.',
  both: 'Supports both table ordering and counter pickup flows.',
};

const qrModeDescriptions: Record<(typeof QR_MODES)[number], string> = {
  per_table: 'Use one QR code per table. Existing table URLs stay unchanged.',
  general_menu: 'Use a general menu QR for browsing or counter pickup. Existing table URLs stay unchanged.',
  both: 'Keep per-table QR codes and also allow a general menu QR mode.',
};

const AdminTemplatesDetailPage = async (props: {
  params: { id: string };
  searchParams?: { tableStatus?: string };
}) => {
  const { ids, organizationRecords } = await getAdminOrganizations();

  if (!ids.includes(props.params.id)) {
    notFound();
  }

  const organizationId = props.params.id;
  const organization = organizationRecords.get(organizationId);
  const tables = await db
    .select({
      id: restaurantTableSchema.id,
      tableNumber: restaurantTableSchema.tableNumber,
      qrCode: restaurantTableSchema.qrCode,
    })
    .from(restaurantTableSchema)
    .where(eq(restaurantTableSchema.organizationId, organizationId))
    .orderBy(asc(restaurantTableSchema.tableNumber));

  return (
    <section className="grid gap-6">
      <div className="rounded-md bg-background p-5">
        <Link
          href="/admin/templates"
          className="text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          Back to QR & Tables
        </Link>
        <h2 className="mt-4 text-xl font-semibold">
          {organization?.restaurantDisplayName || 'Unnamed restaurant'}
        </h2>
        <code className="mt-1 block text-xs text-muted-foreground">
          {organizationId}
        </code>
      </div>

      <form
        action={updateAdminTemplatesAction}
        className="order-3"
      >
        <input type="hidden" name="organizationId" value={organizationId} />

        <AdvancedSettingsBlock
          title="Advanced QR & ordering settings"
          description="Adjust QR flows, ordering mode, and table options."
        >
          <div className="grid gap-4">
            <SettingsSection
              title="Restaurant setup"
              description="Choose the restaurant profile and order flow defaults."
            >
              <div className="grid gap-3 md:grid-cols-2">
                <label
                  htmlFor={`restaurant-profile-${organizationId}`}
                  className="grid gap-1 text-xs font-medium text-muted-foreground"
                >
                  Restaurant profile
                  <select
                    id={`restaurant-profile-${organizationId}`}
                    name="restaurantProfile"
                    defaultValue={organization?.restaurantProfile ?? 'table_service'}
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
                  >
                    {RESTAURANT_PROFILES.map(profile => (
                      <option key={profile} value={profile}>
                        {formatAdminLabel(profile)}
                      </option>
                    ))}
                  </select>
                </label>

                <label
                  htmlFor={`ordering-mode-${organizationId}`}
                  className="grid gap-1 text-xs font-medium text-muted-foreground"
                >
                  Ordering mode
                  <select
                    id={`ordering-mode-${organizationId}`}
                    name="orderingMode"
                    defaultValue={organization?.orderingMode ?? 'table_ordering'}
                    className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
                  >
                    {ORDERING_MODES.map(mode => (
                      <option key={mode} value={mode}>
                        {formatAdminLabel(mode)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="mt-4 grid gap-3 text-xs text-muted-foreground md:grid-cols-2">
                <div className="rounded-md border bg-muted/40 p-3">
                  <div className="font-semibold text-foreground">Restaurant profiles</div>
                  <ul className="mt-2 grid gap-1">
                    {RESTAURANT_PROFILES.map(profile => (
                      <li key={profile}>
                        <span className="font-medium text-foreground">
                          {formatAdminLabel(profile)}
                        </span>
                        {': '}
                        {profileDescriptions[profile]}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-md border bg-muted/40 p-3">
                  <div className="font-semibold text-foreground">Ordering modes</div>
                  <ul className="mt-2 grid gap-1">
                    {ORDERING_MODES.map(mode => (
                      <li key={mode}>
                        <span className="font-medium text-foreground">
                          {formatAdminLabel(mode)}
                        </span>
                        {': '}
                        {orderingModeDescriptions[mode]}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </SettingsSection>

            <SettingsSection
              title="QR behavior"
              description="Control which QR flows are available and how QR codes look."
            >
              <label
                htmlFor={`qr-mode-${organizationId}`}
                className="grid gap-1 text-xs font-medium text-muted-foreground md:max-w-sm"
              >
                QR mode
                <select
                  id={`qr-mode-${organizationId}`}
                  name="qrMode"
                  defaultValue={organization?.qrMode ?? 'per_table'}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
                >
                  {QR_MODES.map(mode => (
                    <option key={mode} value={mode}>
                      {formatAdminLabel(mode)}
                    </option>
                  ))}
                </select>
              </label>

              <div className="mt-4 rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
                <div className="font-semibold text-foreground">QR modes</div>
                <ul className="mt-2 grid gap-1">
                  {QR_MODES.map(mode => (
                    <li key={mode}>
                      <span className="font-medium text-foreground">
                        {formatAdminLabel(mode)}
                      </span>
                      {': '}
                      {qrModeDescriptions[mode]}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-4">
                <QrCustomizationFields
                  defaultBackgroundColor={organization?.qrBackgroundColor}
                  defaultForegroundColor={organization?.qrForegroundColor}
                  defaultFrameColor={organization?.qrFrameColor}
                  defaultLabelText={organization?.qrLabelText}
                  defaultLogoUrl={organization?.restaurantLogoUrl}
                  defaultShowRestaurantName={organization?.qrShowRestaurantName}
                  defaultShowTableNumber={organization?.qrShowTableNumber}
                  defaultStyleTemplate={organization?.qrStyleTemplate}
                  organizationId={organizationId}
                  restaurantName={
                    organization?.restaurantDisplayName || 'Unnamed restaurant'
                  }
                />
              </div>
            </SettingsSection>

            <SettingsSection
              title="Table options"
              description="Configure table labels and customer contact options."
            >
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <SwitchField
                  id={`enable-table-numbers-${organizationId}`}
                  name="enableTableNumbers"
                  label="Table numbers"
                  description="Use numeric labels for tables."
                  defaultChecked={organization?.enableTableNumbers ?? true}
                />
                <SwitchField
                  id={`enable-named-tables-${organizationId}`}
                  name="enableNamedTables"
                  label="Named tables"
                  description="Allow named table zones later."
                  defaultChecked={organization?.enableNamedTables ?? false}
                />
                <SwitchField
                  id={`enable-customer-name-${organizationId}`}
                  name="enableCustomerName"
                  label="Customer name"
                  description="Ask guests for a name on orders."
                  defaultChecked={organization?.enableCustomerName ?? true}
                />
                <SwitchField
                  id={`enable-whatsapp-contact-${organizationId}`}
                  name="enableWhatsappContact"
                  label="WhatsApp contact"
                  description="Show the contact action on public menus."
                  defaultChecked={organization?.enableWhatsappContact ?? true}
                />
              </div>
            </SettingsSection>
          </div>
        </AdvancedSettingsBlock>

        <FormSubmitButton
          pendingLabel="Saving..."
          size="sm"
          className="mt-4 justify-self-end"
        >
          Save settings
        </FormSubmitButton>
      </form>

      <ManagementSection
        title="Tables"
        description="Create, edit, and delete table QR records for this client."
        className="order-2"
      >
        {props.searchParams?.tableStatus === 'delete_blocked' && (
          <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-950">
            This table has existing orders and cannot be deleted.
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_1fr]">
          <form action={createAdminRestaurantTableAction} className="grid gap-3">
            <input type="hidden" name="organizationId" value={organizationId} />
            <div className="space-y-2">
              <Label htmlFor={`admin-table-number-create-${organizationId}`}>
                Table number
              </Label>
              <Input
                id={`admin-table-number-create-${organizationId}`}
                name="tableNumber"
                type="number"
                min={1}
                step={1}
                required
              />
            </div>
            <FormSubmitButton
              pendingLabel="Creating..."
              size="sm"
              className="w-auto max-w-max self-start px-3"
            >
              Create table
            </FormSubmitButton>
          </form>

          {tables.length > 0
            ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Table</TableHead>
                        <TableHead>QR code</TableHead>
                        <TableHead>Public menu URL</TableHead>
                        <TableHead className="w-40 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tables.map((table) => {
                        const publicMenuUrl = `/en/r/${organizationId}/table/${table.id}`;

                        return (
                          <TableRow key={table.id}>
                            <TableCell className="font-medium">
                              <div>{table.tableNumber}</div>
                              <details className="mt-2 rounded-md border p-2">
                                <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
                                  Edit
                                </summary>
                                <form
                                  action={updateAdminRestaurantTableAction}
                                  className="mt-2 grid gap-2"
                                >
                                  <input
                                    type="hidden"
                                    name="organizationId"
                                    value={organizationId}
                                  />
                                  <input
                                    type="hidden"
                                    name="tableId"
                                    value={table.id}
                                  />
                                  <Label htmlFor={`admin-table-number-${table.id}`}>
                                    Table number
                                  </Label>
                                  <Input
                                    id={`admin-table-number-${table.id}`}
                                    name="tableNumber"
                                    type="number"
                                    min={1}
                                    step={1}
                                    defaultValue={table.tableNumber}
                                    required
                                  />
                                  <FormSubmitButton pendingLabel="Saving..." size="sm">
                                    Save table
                                  </FormSubmitButton>
                                </form>
                              </details>
                            </TableCell>
                            <TableCell>
                              <QRCodeCard
                                backgroundColor={organization?.qrBackgroundColor ?? '#ffffff'}
                                foregroundColor={organization?.qrForegroundColor ?? '#111827'}
                                frameColor={organization?.qrFrameColor ?? '#111827'}
                                labelText={organization?.qrLabelText ?? 'Scan to order'}
                                logoUrl={organization?.restaurantLogoUrl ?? null}
                                publicMenuUrl={publicMenuUrl}
                                restaurantName={
                                  organization?.restaurantDisplayName
                                  || 'Unnamed restaurant'
                                }
                                showRestaurantName={
                                  organization?.qrShowRestaurantName ?? true
                                }
                                showTableNumber={
                                  organization?.qrShowTableNumber ?? true
                                }
                                styleTemplate={organization?.qrStyleTemplate ?? 'classic'}
                                tableNumber={table.tableNumber}
                                downloadLabel="Download"
                                downloadFileName={`table-${table.tableNumber}-menu-qr.png`}
                                qrCodeTitle={`Public menu QR code for table ${table.tableNumber}`}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="grid min-w-0 gap-2 sm:min-w-64">
                                <Input
                                  value={publicMenuUrl}
                                  readOnly
                                  aria-label="Public menu URL"
                                  className="h-9 min-w-0 truncate font-mono text-xs"
                                />
                                <SecondaryActionButton
                                  asChild
                                >
                                  <Link href={publicMenuUrl}>
                                    Open public menu
                                  </Link>
                                </SecondaryActionButton>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <form action={deleteAdminRestaurantTableAction}>
                                <input
                                  type="hidden"
                                  name="organizationId"
                                  value={organizationId}
                                />
                                <input
                                  type="hidden"
                                  name="tableId"
                                  value={table.id}
                                />
                                <ConfirmSubmitButton
                                  confirmMessage="Delete this table? Existing orders block deletion."
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
                  No tables yet.
                </div>
              )}
        </div>
      </ManagementSection>
    </section>
  );
};

export default AdminTemplatesDetailPage;

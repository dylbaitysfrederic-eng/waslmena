import Link from 'next/link';
import { notFound } from 'next/navigation';

import { FormSubmitButton } from '@/components/FormSubmitButton';
import { SwitchField } from '@/components/SwitchField';

import {
  formatAdminLabel,
  getAdminOrganizations,
  ORDERING_MODES,
  QR_MODES,
  RESTAURANT_PROFILES,
} from '../../_helpers';
import { updateAdminTemplatesAction } from '../../actions';
import { QrCustomizationFields } from '../QrCustomizationFields';
import { TemplateStylePicker } from '../TemplateStylePicker';

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

const SettingsSection = (props: {
  children: React.ReactNode;
  description: string;
  title: string;
}) => (
  <section className="rounded-md border bg-background p-4">
    <div className="mb-4">
      <h4 className="font-semibold">{props.title}</h4>
      <p className="mt-1 text-sm text-muted-foreground">
        {props.description}
      </p>
    </div>
    {props.children}
  </section>
);

const AdminTemplatesDetailPage = async (props: {
  params: { id: string };
}) => {
  const { ids, organizationRecords } = await getAdminOrganizations();

  if (!ids.includes(props.params.id)) {
    notFound();
  }

  const organizationId = props.params.id;
  const organization = organizationRecords.get(organizationId);

  return (
    <section className="grid gap-4">
      <div className="rounded-md bg-background p-5">
        <Link
          href="/admin/templates"
          className="text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          Back to templates
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
        className="rounded-md bg-background p-5"
      >
        <input type="hidden" name="organizationId" value={organizationId} />
        <div className="mb-4">
          <h3 className="font-semibold">QR & table settings</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure each restaurant’s menu profile, QR behavior, table flow, and visual setup defaults.
            These settings can be changed later and do not affect existing configurations.
          </p>
        </div>

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
            title="Menu appearance"
            description="Choose the visual setup defaults for the customer menu."
          >
            <TemplateStylePicker
              defaultValue={organization?.restaurantTemplateStyle}
              localCurrencyLabel={organization?.localCurrencyLabel ?? 'LL'}
              organizationId={organizationId}
              restaurantName={
                organization?.restaurantDisplayName || 'Unnamed restaurant'
              }
            />
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

        <FormSubmitButton
          pendingLabel="Saving..."
          size="sm"
          className="mt-4 justify-self-end"
        >
          Save template
        </FormSubmitButton>
      </form>
    </section>
  );
};

export default AdminTemplatesDetailPage;

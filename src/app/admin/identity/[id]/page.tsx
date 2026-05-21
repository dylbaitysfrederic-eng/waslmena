import Link from 'next/link';
import { notFound } from 'next/navigation';

import { FormSubmitButton } from '@/components/FormSubmitButton';
import { SettingsSection } from '@/components/layout/SettingsSection';
import { SwitchField } from '@/components/SwitchField';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RESTAURANT_THEME_MODES } from '@/utils/RestaurantTheme';

import {
  formatAdminLabel,
  getAdminOrganizations,
} from '../../_helpers';
import { updateAdminIdentityAction } from '../../actions';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const AdminIdentityDetailPage = async (props: {
  params: { id: string };
  searchParams?: { error?: string; saved?: string };
}) => {
  const { ids, organizationRecords } = await getAdminOrganizations();

  if (!ids.includes(props.params.id)) {
    notFound();
  }

  const organizationId = props.params.id;
  const organization = organizationRecords.get(organizationId);
  const restaurantName = organization?.restaurantDisplayName || 'Unnamed restaurant';
  const welcomeImageUrl = organization?.welcomeImageUrl;

  return (
    <section className="grid gap-6">
      <div className="rounded-md bg-background p-5">
        <Link
          href="/admin/identity"
          className="text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          Back to Identity & Branding
        </Link>
        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-xl font-semibold">{restaurantName}</h2>
            <code className="mt-1 block text-xs text-muted-foreground">
              {organizationId}
            </code>
          </div>
          <span className="w-fit rounded-full border bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
            {formatAdminLabel(organization?.clientCategory ?? 'lead')}
          </span>
        </div>
      </div>

      {props.searchParams?.saved === '1' && (
        <div className="rounded-md border border-green-300 bg-green-50 px-4 py-3 text-sm font-medium text-green-950">
          Identity settings saved.
        </div>
      )}

      {props.searchParams?.error && (
        <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-950">
          {props.searchParams.error === 'invalid_welcome_image'
            ? 'The welcome image could not be optimized. Use a JPG or WEBP image under the upload limit.'
            : 'Some identity fields need attention before saving.'}
        </div>
      )}

      <form
        action={updateAdminIdentityAction}
        className="grid gap-4"
      >
        <input type="hidden" name="organizationId" value={organizationId} />

        <SettingsSection
          title="Restaurant identity"
          description="Public restaurant name, address, and logo shown across the guest experience."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="restaurantDisplayName">Restaurant name</Label>
              <Input
                id="restaurantDisplayName"
                name="restaurantDisplayName"
                defaultValue={organization?.restaurantDisplayName ?? ''}
                placeholder="Restaurant name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="restaurantLogoUrl">Logo URL</Label>
              <Input
                id="restaurantLogoUrl"
                name="restaurantLogoUrl"
                type="url"
                defaultValue={organization?.restaurantLogoUrl ?? ''}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="restaurantAddress">Address</Label>
              <Input
                id="restaurantAddress"
                name="restaurantAddress"
                defaultValue={organization?.restaurantAddress ?? ''}
                maxLength={240}
                placeholder="Street, area, city"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="restaurantOpeningHours">Opening hours</Label>
              <Input
                id="restaurantOpeningHours"
                name="restaurantOpeningHours"
                defaultValue={organization?.restaurantOpeningHours ?? ''}
                maxLength={160}
                placeholder="Mon-Sun 12:00-23:00"
              />
            </div>
          </div>
        </SettingsSection>

        <SettingsSection
          title="Contact details"
          description="Restaurant contact and local currency details used by guest-facing pages."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="restaurantWhatsappNumber">WhatsApp</Label>
              <Input
                id="restaurantWhatsappNumber"
                name="restaurantWhatsappNumber"
                defaultValue={organization?.restaurantWhatsappNumber ?? ''}
                placeholder="+961..."
              />
            </div>
            <SwitchField
              id="enableWhatsappContact"
              name="enableWhatsappContact"
              label="Show WhatsApp contact"
              description="Display the WhatsApp contact action where enabled."
              defaultChecked={organization?.enableWhatsappContact ?? true}
            />
            <div className="space-y-2">
              <Label htmlFor="restaurantInstagramUrl">Instagram</Label>
              <Input
                id="restaurantInstagramUrl"
                name="restaurantInstagramUrl"
                defaultValue={organization?.restaurantInstagramUrl ?? ''}
                placeholder="@restaurant or https://instagram.com/restaurant"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="restaurantGoogleMapsUrl">Google Maps URL</Label>
              <Input
                id="restaurantGoogleMapsUrl"
                name="restaurantGoogleMapsUrl"
                type="url"
                defaultValue={organization?.restaurantGoogleMapsUrl ?? ''}
                placeholder="https://maps.google.com/..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="restaurantWifiName">Wi-Fi name</Label>
              <Input
                id="restaurantWifiName"
                name="restaurantWifiName"
                defaultValue={organization?.restaurantWifiName ?? ''}
                maxLength={80}
                placeholder="Guest Wi-Fi"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="restaurantWifiPassword">Wi-Fi password</Label>
              <Input
                id="restaurantWifiPassword"
                name="restaurantWifiPassword"
                defaultValue={organization?.restaurantWifiPassword ?? ''}
                maxLength={80}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="localCurrencyCode">Currency code</Label>
              <Input
                id="localCurrencyCode"
                name="localCurrencyCode"
                defaultValue={organization?.localCurrencyCode ?? ''}
                placeholder="USD"
                maxLength={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="localCurrencyLabel">Currency label</Label>
              <Input
                id="localCurrencyLabel"
                name="localCurrencyLabel"
                defaultValue={organization?.localCurrencyLabel ?? ''}
                placeholder="$"
                maxLength={12}
              />
            </div>
          </div>
        </SettingsSection>

        <SettingsSection
          title="Welcome screen"
          description="Optional branded entry screen before the public menu. Uploaded art is treated as a background only."
        >
          <div className="grid gap-4">
            <SwitchField
              id="welcomeScreenEnabled"
              name="welcomeScreenEnabled"
              label="Enable welcome screen"
              description="When disabled or when no image exists, guests open the menu directly."
              defaultChecked={organization?.welcomeScreenEnabled ?? false}
            />

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px]">
              <div className="space-y-2">
                <Label htmlFor="welcomeImageFile">Background image</Label>
                <p className="text-sm text-muted-foreground">
                  Recommended: 1080x1920 vertical JPG or WEBP, around 1.5 MB. Wasl automatically optimizes and compresses it for mobile.
                </p>
                <input
                  id="welcomeImageFile"
                  name="welcomeImageFile"
                  type="file"
                  accept=".jpg,.jpeg,.webp"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1 file:text-sm file:font-medium file:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
                {welcomeImageUrl && (
                  <label className="flex items-start gap-2 text-sm font-medium text-foreground">
                    <input
                      type="checkbox"
                      name="removeWelcomeImage"
                      className="mt-1"
                    />
                    <span>Remove current welcome background</span>
                  </label>
                )}
              </div>

              {welcomeImageUrl && (
                <div className="rounded-md border bg-muted/30 p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={welcomeImageUrl}
                    alt=""
                    className="mx-auto h-64 w-36 rounded-md object-cover"
                  />
                  <p className="mt-2 text-center text-xs text-muted-foreground">
                    Background preview
                  </p>
                </div>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="welcomeButtonLabel">Open Menu button label</Label>
                <Input
                  id="welcomeButtonLabel"
                  name="welcomeButtonLabel"
                  defaultValue={organization?.welcomeButtonLabel ?? ''}
                  placeholder="Open Menu"
                  maxLength={32}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="welcomeButtonPosition">Button position</Label>
                <select
                  id="welcomeButtonPosition"
                  name="welcomeButtonPosition"
                  defaultValue={organization?.welcomeButtonPosition ?? 'lower_center'}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="center">Center</option>
                  <option value="lower_center">Lower center</option>
                  <option value="bottom_center">Bottom center</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="welcomeButtonColor">Welcome button color</Label>
                <Input
                  id="welcomeButtonColor"
                  name="welcomeButtonColor"
                  type="color"
                  defaultValue={
                    organization?.welcomeButtonColor
                    ?? organization?.welcomeGeneratedAccentColor
                    ?? organization?.restaurantAccentColor
                    ?? organization?.restaurantPrimaryColor
                    ?? '#111827'
                  }
                  className="h-11 w-24 p-1"
                />
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">Detected image color</div>
                <div className="flex items-center gap-2">
                  <span
                    className="size-8 rounded-md border"
                    style={{
                      backgroundColor:
                        organization?.welcomeGeneratedAccentColor ?? '#111827',
                    }}
                  />
                  <span className="text-sm text-muted-foreground">
                    {organization?.welcomeGeneratedAccentColor ?? 'Upload an image to generate a color.'}
                  </span>
                </div>
              </div>
            </div>

            <SwitchField
              id="welcomeUseImageAccentForMenu"
              name="welcomeUseImageAccentForMenu"
              label="Use welcome screen color for public menu"
              description="Use the color detected from the welcome image as the menu accent color. You can still adjust it manually later."
              defaultChecked={organization?.welcomeUseImageAccentForMenu ?? false}
            />
          </div>
        </SettingsSection>

        <SettingsSection
          title="Theme colors"
          description="Manual public menu colors remain available even when the welcome image generates smart defaults."
        >
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="restaurantPrimaryColor">Primary color</Label>
              <Input
                id="restaurantPrimaryColor"
                name="restaurantPrimaryColor"
                type="color"
                defaultValue={organization?.restaurantPrimaryColor ?? '#111827'}
                className="h-11 w-24 p-1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="restaurantAccentColor">Menu accent color</Label>
              <Input
                id="restaurantAccentColor"
                name="restaurantAccentColor"
                type="color"
                defaultValue={organization?.restaurantAccentColor ?? '#16a34a'}
                className="h-11 w-24 p-1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="restaurantThemeMode">Theme mode</Label>
              <select
                id="restaurantThemeMode"
                name="restaurantThemeMode"
                defaultValue={organization?.restaurantThemeMode ?? 'day'}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {RESTAURANT_THEME_MODES.map(mode => (
                  <option key={mode} value={mode}>
                    {formatAdminLabel(mode)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </SettingsSection>

        <FormSubmitButton
          pendingLabel="Saving..."
          size="sm"
          className="justify-self-end"
        >
          Save identity
        </FormSubmitButton>
      </form>
    </section>
  );
};

export default AdminIdentityDetailPage;

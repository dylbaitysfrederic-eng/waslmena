import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { unstable_noStore as noStore } from 'next/cache';
import { getTranslations } from 'next-intl/server';

import { FormSubmitButton } from '@/components/FormSubmitButton';
import { SwitchField } from '@/components/SwitchField';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DashboardSection } from '@/features/dashboard/DashboardSection';
import { TitleBar } from '@/features/dashboard/TitleBar';
import { db } from '@/libs/DB';
import { organizationSchema } from '@/models/Schema';
import { getI18nPath } from '@/utils/Helpers';
import {
  getRestaurantThemeMode,
  RESTAURANT_THEME_MODES,
} from '@/utils/RestaurantTheme';

import { updateRestaurantBrandingAction } from './actions';

export async function generateMetadata(props: { params: { locale: string } }) {
  const t = await getTranslations({
    locale: props.params.locale,
    namespace: 'RestaurantBranding',
  });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

const RestaurantBrandingPage = async (props: {
  params: { locale: string };
  searchParams: { error?: string; saved?: string };
}) => {
  noStore();

  const { orgId } = await auth();
  const t = await getTranslations('RestaurantBranding');

  if (!orgId) {
    return null;
  }

  const [organization] = await db
    .select({
      restaurantDisplayName: organizationSchema.restaurantDisplayName,
      restaurantAddress: organizationSchema.restaurantAddress,
      restaurantOpeningHours: organizationSchema.restaurantOpeningHours,
      restaurantInstagramUrl: organizationSchema.restaurantInstagramUrl,
      restaurantWifiName: organizationSchema.restaurantWifiName,
      restaurantWifiPassword: organizationSchema.restaurantWifiPassword,
      restaurantGoogleMapsUrl: organizationSchema.restaurantGoogleMapsUrl,
      restaurantLogoUrl: organizationSchema.restaurantLogoUrl,
      welcomeScreenEnabled: organizationSchema.welcomeScreenEnabled,
      welcomeImageAvifUrl: organizationSchema.welcomeImageAvifUrl,
      welcomeImageUrl: organizationSchema.welcomeImageUrl,
      welcomeButtonLabel: organizationSchema.welcomeButtonLabel,
      welcomeButtonColor: organizationSchema.welcomeButtonColor,
      welcomeButtonPosition: organizationSchema.welcomeButtonPosition,
      welcomeUseImageAccentForMenu: organizationSchema.welcomeUseImageAccentForMenu,
      welcomeGeneratedAccentColor: organizationSchema.welcomeGeneratedAccentColor,
      restaurantPrimaryColor: organizationSchema.restaurantPrimaryColor,
      restaurantAccentColor: organizationSchema.restaurantAccentColor,
      restaurantThemeMode: organizationSchema.restaurantThemeMode,
      restaurantWhatsappNumber: organizationSchema.restaurantWhatsappNumber,
      enableWhatsappContact: organizationSchema.enableWhatsappContact,
      orderVisualNotificationsEnabled:
        organizationSchema.orderVisualNotificationsEnabled,
      orderSoundNotificationsEnabled:
        organizationSchema.orderSoundNotificationsEnabled,
      localCurrencyCode: organizationSchema.localCurrencyCode,
      localCurrencyLabel: organizationSchema.localCurrencyLabel,
    })
    .from(organizationSchema)
    .where(eq(organizationSchema.id, orgId))
    .limit(1);

  return (
    <>
      <TitleBar
        title={t('title_bar')}
        description={t('title_bar_description')}
      />

      <DashboardSection
        title={t('section_title')}
        description={t('section_description')}
      >
        <div className="mb-4 rounded-md border bg-muted/30 p-4 text-sm leading-6 text-muted-foreground">
          <div className="font-semibold text-foreground">
            {t('branch_note_title')}
          </div>
          <p className="mt-1">
            {t('branch_note_description')}
          </p>
        </div>

        <form
          action={updateRestaurantBrandingAction}
          encType="multipart/form-data"
          className="max-w-xl space-y-4"
        >
          <input
            type="hidden"
            name="returnPath"
            value={getI18nPath('/dashboard/branding', props.params.locale)}
          />

          {props.searchParams.saved === '1' && (
            <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-950">
              {t('saved_message')}
            </div>
          )}

          {props.searchParams.error === 'invalid_branding' && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm font-medium text-destructive">
              {t('error_invalid_branding')}
            </div>
          )}

          {props.searchParams.error === 'invalid_welcome_image' && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm font-medium text-destructive">
              {t('error_invalid_welcome_image')}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="restaurantDisplayName">
              {t('display_name_label')}
            </Label>
            <Input
              id="restaurantDisplayName"
              name="restaurantDisplayName"
              defaultValue={organization?.restaurantDisplayName ?? ''}
              placeholder={t('display_name_placeholder')}
              maxLength={80}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="restaurantAddress">
              {t('address_label')}
            </Label>
            <textarea
              id="restaurantAddress"
              name="restaurantAddress"
              defaultValue={organization?.restaurantAddress ?? ''}
              placeholder={t('address_placeholder')}
              maxLength={240}
              rows={3}
              className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <p className="text-sm text-muted-foreground">
              {t('address_help')}
            </p>
          </div>

          <div className="grid gap-4 rounded-md border bg-muted/30 p-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <div className="font-semibold">
                {t('public_details_title')}
              </div>
              <p className="text-sm text-muted-foreground">
                {t('public_details_description')}
              </p>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="restaurantOpeningHours">
                {t('opening_hours_label')}
              </Label>
              <Input
                id="restaurantOpeningHours"
                name="restaurantOpeningHours"
                defaultValue={organization?.restaurantOpeningHours ?? ''}
                placeholder={t('opening_hours_placeholder')}
                maxLength={160}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="restaurantInstagramUrl">
                {t('instagram_label')}
              </Label>
              <Input
                id="restaurantInstagramUrl"
                name="restaurantInstagramUrl"
                defaultValue={organization?.restaurantInstagramUrl ?? ''}
                placeholder={t('instagram_placeholder')}
                maxLength={120}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="restaurantGoogleMapsUrl">
                {t('google_maps_label')}
              </Label>
              <Input
                id="restaurantGoogleMapsUrl"
                name="restaurantGoogleMapsUrl"
                type="url"
                defaultValue={organization?.restaurantGoogleMapsUrl ?? ''}
                placeholder={t('google_maps_placeholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="restaurantWifiName">
                {t('wifi_name_label')}
              </Label>
              <Input
                id="restaurantWifiName"
                name="restaurantWifiName"
                defaultValue={organization?.restaurantWifiName ?? ''}
                placeholder={t('wifi_name_placeholder')}
                maxLength={80}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="restaurantWifiPassword">
                {t('wifi_password_label')}
              </Label>
              <Input
                id="restaurantWifiPassword"
                name="restaurantWifiPassword"
                defaultValue={organization?.restaurantWifiPassword ?? ''}
                placeholder={t('wifi_password_placeholder')}
                maxLength={80}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="restaurantLogoUrl">
              {t('logo_url_label')}
            </Label>
            <Input
              id="restaurantLogoUrl"
              name="restaurantLogoUrl"
              type="url"
              defaultValue={organization?.restaurantLogoUrl ?? ''}
              placeholder={t('logo_url_placeholder')}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="restaurantPrimaryColor">
                {t('primary_color_label')}
              </Label>
              <Input
                id="restaurantPrimaryColor"
                name="restaurantPrimaryColor"
                type="color"
                defaultValue={organization?.restaurantPrimaryColor ?? '#111827'}
                className="h-11 w-24 p-1"
              />
              <p className="text-sm text-muted-foreground">
                {t('primary_color_help')}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="restaurantAccentColor">
                {t('accent_color_label')}
              </Label>
              <Input
                id="restaurantAccentColor"
                name="restaurantAccentColor"
                type="color"
                defaultValue={
                  organization?.restaurantAccentColor
                  ?? organization?.restaurantPrimaryColor
                  ?? '#111827'
                }
                className="h-11 w-24 p-1"
              />
              <p className="text-sm text-muted-foreground">
                {t('accent_color_help')}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="restaurantThemeMode">
              {t('theme_mode_label')}
            </Label>
            <select
              id="restaurantThemeMode"
              name="restaurantThemeMode"
              defaultValue={getRestaurantThemeMode(
                organization?.restaurantThemeMode,
              )}
              className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {RESTAURANT_THEME_MODES.map(mode => (
                <option key={mode} value={mode}>
                  {t(`theme_mode_${mode}`)}
                </option>
              ))}
            </select>
            <p className="text-sm text-muted-foreground">
              {t('theme_mode_help')}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="restaurantWhatsappNumber">
              {t('whatsapp_number_label')}
            </Label>
            <Input
              id="restaurantWhatsappNumber"
              name="restaurantWhatsappNumber"
              defaultValue={organization?.restaurantWhatsappNumber ?? ''}
              placeholder={t('whatsapp_number_placeholder')}
              inputMode="tel"
              maxLength={24}
            />
            <p className="text-sm text-muted-foreground">
              {t('whatsapp_number_help')}
            </p>
          </div>

          <SwitchField
            id="enableWhatsappContact"
            name="enableWhatsappContact"
            label={t('whatsapp_enabled_label')}
            description={t('whatsapp_enabled_help')}
            defaultChecked={organization?.enableWhatsappContact ?? true}
          />

          <div className="rounded-md border bg-muted/30 p-4">
            <div className="font-semibold">
              {t('welcome_screen_title')}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('welcome_screen_description')}
            </p>
            <div className="mt-4 grid gap-4">
              <SwitchField
                id="welcomeScreenEnabled"
                name="welcomeScreenEnabled"
                label={t('welcome_enabled_label')}
                description={t('welcome_enabled_help')}
                defaultChecked={organization?.welcomeScreenEnabled ?? false}
              />

              <div className="space-y-2">
                <Label htmlFor="welcomeImageFile">
                  {t('welcome_image_label')}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t('welcome_image_help')}
                </p>
                <input
                  id="welcomeImageFile"
                  name="welcomeImageFile"
                  type="file"
                  accept=".jpg,.jpeg,.webp"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1 file:text-sm file:font-medium file:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
                <p className="text-xs text-muted-foreground">
                  {t('welcome_image_upload_note')}
                </p>
              </div>

              {organization?.welcomeImageUrl && (
                <div className="grid gap-3 rounded-md border bg-background p-3 sm:grid-cols-[96px_1fr]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={organization.welcomeImageUrl}
                    alt=""
                    className="h-40 w-24 rounded-md object-cover"
                  />
                  <div className="text-sm text-muted-foreground">
                    <div className="font-medium text-foreground">
                      {t('welcome_preview_label')}
                    </div>
                    <p className="mt-1">
                      {t('welcome_preview_help')}
                    </p>
                    <label className="mt-3 flex items-start gap-2 text-sm font-medium text-foreground">
                      <input
                        type="checkbox"
                        name="removeWelcomeImage"
                        className="mt-1"
                      />
                      <span>{t('welcome_remove_label')}</span>
                    </label>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="welcomeButtonLabel">
                  {t('welcome_button_label')}
                </Label>
                <Input
                  id="welcomeButtonLabel"
                  name="welcomeButtonLabel"
                  defaultValue={organization?.welcomeButtonLabel ?? ''}
                  placeholder="Open Menu"
                  maxLength={32}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="welcomeButtonPosition">
                  {t('welcome_button_position_label')}
                </Label>
                <select
                  id="welcomeButtonPosition"
                  name="welcomeButtonPosition"
                  defaultValue={organization?.welcomeButtonPosition ?? 'lower_center'}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="center">{t('welcome_button_position_center')}</option>
                  <option value="lower_center">{t('welcome_button_position_lower_center')}</option>
                  <option value="bottom_center">{t('welcome_button_position_bottom_center')}</option>
                </select>
                <p className="text-sm text-muted-foreground">
                  {t('welcome_button_position_help')}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="welcomeButtonColor">
                    {t('welcome_button_color_label')}
                  </Label>
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
                  <p className="text-sm text-muted-foreground">
                    {t('welcome_button_color_help')}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">
                    {t('welcome_generated_color_label')}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="size-8 rounded-md border"
                      style={{
                        backgroundColor:
                          organization?.welcomeGeneratedAccentColor ?? '#111827',
                      }}
                    />
                    <span className="text-sm text-muted-foreground">
                      {organization?.welcomeGeneratedAccentColor
                      ?? t('welcome_generated_color_empty')}
                    </span>
                  </div>
                </div>
              </div>

              <SwitchField
                id="welcomeUseImageAccentForMenu"
                name="welcomeUseImageAccentForMenu"
                label={t('welcome_use_accent_label')}
                description={t('welcome_use_accent_help')}
                defaultChecked={organization?.welcomeUseImageAccentForMenu ?? false}
              />
            </div>
          </div>

          <div className="rounded-md border bg-muted/30 p-4">
            <div className="font-semibold">
              {t('order_notifications_title')}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('order_notifications_description')}
            </p>
            <div className="mt-4 grid gap-3">
              <SwitchField
                id="orderVisualNotificationsEnabled"
                name="orderVisualNotificationsEnabled"
                label={t('visual_notifications_label')}
                description={t('visual_notifications_help')}
                defaultChecked={
                  organization?.orderVisualNotificationsEnabled ?? true
                }
              />
              <SwitchField
                id="orderSoundNotificationsEnabled"
                name="orderSoundNotificationsEnabled"
                label={t('sound_notifications_label')}
                description={t('sound_notifications_help')}
                defaultChecked={
                  organization?.orderSoundNotificationsEnabled ?? false
                }
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="localCurrencyCode">
                {t('local_currency_code_label')}
              </Label>
              <Input
                id="localCurrencyCode"
                name="localCurrencyCode"
                defaultValue={organization?.localCurrencyCode ?? 'LBP'}
                placeholder={t('local_currency_code_placeholder')}
                maxLength={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="localCurrencyLabel">
                {t('local_currency_label_label')}
              </Label>
              <Input
                id="localCurrencyLabel"
                name="localCurrencyLabel"
                defaultValue={organization?.localCurrencyLabel ?? 'LL'}
                placeholder={t('local_currency_label_placeholder')}
                maxLength={12}
              />
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            {t('local_currency_help')}
          </p>

          <FormSubmitButton pendingLabel={t('save_pending_button')}>
            {t('save_button')}
          </FormSubmitButton>
        </form>
      </DashboardSection>
    </>
  );
};

export default RestaurantBrandingPage;

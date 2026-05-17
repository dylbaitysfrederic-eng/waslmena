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
      restaurantLogoUrl: organizationSchema.restaurantLogoUrl,
      restaurantPrimaryColor: organizationSchema.restaurantPrimaryColor,
      restaurantWhatsappNumber: organizationSchema.restaurantWhatsappNumber,
      enableWhatsappContact: organizationSchema.enableWhatsappContact,
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
        <form action={updateRestaurantBrandingAction} className="max-w-xl space-y-4">
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

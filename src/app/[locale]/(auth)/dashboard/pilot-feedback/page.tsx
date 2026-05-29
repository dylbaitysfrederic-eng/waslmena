import { getTranslations } from 'next-intl/server';

import { FormSubmitButton } from '@/components/FormSubmitButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DashboardSection } from '@/features/dashboard/DashboardSection';
import { TitleBar } from '@/features/dashboard/TitleBar';
import {
  BETA_FEEDBACK_CATEGORIES,
  BETA_FEEDBACK_SEVERITIES,
} from '@/utils/BetaFeedback';
import { getI18nPath } from '@/utils/Helpers';

import { submitBetaFeedbackAction } from './actions';
import { DeviceInfoField } from './DeviceInfoField';

const STAFF_FEEDBACK_ITEMS = [
  'reading_orders',
  'speed_of_service',
  'status_clarity',
  'missing_information',
  'connection_issues',
  'qr_scanning_issues',
] as const;

export async function generateMetadata(props: { params: { locale: string } }) {
  const t = await getTranslations({
    locale: props.params.locale,
    namespace: 'PilotFeedback',
  });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

const PilotFeedbackPage = async (props: {
  params: { locale: string };
  searchParams?: {
    error?: string;
    submitted?: string;
  };
}) => {
  const t = await getTranslations('PilotFeedback');
  const returnPath = getI18nPath(
    '/dashboard/pilot-feedback',
    props.params.locale,
  );

  return (
    <>
      <TitleBar
        title={t('title_bar')}
        description={t('title_bar_description')}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
        <DashboardSection
          title={t('form_title')}
          description={t('form_description')}
        >
          {props.searchParams?.submitted === '1' && (
            <div className="mb-4 rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm font-medium text-emerald-950">
              {t('success_message')}
            </div>
          )}

          {props.searchParams?.error === 'missing_message' && (
            <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm font-medium text-destructive">
              {t('error_missing_message')}
            </div>
          )}

          <form action={submitBetaFeedbackAction} className="grid gap-4">
            <input type="hidden" name="returnPath" value={returnPath} />
            <DeviceInfoField />

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium">
                {t('category_label')}
                <select
                  name="category"
                  defaultValue="order_flow"
                  className="min-h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {BETA_FEEDBACK_CATEGORIES.map(category => (
                    <option key={category} value={category}>
                      {t(`category_${category}`)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm font-medium">
                {t('severity_label')}
                <select
                  name="severity"
                  defaultValue="medium"
                  className="min-h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {BETA_FEEDBACK_SEVERITIES.map(severity => (
                    <option key={severity} value={severity}>
                      {t(`severity_${severity}`)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="roleContext">{t('role_context_label')}</Label>
              <Input
                id="roleContext"
                name="roleContext"
                maxLength={120}
                placeholder={t('role_context_placeholder')}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="message">{t('message_label')}</Label>
              <textarea
                id="message"
                name="message"
                maxLength={2000}
                rows={6}
                required
                placeholder={t('message_placeholder')}
                className="min-h-36 rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              <p className="text-xs leading-5 text-muted-foreground">
                {t('sensitive_data_warning')}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="pageContext">{t('page_context_label')}</Label>
                <Input
                  id="pageContext"
                  name="pageContext"
                  maxLength={240}
                  placeholder={t('page_context_placeholder')}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="manualDeviceInfo">{t('device_info_label')}</Label>
                <Input
                  id="manualDeviceInfo"
                  name="manualDeviceInfo"
                  disabled
                  placeholder={t('device_info_placeholder')}
                />
              </div>
            </div>

            <FormSubmitButton pendingLabel={t('submit_pending')}>
              {t('submit_button')}
            </FormSubmitButton>
          </form>
        </DashboardSection>

        <DashboardSection
          title={t('staff_grid_title')}
          description={t('staff_grid_description')}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {STAFF_FEEDBACK_ITEMS.map(item => (
              <div key={item} className="rounded-md border bg-background p-4">
                <div className="text-sm font-semibold">
                  {t(`staff_${item}_title`)}
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {t(`staff_${item}_description`)}
                </p>
              </div>
            ))}
          </div>
        </DashboardSection>
      </div>
    </>
  );
};

export default PilotFeedbackPage;

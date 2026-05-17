import { getTranslations } from 'next-intl/server';

import { DashboardSection } from '@/features/dashboard/DashboardSection';
import { TitleBar } from '@/features/dashboard/TitleBar';

const CUSTOMER_SCRIPT_ITEMS = [
  'scan_qr_code',
  'open_menu',
  'add_item_to_cart',
  'enter_first_name',
  'submit_order',
  'report_confusion',
] as const;

const STAFF_FEEDBACK_ITEMS = [
  'reading_orders',
  'speed_of_service',
  'status_clarity',
  'missing_information',
  'pricing_clarity',
  'connection_issues',
  'qr_scanning_issues',
  'suggested_improvements',
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

const PilotFeedbackPage = async () => {
  const t = await getTranslations('PilotFeedback');

  return (
    <>
      <TitleBar
        title={t('title_bar')}
        description={t('title_bar_description')}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
        <DashboardSection
          title={t('customer_script_title')}
          description={t('customer_script_description')}
        >
          <ol className="space-y-3">
            {CUSTOMER_SCRIPT_ITEMS.map((item, index) => (
              <li key={item} className="flex gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-sm font-semibold">
                  {index + 1}
                </span>
                <span className="text-sm leading-7">
                  {t(`customer_${item}`)}
                </span>
              </li>
            ))}
          </ol>
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

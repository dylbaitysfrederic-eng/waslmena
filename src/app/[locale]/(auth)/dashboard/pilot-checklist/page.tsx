import { getTranslations } from 'next-intl/server';

import { DashboardSection } from '@/features/dashboard/DashboardSection';
import { TitleBar } from '@/features/dashboard/TitleBar';

const CHECKLIST_GROUPS = [
  {
    key: 'before_service',
    items: [
      'create_categories',
      'create_menu_items',
      'create_tables',
      'download_print_qr_codes',
      'test_one_phone_order',
    ],
  },
  {
    key: 'during_service',
    items: [
      'keep_orders_dashboard_open',
      'refresh_orders',
      'watch_pending_orders',
      'record_staff_feedback',
      'record_customer_confusion',
    ],
  },
  {
    key: 'after_service',
    items: [
      'review_completed_orders',
      'collect_staff_notes',
      'collect_customer_notes',
      'list_blockers_before_next_test',
    ],
  },
] as const;

export async function generateMetadata(props: { params: { locale: string } }) {
  const t = await getTranslations({
    locale: props.params.locale,
    namespace: 'PilotChecklist',
  });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

const PilotChecklistPage = async () => {
  const t = await getTranslations('PilotChecklist');

  return (
    <>
      <TitleBar
        title={t('title_bar')}
        description={t('title_bar_description')}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {CHECKLIST_GROUPS.map(group => (
          <DashboardSection
            key={group.key}
            title={t(`${group.key}_title`)}
            description={t(`${group.key}_description`)}
          >
            <ul className="space-y-3">
              {group.items.map(item => (
                <li key={item} className="flex items-start gap-3">
                  <input
                    id={`${group.key}-${item}`}
                    type="checkbox"
                    className="mt-1 size-4 rounded border-input"
                  />
                  <label
                    htmlFor={`${group.key}-${item}`}
                    className="text-sm leading-6"
                  >
                    {t(`item_${item}`)}
                  </label>
                </li>
              ))}
            </ul>
          </DashboardSection>
        ))}
      </div>
    </>
  );
};

export default PilotChecklistPage;

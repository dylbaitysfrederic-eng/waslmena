import { auth } from '@clerk/nextjs/server';
import { and, count, eq, gt, or } from 'drizzle-orm';
import { unstable_noStore as noStore } from 'next/cache';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import { DashboardSection } from '@/features/dashboard/DashboardSection';
import { TitleBar } from '@/features/dashboard/TitleBar';
import { db } from '@/libs/DB';
import {
  menuCategorySchema,
  menuItemSchema,
  orderSchema,
  organizationSchema,
  restaurantTableSchema,
} from '@/models/Schema';
import { getI18nPath } from '@/utils/Helpers';

type ChecklistItem = {
  completed: boolean;
  helper?: string;
  key: string;
};

type ChecklistSection = {
  actionHref: string;
  actionLabelKey: string;
  descriptionKey: string;
  items: ChecklistItem[];
  key: string;
  titleKey: string;
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

const getCountValue = (rows: { count: number }[]) => {
  return Number(rows.at(0)?.count ?? 0);
};

const getReadinessLabelKey = (percentage: number) => {
  if (percentage >= 80) {
    return 'readiness_pilot_ready';
  }

  if (percentage >= 55) {
    return 'readiness_almost_ready';
  }

  return 'readiness_setup_needed';
};

const ChecklistStatus = (props: { completed: boolean }) => (
  <span
    aria-hidden="true"
    className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
      props.completed
        ? 'border-emerald-300 bg-emerald-50 text-emerald-950'
        : 'border-amber-300 bg-amber-50 text-amber-950'
    }`}
  >
    {props.completed ? '✓' : '!'}
  </span>
);

const PilotChecklistPage = async (props: { params: { locale: string } }) => {
  noStore();

  const { orgId } = await auth();
  const t = await getTranslations('PilotChecklist');

  if (!orgId) {
    return null;
  }

  const [
    organizationRows,
    categoryRows,
    menuItemRows,
    unavailableItemRows,
    translatedItemRows,
    tableRows,
    orderRows,
  ] = await Promise.all([
    db
      .select({
        deliveryEnabled: organizationSchema.deliveryEnabled,
        deliveryEstimatedTime: organizationSchema.deliveryEstimatedTime,
        deliveryFeeLocal: organizationSchema.deliveryFeeLocal,
        deliveryFeeUsdCents: organizationSchema.deliveryFeeUsdCents,
        loyaltyEnabled: organizationSchema.loyaltyEnabled,
        onlinePaymentsEnabled: organizationSchema.onlinePaymentsEnabled,
        orderingMode: organizationSchema.orderingMode,
        pickupEnabled: organizationSchema.pickupEnabled,
        posIntegrationEnabled: organizationSchema.posIntegrationEnabled,
        restaurantAccentColor: organizationSchema.restaurantAccentColor,
        restaurantAddress: organizationSchema.restaurantAddress,
        restaurantDisplayName: organizationSchema.restaurantDisplayName,
        restaurantGoogleMapsUrl: organizationSchema.restaurantGoogleMapsUrl,
        restaurantInstagramUrl: organizationSchema.restaurantInstagramUrl,
        restaurantLogoUrl: organizationSchema.restaurantLogoUrl,
        restaurantOpeningHours: organizationSchema.restaurantOpeningHours,
        restaurantPrimaryColor: organizationSchema.restaurantPrimaryColor,
        restaurantWhatsappNumber: organizationSchema.restaurantWhatsappNumber,
        whatsappBusinessEnabled: organizationSchema.whatsappBusinessEnabled,
      })
      .from(organizationSchema)
      .where(eq(organizationSchema.id, orgId))
      .limit(1),
    db
      .select({ count: count() })
      .from(menuCategorySchema)
      .where(eq(menuCategorySchema.organizationId, orgId)),
    db
      .select({ count: count() })
      .from(menuItemSchema)
      .where(eq(menuItemSchema.organizationId, orgId)),
    db
      .select({ count: count() })
      .from(menuItemSchema)
      .where(and(
        eq(menuItemSchema.organizationId, orgId),
        eq(menuItemSchema.isAvailable, false),
      )),
    db
      .select({ count: count() })
      .from(menuItemSchema)
      .where(and(
        eq(menuItemSchema.organizationId, orgId),
        or(
          gt(menuItemSchema.nameEn, ''),
          gt(menuItemSchema.nameFr, ''),
          gt(menuItemSchema.nameAr, ''),
        ),
      )),
    db
      .select({ count: count() })
      .from(restaurantTableSchema)
      .where(eq(restaurantTableSchema.organizationId, orgId)),
    db
      .select({ count: count() })
      .from(orderSchema)
      .where(eq(orderSchema.organizationId, orgId)),
  ]);

  const organization = organizationRows.at(0);
  const categoryCount = getCountValue(categoryRows);
  const menuItemCount = getCountValue(menuItemRows);
  const unavailableItemCount = getCountValue(unavailableItemRows);
  const translatedItemCount = getCountValue(translatedItemRows);
  const tableCount = getCountValue(tableRows);
  const orderCount = getCountValue(orderRows);
  const publicInfoConfigured = Boolean(
    organization?.restaurantAddress
    || organization?.restaurantOpeningHours
    || organization?.restaurantWhatsappNumber
    || organization?.restaurantGoogleMapsUrl
    || organization?.restaurantInstagramUrl,
  );
  const colorsConfigured = Boolean(
    organization?.restaurantPrimaryColor || organization?.restaurantAccentColor,
  );
  const tableOrderingUsed = organization?.orderingMode !== 'counter_pickup';
  const deliverySettingsReady = !organization?.deliveryEnabled
    || Boolean(
      organization.deliveryEstimatedTime
      && (organization.deliveryFeeLocal || organization.deliveryFeeUsdCents),
    );

  const sections: ChecklistSection[] = [
    {
      key: 'identity_branding',
      titleKey: 'identity_branding_title',
      descriptionKey: 'identity_branding_description',
      actionHref: '/dashboard/branding',
      actionLabelKey: 'action_branding',
      items: [
        {
          key: 'restaurant_name_configured',
          completed: Boolean(organization?.restaurantDisplayName),
        },
        {
          key: 'logo_configured',
          completed: Boolean(organization?.restaurantLogoUrl),
        },
        {
          key: 'colors_configured',
          completed: colorsConfigured,
        },
        {
          key: 'public_info_configured',
          completed: publicInfoConfigured,
        },
      ],
    },
    {
      key: 'menu_readiness',
      titleKey: 'menu_readiness_title',
      descriptionKey: 'menu_readiness_description',
      actionHref: '/dashboard/menu-items',
      actionLabelKey: 'action_menu_items',
      items: [
        {
          key: 'category_exists',
          completed: categoryCount > 0,
          helper: t('count_categories', { count: categoryCount }),
        },
        {
          key: 'five_menu_items',
          completed: menuItemCount >= 5,
          helper: t('count_menu_items', { count: menuItemCount }),
        },
        {
          key: 'availability_checked',
          completed: menuItemCount > 0,
          helper: t('count_unavailable_items', { count: unavailableItemCount }),
        },
        {
          key: 'multilingual_recommended',
          completed: translatedItemCount > 0,
          helper: t('count_translated_items', { count: translatedItemCount }),
        },
      ],
    },
    {
      key: 'qr_tables',
      titleKey: 'qr_tables_title',
      descriptionKey: 'qr_tables_description',
      actionHref: '/dashboard/tables',
      actionLabelKey: 'action_tables',
      items: [
        {
          key: 'general_menu_qr_available',
          completed: Boolean(organization),
        },
        {
          key: 'table_exists_if_used',
          completed: !tableOrderingUsed || tableCount > 0,
          helper: t('count_tables', { count: tableCount }),
        },
        {
          key: 'qr_stable_reminder',
          completed: true,
        },
      ],
    },
    {
      key: 'orders_operations',
      titleKey: 'orders_operations_title',
      descriptionKey: 'orders_operations_description',
      actionHref: '/dashboard/orders',
      actionLabelKey: 'action_orders',
      items: [
        {
          key: 'orders_dashboard_accessible',
          completed: true,
          helper: t('count_orders', { count: orderCount }),
        },
        {
          key: 'ticket_printing_available',
          completed: true,
        },
        {
          key: 'export_backup_available',
          completed: true,
        },
        {
          key: 'team_page_available',
          completed: true,
        },
      ],
    },
    {
      key: 'delivery_pickup',
      titleKey: 'delivery_pickup_title',
      descriptionKey: 'delivery_pickup_description',
      actionHref: '/dashboard/modules',
      actionLabelKey: 'action_modules',
      items: [
        {
          key: 'pickup_configured_if_used',
          completed: Boolean(organization?.pickupEnabled),
        },
        {
          key: 'delivery_configured_if_enabled',
          completed: deliverySettingsReady,
        },
        {
          key: 'delivery_fee_time_checked',
          completed: deliverySettingsReady,
        },
        {
          key: 'restaurant_owned_delivery_reminder',
          completed: true,
        },
      ],
    },
    {
      key: 'modules_roadmap',
      titleKey: 'modules_roadmap_title',
      descriptionKey: 'modules_roadmap_description',
      actionHref: '/dashboard/pos',
      actionLabelKey: 'action_pos',
      items: [
        {
          key: 'payments_coming_soon',
          completed: !organization?.onlinePaymentsEnabled,
        },
        {
          key: 'whatsapp_coming_soon',
          completed: !organization?.whatsappBusinessEnabled,
        },
        {
          key: 'pos_foundation',
          completed: !organization?.posIntegrationEnabled,
        },
        {
          key: 'loyalty_planned',
          completed: !organization?.loyaltyEnabled,
        },
      ],
    },
  ];

  const allItems = sections.flatMap(section => section.items);
  const completedCount = allItems.filter(item => item.completed).length;
  const totalCount = allItems.length;
  const percentage = totalCount === 0
    ? 0
    : Math.round((completedCount / totalCount) * 100);
  const readinessLabelKey = getReadinessLabelKey(percentage);
  const showStarterGuidance = completedCount <= 8;

  return (
    <>
      <TitleBar
        title={t('title_bar')}
        description={t('title_bar_description')}
      />

      <div className="space-y-6">
        <DashboardSection
          title={t('progress_title')}
          description={t('progress_description')}
        >
          <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-md border border-foreground/20 bg-background px-3 py-2 text-sm font-semibold">
                  {t(readinessLabelKey)}
                </span>
                <span className="text-sm font-medium text-muted-foreground">
                  {t('completed_count', {
                    completed: completedCount,
                    total: totalCount,
                  })}
                </span>
              </div>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-foreground"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {t('progress_percent', { percentage })}
              </p>
            </div>

            <div className="rounded-md border bg-muted/30 p-4">
              <p className="text-sm font-semibold">
                {t('next_best_steps_title')}
              </p>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
                <li>{t('starter_step_branding')}</li>
                <li>{t('starter_step_menu')}</li>
                <li>{t('starter_step_qr')}</li>
              </ol>
            </div>
          </div>

          {showStarterGuidance && (
            <div className="mt-4 rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
              <p className="font-semibold">{t('starter_guidance_title')}</p>
              <p className="mt-1">{t('starter_guidance_description')}</p>
            </div>
          )}
        </DashboardSection>

        <div className="grid gap-4 xl:grid-cols-2">
          {sections.map(section => (
            <DashboardSection
              key={section.key}
              title={t(section.titleKey)}
              description={t(section.descriptionKey)}
            >
              <ul className="space-y-3">
                {section.items.map(item => (
                  <li
                    key={item.key}
                    className="flex gap-3 rounded-md border bg-background p-3"
                  >
                    <ChecklistStatus completed={item.completed} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">
                        {t(`item_${item.key}`)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.helper
                          ? item.helper
                          : item.completed
                            ? t('status_done')
                            : t('status_needs_attention')}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={getI18nPath(section.actionHref, props.params.locale)}
                  className="inline-flex rounded-md border border-input bg-background px-3 py-2 text-sm font-semibold hover:bg-muted"
                >
                  {t(section.actionLabelKey)}
                </Link>
                {section.key === 'menu_readiness' && (
                  <Link
                    href={getI18nPath('/dashboard/menu-categories', props.params.locale)}
                    className="inline-flex rounded-md border border-input bg-background px-3 py-2 text-sm font-semibold hover:bg-muted"
                  >
                    {t('action_menu_categories')}
                  </Link>
                )}
                {section.key === 'orders_operations' && (
                  <>
                    <Link
                      href={getI18nPath('/dashboard/export', props.params.locale)}
                      className="inline-flex rounded-md border border-input bg-background px-3 py-2 text-sm font-semibold hover:bg-muted"
                    >
                      {t('action_exports')}
                    </Link>
                    <Link
                      href={getI18nPath('/dashboard/team', props.params.locale)}
                      className="inline-flex rounded-md border border-input bg-background px-3 py-2 text-sm font-semibold hover:bg-muted"
                    >
                      {t('action_team')}
                    </Link>
                  </>
                )}
                {section.key === 'modules_roadmap' && (
                  <Link
                    href={getI18nPath('/dashboard/support', props.params.locale)}
                    className="inline-flex rounded-md border border-input bg-background px-3 py-2 text-sm font-semibold hover:bg-muted"
                  >
                    {t('action_support')}
                  </Link>
                )}
              </div>
            </DashboardSection>
          ))}
        </div>
      </div>
    </>
  );
};

export default PilotChecklistPage;

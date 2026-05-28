import { auth } from '@clerk/nextjs/server';
import { count, eq } from 'drizzle-orm';
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

type WizardStep = {
  actions: {
    href: string;
    labelKey: string;
  }[];
  completed: boolean;
  descriptionKey: string;
  helper?: string;
  itemKeys: string[];
  key: string;
  titleKey: string;
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata(props: { params: { locale: string } }) {
  const t = await getTranslations({
    locale: props.params.locale,
    namespace: 'SetupWizard',
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
  if (percentage >= 85) {
    return 'readiness_ready';
  }

  if (percentage >= 55) {
    return 'readiness_almost';
  }

  return 'readiness_needed';
};

const StepStatus = (props: { completed: boolean }) => (
  <span
    className={`inline-flex w-fit rounded-md border px-2 py-1 text-xs font-semibold ${
      props.completed
        ? 'border-emerald-300 bg-emerald-50 text-emerald-950'
        : 'border-amber-300 bg-amber-50 text-amber-950'
    }`}
  >
    {props.completed ? '✓' : '!'}
  </span>
);

const SetupWizardPage = async (props: { params: { locale: string } }) => {
  noStore();

  const { orgId } = await auth();
  const t = await getTranslations('SetupWizard');

  if (!orgId) {
    return null;
  }

  const [
    organizationRows,
    categoryRows,
    itemRows,
    tableRows,
    orderRows,
  ] = await Promise.all([
    db
      .select({
        deliveryEnabled: organizationSchema.deliveryEnabled,
        deliveryEstimatedTime: organizationSchema.deliveryEstimatedTime,
        deliveryFeeLocal: organizationSchema.deliveryFeeLocal,
        deliveryFeeUsdCents: organizationSchema.deliveryFeeUsdCents,
        orderingMode: organizationSchema.orderingMode,
        pickupEnabled: organizationSchema.pickupEnabled,
        restaurantAccentColor: organizationSchema.restaurantAccentColor,
        restaurantAddress: organizationSchema.restaurantAddress,
        restaurantDisplayName: organizationSchema.restaurantDisplayName,
        restaurantGoogleMapsUrl: organizationSchema.restaurantGoogleMapsUrl,
        restaurantInstagramUrl: organizationSchema.restaurantInstagramUrl,
        restaurantLogoUrl: organizationSchema.restaurantLogoUrl,
        restaurantOpeningHours: organizationSchema.restaurantOpeningHours,
        restaurantPrimaryColor: organizationSchema.restaurantPrimaryColor,
        restaurantWhatsappNumber: organizationSchema.restaurantWhatsappNumber,
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
      .from(restaurantTableSchema)
      .where(eq(restaurantTableSchema.organizationId, orgId)),
    db
      .select({ count: count() })
      .from(orderSchema)
      .where(eq(orderSchema.organizationId, orgId)),
  ]);

  const organization = organizationRows.at(0);
  const categoryCount = getCountValue(categoryRows);
  const itemCount = getCountValue(itemRows);
  const tableCount = getCountValue(tableRows);
  const orderCount = getCountValue(orderRows);
  const hasColors = Boolean(
    organization?.restaurantPrimaryColor || organization?.restaurantAccentColor,
  );
  const hasPublicInfo = Boolean(
    organization?.restaurantAddress
    || organization?.restaurantOpeningHours
    || organization?.restaurantWhatsappNumber
    || organization?.restaurantGoogleMapsUrl
    || organization?.restaurantInstagramUrl,
  );
  const tableOrderingUsed = organization?.orderingMode !== 'counter_pickup';
  const deliveryReady = !organization?.deliveryEnabled
    || Boolean(
      organization.deliveryEstimatedTime
      && (organization.deliveryFeeLocal || organization.deliveryFeeUsdCents),
    );
  const orderingReady = Boolean(
    organization?.pickupEnabled || tableOrderingUsed || deliveryReady,
  );

  const steps: WizardStep[] = [
    {
      key: 'identity',
      titleKey: 'identity_title',
      descriptionKey: 'identity_description',
      completed: Boolean(
        organization?.restaurantDisplayName && hasColors && hasPublicInfo,
      ),
      helper: t('identity_helper', {
        logo: organization?.restaurantLogoUrl ? 1 : 0,
      }),
      itemKeys: ['identity_name', 'identity_logo', 'identity_colors', 'identity_public_info'],
      actions: [{ href: '/dashboard/branding', labelKey: 'action_branding' }],
    },
    {
      key: 'menu',
      titleKey: 'menu_title',
      descriptionKey: 'menu_description',
      completed: categoryCount > 0 && itemCount >= 5,
      helper: t('menu_helper', { categories: categoryCount, items: itemCount }),
      itemKeys: ['menu_categories', 'menu_subcategories', 'menu_items', 'menu_images', 'menu_csv'],
      actions: [
        { href: '/dashboard/menu-categories', labelKey: 'action_categories' },
        { href: '/dashboard/menu-items', labelKey: 'action_menu_items' },
      ],
    },
    {
      key: 'qr',
      titleKey: 'qr_title',
      descriptionKey: 'qr_description',
      completed: Boolean(organization) && (!tableOrderingUsed || tableCount > 0),
      helper: t('qr_helper', { tables: tableCount }),
      itemKeys: ['qr_general', 'qr_table', 'qr_stable'],
      actions: [{ href: '/dashboard/tables', labelKey: 'action_tables' }],
    },
    {
      key: 'ordering',
      titleKey: 'ordering_title',
      descriptionKey: 'ordering_description',
      completed: orderingReady,
      helper: t(organization?.deliveryEnabled ? 'ordering_delivery_on' : 'ordering_delivery_off'),
      itemKeys: ['ordering_pickup', 'ordering_table', 'ordering_delivery'],
      actions: [
        { href: '/dashboard/branding', labelKey: 'action_order_settings' },
        { href: '/dashboard/orders', labelKey: 'action_orders' },
      ],
    },
    {
      key: 'operations',
      titleKey: 'operations_title',
      descriptionKey: 'operations_description',
      completed: true,
      helper: t('operations_helper', { orders: orderCount }),
      itemKeys: ['operations_orders', 'operations_ticket', 'operations_exports', 'operations_analytics'],
      actions: [
        { href: '/dashboard/orders', labelKey: 'action_orders' },
        { href: '/dashboard/export', labelKey: 'action_export' },
        { href: '/dashboard/statistics', labelKey: 'action_statistics' },
      ],
    },
    {
      key: 'modules',
      titleKey: 'modules_title',
      descriptionKey: 'modules_description',
      completed: true,
      itemKeys: ['modules_payments', 'modules_whatsapp', 'modules_pos', 'modules_loyalty'],
      actions: [
        { href: '/dashboard/modules', labelKey: 'action_modules' },
        { href: '/dashboard/pos', labelKey: 'action_pos' },
      ],
    },
  ];
  const completedSteps = steps.filter(step => step.completed).length;
  const percentage = Math.round((completedSteps / steps.length) * 100);
  const readinessLabelKey = getReadinessLabelKey(percentage);

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
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-md border border-foreground/20 bg-background px-3 py-2 text-sm font-semibold">
                  {t(readinessLabelKey)}
                </span>
                <span className="text-sm font-medium text-muted-foreground">
                  {t('completed_steps', {
                    completed: completedSteps,
                    total: steps.length,
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
            <Link
              href={getI18nPath('/dashboard/pilot-checklist', props.params.locale)}
              className="inline-flex min-h-10 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-semibold hover:bg-muted"
            >
              {t('action_checklist')}
            </Link>
          </div>
        </DashboardSection>

        <div className="grid gap-4 lg:grid-cols-2">
          {steps.map((step, index) => (
            <article key={step.key} className="rounded-md border bg-card p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    {t('step_label', { number: index + 1 })}
                  </p>
                  <h2 className="mt-1 text-lg font-semibold">
                    {t(step.titleKey)}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {t(step.descriptionKey)}
                  </p>
                </div>
                <StepStatus completed={step.completed} />
              </div>

              {step.helper && (
                <div className="mt-4 rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                  {step.helper}
                </div>
              )}

              <ul className="mt-4 grid gap-2 text-sm text-muted-foreground">
                {step.itemKeys.map(itemKey => (
                  <li key={itemKey} className="flex gap-2">
                    <span aria-hidden="true" className="mt-1 size-1.5 rounded-full bg-foreground/60" />
                    <span>{t(itemKey)}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex flex-wrap gap-2">
                {step.actions.map(action => (
                  <Link
                    key={action.href}
                    href={getI18nPath(action.href, props.params.locale)}
                    className="inline-flex min-h-10 items-center rounded-md border border-input bg-background px-3 text-sm font-semibold hover:bg-muted"
                  >
                    {t(action.labelKey)}
                  </Link>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </>
  );
};

export default SetupWizardPage;

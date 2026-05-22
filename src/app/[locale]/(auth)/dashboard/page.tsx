import { auth } from '@clerk/nextjs/server';
import { and, count, eq, gte } from 'drizzle-orm';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import { Button } from '@/components/ui/button';
import { getCurrentRestaurantDisplayName } from '@/features/dashboard/getRestaurantDisplayName';
import { db } from '@/libs/DB';
import {
  menuItemSchema,
  orderSchema,
  restaurantTableSchema,
} from '@/models/Schema';
import { getI18nPath } from '@/utils/Helpers';

const getCountValue = (rows: { count: number }[]) => {
  return Number(rows.at(0)?.count ?? 0);
};

const DashboardIndexPage = async (props: { params: { locale: string } }) => {
  const t = await getTranslations({
    locale: props.params.locale,
    namespace: 'DashboardIndex',
  });
  const { orgId } = await auth();
  const restaurantDisplayName = await getCurrentRestaurantDisplayName(orgId);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    todayOrderRows,
    pendingOrderRows,
    menuItemRows,
    tableRows,
  ] = orgId
    ? await Promise.all([
      db
        .select({ count: count() })
        .from(orderSchema)
        .where(and(
          eq(orderSchema.organizationId, orgId),
          gte(orderSchema.createdAt, todayStart),
        )),
      db
        .select({ count: count() })
        .from(orderSchema)
        .where(and(
          eq(orderSchema.organizationId, orgId),
          eq(orderSchema.status, 'pending'),
        )),
      db
        .select({ count: count() })
        .from(menuItemSchema)
        .where(eq(menuItemSchema.organizationId, orgId)),
      db
        .select({ count: count() })
        .from(restaurantTableSchema)
        .where(eq(restaurantTableSchema.organizationId, orgId)),
    ])
    : [[], [], [], []];

  const summaryCards = [
    {
      href: '/dashboard/orders',
      label: t('summary_today_orders'),
      value: getCountValue(todayOrderRows),
      helper: t('summary_today_orders_helper'),
    },
    {
      href: '/dashboard/orders',
      label: t('summary_pending_orders'),
      value: getCountValue(pendingOrderRows),
      helper: t('summary_pending_orders_helper'),
      tone: 'urgent',
    },
    {
      href: '/dashboard/menu-items',
      label: t('summary_menu_items'),
      value: getCountValue(menuItemRows),
      helper: t('summary_menu_items_helper'),
    },
    {
      href: '/dashboard/tables',
      label: t('summary_tables'),
      value: getCountValue(tableRows),
      helper: t('summary_tables_helper'),
    },
  ];
  const quickLinks = [
    {
      href: '/dashboard/orders',
      title: t('orders_title'),
      description: t('orders_description'),
      cta: t('orders_cta'),
      primary: true,
    },
    {
      href: '/dashboard/menu-items',
      title: t('menu_title'),
      description: t('menu_description'),
      cta: t('menu_cta'),
    },
    {
      href: '/dashboard/tables',
      title: t('tables_title'),
      description: t('tables_description'),
      cta: t('tables_cta'),
    },
    {
      href: '/dashboard/statistics',
      title: t('statistics_title'),
      description: t('statistics_description'),
      cta: t('statistics_cta'),
    },
    {
      href: '/dashboard/branding',
      title: t('settings_title'),
      description: t('settings_description'),
      cta: t('settings_cta'),
    },
    {
      href: '/dashboard/modules',
      title: 'Modules & integrations',
      description: 'See which optional restaurant modules are prepared and ready for future integration.',
      cta: 'View modules',
    },
    {
      href: '/dashboard/support',
      title: t('support_title'),
      description: t('support_description'),
      cta: t('support_cta'),
    },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-md border bg-card p-4 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {t('welcome_label')}
            </p>
            <h2 className="mt-1 text-2xl font-semibold sm:text-3xl">
              {t('welcome_title', { restaurantName: restaurantDisplayName })}
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              {t('welcome_description')}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row lg:shrink-0">
            <Button asChild>
              <Link href={getI18nPath('/dashboard/orders', props.params.locale)}>
                {t('primary_orders_action')}
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={getI18nPath('/dashboard/menu-items', props.params.locale)}>
                {t('secondary_menu_action')}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {summaryCards.map(card => (
            <Link
              key={card.label}
              href={getI18nPath(card.href, props.params.locale)}
              className={`rounded-md border bg-card p-4 transition-colors hover:bg-muted ${
                card.tone === 'urgent' && card.value > 0
                  ? 'border-amber-300 bg-amber-50'
                  : ''
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {card.label}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {card.helper}
                  </p>
                </div>
                <p className="text-3xl font-semibold">
                  {card.value}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3">
          <h2 className="text-lg font-semibold">
            {t('quick_actions_title')}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t('quick_actions_description')}
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {quickLinks.map(link => (
            <Link
              key={link.href}
              href={getI18nPath(link.href, props.params.locale)}
              className={`rounded-md border bg-card p-4 transition-colors hover:bg-muted sm:p-5 ${
                link.primary ? 'border-foreground/30' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold sm:text-lg">
                    {link.title}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {link.description}
                  </p>
                </div>
                <span className="shrink-0 rounded-md border px-2 py-1 text-xs font-medium">
                  {link.cta}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

export default DashboardIndexPage;

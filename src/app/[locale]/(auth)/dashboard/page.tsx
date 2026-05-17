import { auth } from '@clerk/nextjs/server';
import { and, count, eq, gte } from 'drizzle-orm';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import { getCurrentRestaurantDisplayName } from '@/features/dashboard/getRestaurantDisplayName';
import { TitleBar } from '@/features/dashboard/TitleBar';
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
      label: t('summary_today_orders'),
      value: getCountValue(todayOrderRows),
    },
    {
      label: t('summary_pending_orders'),
      value: getCountValue(pendingOrderRows),
    },
    {
      label: t('summary_menu_items'),
      value: getCountValue(menuItemRows),
    },
    {
      label: t('summary_tables'),
      value: getCountValue(tableRows),
    },
  ];
  const quickLinks = [
    {
      href: '/dashboard/orders',
      title: t('orders_title'),
      description: t('orders_description'),
    },
    {
      href: '/dashboard/menu-items',
      title: t('menu_title'),
      description: t('menu_description'),
    },
    {
      href: '/dashboard/tables',
      title: t('tables_title'),
      description: t('tables_description'),
    },
    {
      href: '/dashboard/statistics',
      title: t('statistics_title'),
      description: t('statistics_description'),
    },
    {
      href: '/dashboard/branding',
      title: t('settings_title'),
      description: t('settings_description'),
    },
  ];

  return (
    <>
      <TitleBar
        title={t('title_bar', { restaurantName: restaurantDisplayName })}
        description={t('title_bar_description')}
      />

      <section className="mb-8">
        <div className="mb-3">
          <h2 className="text-lg font-semibold">
            {t('summary_title')}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t('summary_description')}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {summaryCards.map(card => (
            <div key={card.label} className="rounded-md border bg-card p-4">
              <p className="text-sm font-medium text-muted-foreground">
                {card.label}
              </p>
              <p className="mt-2 text-3xl font-semibold">
                {card.value}
              </p>
            </div>
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

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {quickLinks.map(link => (
            <Link
              key={link.href}
              href={getI18nPath(link.href, props.params.locale)}
              className="rounded-md border bg-card p-5 transition-colors hover:bg-muted"
            >
              <h2 className="text-lg font-semibold">
                {link.title}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {link.description}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
};

export default DashboardIndexPage;

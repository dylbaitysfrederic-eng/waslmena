import { auth } from '@clerk/nextjs/server';
import { and, count, eq, gte } from 'drizzle-orm';
import { getTranslations } from 'next-intl/server';

import { Button } from '@/components/ui/button';
import { DashboardSection } from '@/features/dashboard/DashboardSection';
import { TitleBar } from '@/features/dashboard/TitleBar';
import { db } from '@/libs/DB';
import {
  menuCategorySchema,
  menuItemSchema,
  orderSchema,
  restaurantTableSchema,
} from '@/models/Schema';
import { getI18nPath } from '@/utils/Helpers';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata(props: { params: { locale: string } }) {
  const t = await getTranslations({
    locale: props.params.locale,
    namespace: 'ExportBackup',
  });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

const getCountValue = (rows: { count: number }[]) => {
  return Number(rows.at(0)?.count ?? 0);
};

const ExportBackupPage = async (props: { params: { locale: string } }) => {
  const t = await getTranslations('ExportBackup');
  const { orgId } = await auth();
  const recentStart = new Date(Date.now() - (2 * 86_400_000));

  if (!orgId) {
    return null;
  }

  const [
    categoryRows,
    itemRows,
    tableRows,
    recentOrderRows,
  ] = await Promise.all([
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
      .where(and(
        eq(orderSchema.organizationId, orgId),
        gte(orderSchema.createdAt, recentStart),
      )),
  ]);

  const exportCards = [
    {
      href: getI18nPath('/dashboard/export/menu', props.params.locale),
      title: t('menu_export_title'),
      description: t('menu_export_description'),
      format: t('json_format'),
      summary: t('menu_export_summary', {
        categories: getCountValue(categoryRows),
        items: getCountValue(itemRows),
      }),
    },
    {
      href: getI18nPath('/dashboard/export/tables', props.params.locale),
      title: t('tables_export_title'),
      description: t('tables_export_description'),
      format: t('json_format'),
      summary: t('tables_export_summary', {
        tables: getCountValue(tableRows),
      }),
    },
    {
      href: getI18nPath('/dashboard/export/settings', props.params.locale),
      title: t('settings_export_title'),
      description: t('settings_export_description'),
      format: t('json_format'),
      summary: t('settings_export_summary'),
    },
    {
      href: `${getI18nPath('/dashboard/orders/export', props.params.locale)}?period=recent`,
      title: t('orders_export_title'),
      description: t('orders_export_description'),
      format: t('csv_format'),
      summary: t('orders_export_summary', {
        orders: getCountValue(recentOrderRows),
      }),
    },
  ];

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
        <div className="grid gap-3 sm:grid-cols-2">
          {exportCards.map(card => (
            <article key={card.href} className="wasl-panel grid gap-4 p-4">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-base font-semibold">{card.title}</h3>
                  <span className="rounded-full border bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                    {card.format}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {card.description}
                </p>
              </div>

              <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                {card.summary}
              </div>

              <Button asChild className="w-full sm:w-fit">
                <a href={card.href}>
                  {t('download_button')}
                </a>
              </Button>
            </article>
          ))}
        </div>

        <div className="mt-5 rounded-md border border-dashed bg-background p-4 text-sm leading-6 text-muted-foreground">
          {t('safety_note')}
        </div>
        <div className="mt-3 rounded-md border border-dashed bg-background p-4 text-sm leading-6 text-muted-foreground">
          {t('location_scope_note')}
        </div>
      </DashboardSection>
    </>
  );
};

export default ExportBackupPage;

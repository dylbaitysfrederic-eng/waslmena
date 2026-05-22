import { and, count, eq, gte } from 'drizzle-orm';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { db } from '@/libs/DB';
import {
  menuCategorySchema,
  menuItemSchema,
  orderSchema,
  restaurantTableSchema,
} from '@/models/Schema';

import {
  formatAdminLabel,
  getAdminOrganizations,
} from '../../_helpers';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const getCountValue = (rows: { count: number }[]) => {
  return Number(rows.at(0)?.count ?? 0);
};

const AdminRestaurantExportsPage = async (props: {
  params: { id: string };
}) => {
  const {
    ids,
    organizationRecords,
  } = await getAdminOrganizations();

  if (!ids.includes(props.params.id)) {
    notFound();
  }

  const organizationId = props.params.id;
  const organization = organizationRecords.get(organizationId);
  const restaurantName = organization?.restaurantDisplayName
    || 'Unnamed restaurant';
  const recentStart = new Date(Date.now() - (2 * 86_400_000));
  const [
    categoryRows,
    itemRows,
    tableRows,
    recentOrderRows,
  ] = await Promise.all([
    db
      .select({ count: count() })
      .from(menuCategorySchema)
      .where(eq(menuCategorySchema.organizationId, organizationId)),
    db
      .select({ count: count() })
      .from(menuItemSchema)
      .where(eq(menuItemSchema.organizationId, organizationId)),
    db
      .select({ count: count() })
      .from(restaurantTableSchema)
      .where(eq(restaurantTableSchema.organizationId, organizationId)),
    db
      .select({ count: count() })
      .from(orderSchema)
      .where(and(
        eq(orderSchema.organizationId, organizationId),
        gte(orderSchema.createdAt, recentStart),
      )),
  ]);
  const exportCards = [
    {
      href: `/admin/exports/${organizationId}/menu`,
      title: 'Menu export',
      description: 'Categories, menu items, translations, availability, prices, images, and merchandising badges.',
      format: 'JSON',
      summary: `${getCountValue(categoryRows)} categories · ${getCountValue(itemRows)} items`,
    },
    {
      href: `/admin/exports/${organizationId}/tables`,
      title: 'Tables & QR export',
      description: 'Table ids, table numbers, QR settings, and stable public menu target URLs.',
      format: 'JSON',
      summary: `${getCountValue(tableRows)} tables`,
    },
    {
      href: `/admin/exports/${organizationId}/settings`,
      title: 'Restaurant settings export',
      description: 'Branding, colors, welcome screen, ordering settings, contact info, QR settings, and public details.',
      format: 'JSON',
      summary: 'Operational settings snapshot',
    },
    {
      href: `/admin/exports/${organizationId}/orders?period=recent`,
      title: 'Orders export',
      description: 'Bounded CSV order export using the same 90-day limit as restaurant dashboard exports.',
      format: 'CSV',
      summary: `${getCountValue(recentOrderRows)} orders in last 48 hours`,
    },
  ];

  return (
    <section className="grid gap-6">
      <div className="rounded-md border bg-background p-5 shadow-sm">
        <Link
          href="/admin/exports"
          className="text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          Back to exports
        </Link>
        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-xl font-semibold">
              Exports for
              {' '}
              {restaurantName}
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Admin-only downloads for this restaurant organization. Each route
              is scoped to this organization id, which represents one
              restaurant branch/location, and generates server-side files on
              demand.
            </p>
            <code className="mt-2 block text-xs text-muted-foreground">
              {organizationId}
            </code>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/admin/identity/${organizationId}`}
              className="inline-flex rounded-md border border-input bg-background px-3 py-2 text-xs font-semibold hover:bg-muted"
            >
              Identity
            </Link>
            <Link
              href={`/admin/menu/${organizationId}`}
              className="inline-flex rounded-md border border-input bg-background px-3 py-2 text-xs font-semibold hover:bg-muted"
            >
              Menu
            </Link>
            <Link
              href={`/admin/templates/${organizationId}`}
              className="inline-flex rounded-md border border-input bg-background px-3 py-2 text-xs font-semibold hover:bg-muted"
            >
              QR & Tables
            </Link>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-muted-foreground">
          <span className="rounded-md border bg-muted/30 px-2 py-1">
            {formatAdminLabel(organization?.clientCategory ?? 'restaurant')}
          </span>
          <span className="rounded-md border bg-muted/30 px-2 py-1">
            {formatAdminLabel(organization?.accessStatus ?? 'pending')}
          </span>
          <span className="rounded-md border bg-muted/30 px-2 py-1">
            {formatAdminLabel(organization?.subscriptionStatus ?? 'trial')}
          </span>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {exportCards.map(card => (
          <article key={card.href} className="rounded-md border bg-background p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base font-semibold">{card.title}</h3>
              <span className="rounded-full border bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                {card.format}
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {card.description}
            </p>
            <div className="mt-4 rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
              {restaurantName}
              {' · '}
              {card.summary}
            </div>
            <Button asChild className="mt-4 w-full sm:w-fit">
              <a href={card.href}>
                Download export
              </a>
            </Button>
          </article>
        ))}
      </div>

      <div className="rounded-md border border-dashed bg-background p-4 text-sm leading-6 text-muted-foreground">
        This is a manual export center only. No scheduled backup, restore,
        cloud archive, or cross-organization bundle is created here.
      </div>
    </section>
  );
};

export default AdminRestaurantExportsPage;

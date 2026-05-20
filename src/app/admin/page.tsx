import Link from 'next/link';
import type { CSSProperties } from 'react';

import {
  formatAdminLabel,
  formatDateTime,
  formatUsdAmount,
  getAdminMetrics,
  getAdminOrganizations,
} from './_helpers';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const adminCards = [
  {
    href: '/admin/clients',
    title: 'Clients',
    description: 'List restaurant clients and maintain internal founder notes.',
  },
  {
    href: '/admin/billing',
    title: 'Billing',
    description: 'Track manual subscription amounts, payment methods, and due dates.',
  },
  {
    href: '/admin/access',
    title: 'Access controls',
    description: 'Suspend or restore restaurant client access.',
  },
  {
    href: '/admin/templates',
    title: 'QR & Tables',
    description: 'Configure each restaurant’s QR behavior, ordering flow, and table setup.',
  },
  {
    href: '/admin/menu',
    title: 'Menu setup',
    description: 'Create multilingual starter categories and menu items during onboarding.',
  },
  {
    href: '/admin/usage',
    title: 'Usage overview',
    description: 'Review high-level tables, menu items, orders, and activity.',
  },
  {
    href: '/admin/settings',
    title: 'SaaS settings',
    description: 'Configure official Wasl contact and social links for the landing page.',
  },
];

const stackStyle: CSSProperties = {
  display: 'grid',
  gap: '24px',
};

const panelStyle: CSSProperties = {
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  background: '#ffffff',
  padding: '20px',
};

const metricGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: '12px',
  marginTop: '20px',
};

const metricStyle: CSSProperties = {
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '16px',
};

const cardGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: '12px',
};

const cardStyle: CSSProperties = {
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  background: '#ffffff',
  padding: '20px',
  color: '#111827',
  textDecoration: 'none',
};

const clientRowStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '12px',
  alignItems: 'center',
  justifyContent: 'space-between',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '12px',
};

const AdminOverviewPage = async () => {
  const {
    ids,
    organizationRecords,
    orderStatsByOrganizationId,
  } = await getAdminOrganizations();

  const metrics = getAdminMetrics({
    ids,
    organizationRecords,
    orderStatsByOrganizationId,
  });
  const latestOrderDate = ids
    .map(organizationId => orderStatsByOrganizationId.get(organizationId)?.latestOrderDate)
    .filter((date): date is Date => Boolean(date))
    .sort((left, right) => right.getTime() - left.getTime())
    .at(0);

  return (
    <div className="grid gap-6" style={stackStyle}>
      <section className="rounded-md bg-background p-5" style={panelStyle}>
        <h2 className="text-xl font-semibold">
          Founder admin overview
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          This area is for SaaS-owner operations: client records, commercial tracking,
          access control, QR/table setup, and usage signals. Restaurant operations
          stay in the restaurant dashboard.
        </p>

        <div className="mt-5 grid gap-3 md:grid-cols-4" style={metricGridStyle}>
          <div className="rounded-md border p-4" style={metricStyle}>
            <div className="text-2xl font-semibold">{metrics.totalClients}</div>
            <div className="text-sm text-muted-foreground">Restaurant clients</div>
          </div>
          <div className="rounded-md border p-4" style={metricStyle}>
            <div className="text-2xl font-semibold">{metrics.activeClients}</div>
            <div className="text-sm text-muted-foreground">Active clients</div>
          </div>
          <div className="rounded-md border p-4" style={metricStyle}>
            <div className="text-2xl font-semibold">{metrics.suspendedClients}</div>
            <div className="text-sm text-muted-foreground">Suspended clients</div>
          </div>
          <div className="rounded-md border p-4" style={metricStyle}>
            <div className="text-2xl font-semibold">{metrics.overdueClients}</div>
            <div className="text-sm text-muted-foreground">Overdue clients</div>
          </div>
          <div className="rounded-md border p-4" style={metricStyle}>
            <div className="text-2xl font-semibold">{formatUsdAmount(metrics.estimatedMrr)}</div>
            <div className="text-sm text-muted-foreground">Estimated MRR</div>
          </div>
          <div className="rounded-md border p-4" style={metricStyle}>
            <div className="text-2xl font-semibold">{formatUsdAmount(metrics.setupFeesCollected)}</div>
            <div className="text-sm text-muted-foreground">Setup fees collected</div>
          </div>
          <div className="rounded-md border p-4" style={metricStyle}>
            <div className="text-2xl font-semibold">{formatUsdAmount(metrics.setupFeesUnpaid)}</div>
            <div className="text-sm text-muted-foreground">Setup fees unpaid</div>
          </div>
          <div className="rounded-md border p-4" style={metricStyle}>
            <div className="text-2xl font-semibold">{metrics.totalOrders}</div>
            <div className="text-sm text-muted-foreground">Total orders</div>
          </div>
          <div className="rounded-md border p-4" style={metricStyle}>
            <div className="text-2xl font-semibold">
              {formatDateTime(latestOrderDate ?? null)}
            </div>
            <div className="text-sm text-muted-foreground">Latest client order</div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3" style={cardGridStyle}>
        {adminCards.map(card => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-md border bg-background p-5 hover:bg-muted/40"
            style={cardStyle}
          >
            <div className="text-lg font-semibold">{card.title}</div>
            <p className="mt-2 text-sm text-muted-foreground">{card.description}</p>
          </Link>
        ))}
      </section>

      <section className="rounded-md bg-background p-5" style={panelStyle}>
        <h2 className="text-lg font-semibold">Recent client status</h2>
        <div className="mt-4 grid gap-2">
          {ids.slice(0, 6).map((organizationId) => {
            const organization = organizationRecords.get(organizationId);
            const subscriptionStatus = organization?.subscriptionStatus ?? 'trial';
            const accessStatus = organization?.accessStatus ?? 'pending';

            return (
              <div
                key={organizationId}
                className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between"
                style={clientRowStyle}
              >
                <div>
                  <div className="font-medium">
                    {organization?.restaurantDisplayName || 'Unnamed restaurant'}
                  </div>
                  <code className="text-xs text-muted-foreground">{organizationId}</code>
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatAdminLabel(accessStatus)}
                  {' · '}
                  {formatAdminLabel(subscriptionStatus)}
                </div>
              </div>
            );
          })}

          {ids.length === 0 && (
            <div className="rounded-md border p-6 text-center text-sm text-muted-foreground">
              No restaurant clients found yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default AdminOverviewPage;

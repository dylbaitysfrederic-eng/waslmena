import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import {
  formatAdminLabel,
  formatDateTime,
  formatUsdAmount,
  getAdminMetrics,
  getAdminOrganizations,
  getStatusBadgeClassName,
} from '../_helpers';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const AdminUsagePage = async () => {
  const {
    ids,
    organizationRecords,
    tableCountByOrganizationId,
    menuItemCountByOrganizationId,
    orderStatsByOrganizationId,
  } = await getAdminOrganizations();

  const totals = ids.reduce(
    (accumulator, organizationId) => {
      const orderStat = orderStatsByOrganizationId.get(organizationId);

      return {
        tables: accumulator.tables + (tableCountByOrganizationId.get(organizationId) ?? 0),
        menuItems: accumulator.menuItems + (menuItemCountByOrganizationId.get(organizationId) ?? 0),
        orders: accumulator.orders + (orderStat?.count ?? 0),
      };
    },
    {
      tables: 0,
      menuItems: 0,
      orders: 0,
    },
  );
  const metrics = getAdminMetrics({
    ids,
    organizationRecords,
    orderStatsByOrganizationId,
  });

  return (
    <section className="grid gap-4">
      <div className="rounded-md bg-background p-5">
        <h2 className="text-xl font-semibold">Usage overview</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          High-level SaaS-owner usage signals across restaurant clients. Detailed
          restaurant operations remain in each restaurant dashboard.
        </p>

        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <div className="rounded-md border p-4">
            <div className="text-2xl font-semibold">{metrics.totalClients}</div>
            <div className="text-sm text-muted-foreground">Total clients</div>
          </div>
          <div className="rounded-md border p-4">
            <div className="text-2xl font-semibold">{metrics.activeClients}</div>
            <div className="text-sm text-muted-foreground">Active clients</div>
          </div>
          <div className="rounded-md border p-4">
            <div className="text-2xl font-semibold">{metrics.suspendedClients}</div>
            <div className="text-sm text-muted-foreground">Suspended clients</div>
          </div>
          <div className="rounded-md border p-4">
            <div className="text-2xl font-semibold">{metrics.overdueClients}</div>
            <div className="text-sm text-muted-foreground">Overdue clients</div>
          </div>
          <div className="rounded-md border p-4">
            <div className="text-2xl font-semibold">{formatUsdAmount(metrics.estimatedMrr)}</div>
            <div className="text-sm text-muted-foreground">Estimated MRR</div>
          </div>
          <div className="rounded-md border p-4">
            <div className="text-2xl font-semibold">{formatUsdAmount(metrics.setupFeesCollected)}</div>
            <div className="text-sm text-muted-foreground">Setup fees collected</div>
          </div>
          <div className="rounded-md border p-4">
            <div className="text-2xl font-semibold">{formatUsdAmount(metrics.setupFeesUnpaid)}</div>
            <div className="text-sm text-muted-foreground">Setup fees unpaid</div>
          </div>
          <div className="rounded-md border p-4">
            <div className="text-2xl font-semibold">{totals.tables}</div>
            <div className="text-sm text-muted-foreground">Tables</div>
          </div>
          <div className="rounded-md border p-4">
            <div className="text-2xl font-semibold">{totals.menuItems}</div>
            <div className="text-sm text-muted-foreground">Menu items</div>
          </div>
          <div className="rounded-md border p-4">
            <div className="text-2xl font-semibold">{metrics.totalOrders}</div>
            <div className="text-sm text-muted-foreground">Total orders</div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-md bg-background p-5">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Restaurant / Organization</TableHead>
              <TableHead>Tables</TableHead>
              <TableHead>Menu items</TableHead>
              <TableHead>Orders</TableHead>
              <TableHead>Subscription</TableHead>
              <TableHead>Access</TableHead>
              <TableHead>Latest order</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ids.map((organizationId) => {
              const organization = organizationRecords.get(organizationId);
              const orderStat = orderStatsByOrganizationId.get(organizationId);
              const subscriptionStatus = organization?.subscriptionStatus ?? 'trial';
              const accessSuspended = organization?.accessSuspended ?? false;

              return (
                <TableRow key={organizationId}>
                  <TableCell className="min-w-72 align-top">
                    <div className="font-semibold">
                      {organization?.restaurantDisplayName || 'Unnamed restaurant'}
                    </div>
                    <code className="mt-1 block break-all text-xs text-muted-foreground">
                      {organizationId}
                    </code>
                  </TableCell>
                  <TableCell>{tableCountByOrganizationId.get(organizationId) ?? 0}</TableCell>
                  <TableCell>{menuItemCountByOrganizationId.get(organizationId) ?? 0}</TableCell>
                  <TableCell>{orderStat?.count ?? 0}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex rounded-md border px-2 py-1 text-xs font-semibold ${getStatusBadgeClassName(subscriptionStatus)}`}
                    >
                      {formatAdminLabel(subscriptionStatus)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={
                        accessSuspended
                          ? 'font-semibold text-red-700'
                          : 'font-medium text-green-700'
                      }
                    >
                      {accessSuspended ? 'Suspended' : 'Active'}
                    </span>
                  </TableCell>
                  <TableCell className="min-w-40">
                    {formatDateTime(orderStat?.latestOrderDate ?? null)}
                  </TableCell>
                </TableRow>
              );
            })}

            {ids.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  No restaurant usage found yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  );
};

export default AdminUsagePage;

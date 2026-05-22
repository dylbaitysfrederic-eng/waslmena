import Link from 'next/link';

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
  getAdminOrganizations,
} from '../_helpers';
import {
  filterAdminRestaurantIds,
  getAdminRestaurantSearchQuery,
} from '../_restaurantSearch';
import { AdminRestaurantSearch } from '../AdminRestaurantSearch';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const AdminExportsPage = async (props: {
  searchParams?: { q?: string };
}) => {
  const {
    ids,
    menuItemCountByOrganizationId,
    orderStatsByOrganizationId,
    organizationRecords,
    tableCountByOrganizationId,
  } = await getAdminOrganizations();
  const searchQuery = getAdminRestaurantSearchQuery(props.searchParams);
  const filteredIds = filterAdminRestaurantIds(
    ids,
    organizationRecords,
    searchQuery,
  );

  return (
    <section className="rounded-md border bg-background p-5 shadow-sm">
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Exports & Backups</h2>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Generate lightweight organization-scoped exports for restaurant
            operations. Each organization is treated as one restaurant
            branch/location, so exports stay scoped to that location only.
          </p>
        </div>
      </div>

      <AdminRestaurantSearch
        action="/admin/exports"
        resultCount={filteredIds.length}
        searchQuery={searchQuery}
        totalCount={ids.length}
      />

      {filteredIds.length === 0
        ? (
            <div className="rounded-md border border-dashed bg-muted/20 p-8 text-center text-sm text-muted-foreground">
              No restaurant clients match this export search.
            </div>
          )
        : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Client #</TableHead>
                    <TableHead>Restaurant</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Menu items</TableHead>
                    <TableHead className="text-right">Tables</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIds.map((organizationId, index) => {
                    const organization = organizationRecords.get(organizationId);
                    const clientName = organization?.restaurantDisplayName
                      || 'Unnamed restaurant';
                    const orderStats = orderStatsByOrganizationId.get(organizationId);

                    return (
                      <TableRow key={organizationId}>
                        <TableCell className="font-medium">
                          {String(index + 1).padStart(3, '0')}
                        </TableCell>
                        <TableCell className="min-w-56">
                          <div className="font-semibold">
                            {clientName}
                          </div>
                          <code className="mt-1 block max-w-64 truncate text-xs text-muted-foreground">
                            {organizationId}
                          </code>
                        </TableCell>
                        <TableCell>
                          {formatAdminLabel(
                            organization?.clientCategory ?? 'restaurant',
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {menuItemCountByOrganizationId.get(organizationId) ?? 0}
                        </TableCell>
                        <TableCell className="text-right">
                          {tableCountByOrganizationId.get(organizationId) ?? 0}
                        </TableCell>
                        <TableCell className="text-right">
                          {orderStats?.count ?? 0}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link
                            href={`/admin/exports/${organizationId}`}
                            className="inline-flex rounded-md border border-input bg-background px-3 py-2 text-xs font-semibold hover:bg-muted"
                          >
                            Open exports
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
    </section>
  );
};

export default AdminExportsPage;

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

const AdminTemplatesPage = async (props: {
  searchParams?: { q?: string | string[] };
}) => {
  const {
    ids,
    organizationRecords,
  } = await getAdminOrganizations();
  const searchQuery = getAdminRestaurantSearchQuery(props.searchParams);
  const filteredIds = filterAdminRestaurantIds(
    ids,
    organizationRecords,
    searchQuery,
  );

  return (
    <section className="rounded-md bg-background p-5">
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-xl font-semibold">QR & Tables</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Configure each restaurant’s QR behavior, ordering flow, and table setup.
          </p>
        </div>
      </div>

      <AdminRestaurantSearch
        action="/admin/templates"
        resultCount={filteredIds.length}
        searchQuery={searchQuery}
        totalCount={ids.length}
      />

      {ids.length === 0
        ? (
            <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              No restaurant clients found yet.
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
                    <TableHead>QR mode</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIds.map((organizationId, index) => {
                    const organization = organizationRecords.get(organizationId);
                    const clientName = organization?.restaurantDisplayName
                      || 'Unnamed restaurant';

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
                            organization?.restaurantProfile ?? 'table_service',
                          )}
                        </TableCell>
                        <TableCell>
                          {formatAdminLabel(
                            organization?.qrMode ?? 'per_table',
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link
                            href={`/admin/templates/${organizationId}`}
                            className="inline-flex rounded-md border border-input bg-background px-3 py-2 text-xs font-semibold hover:bg-muted"
                          >
                            Manage QR & Tables
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

export default AdminTemplatesPage;

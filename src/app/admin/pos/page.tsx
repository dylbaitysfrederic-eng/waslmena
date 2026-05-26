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
  formatPosProvider,
  formatPosSyncStatus,
} from '@/utils/POS';

import { getAdminOrganizations } from '../_helpers';
import {
  filterAdminRestaurantIds,
  getAdminRestaurantSearchQuery,
} from '../_restaurantSearch';
import { AdminRestaurantSearch } from '../AdminRestaurantSearch';
import { getAdminPosConfigByOrganizationId } from './queries';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const AdminPOSPage = async (props: {
  searchParams?: { q?: string | string[] };
}) => {
  const { ids, organizationRecords } = await getAdminOrganizations();
  const posConfigByOrganizationId = await getAdminPosConfigByOrganizationId(ids);
  const searchQuery = getAdminRestaurantSearchQuery(props.searchParams);
  const filteredIds = filterAdminRestaurantIds(
    ids,
    organizationRecords,
    searchQuery,
  );

  return (
    <section className="rounded-md border bg-background p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="text-xl font-semibold">POS foundation</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Track POS readiness for each restaurant. Wasl starts with a CSV/manual bridge;
          provider APIs, webhooks, queues, and automatic sync come later.
        </p>
      </div>

      <AdminRestaurantSearch
        action="/admin/pos"
        resultCount={filteredIds.length}
        searchQuery={searchQuery}
        totalCount={ids.length}
      />

      {filteredIds.length === 0
        ? (
            <div className="rounded-md border border-dashed bg-muted/20 p-8 text-center text-sm text-muted-foreground">
              No restaurant clients match this POS search.
            </div>
          )
        : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Client #</TableHead>
                    <TableHead>Restaurant</TableHead>
                    <TableHead>Module</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Sync status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIds.map((organizationId, index) => {
                    const organization = organizationRecords.get(organizationId);
                    const posConfig = posConfigByOrganizationId.get(organizationId);
                    const enabled = organization?.posIntegrationEnabled ?? false;

                    return (
                      <TableRow key={organizationId}>
                        <TableCell className="font-medium">
                          {String(index + 1).padStart(3, '0')}
                        </TableCell>
                        <TableCell className="min-w-56">
                          <div className="font-semibold">
                            {organization?.restaurantDisplayName || 'Unnamed restaurant'}
                          </div>
                          <code className="mt-1 block max-w-64 truncate text-xs text-muted-foreground">
                            {organizationId}
                          </code>
                        </TableCell>
                        <TableCell>
                          <span className={enabled
                            ? 'rounded-full border border-green-300 bg-green-50 px-2 py-1 text-xs font-semibold text-green-900'
                            : 'rounded-full border bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground'}
                          >
                            {enabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {formatPosProvider(posConfig?.provider)}
                        </TableCell>
                        <TableCell>
                          {formatPosSyncStatus(posConfig?.syncStatus)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link
                            href={`/admin/pos/${organizationId}`}
                            className="inline-flex rounded-md border border-input bg-background px-3 py-2 text-xs font-semibold hover:bg-muted"
                          >
                            Open POS
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

export default AdminPOSPage;

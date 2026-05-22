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
  MODULES,
  organizationHasModule,
} from '@/utils/Modules';

import {
  getAdminOrganizations,
} from '../_helpers';
import {
  filterAdminRestaurantIds,
  getAdminRestaurantSearchQuery,
} from '../_restaurantSearch';
import { AdminRestaurantSearch } from '../AdminRestaurantSearch';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const AdminModulesPage = async (props: {
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
          <h2 className="text-xl font-semibold">Modules & integrations</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            View and manage optional module access for each restaurant client. These toggles are lightweight foundations and do not activate a full integration yet.
          </p>
        </div>
      </div>

      <AdminRestaurantSearch
        action="/admin/modules"
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
                    {MODULES.map(module => (
                      <TableHead key={module.key}>{module.title}</TableHead>
                    ))}
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIds.map((organizationId, index) => {
                    const organization = organizationRecords.get(organizationId);

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
                        {MODULES.map((module) => {
                          const enabled = organizationHasModule(organization, module.key);

                          return (
                            <TableCell key={module.key}>
                              <span className={enabled
                                ? 'rounded-full border border-green-300 bg-green-50 px-2 py-1 text-xs font-medium text-green-900'
                                : 'rounded-full border bg-muted px-2 py-1 text-xs font-medium text-muted-foreground'}
                              >
                                {enabled ? 'Enabled' : 'Disabled'}
                              </span>
                            </TableCell>
                          );
                        })}
                        <TableCell className="text-right">
                          <Link
                            href={`/admin/modules/${organizationId}`}
                            className="inline-flex rounded-md border border-input bg-background px-3 py-2 text-xs font-semibold hover:bg-muted"
                          >
                            Manage modules
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

export default AdminModulesPage;

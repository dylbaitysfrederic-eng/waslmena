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

const getMaturityClassName = (maturity: string) => {
  if (maturity === 'MVP available') {
    return 'border-amber-300 bg-amber-50 text-amber-950';
  }

  if (maturity === 'Coming soon') {
    return 'border-blue-300 bg-blue-50 text-blue-950';
  }

  if (maturity === 'Planned') {
    return 'border-muted bg-muted text-muted-foreground';
  }

  return 'border-green-300 bg-green-50 text-green-950';
};

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
            View and manage optional module access for each restaurant client. Future-module flags mark commercial readiness only and do not activate full integrations until Wasl configures them.
          </p>
        </div>
      </div>

      <div className="mb-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {MODULES.map(module => (
          <div key={module.key} className="rounded-md border bg-background p-4">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold">{module.title}</h3>
              <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${getMaturityClassName(module.maturity)}`}>
                {module.maturity}
              </span>
            </div>
            <p className="mt-3 text-sm text-foreground">{module.description}</p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              {module.positioning}
            </p>
          </div>
        ))}
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
                            <TableCell key={module.key} className="min-w-36">
                              <span className={enabled
                                ? 'inline-flex rounded-full border border-green-300 bg-green-50 px-2 py-1 text-xs font-medium text-green-900'
                                : 'inline-flex rounded-full border bg-muted px-2 py-1 text-xs font-medium text-muted-foreground'}
                              >
                                {enabled ? 'Enabled' : 'Disabled'}
                              </span>
                              <span className={`mt-2 inline-flex rounded-full border px-2 py-1 text-xs font-medium ${getMaturityClassName(module.maturity)}`}>
                                {module.maturity}
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

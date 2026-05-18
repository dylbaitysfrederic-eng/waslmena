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

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const AdminMenuPage = async () => {
  const {
    ids,
    organizationRecords,
    menuItemCountByOrganizationId,
  } = await getAdminOrganizations();
  return (
    <section className="rounded-md bg-background p-5">
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Menu setup</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Configure starter categories and menu items for restaurants. Open a client to manage menus.
          </p>
        </div>
      </div>

      {ids.length === 0
        ? (
            <div className="rounded-md border p-8 text-center text-muted-foreground">
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
                    <TableHead className="text-right">Menu items</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ids.map((organizationId, index) => {
                    const organization = organizationRecords.get(organizationId);
                    const itemCount = menuItemCountByOrganizationId.get(organizationId) ?? 0;
                    const clientName = organization?.restaurantDisplayName
                      || 'Unnamed restaurant';
                    const hasItems = itemCount > 0;

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
                          {itemCount}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex w-fit rounded-md border px-2 py-1 text-xs font-semibold ${
                              hasItems
                                ? 'border-green-300 bg-green-50 text-green-950'
                                : 'border-amber-300 bg-amber-50 text-amber-950'
                            }`}
                          >
                            {hasItems ? 'Configured' : 'Empty'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Link
                            href={`/admin/menu/${organizationId}`}
                            className="inline-flex rounded-md border border-input bg-background px-3 py-2 text-xs font-semibold hover:bg-muted"
                          >
                            Manage menu
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

export default AdminMenuPage;

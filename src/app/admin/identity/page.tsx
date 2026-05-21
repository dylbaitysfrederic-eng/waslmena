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

const AdminIdentityPage = async () => {
  const {
    ids,
    organizationRecords,
  } = await getAdminOrganizations();

  return (
    <section className="rounded-md bg-background p-5">
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Identity & Branding</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage each restaurant’s public identity, contact details, theme colors, and welcome screen.
          </p>
        </div>
      </div>

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
                    <TableHead>Welcome screen</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ids.map((organizationId, index) => {
                    const organization = organizationRecords.get(organizationId);
                    const clientName = organization?.restaurantDisplayName
                      || 'Unnamed restaurant';
                    const welcomeReady = Boolean(
                      organization?.welcomeScreenEnabled
                      && organization?.welcomeImageUrl,
                    );

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
                          <span className={
                            welcomeReady
                              ? 'rounded-full border border-green-300 bg-green-50 px-2 py-1 text-xs font-medium text-green-900'
                              : 'rounded-full border bg-muted px-2 py-1 text-xs font-medium text-muted-foreground'
                          }
                          >
                            {welcomeReady ? 'Enabled' : 'Menu opens directly'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Link
                            href={`/admin/identity/${organizationId}`}
                            className="inline-flex rounded-md border border-input bg-background px-3 py-2 text-xs font-semibold hover:bg-muted"
                          >
                            Manage identity
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

export default AdminIdentityPage;

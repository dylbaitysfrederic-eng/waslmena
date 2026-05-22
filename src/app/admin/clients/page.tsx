import Link from 'next/link';

import { FormSubmitButton } from '@/components/FormSubmitButton';
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
  getStatusBadgeClassName,
} from '../_helpers';
import {
  filterAdminRestaurantIds,
  getAdminRestaurantSearchQuery,
} from '../_restaurantSearch';
import { syncClerkOrganizationsAction } from '../actions';
import { AdminRestaurantSearch } from '../AdminRestaurantSearch';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const statusBadgeClassName = (status: string) => {
  return `inline-flex w-fit rounded-md border px-2 py-1 text-xs font-semibold ${getStatusBadgeClassName(status)}`;
};

const getSyncCount = (value: string | string[] | undefined) => {
  const textValue = Array.isArray(value) ? value.at(0) : value;
  const count = Number.parseInt(textValue ?? '', 10);

  return Number.isNaN(count) || count < 0 ? null : count;
};

const getContactName = (organization: {
  mainContactFirstName: string | null;
  mainContactLastName: string | null;
} | undefined) => {
  const contactName = [
    organization?.mainContactFirstName,
    organization?.mainContactLastName,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();

  return contactName || '-';
};

const AdminClientsPage = async (props: {
  searchParams?: {
    q?: string | string[];
    syncCreated?: string | string[];
    syncExisting?: string | string[];
  };
}) => {
  const {
    ids,
    organizationRecords,
  } = await getAdminOrganizations();
  const syncCreated = getSyncCount(props.searchParams?.syncCreated);
  const syncExisting = getSyncCount(props.searchParams?.syncExisting);
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
          <h2 className="text-xl font-semibold">Restaurant clients</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Compact client index. Open a client to manage identity, billing,
            access, and template shortcuts.
          </p>
        </div>
        <form action={syncClerkOrganizationsAction}>
          <FormSubmitButton size="sm" variant="secondary" pendingLabel="Syncing...">
            Sync Clerk organizations
          </FormSubmitButton>
        </form>
      </div>

      {syncCreated !== null && syncExisting !== null && (
        <div className="mb-4 rounded-md border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-950">
          Clerk sync complete:
          {' '}
          {syncCreated}
          {' '}
          created,
          {' '}
          {syncExisting}
          {' '}
          already existing.
        </div>
      )}

      <AdminRestaurantSearch
        action="/admin/clients"
        resultCount={filteredIds.length}
        searchQuery={searchQuery}
        totalCount={ids.length}
      />

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
                    <TableHead>Contact</TableHead>
                    <TableHead>WhatsApp</TableHead>
                    <TableHead>Access</TableHead>
                    <TableHead>Subscription</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIds.map((organizationId, index) => {
                    const organization = organizationRecords.get(organizationId);
                    const subscriptionStatus = organization?.subscriptionStatus ?? 'trial';
                    const paymentStatus = organization?.monthlySubscriptionStatus ?? 'paused';
                    const accessStatus = organization?.accessStatus ?? 'pending';
                    const clientName = organization?.restaurantDisplayName
                      || 'Unnamed restaurant';

                    return (
                      <TableRow key={organizationId}>
                        <TableCell className="font-medium">
                          {String(index + 1).padStart(3, '0')}
                        </TableCell>
                        <TableCell className="min-w-56">
                          <Link
                            href={`/admin/clients/${organizationId}`}
                            className="font-semibold hover:underline"
                          >
                            {clientName}
                          </Link>
                          <code className="mt-1 block max-w-64 truncate text-xs text-muted-foreground">
                            {organizationId}
                          </code>
                        </TableCell>
                        <TableCell>
                          {formatAdminLabel(
                            organization?.clientCategory ?? 'restaurant',
                          )}
                        </TableCell>
                        <TableCell>{getContactName(organization)}</TableCell>
                        <TableCell>
                          {organization?.mainContactWhatsappNumber ?? '-'}
                        </TableCell>
                        <TableCell>
                          <span className={statusBadgeClassName(accessStatus)}>
                            {formatAdminLabel(accessStatus)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={statusBadgeClassName(subscriptionStatus)}>
                            {formatAdminLabel(subscriptionStatus)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex w-fit rounded-md border bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">
                            {formatAdminLabel(paymentStatus)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Link
                            href={`/admin/clients/${organizationId}`}
                            className="inline-flex rounded-md border border-input bg-background px-3 py-2 text-xs font-semibold hover:bg-muted"
                          >
                            Open
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

export default AdminClientsPage;

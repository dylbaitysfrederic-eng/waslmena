import { ArrowUpDown } from 'lucide-react';
import Link from 'next/link';

import { FormSubmitButton } from '@/components/FormSubmitButton';
import { Input } from '@/components/ui/input';
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
  formatDate,
  formatDateInputValue,
  getAdminOrganizations,
  getOverdueDuration,
  getStatusBadgeClassName,
} from '../_helpers';
import {
  markClientPaymentPaidAction,
  restoreClientAccessAction,
  suspendClientAccessAction,
  updateAdminClientAction,
} from '../actions';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const AdminClientsPage = async () => {
  const {
    ids,
    organizationRecords,
  } = await getAdminOrganizations();

  return (
    <section className="rounded-md bg-background p-5">
      <div className="mb-5">
        <h2 className="text-xl font-semibold">Restaurant clients</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage SaaS-owner client records and internal notes. Restaurant menus,
          tables, and orders stay in the dashboard.
        </p>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer">
                <span className="inline-flex items-center gap-1">
                  Restaurant / Organization
                  <ArrowUpDown className="size-3" />
                </span>
              </TableHead>
              <TableHead className="cursor-pointer">
                <span className="inline-flex items-center gap-1">
                  Salesperson
                  <ArrowUpDown className="size-3" />
                </span>
              </TableHead>
              <TableHead className="cursor-pointer">
                <span className="inline-flex items-center gap-1">
                  Subscription status
                  <ArrowUpDown className="size-3" />
                </span>
              </TableHead>
              <TableHead className="cursor-pointer">
                <span className="inline-flex items-center gap-1">
                  Payment status
                  <ArrowUpDown className="size-3" />
                </span>
              </TableHead>
              <TableHead className="cursor-pointer">
                <span className="inline-flex items-center gap-1">
                  Payment method
                  <ArrowUpDown className="size-3" />
                </span>
              </TableHead>
              <TableHead className="cursor-pointer">
                <span className="inline-flex items-center gap-1">
                  Billing cycle
                  <ArrowUpDown className="size-3" />
                </span>
              </TableHead>
              <TableHead className="cursor-pointer">
                <span className="inline-flex items-center gap-1">
                  Last payment
                  <ArrowUpDown className="size-3" />
                </span>
              </TableHead>
              <TableHead className="cursor-pointer">
                <span className="inline-flex items-center gap-1">
                  Renewal date
                  <ArrowUpDown className="size-3" />
                </span>
              </TableHead>
              <TableHead className="cursor-pointer">
                <span className="inline-flex items-center gap-1">
                  Next due
                  <ArrowUpDown className="size-3" />
                </span>
              </TableHead>
              <TableHead className="cursor-pointer">
                <span className="inline-flex items-center gap-1">
                  Overdue
                  <ArrowUpDown className="size-3" />
                </span>
              </TableHead>
              <TableHead className="cursor-pointer">
                <span className="inline-flex items-center gap-1">
                  Access
                  <ArrowUpDown className="size-3" />
                </span>
              </TableHead>
              <TableHead className="cursor-pointer">Actions / notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ids.map((organizationId) => {
              const organization = organizationRecords.get(organizationId);
              const subscriptionStatus = organization?.subscriptionStatus ?? 'trial';
              const paymentStatus = organization?.monthlySubscriptionStatus ?? 'paused';
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
                  <TableCell className="align-top text-sm">
                    {organization?.assignedSalesperson || (
                      <span className="text-muted-foreground">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell className="align-top">
                    <span
                      className={`inline-flex w-fit rounded-md border px-2 py-1 text-xs font-semibold ${getStatusBadgeClassName(subscriptionStatus)}`}
                    >
                      {formatAdminLabel(subscriptionStatus)}
                    </span>
                  </TableCell>
                  <TableCell className="align-top text-sm">
                    {formatAdminLabel(paymentStatus)}
                  </TableCell>
                  <TableCell className="align-top text-sm">
                    {formatAdminLabel(organization?.subscriptionPaymentMethod ?? 'cash')}
                  </TableCell>
                  <TableCell className="align-top text-sm">
                    {formatAdminLabel(organization?.billingCycle ?? 'monthly')}
                  </TableCell>
                  <TableCell className="align-top text-sm">
                    {formatDate(organization?.lastPaymentDate)}
                  </TableCell>
                  <TableCell className="align-top text-sm">
                    {organization?.renewalDate
                      ? formatDate(organization.renewalDate)
                      : organization?.nextPaymentDueDate
                        ? formatDate(organization.nextPaymentDueDate)
                        : 'Not set'}
                  </TableCell>
                  <TableCell className="align-top text-sm">
                    {organization?.nextPaymentDueDate
                      ? formatDate(organization.nextPaymentDueDate)
                      : 'Not set'}
                  </TableCell>
                  <TableCell className="align-top text-sm">
                    {subscriptionStatus === 'overdue'
                      ? getOverdueDuration(organization?.overdueSince)
                      : '-'}
                  </TableCell>
                  <TableCell className="align-top text-sm">
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
                  <TableCell className="min-w-[300px] space-y-3 align-top">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/admin/billing?organizationId=${organizationId}`}
                        className="rounded-md border border-input bg-background px-2 py-1 text-xs font-semibold hover:bg-muted"
                      >
                        Billing
                      </Link>
                      <Link
                        href={`/admin/access?organizationId=${organizationId}`}
                        className="rounded-md border border-input bg-background px-2 py-1 text-xs font-semibold hover:bg-muted"
                      >
                        Access
                      </Link>
                      <Link
                        href={`/admin/templates?organizationId=${organizationId}`}
                        className="rounded-md border border-input bg-background px-2 py-1 text-xs font-semibold hover:bg-muted"
                      >
                        Templates
                      </Link>
                    </div>
                    <div className="grid gap-2">
                      <form action={markClientPaymentPaidAction} className="grid gap-2">
                        <input type="hidden" name="organizationId" value={organizationId} />
                        <input type="hidden" name="billingCycle" value="monthly" />
                        <FormSubmitButton size="sm" variant="secondary" pendingLabel="Processing...">
                          Mark monthly paid
                        </FormSubmitButton>
                      </form>
                      <form action={markClientPaymentPaidAction} className="grid gap-2">
                        <input type="hidden" name="organizationId" value={organizationId} />
                        <input type="hidden" name="billingCycle" value="yearly" />
                        <FormSubmitButton size="sm" variant="secondary" pendingLabel="Processing...">
                          Mark yearly paid
                        </FormSubmitButton>
                      </form>
                      <form action={suspendClientAccessAction} className="grid gap-2">
                        <input type="hidden" name="organizationId" value={organizationId} />
                        <FormSubmitButton size="sm" variant="destructive" pendingLabel="Processing..." disabled={accessSuspended}>
                          Suspend access
                        </FormSubmitButton>
                      </form>
                      <form action={restoreClientAccessAction} className="grid gap-2">
                        <input type="hidden" name="organizationId" value={organizationId} />
                        <FormSubmitButton size="sm" variant="secondary" pendingLabel="Processing..." disabled={!accessSuspended}>
                          Restore access
                        </FormSubmitButton>
                      </form>
                    </div>
                  </TableCell>
                  <TableCell className="min-w-[420px] align-top">
                    <form action={updateAdminClientAction} className="grid gap-3">
                      <input type="hidden" name="organizationId" value={organizationId} />
                      <Input
                        name="assignedSalesperson"
                        defaultValue={organization?.assignedSalesperson ?? ''}
                        placeholder="Assigned salesperson"
                      />
                      <Input
                        type="date"
                        name="renewalDate"
                        defaultValue={formatDateInputValue(organization?.renewalDate)}
                      />
                      <Input
                        name="internalAdminNotes"
                        defaultValue={
                          organization?.internalAdminNotes
                          ?? organization?.adminNotes
                          ?? ''
                        }
                        placeholder="Founder notes, onboarding context, relationship history..."
                      />
                      <FormSubmitButton
                        pendingLabel="Saving..."
                        size="sm"
                        className="justify-self-end"
                      >
                        Save client
                      </FormSubmitButton>
                    </form>
                  </TableCell>
                </TableRow>
              );
            })}

            {ids.length === 0 && (
              <TableRow>
                <TableCell colSpan={12} className="py-8 text-center text-muted-foreground">
                  No restaurant clients found yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  );
};

export default AdminClientsPage;

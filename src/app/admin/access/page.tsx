import { FormSubmitButton } from '@/components/FormSubmitButton';
import { SwitchField } from '@/components/SwitchField';
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
  formatDateInputValue,
  getAdminOrganizations,
  getOverdueDuration,
  getStatusBadgeClassName,
  SUBSCRIPTION_STATUSES,
} from '../_helpers';
import { updateAdminAccessAction } from '../actions';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const AdminAccessPage = async () => {
  const {
    ids,
    organizationRecords,
  } = await getAdminOrganizations();

  return (
    <section className="rounded-md bg-background p-5">
      <div className="mb-5">
        <h2 className="text-xl font-semibold">Access controls</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Suspend or restore restaurant dashboard access for commercial or support reasons.
        </p>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Restaurant / Organization</TableHead>
              <TableHead>Current access</TableHead>
              <TableHead>Control</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ids.map((organizationId) => {
              const organization = organizationRecords.get(organizationId);
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
                  <TableCell className="align-top">
                    <div
                      className={
                        accessSuspended
                          ? 'font-semibold text-red-700'
                          : 'font-medium text-green-700'
                      }
                    >
                      {accessSuspended ? 'Suspended' : 'Active'}
                    </div>
                    <span
                      className={`mt-2 inline-flex rounded-md border px-2 py-1 text-xs font-semibold ${getStatusBadgeClassName(subscriptionStatus)}`}
                    >
                      {formatAdminLabel(subscriptionStatus)}
                    </span>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Overdue:
                      {' '}
                      {getOverdueDuration(organization?.overdueSince)}
                    </div>
                  </TableCell>
                  <TableCell className="min-w-[560px] align-top">
                    <form action={updateAdminAccessAction} className="grid gap-3">
                      <input
                        type="hidden"
                        name="organizationId"
                        value={organizationId}
                      />
                      <div className="grid gap-3 md:grid-cols-3">
                        <label
                          htmlFor={`access-subscription-status-${organizationId}`}
                          className="grid gap-1 text-xs font-medium text-muted-foreground"
                        >
                          Subscription status
                          <select
                            id={`access-subscription-status-${organizationId}`}
                            name="subscriptionStatus"
                            defaultValue={subscriptionStatus}
                            className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
                          >
                            {SUBSCRIPTION_STATUSES.map(status => (
                              <option key={status} value={status}>
                                {formatAdminLabel(status)}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label
                          htmlFor={`access-overdue-since-${organizationId}`}
                          className="grid gap-1 text-xs font-medium text-muted-foreground"
                        >
                          Overdue since
                          <Input
                            id={`access-overdue-since-${organizationId}`}
                            name="overdueSince"
                            type="date"
                            defaultValue={formatDateInputValue(organization?.overdueSince)}
                          />
                        </label>
                        <div className="md:pt-4">
                          <SwitchField
                            id={`access-suspended-${organizationId}`}
                            name="accessSuspended"
                            label="Access suspended"
                            description="Block this client from the restaurant dashboard."
                            defaultChecked={accessSuspended}
                          />
                        </div>
                      </div>
                      <Input
                        name="adminNotes"
                        defaultValue={organization?.adminNotes ?? ''}
                        placeholder="Reason for suspension, restore notes, support context..."
                      />
                      <FormSubmitButton
                        pendingLabel="Saving..."
                        size="sm"
                        className="justify-self-end"
                      >
                        Save access
                      </FormSubmitButton>
                    </form>
                  </TableCell>
                </TableRow>
              );
            })}

            {ids.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
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

export default AdminAccessPage;

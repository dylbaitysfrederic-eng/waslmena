import Link from 'next/link';
import { notFound } from 'next/navigation';

import { FormSubmitButton } from '@/components/FormSubmitButton';
import { Input } from '@/components/ui/input';
import {
  getClerkRoleLabel,
  getOperationalRoleLabelKey,
  getRestaurantTeamMembers,
} from '@/utils/RestaurantTeam';

import {
  CLIENT_CATEGORIES,
  formatAdminLabel,
  formatDate,
  formatDateInputValue,
  getAdminOrganizations,
  getOverdueDuration,
  getStatusBadgeClassName,
} from '../../_helpers';
import {
  activateClientAccessAction,
  markClientPaymentPaidAction,
  revokeClientAccessAction,
  suspendClientAccessAction,
  updateAdminClientAction,
} from '../../actions';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const statusBadgeClassName = (status: string) => {
  return `inline-flex w-fit rounded-md border px-2 py-1 text-xs font-semibold ${getStatusBadgeClassName(status)}`;
};

const ClientDetailPage = async (props: { params: { id: string } }) => {
  const { ids, organizationRecords } = await getAdminOrganizations();

  if (!ids.includes(props.params.id)) {
    notFound();
  }

  const organizationId = props.params.id;
  const organization = organizationRecords.get(organizationId);
  const subscriptionStatus = organization?.subscriptionStatus ?? 'trial';
  const paymentStatus = organization?.monthlySubscriptionStatus ?? 'paused';
  const accessStatus = organization?.accessStatus ?? 'pending';
  const clientName = organization?.restaurantDisplayName || 'Unnamed restaurant';
  const { members, unavailable: membersUnavailable } = await getRestaurantTeamMembers(
    organizationId,
  );

  return (
    <section className="grid gap-5">
      <div className="rounded-md bg-background p-5">
        <Link
          href="/admin/clients"
          className="text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          Back to clients
        </Link>
        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-xl font-semibold">{clientName}</h2>
            <code className="mt-1 block text-xs text-muted-foreground">
              {organizationId}
            </code>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className={statusBadgeClassName(accessStatus)}>
              {formatAdminLabel(accessStatus)}
            </span>
            <span className={statusBadgeClassName(subscriptionStatus)}>
              {formatAdminLabel(subscriptionStatus)}
            </span>
            <span className="inline-flex w-fit rounded-md border bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">
              {formatAdminLabel(paymentStatus)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="rounded-md bg-background p-5">
          <h3 className="text-base font-semibold">Client location identity</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            These details define one restaurant branch/location. Multi-branch
            businesses should use separate restaurant profiles so QR codes,
            orders, exports, and settings stay location-scoped.
          </p>

          <form action={updateAdminClientAction} className="mt-5 grid gap-4">
            <input type="hidden" name="organizationId" value={organizationId} />

            <div className="grid gap-3 md:grid-cols-2">
              <label
                htmlFor="restaurant-display-name"
                className="grid gap-1 text-xs font-medium text-muted-foreground"
              >
                Restaurant display name
                <Input
                  id="restaurant-display-name"
                  name="restaurantDisplayName"
                  defaultValue={organization?.restaurantDisplayName ?? ''}
                  placeholder="Cedar Bistro"
                />
              </label>
              <label
                htmlFor="client-category"
                className="grid gap-1 text-xs font-medium text-muted-foreground"
              >
                Client category
                <select
                  id="client-category"
                  name="clientCategory"
                  defaultValue={organization?.clientCategory ?? 'restaurant'}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
                >
                  {CLIENT_CATEGORIES.map(category => (
                    <option key={category} value={category}>
                      {formatAdminLabel(category)}
                    </option>
                  ))}
                </select>
              </label>
              <label
                htmlFor="main-contact-first-name"
                className="grid gap-1 text-xs font-medium text-muted-foreground"
              >
                Main contact first name
                <Input
                  id="main-contact-first-name"
                  name="mainContactFirstName"
                  defaultValue={organization?.mainContactFirstName ?? ''}
                  placeholder="First name"
                />
              </label>
              <label
                htmlFor="main-contact-last-name"
                className="grid gap-1 text-xs font-medium text-muted-foreground"
              >
                Main contact last name
                <Input
                  id="main-contact-last-name"
                  name="mainContactLastName"
                  defaultValue={organization?.mainContactLastName ?? ''}
                  placeholder="Last name"
                />
              </label>
              <label
                htmlFor="main-contact-whatsapp"
                className="grid gap-1 text-xs font-medium text-muted-foreground md:col-span-2"
              >
                Main contact WhatsApp
                <Input
                  id="main-contact-whatsapp"
                  name="mainContactWhatsappNumber"
                  defaultValue={organization?.mainContactWhatsappNumber ?? ''}
                  placeholder="+961 00 000 000"
                />
              </label>
              <label
                htmlFor="restaurant-address"
                className="grid gap-1 text-xs font-medium text-muted-foreground md:col-span-2"
              >
                Restaurant branch/location address
                <textarea
                  id="restaurant-address"
                  name="restaurantAddress"
                  defaultValue={organization?.restaurantAddress ?? ''}
                  placeholder="Street, neighborhood, city"
                  maxLength={240}
                  rows={3}
                  className="min-h-20 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                />
              </label>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label
                htmlFor="assigned-salesperson"
                className="grid gap-1 text-xs font-medium text-muted-foreground"
              >
                Assigned salesperson
                <Input
                  id="assigned-salesperson"
                  name="assignedSalesperson"
                  defaultValue={organization?.assignedSalesperson ?? ''}
                  placeholder="Assigned salesperson"
                />
              </label>
              <label
                htmlFor="renewal-date"
                className="grid gap-1 text-xs font-medium text-muted-foreground"
              >
                Renewal date
                <Input
                  id="renewal-date"
                  type="date"
                  name="renewalDate"
                  defaultValue={formatDateInputValue(organization?.renewalDate)}
                />
              </label>
            </div>

            <label
              htmlFor="internal-admin-notes"
              className="grid gap-1 text-xs font-medium text-muted-foreground"
            >
              Internal notes
              <Input
                id="internal-admin-notes"
                name="internalAdminNotes"
                defaultValue={
                  organization?.internalAdminNotes
                  ?? organization?.adminNotes
                  ?? ''
                }
                placeholder="Founder notes, onboarding context, relationship history..."
              />
            </label>

            <FormSubmitButton
              pendingLabel="Saving..."
              size="sm"
              className="justify-self-end"
            >
              Save client details
            </FormSubmitButton>
          </form>
        </div>

        <aside className="grid content-start gap-4">
          <div className="rounded-md border bg-background p-4">
            <div className="text-sm font-semibold">Client summary</div>
            <dl className="mt-3 grid gap-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Category</dt>
                <dd className="font-medium">
                  {formatAdminLabel(organization?.clientCategory ?? 'restaurant')}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Payment method</dt>
                <dd className="font-medium">
                  {formatAdminLabel(organization?.subscriptionPaymentMethod ?? 'cash')}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Billing cycle</dt>
                <dd className="font-medium">
                  {formatAdminLabel(organization?.billingCycle ?? 'monthly')}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Last payment</dt>
                <dd className="font-medium">
                  {formatDate(organization?.lastPaymentDate)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Next due</dt>
                <dd className="font-medium">
                  {formatDate(organization?.nextPaymentDueDate)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Overdue</dt>
                <dd className="font-medium">
                  {subscriptionStatus === 'overdue'
                    ? getOverdueDuration(organization?.overdueSince)
                    : '-'}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-md border bg-background p-4">
            <div className="text-sm font-semibold">Team access</div>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Uses current Clerk organization memberships. Restaurant roles are
              informational for now.
            </p>
            {membersUnavailable
              ? (
                  <div className="mt-3 rounded-md border border-dashed bg-muted/20 p-3 text-xs text-muted-foreground">
                    Members could not be loaded from Clerk.
                  </div>
                )
              : members.length > 0
                ? (
                    <div className="mt-3 grid gap-2">
                      {members.slice(0, 6).map(member => (
                        <div key={member.id} className="rounded-md border bg-muted/20 p-3">
                          <div className="truncate text-sm font-medium">
                            {[member.firstName, member.lastName]
                              .filter(Boolean)
                              .join(' ')
                              || member.email
                              || 'Team member'}
                          </div>
                          {member.email && (
                            <div className="mt-1 truncate text-xs text-muted-foreground">
                              {member.email}
                            </div>
                          )}
                          <div className="mt-2 flex flex-wrap gap-1">
                            <span className="rounded-full border bg-background px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                              {getClerkRoleLabel(member.role)}
                            </span>
                            <span className="rounded-full border bg-background px-2 py-0.5 text-[11px] font-semibold">
                              {getOperationalRoleLabelKey(member.role) === 'role_owner_manager'
                                ? 'Owner / Manager'
                                : 'Staff'}
                            </span>
                          </div>
                        </div>
                      ))}
                      {members.length > 6 && (
                        <div className="text-xs text-muted-foreground">
                          {members.length - 6}
                          {' '}
                          more members in Clerk.
                        </div>
                      )}
                    </div>
                  )
                : (
                    <div className="mt-3 rounded-md border border-dashed bg-muted/20 p-3 text-xs text-muted-foreground">
                      No organization members found in Clerk yet.
                    </div>
                  )}
          </div>

          <div className="flex flex-wrap gap-2 rounded-md border bg-background p-4">
            <Link
              href={`/admin/billing?organizationId=${organizationId}`}
              className="rounded-md border border-input bg-background px-3 py-2 text-xs font-semibold hover:bg-muted"
            >
              Billing
            </Link>
            <Link
              href={`/admin/access?organizationId=${organizationId}`}
              className="rounded-md border border-input bg-background px-3 py-2 text-xs font-semibold hover:bg-muted"
            >
              Access
            </Link>
            <Link
              href={`/admin/templates?organizationId=${organizationId}`}
              className="rounded-md border border-input bg-background px-3 py-2 text-xs font-semibold hover:bg-muted"
            >
              Templates
            </Link>
          </div>

          <div className="grid gap-2 rounded-md border bg-background p-4">
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
            <form action={activateClientAccessAction} className="grid gap-2">
              <input type="hidden" name="organizationId" value={organizationId} />
              <FormSubmitButton
                size="sm"
                variant="secondary"
                pendingLabel="Processing..."
                disabled={accessStatus === 'active'}
              >
                Activate client
              </FormSubmitButton>
            </form>
            <form action={suspendClientAccessAction} className="grid gap-2">
              <input type="hidden" name="organizationId" value={organizationId} />
              <FormSubmitButton
                size="sm"
                variant="destructive"
                pendingLabel="Processing..."
                disabled={accessStatus === 'suspended'}
              >
                Suspend access
              </FormSubmitButton>
            </form>
            <form action={revokeClientAccessAction} className="grid gap-2">
              <input type="hidden" name="organizationId" value={organizationId} />
              <FormSubmitButton
                size="sm"
                variant="destructive"
                pendingLabel="Processing..."
                disabled={accessStatus === 'revoked'}
              >
                Revoke access
              </FormSubmitButton>
            </form>
          </div>
        </aside>
      </div>
    </section>
  );
};

export default ClientDetailPage;

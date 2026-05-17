import Link from 'next/link';

import { FormSubmitButton } from '@/components/FormSubmitButton';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';

import {
  CLIENT_CATEGORIES,
  formatAdminLabel,
  formatDate,
  formatDateInputValue,
  getAdminOrganizations,
  getOverdueDuration,
  getStatusBadgeClassName,
} from '../_helpers';
import {
  activateClientAccessAction,
  markClientPaymentPaidAction,
  revokeClientAccessAction,
  suspendClientAccessAction,
  updateAdminClientAction,
} from '../actions';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const statusBadgeClassName = (status: string) => {
  return `inline-flex w-fit rounded-md border px-2 py-1 text-xs font-semibold ${getStatusBadgeClassName(status)}`;
};

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
          Manage client identity, contact details, billing shortcuts, and access
          actions. Restaurant menus, tables, and orders stay in the dashboard.
        </p>
      </div>

      {ids.length === 0 && (
        <div className="rounded-md border p-8 text-center text-muted-foreground">
          No restaurant clients found yet.
        </div>
      )}

      {ids.length > 0 && (
        <Accordion type="single" collapsible className="space-y-3">
          {ids.map((organizationId) => {
            const organization = organizationRecords.get(organizationId);
            const subscriptionStatus = organization?.subscriptionStatus ?? 'trial';
            const paymentStatus = organization?.monthlySubscriptionStatus ?? 'paused';
            const accessStatus = organization?.accessStatus ?? 'pending';
            const clientName = organization?.restaurantDisplayName || 'Unnamed restaurant';

            return (
              <AccordionItem
                key={organizationId}
                value={organizationId}
                className="rounded-md border bg-card px-4"
              >
                <AccordionTrigger className="gap-4 py-4 text-left hover:no-underline">
                  <div className="grid flex-1 gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                    <div className="min-w-0">
                      <div className="truncate text-base font-semibold">
                        {clientName}
                      </div>
                      <code className="mt-1 block truncate text-xs text-muted-foreground">
                        {organizationId}
                      </code>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className={statusBadgeClassName(subscriptionStatus)}>
                        {formatAdminLabel(subscriptionStatus)}
                      </span>
                      <span className={statusBadgeClassName(accessStatus)}>
                        {formatAdminLabel(accessStatus)}
                      </span>
                      <span className="inline-flex w-fit rounded-md border bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">
                        {formatAdminLabel(paymentStatus)}
                      </span>
                    </div>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="pb-5 text-foreground">
                  <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
                    <form action={updateAdminClientAction} className="grid gap-4">
                      <input type="hidden" name="organizationId" value={organizationId} />

                      <div className="grid gap-3 md:grid-cols-2">
                        <label
                          htmlFor={`restaurant-display-name-${organizationId}`}
                          className="grid gap-1 text-xs font-medium text-muted-foreground"
                        >
                          Restaurant display name
                          <Input
                            id={`restaurant-display-name-${organizationId}`}
                            name="restaurantDisplayName"
                            defaultValue={organization?.restaurantDisplayName ?? ''}
                            placeholder="Cedar Bistro"
                          />
                        </label>
                        <label
                          htmlFor={`client-category-${organizationId}`}
                          className="grid gap-1 text-xs font-medium text-muted-foreground"
                        >
                          Client category
                          <select
                            id={`client-category-${organizationId}`}
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
                          htmlFor={`main-contact-first-name-${organizationId}`}
                          className="grid gap-1 text-xs font-medium text-muted-foreground"
                        >
                          Main contact first name
                          <Input
                            id={`main-contact-first-name-${organizationId}`}
                            name="mainContactFirstName"
                            defaultValue={organization?.mainContactFirstName ?? ''}
                            placeholder="First name"
                          />
                        </label>
                        <label
                          htmlFor={`main-contact-last-name-${organizationId}`}
                          className="grid gap-1 text-xs font-medium text-muted-foreground"
                        >
                          Main contact last name
                          <Input
                            id={`main-contact-last-name-${organizationId}`}
                            name="mainContactLastName"
                            defaultValue={organization?.mainContactLastName ?? ''}
                            placeholder="Last name"
                          />
                        </label>
                        <label
                          htmlFor={`main-contact-whatsapp-${organizationId}`}
                          className="grid gap-1 text-xs font-medium text-muted-foreground md:col-span-2"
                        >
                          Main contact WhatsApp
                          <Input
                            id={`main-contact-whatsapp-${organizationId}`}
                            name="mainContactWhatsappNumber"
                            defaultValue={organization?.mainContactWhatsappNumber ?? ''}
                            placeholder="+961 00 000 000"
                          />
                        </label>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <label
                          htmlFor={`assigned-salesperson-${organizationId}`}
                          className="grid gap-1 text-xs font-medium text-muted-foreground"
                        >
                          Assigned salesperson
                          <Input
                            id={`assigned-salesperson-${organizationId}`}
                            name="assignedSalesperson"
                            defaultValue={organization?.assignedSalesperson ?? ''}
                            placeholder="Assigned salesperson"
                          />
                        </label>
                        <label
                          htmlFor={`renewal-date-${organizationId}`}
                          className="grid gap-1 text-xs font-medium text-muted-foreground"
                        >
                          Renewal date
                          <Input
                            id={`renewal-date-${organizationId}`}
                            type="date"
                            name="renewalDate"
                            defaultValue={formatDateInputValue(organization?.renewalDate)}
                          />
                        </label>
                      </div>

                      <label
                        htmlFor={`internal-admin-notes-${organizationId}`}
                        className="grid gap-1 text-xs font-medium text-muted-foreground"
                      >
                        Internal notes
                        <Input
                          id={`internal-admin-notes-${organizationId}`}
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

                    <div className="grid content-start gap-4">
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

                      <div className="flex flex-wrap gap-2">
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
                        <form action={activateClientAccessAction} className="grid gap-2">
                          <input type="hidden" name="organizationId" value={organizationId} />
                          <FormSubmitButton size="sm" variant="secondary" pendingLabel="Processing..." disabled={accessStatus === 'active'}>
                            Activate client
                          </FormSubmitButton>
                        </form>
                        <form action={suspendClientAccessAction} className="grid gap-2">
                          <input type="hidden" name="organizationId" value={organizationId} />
                          <FormSubmitButton size="sm" variant="destructive" pendingLabel="Processing..." disabled={accessStatus === 'suspended'}>
                            Suspend access
                          </FormSubmitButton>
                        </form>
                        <form action={revokeClientAccessAction} className="grid gap-2">
                          <input type="hidden" name="organizationId" value={organizationId} />
                          <FormSubmitButton size="sm" variant="destructive" pendingLabel="Processing..." disabled={accessStatus === 'revoked'}>
                            Revoke access
                          </FormSubmitButton>
                        </form>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </section>
  );
};

export default AdminClientsPage;

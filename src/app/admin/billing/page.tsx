import { FormSubmitButton } from '@/components/FormSubmitButton';
import { Input } from '@/components/ui/input';

import {
  BILLING_CYCLES,
  formatAdminLabel,
  formatDate,
  formatDateInputValue,
  getAdminOrganizations,
  getOverdueDuration,
  getStatusBadgeClassName,
  MONTHLY_SUBSCRIPTION_STATUSES,
  SETUP_FEE_STATUSES,
  SUBSCRIPTION_PAYMENT_METHODS,
  SUBSCRIPTION_STATUSES,
} from '../_helpers';
import { updateAdminBillingAction } from '../actions';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const AdminBillingPage = async () => {
  const {
    ids,
    organizationRecords,
  } = await getAdminOrganizations();

  return (
    <section className="grid gap-4">
      <div className="rounded-md bg-background p-5">
        <h2 className="text-xl font-semibold">Manual billing</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Track SaaS subscription and setup payments for restaurant clients.
          This does not duplicate customer ordering or restaurant operations.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Manual tracking only: no Stripe, no crypto processing, and no automated
          online payment collection is triggered from this page.
        </p>
      </div>

      {ids.map((organizationId) => {
        const organization = organizationRecords.get(organizationId);
        const subscriptionStatus = organization?.subscriptionStatus ?? 'trial';

        return (
          <form
            key={organizationId}
            action={updateAdminBillingAction}
            className="rounded-md bg-background p-5"
          >
            <input type="hidden" name="organizationId" value={organizationId} />
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="font-semibold">
                  {organization?.restaurantDisplayName || 'Unnamed restaurant'}
                </h3>
                <code className="text-xs text-muted-foreground">{organizationId}</code>
              </div>
              <span
                className={`inline-flex w-fit rounded-md border px-2 py-1 text-xs font-semibold ${getStatusBadgeClassName(subscriptionStatus)}`}
              >
                {formatAdminLabel(subscriptionStatus)}
              </span>
            </div>

            <div className="grid gap-3 lg:grid-cols-4">
              <label
                htmlFor={`subscription-payment-method-${organizationId}`}
                className="grid gap-1 text-xs font-medium text-muted-foreground"
              >
                Payment method
                <select
                  id={`subscription-payment-method-${organizationId}`}
                  name="subscriptionPaymentMethod"
                  defaultValue={organization?.subscriptionPaymentMethod ?? 'cash'}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
                >
                  {SUBSCRIPTION_PAYMENT_METHODS.map(method => (
                    <option key={method} value={method}>
                      {formatAdminLabel(method)}
                    </option>
                  ))}
                </select>
              </label>
              <label
                htmlFor={`billing-cycle-${organizationId}`}
                className="grid gap-1 text-xs font-medium text-muted-foreground"
              >
                Billing cycle
                <select
                  id={`billing-cycle-${organizationId}`}
                  name="billingCycle"
                  defaultValue={organization?.billingCycle ?? 'monthly'}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
                >
                  {BILLING_CYCLES.map(cycle => (
                    <option key={cycle} value={cycle}>
                      {formatAdminLabel(cycle)}
                    </option>
                  ))}
                </select>
              </label>
              <label
                htmlFor={`subscription-amount-${organizationId}`}
                className="grid gap-1 text-xs font-medium text-muted-foreground"
              >
                Subscription USD
                <Input
                  id={`subscription-amount-${organizationId}`}
                  name="subscriptionAmountUsd"
                  type="number"
                  min={0}
                  step={1}
                  defaultValue={organization?.subscriptionAmountUsd ?? ''}
                  placeholder="99"
                />
              </label>
              <label
                htmlFor={`subscription-status-${organizationId}`}
                className="grid gap-1 text-xs font-medium text-muted-foreground"
              >
                Subscription status
                <select
                  id={`subscription-status-${organizationId}`}
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
                htmlFor={`last-payment-${organizationId}`}
                className="grid gap-1 text-xs font-medium text-muted-foreground"
              >
                Last payment
                <Input
                  id={`last-payment-${organizationId}`}
                  name="lastPaymentDate"
                  type="date"
                  defaultValue={formatDateInputValue(organization?.lastPaymentDate)}
                />
              </label>
              <label
                htmlFor={`next-payment-due-${organizationId}`}
                className="grid gap-1 text-xs font-medium text-muted-foreground"
              >
                Next payment due
                <Input
                  id={`next-payment-due-${organizationId}`}
                  name="nextPaymentDueDate"
                  type="date"
                  defaultValue={formatDateInputValue(organization?.nextPaymentDueDate)}
                />
              </label>
              <label
                htmlFor={`overdue-since-${organizationId}`}
                className="grid gap-1 text-xs font-medium text-muted-foreground"
              >
                Overdue since
                <Input
                  id={`overdue-since-${organizationId}`}
                  name="overdueSince"
                  type="date"
                  defaultValue={formatDateInputValue(organization?.overdueSince)}
                />
              </label>
              <div className="rounded-md border p-3 text-sm">
                <div className="text-xs font-medium text-muted-foreground">Next due</div>
                <div>{formatDate(organization?.nextPaymentDueDate)}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Overdue:
                  {' '}
                  {getOverdueDuration(organization?.overdueSince)}
                </div>
              </div>
              <label
                htmlFor={`setup-fee-amount-${organizationId}`}
                className="grid gap-1 text-xs font-medium text-muted-foreground"
              >
                Setup fee USD
                <Input
                  id={`setup-fee-amount-${organizationId}`}
                  name="setupFeeAmountUsd"
                  type="number"
                  min={0}
                  step={1}
                  defaultValue={organization?.setupFeeAmountUsd ?? ''}
                  placeholder="500"
                />
              </label>
              <label
                htmlFor={`setup-fee-status-${organizationId}`}
                className="grid gap-1 text-xs font-medium text-muted-foreground"
              >
                Setup fee status
                <select
                  id={`setup-fee-status-${organizationId}`}
                  name="setupFeeStatus"
                  defaultValue={organization?.setupFeeStatus ?? 'unpaid'}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
                >
                  {SETUP_FEE_STATUSES.map(status => (
                    <option key={status} value={status}>
                      {formatAdminLabel(status)}
                    </option>
                  ))}
                </select>
              </label>
              <label
                htmlFor={`monthly-amount-${organizationId}`}
                className="grid gap-1 text-xs font-medium text-muted-foreground"
              >
                Monthly USD
                <Input
                  id={`monthly-amount-${organizationId}`}
                  name="monthlySubscriptionAmountUsd"
                  type="number"
                  min={0}
                  step={1}
                  defaultValue={organization?.monthlySubscriptionAmountUsd ?? ''}
                  placeholder="99"
                />
              </label>
              <label
                htmlFor={`monthly-status-${organizationId}`}
                className="grid gap-1 text-xs font-medium text-muted-foreground"
              >
                Monthly status
                <select
                  id={`monthly-status-${organizationId}`}
                  name="monthlySubscriptionStatus"
                  defaultValue={organization?.monthlySubscriptionStatus ?? 'paused'}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
                >
                  {MONTHLY_SUBSCRIPTION_STATUSES.map(status => (
                    <option key={status} value={status}>
                      {formatAdminLabel(status)}
                    </option>
                  ))}
                </select>
              </label>
              <label
                htmlFor={`next-billing-${organizationId}`}
                className="grid gap-1 text-xs font-medium text-muted-foreground"
              >
                Next billing date
                <Input
                  id={`next-billing-${organizationId}`}
                  name="nextBillingDate"
                  type="date"
                  defaultValue={formatDateInputValue(organization?.nextBillingDate)}
                />
              </label>
              <label
                htmlFor={`payment-note-${organizationId}`}
                className="grid gap-1 text-xs font-medium text-muted-foreground lg:col-span-2"
              >
                Payment method note
                <Input
                  id={`payment-note-${organizationId}`}
                  name="paymentMethodNote"
                  defaultValue={organization?.paymentMethodNote ?? ''}
                  placeholder="Cash, bank transfer, invoice reference..."
                />
              </label>
              <label
                htmlFor={`admin-payment-notes-${organizationId}`}
                className="grid gap-1 text-xs font-medium text-muted-foreground lg:col-span-2"
              >
                Admin payment notes
                <Input
                  id={`admin-payment-notes-${organizationId}`}
                  name="adminPaymentNotes"
                  defaultValue={organization?.adminPaymentNotes ?? ''}
                  placeholder="Manual payment context, reminders, collection notes..."
                />
              </label>
            </div>

            <FormSubmitButton
              pendingLabel="Saving..."
              size="sm"
              className="mt-4 justify-self-end"
            >
              Save billing
            </FormSubmitButton>
          </form>
        );
      })}

      {ids.length === 0 && (
        <div className="rounded-md bg-background p-8 text-center text-sm text-muted-foreground">
          No restaurant clients found yet.
        </div>
      )}
    </section>
  );
};

export default AdminBillingPage;

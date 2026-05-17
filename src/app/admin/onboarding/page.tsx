import { FormSubmitButton } from '@/components/FormSubmitButton';
import { Input } from '@/components/ui/input';

import {
  BILLING_CYCLES,
  formatAdminLabel,
  MONTHLY_SUBSCRIPTION_STATUSES,
  ORDERING_MODES,
  QR_MODES,
  RESTAURANT_PROFILES,
  SETUP_FEE_STATUSES,
  SUBSCRIPTION_PAYMENT_METHODS,
  SUBSCRIPTION_STATUSES,
} from '../_helpers';
import { createAdminOnboardingAction } from '../actions';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const statusMessages = {
  created: {
    title: 'Client created and owner invited',
    description: 'The Clerk organization was created, the local restaurant client was initialized, and an owner invitation was sent.',
    className: 'border-green-300 bg-green-50 text-green-950',
  },
  created_invite_failed: {
    title: 'Client created, invitation needs manual follow-up',
    description: 'The Clerk organization and local restaurant client were created, but Clerk did not send the invitation. Invite the owner manually from Clerk or retry onboarding.',
    className: 'border-amber-300 bg-amber-50 text-amber-950',
  },
  missing_fields: {
    title: 'Missing required fields',
    description: 'Restaurant display name and owner email are required.',
    className: 'border-red-300 bg-red-50 text-red-950',
  },
  clerk_error: {
    title: 'Clerk organization creation failed',
    description: 'No local client was created. Check Clerk organization settings and try again.',
    className: 'border-red-300 bg-red-50 text-red-950',
  },
} as const;

type AdminOnboardingPageProps = {
  searchParams: {
    organizationId?: string;
    status?: keyof typeof statusMessages;
  };
};

const AdminOnboardingPage = (props: AdminOnboardingPageProps) => {
  const status = props.searchParams.status
    ? statusMessages[props.searchParams.status]
    : null;

  return (
    <section className="grid gap-4">
      <div className="rounded-md bg-background p-5">
        <h2 className="text-xl font-semibold">Client onboarding</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Create a Clerk organization for a new restaurant client, initialize the
          local restaurant settings, and invite the owner by email. The invited
          owner receives restaurant organization access only; `/admin` remains
          protected by `ADMIN_EMAILS`.
        </p>
      </div>

      {status && (
        <div className={`rounded-md border p-4 ${status.className}`}>
          <div className="font-semibold">{status.title}</div>
          <p className="mt-1 text-sm">{status.description}</p>
          {props.searchParams.organizationId && (
            <code className="mt-2 block break-all text-xs">
              Organization ID:
              {' '}
              {props.searchParams.organizationId}
            </code>
          )}
        </div>
      )}

      <form
        action={createAdminOnboardingAction}
        className="grid gap-5 rounded-md bg-background p-5"
      >
        <div>
          <h3 className="text-lg font-semibold">Restaurant client</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            These values create the initial SaaS-owner record and restaurant setup.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label
            htmlFor="restaurantDisplayName"
            className="grid gap-1 text-sm font-medium"
          >
            Restaurant display name
            <Input
              id="restaurantDisplayName"
              name="restaurantDisplayName"
              required
              maxLength={100}
              placeholder="Cedar Table"
            />
          </label>

          <label htmlFor="ownerEmail" className="grid gap-1 text-sm font-medium">
            Owner email to invite
            <Input
              id="ownerEmail"
              name="ownerEmail"
              type="email"
              required
              placeholder="owner@example.com"
            />
          </label>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <label
            htmlFor="restaurantProfile"
            className="grid gap-1 text-sm font-medium"
          >
            Initial restaurant profile
            <select
              id="restaurantProfile"
              name="restaurantProfile"
              defaultValue="table_service"
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              {RESTAURANT_PROFILES.map(profile => (
                <option key={profile} value={profile}>
                  {formatAdminLabel(profile)}
                </option>
              ))}
            </select>
          </label>

          <label htmlFor="orderingMode" className="grid gap-1 text-sm font-medium">
            Ordering mode
            <select
              id="orderingMode"
              name="orderingMode"
              defaultValue="table_ordering"
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              {ORDERING_MODES.map(mode => (
                <option key={mode} value={mode}>
                  {formatAdminLabel(mode)}
                </option>
              ))}
            </select>
          </label>

          <label htmlFor="qrMode" className="grid gap-1 text-sm font-medium">
            QR mode
            <select
              id="qrMode"
              name="qrMode"
              defaultValue="per_table"
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              {QR_MODES.map(mode => (
                <option key={mode} value={mode}>
                  {formatAdminLabel(mode)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label
            htmlFor="localCurrencyCode"
            className="grid gap-1 text-sm font-medium"
          >
            Local currency code
            <Input
              id="localCurrencyCode"
              name="localCurrencyCode"
              maxLength={10}
              placeholder="AED"
            />
          </label>

          <label
            htmlFor="localCurrencyLabel"
            className="grid gap-1 text-sm font-medium"
          >
            Local currency label
            <Input
              id="localCurrencyLabel"
              name="localCurrencyLabel"
              maxLength={20}
              placeholder="AED"
            />
          </label>
        </div>

        <p className="text-sm text-muted-foreground">
          Use AED, SAR, QAR, KWD, EGP, MAD, or any local code/label. For Lebanon,
          use code LBP and label LL. USD prices stay optional per menu item.
        </p>

        <div>
          <h3 className="text-lg font-semibold">Initial manual billing</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Optional manual tracking only. This does not trigger Stripe, crypto,
            or online payment automation.
          </p>
        </div>

        <div className="grid gap-3 lg:grid-cols-4">
          <label
            htmlFor="subscriptionPaymentMethod"
            className="grid gap-1 text-sm font-medium"
          >
            Payment method
            <select
              id="subscriptionPaymentMethod"
              name="subscriptionPaymentMethod"
              defaultValue="cash"
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              {SUBSCRIPTION_PAYMENT_METHODS.map(method => (
                <option key={method} value={method}>
                  {formatAdminLabel(method)}
                </option>
              ))}
            </select>
          </label>

          <label htmlFor="billingCycle" className="grid gap-1 text-sm font-medium">
            Billing cycle
            <select
              id="billingCycle"
              name="billingCycle"
              defaultValue="monthly"
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              {BILLING_CYCLES.map(cycle => (
                <option key={cycle} value={cycle}>
                  {formatAdminLabel(cycle)}
                </option>
              ))}
            </select>
          </label>

          <label
            htmlFor="subscriptionStatus"
            className="grid gap-1 text-sm font-medium"
          >
            Subscription status
            <select
              id="subscriptionStatus"
              name="subscriptionStatus"
              defaultValue="trial"
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              {SUBSCRIPTION_STATUSES.map(status => (
                <option key={status} value={status}>
                  {formatAdminLabel(status)}
                </option>
              ))}
            </select>
          </label>

          <label
            htmlFor="subscriptionAmountUsd"
            className="grid gap-1 text-sm font-medium"
          >
            Subscription USD
            <Input
              id="subscriptionAmountUsd"
              name="subscriptionAmountUsd"
              type="number"
              min={0}
              step={1}
              placeholder="99"
            />
          </label>

          <label
            htmlFor="setupFeeAmountUsd"
            className="grid gap-1 text-sm font-medium"
          >
            Setup fee USD
            <Input
              id="setupFeeAmountUsd"
              name="setupFeeAmountUsd"
              type="number"
              min={0}
              step={1}
              placeholder="500"
            />
          </label>

          <label htmlFor="setupFeeStatus" className="grid gap-1 text-sm font-medium">
            Setup fee status
            <select
              id="setupFeeStatus"
              name="setupFeeStatus"
              defaultValue="unpaid"
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              {SETUP_FEE_STATUSES.map(status => (
                <option key={status} value={status}>
                  {formatAdminLabel(status)}
                </option>
              ))}
            </select>
          </label>

          <label
            htmlFor="monthlySubscriptionAmountUsd"
            className="grid gap-1 text-sm font-medium"
          >
            Monthly USD
            <Input
              id="monthlySubscriptionAmountUsd"
              name="monthlySubscriptionAmountUsd"
              type="number"
              min={0}
              step={1}
              placeholder="99"
            />
          </label>

          <label
            htmlFor="monthlySubscriptionStatus"
            className="grid gap-1 text-sm font-medium"
          >
            Monthly status
            <select
              id="monthlySubscriptionStatus"
              name="monthlySubscriptionStatus"
              defaultValue="paused"
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              {MONTHLY_SUBSCRIPTION_STATUSES.map(status => (
                <option key={status} value={status}>
                  {formatAdminLabel(status)}
                </option>
              ))}
            </select>
          </label>

          <label
            htmlFor="nextBillingDate"
            className="grid gap-1 text-sm font-medium"
          >
            Next billing date
            <Input id="nextBillingDate" name="nextBillingDate" type="date" />
          </label>

          <label
            htmlFor="nextPaymentDueDate"
            className="grid gap-1 text-sm font-medium"
          >
            Next payment due
            <Input id="nextPaymentDueDate" name="nextPaymentDueDate" type="date" />
          </label>

          <label
            htmlFor="paymentMethodNote"
            className="grid gap-1 text-sm font-medium lg:col-span-2"
          >
            Payment note
            <Input
              id="paymentMethodNote"
              name="paymentMethodNote"
              placeholder="Cash collection note, bank reference, invoice context..."
            />
          </label>
        </div>

        <FormSubmitButton pendingLabel="Creating client...">
          Create client and invite owner
        </FormSubmitButton>
      </form>
    </section>
  );
};

export default AdminOnboardingPage;

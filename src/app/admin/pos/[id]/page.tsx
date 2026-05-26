import Link from 'next/link';

import { FormSubmitButton } from '@/components/FormSubmitButton';
import { SettingsSection } from '@/components/layout/SettingsSection';
import {
  formatPosProvider,
  formatPosSyncStatus,
  getPosProviderDescription,
  POS_PROVIDERS,
  POS_SYNC_STATUSES,
} from '@/utils/POS';

import { formatAdminLabel, getAdminOrganizations } from '../../_helpers';
import { updateAdminPosConfigAction } from '../../actions';
import { getAdminPosConfigByOrganizationId } from '../queries';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const AdminPOSDetailPage = async (props: {
  params: { id: string };
  searchParams?: { saved?: string };
}) => {
  const { ids, organizationRecords } = await getAdminOrganizations();

  if (!ids.includes(props.params.id)) {
    return null;
  }

  const organizationId = props.params.id;
  const organization = organizationRecords.get(organizationId);
  const restaurantName = organization?.restaurantDisplayName || 'Unnamed restaurant';
  const posConfig = (await getAdminPosConfigByOrganizationId([organizationId]))
    .get(organizationId);
  const provider = posConfig?.provider ?? 'csv_manual';

  return (
    <section className="grid gap-6">
      <div className="rounded-md bg-background p-5">
        <Link
          href="/admin/pos"
          className="text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          Back to POS foundation
        </Link>
        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-xl font-semibold">{restaurantName}</h2>
            <code className="mt-1 block text-xs text-muted-foreground">{organizationId}</code>
          </div>
          <span className="w-fit rounded-full border bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
            {formatAdminLabel(organization?.clientCategory ?? 'restaurant')}
          </span>
        </div>
      </div>

      {props.searchParams?.saved === '1' && (
        <div className="rounded-md border border-green-300 bg-green-50 px-4 py-3 text-sm font-medium text-green-950">
          POS foundation saved.
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-md border bg-background p-4">
          <div className="text-sm font-semibold">Module status</div>
          <div className="mt-3">
            <span className={organization?.posIntegrationEnabled
              ? 'rounded-full border border-green-300 bg-green-50 px-2 py-1 text-xs font-semibold text-green-900'
              : 'rounded-full border bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground'}
            >
              {organization?.posIntegrationEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>
        <div className="rounded-md border bg-background p-4">
          <div className="text-sm font-semibold">Provider</div>
          <p className="mt-2 text-sm">{formatPosProvider(provider)}</p>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            {getPosProviderDescription(provider)}
          </p>
        </div>
        <div className="rounded-md border bg-background p-4">
          <div className="text-sm font-semibold">Sync status</div>
          <p className="mt-2 text-sm">
            {formatPosSyncStatus(posConfig?.syncStatus)}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            No automatic provider sync is active.
          </p>
        </div>
      </div>

      <form action={updateAdminPosConfigAction} className="rounded-md bg-background p-5">
        <input type="hidden" name="organizationId" value={organizationId} />

        <SettingsSection
          title="POS bridge setup"
          description="Store lightweight POS readiness notes for this restaurant. This does not connect an API, send orders to a POS, or create a sync worker."
        >
          <div className="rounded-md border border-muted p-4 text-sm text-muted-foreground">
            <div className="font-semibold text-foreground">CSV/manual first</div>
            <p className="mt-2">
              Wasl is not replacing the POS. This foundation keeps CSV/manual operations practical now and leaves room for provider integrations later.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm">
              <span className="font-medium">Provider placeholder</span>
              <select
                name="provider"
                defaultValue={provider}
                className="rounded-md border border-input bg-background px-3 py-2"
              >
                {POS_PROVIDERS.map(posProvider => (
                  <option key={posProvider} value={posProvider}>
                    {formatPosProvider(posProvider)}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm">
              <span className="font-medium">Sync status</span>
              <select
                name="syncStatus"
                defaultValue={posConfig?.syncStatus ?? 'not_configured'}
                className="rounded-md border border-input bg-background px-3 py-2"
              >
                {POS_SYNC_STATUSES.map(status => (
                  <option key={status} value={status}>
                    {formatPosSyncStatus(status)}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex items-start gap-3 rounded-md border p-3 text-sm">
              <input
                id="pos-enabled"
                type="checkbox"
                name="enabled"
                defaultChecked={posConfig?.enabled ?? false}
                className="mt-1"
              />
              <span>
                <label htmlFor="pos-enabled" className="block font-medium">
                  Mark POS bridge enabled
                </label>
                <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                  Administrative readiness marker only. Use Modules to control restaurant module access.
                </span>
              </span>
            </div>

            <div className="flex items-start gap-3 rounded-md border p-3 text-sm">
              <input
                id="pos-sync-enabled"
                type="checkbox"
                name="syncEnabled"
                defaultChecked={posConfig?.syncEnabled ?? false}
                className="mt-1"
              />
              <span>
                <label htmlFor="pos-sync-enabled" className="block font-medium">
                  Mark sync planned
                </label>
                <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                  Planning marker only. No automatic sync, queue, or provider call is started.
                </span>
              </span>
            </div>

            <div className="flex items-start gap-3 rounded-md border p-3 text-sm">
              <input
                id="pos-test-mode"
                type="checkbox"
                name="testMode"
                defaultChecked={posConfig?.testMode ?? true}
                className="mt-1"
              />
              <span>
                <label htmlFor="pos-test-mode" className="block font-medium">
                  Test mode
                </label>
                <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                  Keep provider discussions and manual checks separated from live operations.
                </span>
              </span>
            </div>

            <label className="grid gap-2 text-sm">
              <span className="font-medium">Provider merchant ID</span>
              <input
                name="providerMerchantId"
                defaultValue={posConfig?.providerMerchantId ?? ''}
                className="rounded-md border border-input bg-background px-3 py-2"
                placeholder="Optional public/provider reference"
              />
            </label>

            <label className="grid gap-2 text-sm md:col-span-2">
              <span className="font-medium">Sync error note</span>
              <textarea
                name="syncErrorMessage"
                defaultValue={posConfig?.syncErrorMessage ?? ''}
                className="min-h-20 rounded-md border border-input bg-background px-3 py-2"
                placeholder="Manual note only. No retry worker reads this yet."
              />
            </label>

            <label className="grid gap-2 text-sm md:col-span-2">
              <span className="font-medium">Provider metadata</span>
              <textarea
                name="providerMetadata"
                defaultValue={posConfig?.providerMetadata ?? ''}
                className="min-h-24 rounded-md border border-input bg-background px-3 py-2"
                placeholder="Optional non-secret JSON/text notes. Do not store API keys or tokens."
              />
            </label>
          </div>
        </SettingsSection>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Provider API integrations, webhooks, queues, and automatic conflict resolution are intentionally not active.
          </p>
          <FormSubmitButton pendingLabel="Saving..." size="sm">
            Save POS foundation
          </FormSubmitButton>
        </div>
      </form>
    </section>
  );
};

export default AdminPOSDetailPage;

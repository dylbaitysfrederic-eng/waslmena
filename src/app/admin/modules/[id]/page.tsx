import Link from 'next/link';

import { FormSubmitButton } from '@/components/FormSubmitButton';
import { SettingsSection } from '@/components/layout/SettingsSection';
import { SwitchField } from '@/components/SwitchField';
import {
  MODULES,
  organizationHasModule,
} from '@/utils/Modules';

import { formatAdminLabel, getAdminOrganizations } from '../../_helpers';
import { updateAdminModulesAction } from '../../actions';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const getMaturityClassName = (maturity: string) => {
  if (maturity === 'MVP available') {
    return 'border-amber-300 bg-amber-50 text-amber-950';
  }

  if (maturity === 'Coming soon') {
    return 'border-blue-300 bg-blue-50 text-blue-950';
  }

  if (maturity === 'Planned') {
    return 'border-muted bg-muted text-muted-foreground';
  }

  return 'border-green-300 bg-green-50 text-green-950';
};

const AdminModulesDetailPage = async (props: {
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

  return (
    <section className="grid gap-6">
      <div className="rounded-md bg-background p-5">
        <Link
          href="/admin/modules"
          className="text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          Back to Modules & integrations
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
          Modules updated.
        </div>
      )}

      <form action={updateAdminModulesAction} className="rounded-md bg-background p-5">
        <input type="hidden" name="organizationId" value={organizationId} />

        <SettingsSection
          title="Modules & integrations"
          description="Enable or disable optional restaurant module flags for this client. Future modules still require setup before any full integration is active."
        >
          <div className="rounded-md border border-muted p-4 text-sm text-muted-foreground">
            <div className="font-semibold text-foreground">Lightweight foundation only</div>
            <p className="mt-2">
              Keep the restaurant context clear: these flags describe which modules this client can discuss, pilot, or prepare for. Enabling future modules does not activate payments, POS, WhatsApp Business automation, loyalty, or advanced delivery integrations until Wasl configures them separately.
            </p>
          </div>

          <div className="grid gap-3">
            {MODULES.map((module) => {
              const enabled = organizationHasModule(organization, module.key);

              return (
                <div key={module.key} className="rounded-md border bg-background p-4">
                  <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-sm font-semibold">{module.title}</h3>
                      <p className="mt-2 text-sm text-foreground">{module.description}</p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <span className={enabled
                        ? 'rounded-full border border-green-300 bg-green-50 px-2 py-1 text-xs font-semibold text-green-900'
                        : 'rounded-full border bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground'}
                      >
                        {enabled ? 'Enabled' : 'Disabled'}
                      </span>
                      <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${getMaturityClassName(module.maturity)}`}>
                        {module.maturity}
                      </span>
                      {module.key === 'whatsappBusiness' && (
                        <span className="rounded-full border border-purple-300 bg-purple-50 px-2 py-1 text-xs font-semibold text-purple-950">
                          Premium
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="mb-3 text-sm leading-6 text-muted-foreground">
                    {module.positioning}
                  </p>
                  <SwitchField
                    id={`module-${module.key}`}
                    name={`${module.key}Enabled`}
                    label={`Enable ${module.title}`}
                    description={module.adminHelper}
                    defaultChecked={enabled}
                  />
                </div>
              );
            })}
          </div>
        </SettingsSection>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Module status is managed at the restaurant level and stays separate from billing and access control.
          </p>
          <FormSubmitButton pendingLabel="Saving..." size="sm">
            Save module settings
          </FormSubmitButton>
        </div>
      </form>
    </section>
  );
};

export default AdminModulesDetailPage;

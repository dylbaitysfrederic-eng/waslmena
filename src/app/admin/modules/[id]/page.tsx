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
          description="Enable optional restaurant modules. These toggles prepare the restaurant for future capability without requiring a full integration yet."
        >
          <div className="rounded-md border border-muted p-4 text-sm text-muted-foreground">
            <div className="font-semibold text-foreground">Lightweight foundation only</div>
            <p className="mt-2">
              Modules are optional and are designed to stay lightweight for weak connections.
              Enabling a module does not yet mean the integration is fully configured.
            </p>
          </div>

          <div className="grid gap-3">
            {MODULES.map(module => (
              <SwitchField
                key={module.key}
                id={`module-${module.key}`}
                name={`${module.key}Enabled`}
                label={module.title}
                description={module.description}
                defaultChecked={organizationHasModule(organization, module.key)}
              />
            ))}
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

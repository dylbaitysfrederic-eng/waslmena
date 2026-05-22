import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import Link from 'next/link';

import { db } from '@/libs/DB';
import { organizationSchema } from '@/models/Schema';
import { getI18nPath } from '@/utils/Helpers';
import {
  MODULES,
  organizationHasModule,
} from '@/utils/Modules';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const DashboardModulesPage = async (props: {
  params: { locale: string };
}) => {
  const { orgId } = await auth();

  const [organization] = orgId
    ? await db
      .select({
        deliveryEnabled: organizationSchema.deliveryEnabled,
        onlinePaymentsEnabled: organizationSchema.onlinePaymentsEnabled,
        posIntegrationEnabled: organizationSchema.posIntegrationEnabled,
        whatsappBusinessEnabled: organizationSchema.whatsappBusinessEnabled,
        loyaltyEnabled: organizationSchema.loyaltyEnabled,
      })
      .from(organizationSchema)
      .where(eq(organizationSchema.id, orgId))
      .limit(1)
    : [];

  return (
    <section className="grid gap-6">
      <div className="rounded-md border bg-background p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold">Modules & integrations</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              See which optional modules are prepared for your restaurant. These toggles are lightweight foundations for future features and do not yet enable active new workflows.
            </p>
          </div>
          <Link
            href={getI18nPath('/dashboard/branding', props.params.locale)}
            className="inline-flex rounded-md border border-input bg-background px-3 py-2 text-sm font-semibold hover:bg-muted"
          >
            Restaurant settings
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {MODULES.map((module) => {
          const enabled = organizationHasModule(organization, module.key);

          return (
            <div key={module.key} className="rounded-md border bg-background p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold">{module.title}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">{module.description}</p>
                </div>
                <span className={enabled
                  ? 'rounded-full border border-green-300 bg-green-50 px-2 py-1 text-xs font-semibold text-green-900'
                  : 'rounded-full border bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground'}
                >
                  {enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              {!enabled && (
                <div className="mt-4 rounded-md border border-dashed border-muted p-3 text-sm text-muted-foreground">
                  Coming soon: this optional module is in preparation and will stay lightweight for weak and mobile connections.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default DashboardModulesPage;

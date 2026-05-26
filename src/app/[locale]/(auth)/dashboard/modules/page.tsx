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
              See what is available for your restaurant now and what is on the Wasl roadmap. Future modules stay informational until Wasl configures them with you.
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
              <div className="flex h-full flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-base font-semibold">{module.title}</h2>
                  <span className={enabled
                    ? 'shrink-0 rounded-full border border-green-300 bg-green-50 px-2 py-1 text-xs font-semibold text-green-900'
                    : 'shrink-0 rounded-full border bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground'}
                  >
                    {enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${getMaturityClassName(module.maturity)}`}>
                    {module.maturity}
                  </span>
                  {module.key === 'whatsappBusiness' && (
                    <span className="rounded-full border border-purple-300 bg-purple-50 px-2 py-1 text-xs font-semibold text-purple-950">
                      Premium
                    </span>
                  )}
                </div>

                <div>
                  <p className="text-sm text-foreground">{module.description}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {module.positioning}
                  </p>
                </div>

                <div className="mt-auto rounded-md border border-dashed border-muted p-3 text-sm text-muted-foreground">
                  {module.maturity === 'MVP available'
                    ? 'Available as an MVP module. Contact Wasl if you want help positioning it for your restaurant operations.'
                    : 'Coming soon: contact Wasl to discuss availability, priority, and setup requirements.'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default DashboardModulesPage;

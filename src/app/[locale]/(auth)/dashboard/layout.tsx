import { auth, clerkClient } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { getTranslations } from 'next-intl/server';

import { DashboardHeader } from '@/features/dashboard/DashboardHeader';
import {
  getCurrentRestaurantDisplayName,
  resolveRestaurantDisplayName,
} from '@/features/dashboard/getRestaurantDisplayName';
import { db } from '@/libs/DB';
import { organizationSchema } from '@/models/Schema';

const ensurePendingClientRecord = async (orgId: string) => {
  let restaurantDisplayName: string | null = null;

  try {
    const client = await clerkClient();
    const clerkOrganization = await client.organizations.getOrganization({
      organizationId: orgId,
    });

    restaurantDisplayName = clerkOrganization.name;
  } catch (error) {
    console.error('Unable to load Clerk organization for pending client', error);
  }

  await db
    .insert(organizationSchema)
    .values({
      id: orgId,
      restaurantDisplayName,
      accessStatus: 'pending',
      accessSuspended: false,
      subscriptionStatus: 'trial',
    })
    .onConflictDoNothing();
};

export async function generateMetadata(props: { params: { locale: string } }) {
  const t = await getTranslations({
    locale: props.params.locale,
    namespace: 'Dashboard',
  });
  const { orgId } = await auth();
  const restaurantDisplayName = await getCurrentRestaurantDisplayName(orgId);

  return {
    title: t('meta_title', { restaurantName: restaurantDisplayName }),
    description: t('meta_description'),
  };
}

export default async function DashboardLayout(props: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const t = await getTranslations({
    locale: props.params.locale,
    namespace: 'DashboardLayout',
  });
  const { orgId } = await auth();
  let [organization] = orgId
    ? await db
      .select({
        accessStatus: organizationSchema.accessStatus,
        accessSuspended: organizationSchema.accessSuspended,
        restaurantDisplayName: organizationSchema.restaurantDisplayName,
      })
      .from(organizationSchema)
      .where(eq(organizationSchema.id, orgId))
      .limit(1)
    : [];

  if (orgId && !organization) {
    await ensurePendingClientRecord(orgId);
    [organization] = await db
      .select({
        accessStatus: organizationSchema.accessStatus,
        accessSuspended: organizationSchema.accessSuspended,
        restaurantDisplayName: organizationSchema.restaurantDisplayName,
      })
      .from(organizationSchema)
      .where(eq(organizationSchema.id, orgId))
      .limit(1);
  }

  const accessStatus = organization?.accessStatus ?? 'pending';
  const isPendingActivation = !orgId || !organization || accessStatus === 'pending';
  const restaurantDisplayName = await resolveRestaurantDisplayName(
    orgId,
    organization?.restaurantDisplayName,
  );

  let dashboardContent: React.ReactNode;

  if (isPendingActivation) {
    dashboardContent = (
      <div className="rounded-md border border-amber-300 bg-background p-6">
        <h1 className="text-xl font-semibold">
          {t('access_pending_title')}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t('access_pending_description')}
        </p>
      </div>
    );
  } else if (accessStatus === 'revoked') {
    dashboardContent = (
      <div className="rounded-md border border-destructive/30 bg-background p-6">
        <h1 className="text-xl font-semibold">
          {t('access_revoked_title')}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t('access_revoked_description')}
        </p>
      </div>
    );
  } else if (accessStatus === 'suspended' || organization?.accessSuspended) {
    dashboardContent = (
      <div className="rounded-md border border-destructive/30 bg-background p-6">
        <h1 className="text-xl font-semibold">
          {t('access_suspended_title')}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t('access_suspended_description')}
        </p>
      </div>
    );
  } else {
    dashboardContent = props.children;
  }

  return (
    <>
      <div className="bg-background shadow-md">
        <div className="mx-auto max-w-screen-xl px-3 py-4">
          <div className="mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t('restaurant_area_label', {
                  restaurantName: restaurantDisplayName,
                })}
              </p>
              <h1 className="mt-1 text-2xl font-semibold">
                {t('restaurant_dashboard_title', {
                  restaurantName: restaurantDisplayName,
                })}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('restaurant_dashboard_helper')}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <DashboardHeader
              settingsLabel={t('settings')}
              menu={[
                {
                  href: '/dashboard/orders',
                  label: t('orders'),
                },
                {
                  href: '/dashboard/menu-items',
                  label: t('menu'),
                },
                {
                  href: '/dashboard/tables',
                  label: t('tables_qr'),
                },
                {
                  href: '/dashboard/statistics',
                  label: t('statistics'),
                },
              ]}
              secondaryMenu={[
                {
                  href: '/dashboard/branding',
                  label: t('branding'),
                },
                {
                  href: '/dashboard/menu-categories',
                  label: t('menu_categories'),
                },
                {
                  href: '/dashboard/pilot-checklist',
                  label: t('pilot_checklist'),
                },
                {
                  href: '/dashboard/pilot-feedback',
                  label: t('pilot_feedback'),
                },
                {
                  href: '/dashboard/support',
                  label: t('support'),
                },
                // PRO: Link to the /dashboard/todos page
                {
                  href: '/dashboard/organization-profile/organization-members',
                  label: t('members'),
                },
                {
                  href: '/dashboard/organization-profile',
                  label: t('settings'),
                },
                // PRO: Link to the /dashboard/billing page
              ]}
            />
          </div>
        </div>
      </div>

      <div className="min-h-[calc(100vh-72px)] bg-muted">
        <div className="mx-auto max-w-screen-xl px-3 pb-16 pt-6">
          {dashboardContent}
        </div>
      </div>
    </>
  );
}

export const dynamic = 'force-dynamic';

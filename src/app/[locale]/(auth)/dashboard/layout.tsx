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
import { cn } from '@/utils/Helpers';
import {
  getRestaurantBrandStyle,
  getRestaurantThemeClassName,
} from '@/utils/RestaurantTheme';

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
        restaurantLogoUrl: organizationSchema.restaurantLogoUrl,
        restaurantPrimaryColor: organizationSchema.restaurantPrimaryColor,
        restaurantAccentColor: organizationSchema.restaurantAccentColor,
        restaurantThemeMode: organizationSchema.restaurantThemeMode,
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
        restaurantLogoUrl: organizationSchema.restaurantLogoUrl,
        restaurantPrimaryColor: organizationSchema.restaurantPrimaryColor,
        restaurantAccentColor: organizationSchema.restaurantAccentColor,
        restaurantThemeMode: organizationSchema.restaurantThemeMode,
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
      <div
        className={cn(
          'sticky top-0 z-40 border-b border-zinc-900/10 bg-background/95 shadow-sm backdrop-blur-sm',
          getRestaurantThemeClassName(organization?.restaurantThemeMode),
        )}
        style={getRestaurantBrandStyle(
          organization?.restaurantPrimaryColor,
          organization?.restaurantAccentColor,
        )}
      >
        <div className="mx-auto max-w-screen-xl px-3 py-4">
          <div
            className="mb-3 border-l-4 pl-3 sm:mb-4"
            style={{ borderColor: 'var(--restaurant-accent)' }}
          >
            <div className="flex items-start gap-3">
              {organization?.restaurantLogoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={organization.restaurantLogoUrl}
                  alt=""
                  className="size-10 rounded-md border bg-background object-cover sm:size-12"
                />
              )}
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t('restaurant_area_label', {
                    restaurantName: restaurantDisplayName,
                  })}
                </p>
                <h1
                  className="mt-1 truncate text-xl font-semibold sm:text-2xl"
                  style={{ color: 'var(--restaurant-primary)' }}
                >
                  {t('restaurant_dashboard_title', {
                    restaurantName: restaurantDisplayName,
                  })}
                </h1>
                <p className="mt-1 hidden text-sm text-muted-foreground sm:block">
                  {t('restaurant_dashboard_helper')}
                </p>
              </div>
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
                {
                  href: '/dashboard/export',
                  label: t('export_backup'),
                },
                {
                  href: '/dashboard/branding',
                  label: t('branding'),
                },
                {
                  href: '/dashboard/support',
                  label: t('support'),
                },
              ]}
              secondaryMenu={[
                {
                  group: t('menu_group_menu'),
                  href: '/dashboard/menu-items',
                  label: t('menu_items'),
                },
                {
                  group: t('menu_group_menu'),
                  href: '/dashboard/menu-categories',
                  label: t('menu_categories'),
                },
                {
                  group: t('menu_group_settings'),
                  href: '/dashboard/branding',
                  label: t('branding'),
                },
                {
                  group: t('menu_group_settings'),
                  href: '/dashboard/export',
                  label: t('export_backup'),
                },
                {
                  group: t('menu_group_settings'),
                  href: '/dashboard/organization-profile',
                  label: t('organization_settings'),
                },
                {
                  group: t('menu_group_settings'),
                  href: '/dashboard/organization-profile/organization-members',
                  label: t('members'),
                },
                {
                  group: t('menu_group_help'),
                  href: '/dashboard/support',
                  label: t('support'),
                },
                {
                  group: t('menu_group_help'),
                  href: '/dashboard/pilot-checklist',
                  label: t('pilot_checklist'),
                },
                {
                  group: t('menu_group_help'),
                  href: '/dashboard/pilot-feedback',
                  label: t('pilot_feedback'),
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

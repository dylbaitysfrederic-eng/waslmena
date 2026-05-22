import { auth } from '@clerk/nextjs/server';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import { DashboardSection } from '@/features/dashboard/DashboardSection';
import { TitleBar } from '@/features/dashboard/TitleBar';
import { getI18nPath } from '@/utils/Helpers';
import {
  getClerkRoleLabel,
  getOperationalRoleLabelKey,
  getRestaurantTeamMembers,
  STAFF_ROLE_GUIDE,
} from '@/utils/RestaurantTeam';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata(props: { params: { locale: string } }) {
  const t = await getTranslations({
    locale: props.params.locale,
    namespace: 'Team',
  });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

const getMemberName = (member: {
  email: string | null;
  firstName: string | null;
  lastName: string | null;
}) => {
  const name = [member.firstName, member.lastName].filter(Boolean).join(' ');

  return name || member.email || 'Team member';
};

const TeamPage = async (props: { params: { locale: string } }) => {
  const { orgId } = await auth();
  const t = await getTranslations('Team');

  if (!orgId) {
    return null;
  }

  const { members, unavailable } = await getRestaurantTeamMembers(orgId);

  return (
    <>
      <TitleBar
        title={t('title_bar')}
        description={t('title_bar_description')}
      />

      <div className="grid gap-5">
        <DashboardSection
          title={t('members_section_title')}
          description={t('members_section_description')}
        >
          {unavailable
            ? (
                <div className="rounded-md border border-dashed bg-background p-4 text-sm text-muted-foreground">
                  {t('members_unavailable')}
                </div>
              )
            : members.length > 0
              ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {members.map(member => (
                      <article
                        key={member.id}
                        className="rounded-md border bg-background p-4"
                      >
                        <div className="flex items-start gap-3">
                          {member.imageUrl
                            ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={member.imageUrl}
                                  alt=""
                                  className="size-10 rounded-full border object-cover"
                                />
                              )
                            : (
                                <div className="flex size-10 items-center justify-center rounded-full border bg-muted text-sm font-semibold">
                                  {getMemberName(member).slice(0, 1).toUpperCase()}
                                </div>
                              )}
                          <div className="min-w-0">
                            <div className="font-semibold">
                              {getMemberName(member)}
                            </div>
                            {member.email && (
                              <div className="mt-1 truncate text-xs text-muted-foreground">
                                {member.email}
                              </div>
                            )}
                            <div className="mt-2 flex flex-wrap gap-1">
                              <span className="rounded-full border bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                                {getClerkRoleLabel(member.role)}
                              </span>
                              <span className="rounded-full border bg-background px-2 py-0.5 text-[11px] font-semibold">
                                {t(getOperationalRoleLabelKey(member.role))}
                              </span>
                            </div>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )
              : (
                  <div className="rounded-md border border-dashed bg-background p-4 text-sm text-muted-foreground">
                    {t('empty_members')}
                  </div>
                )}

          <div className="mt-4 rounded-md border bg-muted/30 p-4 text-sm leading-6 text-muted-foreground">
            {t('invitation_guidance')}
            {' '}
            <Link
              href={getI18nPath(
                '/dashboard/organization-profile/organization-members',
                props.params.locale,
              )}
              className="font-semibold text-foreground underline-offset-4 hover:underline"
            >
              {t('invitation_link')}
            </Link>
          </div>
        </DashboardSection>

        <DashboardSection
          title={t('roles_section_title')}
          description={t('roles_section_description')}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {STAFF_ROLE_GUIDE.map(role => (
              <article key={role.key} className="rounded-md border bg-background p-4">
                <div className="font-semibold">{t(`guide_${role.key}_title`)}</div>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {t(`guide_${role.key}_description`)}
                </p>
                <div className="mt-3 rounded-md border bg-muted/30 px-3 py-2 text-xs font-semibold text-muted-foreground">
                  {t(role.dashboardAccessKey)}
                </div>
              </article>
            ))}
          </div>
          <div className="mt-4 rounded-md border border-dashed bg-background p-4 text-sm leading-6 text-muted-foreground">
            {t('mvp_note')}
          </div>
        </DashboardSection>
      </div>
    </>
  );
};

export default TeamPage;

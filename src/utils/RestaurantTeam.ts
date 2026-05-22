import { clerkClient } from '@clerk/nextjs/server';

import { ORG_ROLE } from '@/types/Auth';

export const STAFF_ROLE_GUIDE = [
  {
    dashboardAccessKey: 'guide_owner_access',
    key: 'owner',
  },
  {
    dashboardAccessKey: 'guide_manager_access',
    key: 'manager',
  },
  {
    dashboardAccessKey: 'guide_service_staff_access',
    key: 'service_staff',
  },
  {
    dashboardAccessKey: 'guide_kitchen_staff_access',
    key: 'kitchen_staff',
  },
] as const;

export const getOperationalRoleLabelKey = (clerkRole: string) => {
  if (clerkRole === ORG_ROLE.ADMIN) {
    return 'role_owner_manager';
  }

  return 'role_staff';
};

export const getClerkRoleLabel = (clerkRole: string) => {
  if (clerkRole === ORG_ROLE.ADMIN) {
    return 'Clerk admin';
  }

  if (clerkRole === ORG_ROLE.MEMBER) {
    return 'Clerk member';
  }

  return clerkRole;
};

export type RestaurantTeamMember = {
  email: string | null;
  firstName: string | null;
  id: string;
  imageUrl: string | null;
  lastName: string | null;
  role: string;
};

export const getRestaurantTeamMembers = async (organizationId: string) => {
  try {
    const client = await clerkClient();
    const memberships = await client.organizations.getOrganizationMembershipList({
      organizationId,
      limit: 100,
    });

    return {
      members: memberships.data.map((membership): RestaurantTeamMember => ({
        email: membership.publicUserData?.identifier ?? null,
        firstName: membership.publicUserData?.firstName ?? null,
        id: membership.id,
        imageUrl: membership.publicUserData?.imageUrl ?? null,
        lastName: membership.publicUserData?.lastName ?? null,
        role: membership.role,
      })),
      unavailable: false,
    };
  } catch (error) {
    console.error('Unable to load restaurant team members', error);

    return {
      members: [],
      unavailable: true,
    };
  }
};

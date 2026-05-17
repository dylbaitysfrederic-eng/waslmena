import { clerkClient } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';

import { db } from '@/libs/DB';
import { organizationSchema } from '@/models/Schema';

export const RESTAURANT_DISPLAY_NAME_FALLBACK = 'Restaurant';

export const normalizeRestaurantDisplayName = (
  value: string | null | undefined,
) => {
  const normalizedValue = value?.trim();

  return normalizedValue && normalizedValue.length > 0
    ? normalizedValue
    : null;
};

export const getClerkOrganizationName = async (orgId: string) => {
  try {
    const client = await clerkClient();
    const organization = await client.organizations.getOrganization({
      organizationId: orgId,
    });

    return normalizeRestaurantDisplayName(organization.name);
  } catch (error) {
    console.error('Unable to resolve Clerk organization name', error);
    return null;
  }
};

export const resolveRestaurantDisplayName = async (
  orgId: string | null | undefined,
  localDisplayName: string | null | undefined,
) => {
  const normalizedLocalName = normalizeRestaurantDisplayName(localDisplayName);

  if (normalizedLocalName) {
    return normalizedLocalName;
  }

  if (!orgId) {
    return RESTAURANT_DISPLAY_NAME_FALLBACK;
  }

  return (
    await getClerkOrganizationName(orgId)
  ) ?? RESTAURANT_DISPLAY_NAME_FALLBACK;
};

export const getCurrentRestaurantDisplayName = async (
  orgId: string | null | undefined,
) => {
  if (!orgId) {
    return RESTAURANT_DISPLAY_NAME_FALLBACK;
  }

  const [organization] = await db
    .select({ restaurantDisplayName: organizationSchema.restaurantDisplayName })
    .from(organizationSchema)
    .where(eq(organizationSchema.id, orgId))
    .limit(1);

  return resolveRestaurantDisplayName(
    orgId,
    organization?.restaurantDisplayName,
  );
};

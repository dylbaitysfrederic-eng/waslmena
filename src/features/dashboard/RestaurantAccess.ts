import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';

import { db } from '@/libs/DB';
import { organizationSchema } from '@/models/Schema';

export const getActiveRestaurantOrganizationId = async () => {
  const { orgId } = await auth();

  if (!orgId) {
    return null;
  }

  const [organization] = await db
    .select({ accessSuspended: organizationSchema.accessSuspended })
    .from(organizationSchema)
    .where(eq(organizationSchema.id, orgId))
    .limit(1);

  if (!organization || organization.accessSuspended) {
    return null;
  }

  return orgId;
};

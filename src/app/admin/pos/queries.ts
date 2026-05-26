import { desc, inArray } from 'drizzle-orm';

import { db } from '@/libs/DB';
import { posProviderConfigSchema } from '@/models/Schema';

export const getAdminPosConfigByOrganizationId = async (
  organizationIds: string[],
) => {
  if (organizationIds.length === 0) {
    return new Map<string, typeof posProviderConfigSchema.$inferSelect>();
  }

  const rows = await db
    .select()
    .from(posProviderConfigSchema)
    .where(inArray(posProviderConfigSchema.organizationId, organizationIds))
    .orderBy(desc(posProviderConfigSchema.createdAt));

  const configByOrganizationId = new Map<
    string,
    typeof posProviderConfigSchema.$inferSelect
  >();

  for (const row of rows) {
    if (!configByOrganizationId.has(row.organizationId)) {
      configByOrganizationId.set(row.organizationId, row);
    }
  }

  return configByOrganizationId;
};

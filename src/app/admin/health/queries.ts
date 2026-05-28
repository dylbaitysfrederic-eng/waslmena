import type { InferSelectModel } from 'drizzle-orm';
import { and, asc, count, desc, eq, gte, inArray, max } from 'drizzle-orm';

import { db } from '@/libs/DB';
import {
  menuCategorySchema,
  menuItemSchema,
  orderSchema,
  organizationSchema,
  posProviderConfigSchema,
  restaurantTableSchema,
} from '@/models/Schema';
import { getEnabledModules, MODULES } from '@/utils/Modules';

type Organization = InferSelectModel<typeof organizationSchema>;
type PosProviderConfig = InferSelectModel<typeof posProviderConfigSchema>;
type RestaurantTable = InferSelectModel<typeof restaurantTableSchema>;

export type AdminHealthStatus =
  | 'healthy'
  | 'setup_incomplete'
  | 'inactive'
  | 'needs_review';

export type AdminHealthRow = {
  organization: Organization;
  activeModules: string[];
  categoryCount: number;
  firstTable: Pick<RestaurantTable, 'id' | 'tableNumber'> | null;
  healthStatus: AdminHealthStatus;
  lastOrderDate: Date | null;
  menuItemCount: number;
  ordersLast7Days: number;
  posConfigured: boolean;
  readinessIssues: string[];
  tableCount: number;
  totalOrders: number;
};

export type AdminHealthFilter = 'all' | 'active' | 'suspended' | 'inactive' | 'setup_incomplete';

const moduleTitleByKey = new Map(MODULES.map(module => [module.key, module.title]));

const getCountMap = (rows: { organizationId: string; count: number }[]) => {
  return new Map(rows.map(row => [row.organizationId, Number(row.count)]));
};

const getOrderStatsMap = (
  rows: {
    organizationId: string;
    count: number;
    latestOrderDate: Date | null;
  }[],
) => {
  return new Map(
    rows.map(row => [
      row.organizationId,
      {
        count: Number(row.count),
        latestOrderDate: row.latestOrderDate,
      },
    ]),
  );
};

const getPosConfiguredMap = (configs: PosProviderConfig[]) => {
  const map = new Map<string, boolean>();

  for (const config of configs) {
    if (map.has(config.organizationId)) {
      continue;
    }

    map.set(
      config.organizationId,
      config.enabled
      && config.syncStatus !== 'not_configured'
      && Boolean(config.provider),
    );
  }

  return map;
};

const getFirstTableMap = (
  tables: Pick<RestaurantTable, 'organizationId' | 'id' | 'tableNumber'>[],
) => {
  const map = new Map<string, Pick<RestaurantTable, 'id' | 'tableNumber'>>();

  for (const table of tables) {
    if (!map.has(table.organizationId)) {
      map.set(table.organizationId, {
        id: table.id,
        tableNumber: table.tableNumber,
      });
    }
  }

  return map;
};

const buildReadinessIssues = ({
  organization,
  categoryCount,
  menuItemCount,
  posConfigured,
  tableCount,
}: {
  organization: Organization;
  categoryCount: number;
  menuItemCount: number;
  posConfigured: boolean;
  tableCount: number;
}) => {
  const issues: string[] = [];

  if (menuItemCount === 0) {
    issues.push('Missing menu');
  }

  if (categoryCount === 0) {
    issues.push('Missing categories');
  }

  if (tableCount === 0) {
    issues.push('No tables');
  }

  if (!organization.restaurantLogoUrl) {
    issues.push('No logo');
  }

  if (!organization.restaurantOpeningHours) {
    issues.push('No opening hours');
  }

  if (!organization.restaurantWhatsappNumber) {
    issues.push('No WhatsApp number');
  }

  if (
    organization.deliveryEnabled
    && (
      (!organization.deliveryFeeUsdCents && !organization.deliveryFeeLocal)
      || !organization.deliveryEstimatedTime
    )
  ) {
    issues.push('Delivery enabled but missing fee/time');
  }

  if (organization.onlinePaymentsEnabled) {
    issues.push('Payment module enabled but still coming soon');
  }

  if (organization.posIntegrationEnabled && !posConfigured) {
    issues.push('POS module enabled but not configured');
  }

  return issues;
};

const getHealthStatus = ({
  organization,
  ordersLast7Days,
  readinessIssues,
}: {
  organization: Organization;
  ordersLast7Days: number;
  readinessIssues: string[];
}): AdminHealthStatus => {
  const isSuspended = organization.accessSuspended
    || organization.accessStatus === 'suspended'
    || organization.accessStatus === 'revoked';
  const hasSetupGap = readinessIssues.some(issue =>
    [
      'Missing menu',
      'Missing categories',
      'No tables',
      'No opening hours',
      'No WhatsApp number',
    ].includes(issue),
  );
  const hasModuleWarning = readinessIssues.some(issue =>
    issue.includes('coming soon') || issue.includes('not configured'),
  );

  if (isSuspended || hasModuleWarning) {
    return 'needs_review';
  }

  if (hasSetupGap) {
    return 'setup_incomplete';
  }

  if (organization.accessStatus !== 'active' || ordersLast7Days === 0) {
    return 'inactive';
  }

  return 'healthy';
};

const buildHealthRow = ({
  categoryCount,
  firstTable,
  menuItemCount,
  orderStats,
  ordersLast7Days,
  organization,
  posConfigured,
  tableCount,
}: {
  categoryCount: number;
  firstTable: Pick<RestaurantTable, 'id' | 'tableNumber'> | null;
  menuItemCount: number;
  orderStats: { count: number; latestOrderDate: Date | null };
  ordersLast7Days: number;
  organization: Organization;
  posConfigured: boolean;
  tableCount: number;
}): AdminHealthRow => {
  const activeModules = getEnabledModules(organization)
    .map(moduleKey => moduleTitleByKey.get(moduleKey) ?? moduleKey);
  const readinessIssues = buildReadinessIssues({
    organization,
    categoryCount,
    menuItemCount,
    posConfigured,
    tableCount,
  });

  return {
    organization,
    activeModules,
    categoryCount,
    firstTable,
    healthStatus: getHealthStatus({
      organization,
      ordersLast7Days,
      readinessIssues,
    }),
    lastOrderDate: orderStats.latestOrderDate,
    menuItemCount,
    ordersLast7Days,
    posConfigured,
    readinessIssues,
    tableCount,
    totalOrders: orderStats.count,
  };
};

const getHealthAggregates = async (organizationIds: string[]) => {
  if (organizationIds.length === 0) {
    return {
      categoryCountByOrganizationId: new Map<string, number>(),
      firstTableByOrganizationId: new Map<string, Pick<RestaurantTable, 'id' | 'tableNumber'>>(),
      menuItemCountByOrganizationId: new Map<string, number>(),
      orderStatsByOrganizationId: new Map<string, { count: number; latestOrderDate: Date | null }>(),
      ordersLast7DaysByOrganizationId: new Map<string, number>(),
      posConfiguredByOrganizationId: new Map<string, boolean>(),
      tableCountByOrganizationId: new Map<string, number>(),
    };
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    categoryCounts,
    firstTables,
    menuItemCounts,
    orderStats,
    ordersLast7Days,
    posConfigs,
    tableCounts,
  ] = await Promise.all([
    db
      .select({
        organizationId: menuCategorySchema.organizationId,
        count: count(),
      })
      .from(menuCategorySchema)
      .where(inArray(menuCategorySchema.organizationId, organizationIds))
      .groupBy(menuCategorySchema.organizationId),
    db
      .select({
        organizationId: restaurantTableSchema.organizationId,
        id: restaurantTableSchema.id,
        tableNumber: restaurantTableSchema.tableNumber,
      })
      .from(restaurantTableSchema)
      .where(inArray(restaurantTableSchema.organizationId, organizationIds))
      .orderBy(asc(restaurantTableSchema.tableNumber)),
    db
      .select({
        organizationId: menuItemSchema.organizationId,
        count: count(),
      })
      .from(menuItemSchema)
      .where(inArray(menuItemSchema.organizationId, organizationIds))
      .groupBy(menuItemSchema.organizationId),
    db
      .select({
        organizationId: orderSchema.organizationId,
        count: count(),
        latestOrderDate: max(orderSchema.createdAt),
      })
      .from(orderSchema)
      .where(inArray(orderSchema.organizationId, organizationIds))
      .groupBy(orderSchema.organizationId),
    db
      .select({
        organizationId: orderSchema.organizationId,
        count: count(),
      })
      .from(orderSchema)
      .where(and(
        inArray(orderSchema.organizationId, organizationIds),
        gte(orderSchema.createdAt, sevenDaysAgo),
      ))
      .groupBy(orderSchema.organizationId),
    db
      .select()
      .from(posProviderConfigSchema)
      .where(inArray(posProviderConfigSchema.organizationId, organizationIds))
      .orderBy(desc(posProviderConfigSchema.updatedAt)),
    db
      .select({
        organizationId: restaurantTableSchema.organizationId,
        count: count(),
      })
      .from(restaurantTableSchema)
      .where(inArray(restaurantTableSchema.organizationId, organizationIds))
      .groupBy(restaurantTableSchema.organizationId),
  ]);

  return {
    categoryCountByOrganizationId: getCountMap(categoryCounts),
    firstTableByOrganizationId: getFirstTableMap(firstTables),
    menuItemCountByOrganizationId: getCountMap(menuItemCounts),
    orderStatsByOrganizationId: getOrderStatsMap(orderStats),
    ordersLast7DaysByOrganizationId: getCountMap(ordersLast7Days),
    posConfiguredByOrganizationId: getPosConfiguredMap(posConfigs),
    tableCountByOrganizationId: getCountMap(tableCounts),
  };
};

export const getAdminHealthRows = async () => {
  const organizations = await db
    .select()
    .from(organizationSchema)
    .orderBy(desc(organizationSchema.createdAt));
  const organizationIds = organizations.map(organization => organization.id);
  const aggregates = await getHealthAggregates(organizationIds);

  return organizations.map(organization => buildHealthRow({
    organization,
    categoryCount: aggregates.categoryCountByOrganizationId.get(organization.id) ?? 0,
    firstTable: aggregates.firstTableByOrganizationId.get(organization.id) ?? null,
    menuItemCount: aggregates.menuItemCountByOrganizationId.get(organization.id) ?? 0,
    orderStats: aggregates.orderStatsByOrganizationId.get(organization.id) ?? {
      count: 0,
      latestOrderDate: null,
    },
    ordersLast7Days: aggregates.ordersLast7DaysByOrganizationId.get(organization.id) ?? 0,
    posConfigured: aggregates.posConfiguredByOrganizationId.get(organization.id) ?? false,
    tableCount: aggregates.tableCountByOrganizationId.get(organization.id) ?? 0,
  }));
};

export const getAdminHealthDetail = async (organizationId: string) => {
  const [organization] = await db
    .select()
    .from(organizationSchema)
    .where(eq(organizationSchema.id, organizationId))
    .limit(1);

  if (!organization) {
    return null;
  }

  const aggregates = await getHealthAggregates([organization.id]);

  return buildHealthRow({
    organization,
    categoryCount: aggregates.categoryCountByOrganizationId.get(organization.id) ?? 0,
    firstTable: aggregates.firstTableByOrganizationId.get(organization.id) ?? null,
    menuItemCount: aggregates.menuItemCountByOrganizationId.get(organization.id) ?? 0,
    orderStats: aggregates.orderStatsByOrganizationId.get(organization.id) ?? {
      count: 0,
      latestOrderDate: null,
    },
    ordersLast7Days: aggregates.ordersLast7DaysByOrganizationId.get(organization.id) ?? 0,
    posConfigured: aggregates.posConfiguredByOrganizationId.get(organization.id) ?? false,
    tableCount: aggregates.tableCountByOrganizationId.get(organization.id) ?? 0,
  });
};

export const filterAdminHealthRows = (
  rows: AdminHealthRow[],
  searchQuery: string,
  statusFilter: AdminHealthFilter,
) => {
  const normalizedQuery = searchQuery.trim().toLowerCase();

  return rows.filter((row) => {
    const organizationName = row.organization.restaurantDisplayName
      || row.organization.id;
    const matchesQuery = normalizedQuery.length === 0
      || organizationName.toLowerCase().includes(normalizedQuery)
      || row.organization.id.toLowerCase().includes(normalizedQuery);

    if (!matchesQuery) {
      return false;
    }

    if (statusFilter === 'active') {
      return row.organization.accessStatus === 'active'
        && !row.organization.accessSuspended;
    }

    if (statusFilter === 'suspended') {
      return row.organization.accessSuspended
        || row.organization.accessStatus === 'suspended'
        || row.organization.accessStatus === 'revoked';
    }

    if (statusFilter === 'inactive') {
      return row.healthStatus === 'inactive';
    }

    if (statusFilter === 'setup_incomplete') {
      return row.healthStatus === 'setup_incomplete';
    }

    return true;
  });
};

import { currentUser } from '@clerk/nextjs/server';
import { count, desc, inArray, max } from 'drizzle-orm';
import { notFound } from 'next/navigation';

import { db } from '@/libs/DB';
import {
  menuItemSchema,
  orderSchema,
  organizationSchema,
  restaurantTableSchema,
} from '@/models/Schema';
import { getAdminEmails } from '@/utils/AdminEmails';

export const RESTAURANT_PROFILES = [
  'fast_food',
  'cafe',
  'casual_dining',
  'table_service',
  'shisha_lounge',
] as const;

export const RESTAURANT_TEMPLATE_STYLES = [
  'fast_food',
  'cafe',
  'casual_restaurant',
  'table_service',
  'shisha_lounge',
] as const;

export const ORDERING_MODES = ['table_ordering', 'counter_pickup', 'both'] as const;

export const QR_MODES = ['per_table', 'general_menu', 'both'] as const;

export const QR_STYLE_TEMPLATES = ['classic', 'modern', 'minimal'] as const;

export const SETUP_FEE_STATUSES = ['unpaid', 'paid', 'waived'] as const;

export const MONTHLY_SUBSCRIPTION_STATUSES = [
  'active',
  'overdue',
  'paused',
  'cancelled',
] as const;

export const SUBSCRIPTION_PAYMENT_METHODS = [
  'cash',
  'bank_transfer',
  'card',
  'other',
] as const;

export const BILLING_CYCLES = ['monthly', 'yearly', 'custom'] as const;

export const CLIENT_ACCESS_STATUSES = [
  'pending',
  'active',
  'suspended',
  'revoked',
] as const;

export const CLIENT_CATEGORIES = [
  'restaurant',
  'cafe',
  'fast_food',
  'shisha_lounge',
  'other',
] as const;

export const MENU_TEMPLATE_TYPES = [
  'restaurant',
  'cafe',
  'fast_food',
  'shisha_lounge',
] as const;

export const SUBSCRIPTION_STATUSES = [
  'up_to_date',
  'overdue',
  'suspended',
  'cancelled',
  'trial',
] as const;

export const getCurrentAdminEmail = async () => {
  const user = await currentUser();
  const primaryEmail = user?.primaryEmailAddress;
  const adminEmails = getAdminEmails();

  const email = primaryEmail?.emailAddress.toLowerCase();
  const verificationStatus = primaryEmail?.verification?.status;
  const hasAdminEmails = adminEmails.length > 0;
  const isEmailAllowed = email ? adminEmails.includes(email) : false;
  const isEmailVerified = verificationStatus === undefined
    ? true
    : verificationStatus === 'verified';

  // Deny access if:
  // - No authenticated user
  // - No primary email configured
  // - ADMIN_EMAILS not configured (deny by default)
  // - Email not in allowed ADMIN_EMAILS list
  // - Email verification status is explicitly not verified
  const shouldDenyAdminAccess = [
    !user,
    !primaryEmail,
    !email,
    !hasAdminEmails,
    !isEmailAllowed,
    !isEmailVerified,
  ].some(Boolean);

  if (shouldDenyAdminAccess) {
    notFound();
  }

  return email;
};

export const assertAdmin = async () => {
  await getCurrentAdminEmail();
};

export const formatAdminLabel = (value: string) => {
  return value
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

export const formatDateInputValue = (date: Date | null | undefined) => {
  if (!date) {
    return '';
  }

  return date.toISOString().slice(0, 10);
};

export const formatDate = (date: Date | null | undefined) => {
  if (!date) {
    return 'Not set';
  }

  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(date);
};

export const formatDateTime = (date: Date | null) => {
  if (!date) {
    return 'No orders yet';
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

export const formatUsdAmount = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const getOverdueDuration = (date: Date | null | undefined) => {
  if (!date) {
    return 'Not set';
  }

  const days = Math.max(
    0,
    Math.floor((Date.now() - date.getTime()) / 86_400_000),
  );

  return `${days} day${days === 1 ? '' : 's'}`;
};

export const getStatusBadgeClassName = (status: string) => {
  if (status === 'up_to_date' || status === 'active') {
    return 'border-green-300 bg-green-50 text-green-900';
  }

  if (status === 'pending') {
    return 'border-amber-300 bg-amber-50 text-amber-900';
  }

  if (status === 'overdue' || status === 'suspended' || status === 'revoked') {
    return 'border-red-300 bg-red-50 text-red-900';
  }

  if (status === 'trial') {
    return 'border-blue-300 bg-blue-50 text-blue-900';
  }

  return 'border-muted bg-muted text-muted-foreground';
};

export const getAdminOrganizations = async () => {
  const [
    organizations,
    tableOrganizationIds,
    menuItemOrganizationIds,
    orderOrganizationIds,
  ] = await Promise.all([
    db.select().from(organizationSchema).orderBy(desc(organizationSchema.createdAt)),
    db
      .selectDistinct({ organizationId: restaurantTableSchema.organizationId })
      .from(restaurantTableSchema),
    db
      .selectDistinct({ organizationId: menuItemSchema.organizationId })
      .from(menuItemSchema),
    db
      .selectDistinct({ organizationId: orderSchema.organizationId })
      .from(orderSchema),
  ]);

  const organizationIds = new Set<string>();

  for (const organization of organizations) {
    organizationIds.add(organization.id);
  }

  for (const row of [
    ...tableOrganizationIds,
    ...menuItemOrganizationIds,
    ...orderOrganizationIds,
  ]) {
    organizationIds.add(row.organizationId);
  }

  const ids = [...organizationIds].sort();
  const organizationRecords = new Map(
    organizations.map(organization => [organization.id, organization]),
  );

  const [tableCounts, menuItemCounts, orderStats] = ids.length > 0
    ? await Promise.all([
      db
        .select({
          organizationId: restaurantTableSchema.organizationId,
          count: count(),
        })
        .from(restaurantTableSchema)
        .where(inArray(restaurantTableSchema.organizationId, ids))
        .groupBy(restaurantTableSchema.organizationId),
      db
        .select({
          organizationId: menuItemSchema.organizationId,
          count: count(),
        })
        .from(menuItemSchema)
        .where(inArray(menuItemSchema.organizationId, ids))
        .groupBy(menuItemSchema.organizationId),
      db
        .select({
          organizationId: orderSchema.organizationId,
          count: count(),
          latestOrderDate: max(orderSchema.createdAt),
        })
        .from(orderSchema)
        .where(inArray(orderSchema.organizationId, ids))
        .groupBy(orderSchema.organizationId),
    ])
    : [[], [], []];

  return {
    ids,
    organizationRecords,
    tableCountByOrganizationId: new Map(
      tableCounts.map(row => [row.organizationId, row.count]),
    ),
    menuItemCountByOrganizationId: new Map(
      menuItemCounts.map(row => [row.organizationId, row.count]),
    ),
    orderStatsByOrganizationId: new Map(
      orderStats.map(row => [row.organizationId, row]),
    ),
  };
};

type AdminOrganizationData = Awaited<ReturnType<typeof getAdminOrganizations>>;
type AdminOrganization = AdminOrganizationData['organizationRecords'] extends Map<string, infer Organization>
  ? Organization
  : never;

const REVENUE_ACTIVE_STATUSES = ['up_to_date', 'trial'] as const;

const getEstimatedMonthlyAmount = (organization: AdminOrganization | undefined) => {
  return organization?.subscriptionAmountUsd
    ?? organization?.monthlySubscriptionAmountUsd
    ?? 0;
};

const getSetupFeeAmount = (organization: AdminOrganization | undefined) => {
  return organization?.setupFeeAmountUsd ?? 0;
};

export const getAdminMetrics = ({
  ids,
  organizationRecords,
  orderStatsByOrganizationId,
}: Pick<AdminOrganizationData, 'ids' | 'organizationRecords' | 'orderStatsByOrganizationId'>) => {
  return ids.reduce(
    (metrics, organizationId) => {
      const organization = organizationRecords.get(organizationId);
      const subscriptionStatus = organization?.subscriptionStatus ?? 'trial';
      const accessStatus = organization?.accessStatus ?? 'pending';
      const estimatedMonthlyAmount = getEstimatedMonthlyAmount(organization);
      const setupFeeAmount = getSetupFeeAmount(organization);
      const setupFeeStatus = organization?.setupFeeStatus ?? 'unpaid';
      const ordersCount = orderStatsByOrganizationId.get(organizationId)?.count ?? 0;

      return {
        totalClients: metrics.totalClients + 1,
        activeClients: metrics.activeClients + (
          accessStatus === 'active' && subscriptionStatus !== 'cancelled' ? 1 : 0
        ),
        suspendedClients: metrics.suspendedClients + (accessStatus === 'suspended' ? 1 : 0),
        overdueClients: metrics.overdueClients + (
          subscriptionStatus === 'overdue' ? 1 : 0
        ),
        estimatedMrr: metrics.estimatedMrr + (
          accessStatus === 'active'
          && REVENUE_ACTIVE_STATUSES.includes(
            subscriptionStatus as (typeof REVENUE_ACTIVE_STATUSES)[number],
          )
            ? estimatedMonthlyAmount
            : 0
        ),
        setupFeesCollected: metrics.setupFeesCollected + (
          setupFeeStatus === 'paid' ? setupFeeAmount : 0
        ),
        setupFeesUnpaid: metrics.setupFeesUnpaid + (
          setupFeeStatus === 'unpaid' ? setupFeeAmount : 0
        ),
        totalOrders: metrics.totalOrders + ordersCount,
      };
    },
    {
      totalClients: 0,
      activeClients: 0,
      suspendedClients: 0,
      overdueClients: 0,
      estimatedMrr: 0,
      setupFeesCollected: 0,
      setupFeesUnpaid: 0,
      totalOrders: 0,
    },
  );
};

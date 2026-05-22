import type { organizationSchema } from '@/models/Schema';

type OrganizationRecord = typeof organizationSchema.$inferSelect;

type SearchParams = {
  q?: string | string[];
};

const normalizeSearchValue = (value: string | string[] | undefined) => {
  const textValue = Array.isArray(value) ? value.at(0) : value;

  return textValue?.trim() ?? '';
};

const searchableValuesForOrganization = (
  organizationId: string,
  organization: OrganizationRecord | undefined,
) => [
  organizationId,
  organization?.restaurantDisplayName,
  organization?.clientCategory,
  organization?.restaurantProfile,
  organization?.accessStatus,
  organization?.subscriptionStatus,
  organization?.monthlySubscriptionStatus,
  organization?.setupFeeStatus,
  organization?.subscriptionPaymentMethod,
  organization?.mainContactFirstName,
  organization?.mainContactLastName,
  organization?.mainContactWhatsappNumber,
  organization?.restaurantWhatsappNumber,
  organization?.restaurantAddress,
  organization?.assignedSalesperson,
  organization?.adminNotes,
  organization?.internalAdminNotes,
  organization?.adminPaymentNotes,
  organization?.paymentMethodNote,
];

export const getAdminRestaurantSearchQuery = (
  searchParams?: SearchParams,
) => normalizeSearchValue(searchParams?.q);

export const filterAdminRestaurantIds = (
  ids: string[],
  organizationRecords: Map<string, OrganizationRecord>,
  searchQuery: string,
) => {
  const normalizedQuery = searchQuery.trim().toLowerCase();

  if (!normalizedQuery) {
    return ids;
  }

  return ids.filter((organizationId) => {
    const organization = organizationRecords.get(organizationId);

    return searchableValuesForOrganization(organizationId, organization)
      .filter((value): value is string => Boolean(value))
      .some(value => value.toLowerCase().includes(normalizedQuery));
  });
};

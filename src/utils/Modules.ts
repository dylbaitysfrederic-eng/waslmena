export const MODULE_KEYS = [
  'delivery',
  'onlinePayments',
  'posIntegration',
  'whatsappBusiness',
  'loyalty',
] as const;

export type ModuleKey = typeof MODULE_KEYS[number];

export type OrganizationModuleFlags = {
  deliveryEnabled?: boolean | null;
  onlinePaymentsEnabled?: boolean | null;
  posIntegrationEnabled?: boolean | null;
  whatsappBusinessEnabled?: boolean | null;
  loyaltyEnabled?: boolean | null;
};

export type ModuleDefinition = {
  key: ModuleKey;
  title: string;
  description: string;
};

export const MODULES: ModuleDefinition[] = [
  {
    key: 'delivery',
    title: 'Delivery',
    description: 'Prepare a lightweight delivery foundation for future guest orders and fulfillment.',
  },
  {
    key: 'onlinePayments',
    title: 'Online Payments',
    description: 'Prepare the restaurant for future digital payment acceptance and checkout flows.',
  },
  {
    key: 'posIntegration',
    title: 'POS Integrations',
    description: 'Enable future point-of-sale connectivity without changing the current core ordering experience.',
  },
  {
    key: 'whatsappBusiness',
    title: 'WhatsApp Business',
    description: 'Prepare the restaurant for future WhatsApp ordering and guest notifications.',
  },
  {
    key: 'loyalty',
    title: 'Loyalty',
    description: 'Prepare for future guest rewards and repeat-customer programs.',
  },
];

const MODULE_FLAG_KEYS: Record<ModuleKey, keyof OrganizationModuleFlags> = {
  delivery: 'deliveryEnabled',
  onlinePayments: 'onlinePaymentsEnabled',
  posIntegration: 'posIntegrationEnabled',
  whatsappBusiness: 'whatsappBusinessEnabled',
  loyalty: 'loyaltyEnabled',
};

export const organizationHasModule = (
  organization: OrganizationModuleFlags | undefined | null,
  moduleKey: ModuleKey,
) => {
  if (!organization) {
    return false;
  }

  return Boolean(organization[MODULE_FLAG_KEYS[moduleKey]]);
};

export const getEnabledModules = (
  organization: OrganizationModuleFlags | undefined | null,
) => MODULE_KEYS.filter(moduleKey => organizationHasModule(organization, moduleKey));

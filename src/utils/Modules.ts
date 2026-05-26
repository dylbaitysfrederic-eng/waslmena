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
  maturity: 'Available' | 'MVP available' | 'Coming soon' | 'Planned';
  positioning: string;
  adminHelper: string;
};

export const MODULES: ModuleDefinition[] = [
  {
    key: 'delivery',
    title: 'Delivery',
    description: 'Restaurant-owned delivery flow for direct orders and local fulfillment.',
    maturity: 'MVP available',
    positioning: 'Keep delivery direct, branded, and under the restaurant team\'s control instead of sending guests to a marketplace.',
    adminHelper: 'MVP support covers restaurant-owned delivery. The restaurant still manages its own delivery area, fees, timing, and fulfillment.',
  },
  {
    key: 'onlinePayments',
    title: 'Online Payments',
    description: 'Provider-agnostic payment foundation prepared for future checkout flows.',
    maturity: 'Coming soon',
    positioning: 'Foundation ready for a future premium payment module without locking the restaurant into one processor.',
    adminHelper: 'Enabling the flag only marks interest/readiness. It does not connect a payment provider, create checkout links, or activate online collection.',
  },
  {
    key: 'posIntegration',
    title: 'POS Integrations',
    description: 'CSV and manual operations first, provider integrations later.',
    maturity: 'Planned',
    positioning: 'Start with clean operational exports while leaving room for POS provider connectivity when a restaurant needs it.',
    adminHelper: 'Keep current CSV/manual workflows as the default. Provider integrations are not active from this toggle.',
  },
  {
    key: 'whatsappBusiness',
    title: 'WhatsApp Business',
    description: 'Premium foundation for automated order updates through WhatsApp Business.',
    maturity: 'Coming soon',
    positioning: 'A future premium automation layer for guest updates, separate from the existing free WhatsApp contact button.',
    adminHelper: 'This is separate from the public WhatsApp contact button. Enabling it does not configure Meta, send messages, or activate WhatsApp Business automation.',
  },
  {
    key: 'loyalty',
    title: 'Loyalty',
    description: 'Simple repeat-guest rewards are on the product roadmap.',
    maturity: 'Planned',
    positioning: 'A light retention module for restaurants that want to bring guests back without heavy setup.',
    adminHelper: 'Roadmap marker only. No loyalty rules, rewards, or guest wallet are activated.',
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

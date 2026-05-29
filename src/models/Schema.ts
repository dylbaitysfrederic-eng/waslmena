import {
  bigint,
  boolean,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

// This file defines the structure of your database tables using the Drizzle ORM.

// To modify the database schema:
// 1. Update this file with your desired changes.
// 2. Generate a new migration by running: `npm run db:generate`

// The generated migration file will reflect your schema changes.
// The migration is automatically applied during the next database interaction,
// so there's no need to run it manually or restart the Next.js server.

// Need a database for production? Check out https://www.prisma.io/?via=saasboilerplatesrc
// Tested and compatible with Next.js Boilerplate
export const organizationSchema = pgTable(
  'organization',
  {
    id: text('id').primaryKey(),
    restaurantDisplayName: text('restaurant_display_name'),
    clientCategory: text('client_category').default('restaurant').notNull(),
    mainContactFirstName: text('main_contact_first_name'),
    mainContactLastName: text('main_contact_last_name'),
    mainContactWhatsappNumber: text('main_contact_whatsapp_number'),
    restaurantAddress: text('restaurant_address'),
    restaurantOpeningHours: text('restaurant_opening_hours'),
    restaurantInstagramUrl: text('restaurant_instagram_url'),
    restaurantWifiName: text('restaurant_wifi_name'),
    restaurantWifiPassword: text('restaurant_wifi_password'),
    restaurantGoogleMapsUrl: text('restaurant_google_maps_url'),
    restaurantLogoUrl: text('restaurant_logo_url'),
    welcomeScreenEnabled: boolean('welcome_screen_enabled').default(false).notNull(),
    welcomeImageUrl: text('welcome_image_url'),
    welcomeImageAvifUrl: text('welcome_image_avif_url'),
    welcomeButtonLabel: text('welcome_button_label'),
    welcomeButtonColor: text('welcome_button_color'),
    welcomeButtonPosition: text('welcome_button_position').default('lower_center').notNull(),
    welcomeUseImageAccentForMenu: boolean('welcome_use_image_accent_for_menu').default(false).notNull(),
    welcomeGeneratedAccentColor: text('welcome_generated_accent_color'),
    restaurantPrimaryColor: text('restaurant_primary_color'),
    restaurantAccentColor: text('restaurant_accent_color'),
    showMenuItemImages: boolean('show_menu_item_images').default(true).notNull(),
    restaurantThemeMode: text('restaurant_theme_mode').default('day').notNull(),
    restaurantTemplateStyle: text('restaurant_template_style'),
    restaurantWhatsappNumber: text('restaurant_whatsapp_number'),
    localCurrencyCode: text('local_currency_code'),
    localCurrencyLabel: text('local_currency_label'),
    restaurantProfile: text('restaurant_profile').default('table_service').notNull(),
    orderingMode: text('ordering_mode').default('table_ordering').notNull(),
    enableTableNumbers: boolean('enable_table_numbers').default(true).notNull(),
    enableNamedTables: boolean('enable_named_tables').default(false).notNull(),
    enableCustomerName: boolean('enable_customer_name').default(true).notNull(),
    enableWhatsappContact: boolean('enable_whatsapp_contact').default(true).notNull(),
    deliveryEnabled: boolean('delivery_enabled').default(false).notNull(),
    pickupEnabled: boolean('pickup_enabled').default(true).notNull(),
    deliveryFeeUsdCents: integer('delivery_fee_usd_cents'),
    deliveryFeeLocal: integer('delivery_fee_local'),
    minimumOrderAmountUsdCents: integer('minimum_order_amount_usd_cents'),
    minimumOrderAmountLocal: integer('minimum_order_amount_local'),
    deliveryEstimatedTime: text('delivery_estimated_time'),
    deliveryCoverageNotes: text('delivery_coverage_notes'),
    onlinePaymentsEnabled: boolean('online_payments_enabled').default(false).notNull(),
    posIntegrationEnabled: boolean('pos_integration_enabled').default(false).notNull(),
    whatsappBusinessEnabled: boolean('whatsapp_business_enabled').default(false).notNull(),
    loyaltyEnabled: boolean('loyalty_enabled').default(false).notNull(),
    orderVisualNotificationsEnabled: boolean('order_visual_notifications_enabled')
      .default(true)
      .notNull(),
    orderSoundNotificationsEnabled: boolean('order_sound_notifications_enabled')
      .default(false)
      .notNull(),
    qrMode: text('qr_mode').default('per_table').notNull(),
    qrFrameColor: text('qr_frame_color').default('#111827').notNull(),
    qrForegroundColor: text('qr_foreground_color').default('#111827').notNull(),
    qrBackgroundColor: text('qr_background_color').default('#ffffff').notNull(),
    qrLabelText: text('qr_label_text'),
    qrShowRestaurantName: boolean('qr_show_restaurant_name').default(true).notNull(),
    qrShowTableNumber: boolean('qr_show_table_number').default(true).notNull(),
    qrStyleTemplate: text('qr_style_template').default('classic').notNull(),
    setupFeeAmountUsd: integer('setup_fee_amount_usd'),
    setupFeeStatus: text('setup_fee_status'),
    monthlySubscriptionAmountUsd: integer('monthly_subscription_amount_usd'),
    monthlySubscriptionStatus: text('monthly_subscription_status'),
    nextBillingDate: timestamp('next_billing_date', { mode: 'date' }),
    financeGoodsCostUsdCents: integer('finance_goods_cost_usd_cents'),
    financeGoodsCostLocal: integer('finance_goods_cost_local'),
    financeRentCostUsdCents: integer('finance_rent_cost_usd_cents'),
    financeRentCostLocal: integer('finance_rent_cost_local'),
    financeStaffCostUsdCents: integer('finance_staff_cost_usd_cents'),
    financeStaffCostLocal: integer('finance_staff_cost_local'),
    financeUtilitiesCostUsdCents: integer('finance_utilities_cost_usd_cents'),
    financeUtilitiesCostLocal: integer('finance_utilities_cost_local'),
    financeOtherCostUsdCents: integer('finance_other_cost_usd_cents'),
    financeOtherCostLocal: integer('finance_other_cost_local'),
    paymentMethodNote: text('payment_method_note'),
    internalAdminNotes: text('internal_admin_notes'),
    subscriptionPaymentMethod: text('subscription_payment_method'),
    billingCycle: text('billing_cycle'),
    assignedSalesperson: text('assigned_salesperson'),
    renewalDate: timestamp('renewal_date', { mode: 'date' }),
    subscriptionAmountUsd: integer('subscription_amount_usd'),
    subscriptionStatus: text('subscription_status').default('trial').notNull(),
    lastPaymentDate: timestamp('last_payment_date', { mode: 'date' }),
    nextPaymentDueDate: timestamp('next_payment_due_date', { mode: 'date' }),
    overdueSince: timestamp('overdue_since', { mode: 'date' }),
    adminPaymentNotes: text('admin_payment_notes'),
    accessStatus: text('access_status').default('pending').notNull(),
    accessSuspended: boolean('access_suspended').default(false).notNull(),
    adminNotes: text('admin_notes'),
    stripeCustomerId: text('stripe_customer_id'),
    stripeSubscriptionId: text('stripe_subscription_id'),
    stripeSubscriptionPriceId: text('stripe_subscription_price_id'),
    stripeSubscriptionStatus: text('stripe_subscription_status'),
    stripeSubscriptionCurrentPeriodEnd: bigint(
      'stripe_subscription_current_period_end',
      { mode: 'number' },
    ),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => {
    return {
      stripeCustomerIdIdx: uniqueIndex('stripe_customer_id_idx').on(
        table.stripeCustomerId,
      ),
    };
  },
);

export const todoSchema = pgTable('todo', {
  id: serial('id').primaryKey(),
  ownerId: text('owner_id').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

export const saasSettingsSchema = pgTable('saas_settings', {
  id: text('id').primaryKey(),
  supportEmail: text('support_email'),
  instagramUrl: text('instagram_url'),
  whatsappNumberOrUrl: text('whatsapp_url'),
  facebookUrl: text('facebook_url'),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

export const betaFeedbackSchema = pgTable(
  'beta_feedback',
  {
    id: serial('id').primaryKey(),
    organizationId: text('organization_id'),
    submittedByUserId: text('submitted_by_user_id'),
    roleContext: text('role_context'),
    category: text('category').default('other').notNull(),
    severity: text('severity').default('medium').notNull(),
    message: text('message').notNull(),
    deviceInfo: text('device_info'),
    pageContext: text('page_context'),
    status: text('status').default('new').notNull(),
    adminNotes: text('admin_notes'),
    updatedAt: timestamp('updated_at', { mode: 'date' })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  },
  (table) => {
    return {
      betaFeedbackOrgCreatedIdx: index('beta_feedback_org_created_idx').on(
        table.organizationId,
        table.createdAt,
      ),
      betaFeedbackStatusCreatedIdx: index('beta_feedback_status_created_idx').on(
        table.status,
        table.createdAt,
      ),
    };
  },
);

export const restaurantTableSchema = pgTable('restaurant_table', {
  id: serial('id').primaryKey(),
  organizationId: text('organization_id').notNull(),
  tableNumber: integer('table_number').notNull(),
  qrCode: text('qr_code'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const menuCategorySchema = pgTable('menu_category', {
  id: serial('id').primaryKey(),
  organizationId: text('organization_id').notNull(),
  parentCategoryId: integer('parent_category_id'),
  name: text('name').notNull(),
  nameEn: text('name_en'),
  nameAr: text('name_ar'),
  nameFr: text('name_fr'),
  displayOrder: integer('display_order').default(0).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const menuItemSchema = pgTable('menu_item', {
  id: serial('id').primaryKey(),
  organizationId: text('organization_id').notNull(),
  categoryId: integer('category_id').notNull(),
  name: text('name').notNull(),
  nameEn: text('name_en'),
  nameAr: text('name_ar'),
  nameFr: text('name_fr'),
  description: text('description'),
  descriptionEn: text('description_en'),
  descriptionAr: text('description_ar'),
  descriptionFr: text('description_fr'),
  imageUrl: text('image_url'),
  priceUsdCents: integer('price_usd_cents'),
  priceLbp: integer('price_lbp'),
  originalPriceUsdCents: integer('original_price_usd_cents'),
  originalPriceLbp: integer('original_price_lbp'),
  isPopular: boolean('is_popular').default(false).notNull(),
  isNew: boolean('is_new').default(false).notNull(),
  isSpicy: boolean('is_spicy').default(false).notNull(),
  isFeatured: boolean('is_featured').default(false).notNull(),
  isPromo: boolean('is_promo').default(false).notNull(),
  isAvailable: boolean('is_available').default(true).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const orderSchema = pgTable('order', {
  id: serial('id').primaryKey(),
  organizationId: text('organization_id').notNull(),
  idempotencyKey: text('idempotency_key'),
  tableId: integer('table_id'),
  orderType: text('order_type'),
  customerName: text('customer_name'),
  customerNote: text('customer_note'),
  deliveryAddress: text('delivery_address'),
  deliveryPhone: text('delivery_phone'),
  deliveryNotes: text('delivery_notes'),
  deliveryMapLink: text('delivery_map_link'),
  deliveryFeeUsdCents: integer('delivery_fee_usd_cents'),
  deliveryFeeLocal: integer('delivery_fee_local'),
  deliveryEstimatedTime: text('delivery_estimated_time'),
  status: text('status').default('pending').notNull(),
  paymentMethod: text('payment_method').default('cash').notNull(),
  paymentStatus: text('payment_status').default('unpaid').notNull(),
  paymentSessionId: integer('payment_session_id'),
  totalUsdCents: integer('total_usd_cents'),
  totalLbp: integer('total_lbp'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
}, (table) => {
  return {
    orderOrgIdempotencyIdx: uniqueIndex('order_org_idempotency_idx').on(
      table.organizationId,
      table.idempotencyKey,
    ),
  };
});

export const paymentSessionSchema = pgTable('payment_session', {
  id: serial('id').primaryKey(),
  organizationId: text('organization_id').notNull(),
  orderId: integer('order_id'),
  provider: text('provider').notNull(),
  providerSessionId: text('provider_session_id'),
  providerPaymentId: text('provider_payment_id'),
  providerStatus: text('provider_status'),
  paymentStatus: text('payment_status').default('pending_payment').notNull(),
  amountUsdCents: integer('amount_usd_cents'),
  amountLocal: integer('amount_local'),
  localCurrencyLabel: text('local_currency_label'),
  idempotencyKey: text('idempotency_key'),
  webhookEventId: text('webhook_event_id'),
  checkoutUrl: text('checkout_url'),
  metadata: text('metadata'),
  manualReconciliationNotes: text('manual_reconciliation_notes'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const whatsappMessageSchema = pgTable('whatsapp_message', {
  id: serial('id').primaryKey(),
  organizationId: text('organization_id').notNull(),
  orderId: integer('order_id'),
  recipientPhone: text('recipient_phone').notNull(),
  templateKey: text('template_key'),
  messageType: text('message_type').notNull(),
  messageStatus: text('message_status').default('pending').notNull(),
  provider: text('provider').default('internal').notNull(),
  providerMessageId: text('provider_message_id'),
  providerStatus: text('provider_status'),
  idempotencyKey: text('idempotency_key'),
  retryCount: integer('retry_count').default(0).notNull(),
  lastAttemptAt: timestamp('last_attempt_at', { mode: 'date' }),
  deliveredAt: timestamp('delivered_at', { mode: 'date' }),
  readAt: timestamp('read_at', { mode: 'date' }),
  failedAt: timestamp('failed_at', { mode: 'date' }),
  failureReason: text('failure_reason'),
  payloadSnapshot: text('payload_snapshot'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const whatsappWebhookEventSchema = pgTable('whatsapp_webhook_event', {
  id: serial('id').primaryKey(),
  organizationId: text('organization_id'),
  provider: text('provider').notNull(),
  eventType: text('event_type').notNull(),
  providerEventId: text('provider_event_id'),
  payloadSnapshot: text('payload_snapshot').notNull(),
  processed: boolean('processed').default(false).notNull(),
  processedAt: timestamp('processed_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

export const posProviderConfigSchema = pgTable('pos_provider_config', {
  id: serial('id').primaryKey(),
  organizationId: text('organization_id').notNull(),
  provider: text('provider').default('csv_manual').notNull(),
  enabled: boolean('enabled').default(false).notNull(),
  syncEnabled: boolean('sync_enabled').default(false).notNull(),
  testMode: boolean('test_mode').default(true).notNull(),
  lastSyncAt: timestamp('last_sync_at', { mode: 'date' }),
  syncStatus: text('sync_status').default('not_configured').notNull(),
  syncErrorMessage: text('sync_error_message'),
  providerMerchantId: text('provider_merchant_id'),
  providerMetadata: text('provider_metadata'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const posItemMappingSchema = pgTable('pos_item_mapping', {
  id: serial('id').primaryKey(),
  organizationId: text('organization_id').notNull(),
  menuItemId: integer('menu_item_id'),
  posSku: text('pos_sku'),
  posExternalId: text('pos_external_id'),
  posName: text('pos_name'),
  posCategory: text('pos_category'),
  posPriceUsdCents: integer('pos_price_usd_cents'),
  posPriceLocal: integer('pos_price_local'),
  syncStatus: text('sync_status').default('pending').notNull(),
  conflictReason: text('conflict_reason'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const posCategoryMappingSchema = pgTable('pos_category_mapping', {
  id: serial('id').primaryKey(),
  organizationId: text('organization_id').notNull(),
  categoryId: integer('category_id'),
  posCategoryId: text('pos_category_id'),
  posName: text('pos_name'),
  syncStatus: text('sync_status').default('pending').notNull(),
  conflictReason: text('conflict_reason'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const posOrderMappingSchema = pgTable('pos_order_mapping', {
  id: serial('id').primaryKey(),
  organizationId: text('organization_id').notNull(),
  orderId: integer('order_id').notNull(),
  posOrderId: text('pos_order_id'),
  pushStatus: text('push_status').default('pending').notNull(),
  posStatus: text('pos_status'),
  statusSyncedAt: timestamp('status_synced_at', { mode: 'date' }),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const posSyncLogSchema = pgTable('pos_sync_log', {
  id: serial('id').primaryKey(),
  organizationId: text('organization_id').notNull(),
  syncType: text('sync_type').notNull(),
  resourceType: text('resource_type'),
  resourceId: text('resource_id'),
  status: text('status').default('pending').notNull(),
  message: text('message'),
  payloadSnapshot: text('payload_snapshot'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

export const orderItemSchema = pgTable('order_item', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').notNull(),
  menuItemId: integer('menu_item_id').notNull(),
  quantity: integer('quantity').notNull(),
  customerNote: text('customer_note'),
  unitPriceUsdCents: integer('unit_price_usd_cents'),
  unitPriceLbp: integer('unit_price_lbp'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
});

export const analyticsEventSchema = pgTable('analytics_event', {
  id: serial('id').primaryKey(),
  organizationId: text('organization_id').notNull(),
  eventType: text('event_type').notNull(),
  locale: text('locale'),
  deviceType: text('device_type'),
  tableId: integer('table_id'),
  categoryId: integer('category_id'),
  orderId: integer('order_id'),
  metadata: text('metadata'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => {
  return {
    analyticsEventOrgCreatedIdx: index('analytics_event_org_created_idx').on(
      table.organizationId,
      table.createdAt,
    ),
    analyticsEventTypeCreatedIdx: index('analytics_event_type_created_idx').on(
      table.eventType,
      table.createdAt,
    ),
  };
});

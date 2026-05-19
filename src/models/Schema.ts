import {
  bigint,
  boolean,
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
    restaurantLogoUrl: text('restaurant_logo_url'),
    restaurantPrimaryColor: text('restaurant_primary_color'),
    restaurantAccentColor: text('restaurant_accent_color'),
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
    showMenuItemImages: boolean('show_menu_item_images').default(true).notNull(),
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
  displayOrder: integer('display_order').default(1).notNull(),
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
  tableId: integer('table_id').notNull(),
  customerName: text('customer_name'),
  customerNote: text('customer_note'),
  status: text('status').default('pending').notNull(),
  paymentMethod: text('payment_method').default('cash').notNull(),
  totalUsdCents: integer('total_usd_cents'),
  totalLbp: integer('total_lbp'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
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

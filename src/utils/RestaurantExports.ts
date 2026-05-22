import { and, asc, desc, eq, gte, inArray, lt } from 'drizzle-orm';
import type { NextRequest } from 'next/server';

import {
  getOrderRange,
  normalizeOrderPeriod,
  ORDER_EXPORT_RANGE_LIMIT_DAYS,
} from '@/app/[locale]/(auth)/dashboard/orders/periods';
import { db } from '@/libs/DB';
import {
  menuCategorySchema,
  menuItemSchema,
  orderItemSchema,
  orderSchema,
  organizationSchema,
  restaurantTableSchema,
} from '@/models/Schema';
import { getBaseUrl } from '@/utils/Helpers';

const EXPORT_TYPES = ['menu', 'tables', 'settings'] as const;

export type RestaurantJsonExportType = typeof EXPORT_TYPES[number];

export const isRestaurantJsonExportType = (
  value: string,
): value is RestaurantJsonExportType => {
  return EXPORT_TYPES.includes(value as RestaurantJsonExportType);
};

export const createJsonDownload = (
  fileName: string,
  payload: Record<string, unknown>,
) => {
  return new Response(`${JSON.stringify(payload, null, 2)}\n`, {
    headers: {
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
};

const csvHeaders = [
  'restaurant_name',
  'order_number',
  'date_time',
  'status',
  'table_or_menu',
  'items',
  'quantities',
  'total_usd',
  'total_local',
];

const escapeCsvValue = (value: string | number | null) => {
  if (value === null) {
    return '';
  }

  const textValue = String(value);

  if (/[",\n\r]/.test(textValue)) {
    return `"${textValue.replaceAll('"', '""')}"`;
  }

  return textValue;
};

const formatUsdTotal = (amount: number | null) => {
  return amount === null ? null : (amount / 100).toFixed(2);
};

const formatLocalTotal = (
  amount: number | null,
  localCurrencyLabel: string,
) => {
  return amount === null ? null : `${amount} ${localCurrencyLabel}`;
};

const formatDateTime = (date: Date, locale: string) => {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

export const createRestaurantJsonExport = async (
  organizationId: string,
  exportType: RestaurantJsonExportType,
  locale: string,
) => {
  const exportedAt = new Date().toISOString();

  if (exportType === 'menu') {
    const [categories, items] = await Promise.all([
      db
        .select({
          id: menuCategorySchema.id,
          parentCategoryId: menuCategorySchema.parentCategoryId,
          name: menuCategorySchema.name,
          nameEn: menuCategorySchema.nameEn,
          nameAr: menuCategorySchema.nameAr,
          nameFr: menuCategorySchema.nameFr,
          displayOrder: menuCategorySchema.displayOrder,
          createdAt: menuCategorySchema.createdAt,
          updatedAt: menuCategorySchema.updatedAt,
        })
        .from(menuCategorySchema)
        .where(eq(menuCategorySchema.organizationId, organizationId))
        .orderBy(
          asc(menuCategorySchema.displayOrder),
          asc(menuCategorySchema.name),
        ),
      db
        .select({
          id: menuItemSchema.id,
          categoryId: menuItemSchema.categoryId,
          name: menuItemSchema.name,
          nameEn: menuItemSchema.nameEn,
          nameAr: menuItemSchema.nameAr,
          nameFr: menuItemSchema.nameFr,
          description: menuItemSchema.description,
          descriptionEn: menuItemSchema.descriptionEn,
          descriptionAr: menuItemSchema.descriptionAr,
          descriptionFr: menuItemSchema.descriptionFr,
          imageUrl: menuItemSchema.imageUrl,
          priceUsdCents: menuItemSchema.priceUsdCents,
          priceLbp: menuItemSchema.priceLbp,
          originalPriceUsdCents: menuItemSchema.originalPriceUsdCents,
          originalPriceLbp: menuItemSchema.originalPriceLbp,
          isPopular: menuItemSchema.isPopular,
          isNew: menuItemSchema.isNew,
          isSpicy: menuItemSchema.isSpicy,
          isFeatured: menuItemSchema.isFeatured,
          isPromo: menuItemSchema.isPromo,
          isAvailable: menuItemSchema.isAvailable,
          createdAt: menuItemSchema.createdAt,
          updatedAt: menuItemSchema.updatedAt,
        })
        .from(menuItemSchema)
        .where(eq(menuItemSchema.organizationId, organizationId))
        .orderBy(asc(menuItemSchema.name)),
    ]);

    return createJsonDownload(`wasl-menu-${organizationId}.json`, {
      exportType: 'menu',
      exportedAt,
      organizationId,
      categories,
      items: items.map(item => ({
        ...item,
        badges: [
          ...(item.isPopular ? ['popular'] : []),
          ...(item.isNew ? ['new'] : []),
          ...(item.isSpicy ? ['spicy'] : []),
          ...(item.isFeatured ? ['featured'] : []),
          ...(item.isPromo ? ['promo'] : []),
        ],
      })),
    });
  }

  if (exportType === 'tables') {
    const [organization] = await db
      .select({
        qrMode: organizationSchema.qrMode,
        qrFrameColor: organizationSchema.qrFrameColor,
        qrForegroundColor: organizationSchema.qrForegroundColor,
        qrBackgroundColor: organizationSchema.qrBackgroundColor,
        qrLabelText: organizationSchema.qrLabelText,
        qrShowRestaurantName: organizationSchema.qrShowRestaurantName,
        qrShowTableNumber: organizationSchema.qrShowTableNumber,
        qrStyleTemplate: organizationSchema.qrStyleTemplate,
      })
      .from(organizationSchema)
      .where(eq(organizationSchema.id, organizationId))
      .limit(1);
    const tables = await db
      .select({
        id: restaurantTableSchema.id,
        tableNumber: restaurantTableSchema.tableNumber,
        qrCode: restaurantTableSchema.qrCode,
        createdAt: restaurantTableSchema.createdAt,
        updatedAt: restaurantTableSchema.updatedAt,
      })
      .from(restaurantTableSchema)
      .where(eq(restaurantTableSchema.organizationId, organizationId))
      .orderBy(asc(restaurantTableSchema.tableNumber));
    const baseUrl = getBaseUrl();

    return createJsonDownload(`wasl-tables-qr-${organizationId}.json`, {
      exportType: 'tables_qr',
      exportedAt,
      organizationId,
      qrSettings: organization ?? null,
      generalMenuUrl: `${baseUrl}/${locale}/r/${organizationId}/menu`,
      tables: tables.map(table => ({
        ...table,
        publicMenuUrl: `${baseUrl}/${locale}/r/${organizationId}/table/${table.id}`,
      })),
    });
  }

  const [organization] = await db
    .select({
      id: organizationSchema.id,
      restaurantDisplayName: organizationSchema.restaurantDisplayName,
      clientCategory: organizationSchema.clientCategory,
      restaurantAddress: organizationSchema.restaurantAddress,
      restaurantOpeningHours: organizationSchema.restaurantOpeningHours,
      restaurantInstagramUrl: organizationSchema.restaurantInstagramUrl,
      restaurantWifiName: organizationSchema.restaurantWifiName,
      restaurantWifiPassword: organizationSchema.restaurantWifiPassword,
      restaurantGoogleMapsUrl: organizationSchema.restaurantGoogleMapsUrl,
      restaurantLogoUrl: organizationSchema.restaurantLogoUrl,
      restaurantPrimaryColor: organizationSchema.restaurantPrimaryColor,
      restaurantAccentColor: organizationSchema.restaurantAccentColor,
      restaurantThemeMode: organizationSchema.restaurantThemeMode,
      restaurantTemplateStyle: organizationSchema.restaurantTemplateStyle,
      restaurantWhatsappNumber: organizationSchema.restaurantWhatsappNumber,
      localCurrencyCode: organizationSchema.localCurrencyCode,
      localCurrencyLabel: organizationSchema.localCurrencyLabel,
      showMenuItemImages: organizationSchema.showMenuItemImages,
      orderingMode: organizationSchema.orderingMode,
      enableTableNumbers: organizationSchema.enableTableNumbers,
      enableNamedTables: organizationSchema.enableNamedTables,
      enableCustomerName: organizationSchema.enableCustomerName,
      enableWhatsappContact: organizationSchema.enableWhatsappContact,
      welcomeScreenEnabled: organizationSchema.welcomeScreenEnabled,
      welcomeImageUrl: organizationSchema.welcomeImageUrl,
      welcomeImageAvifUrl: organizationSchema.welcomeImageAvifUrl,
      welcomeButtonLabel: organizationSchema.welcomeButtonLabel,
      welcomeButtonColor: organizationSchema.welcomeButtonColor,
      welcomeButtonPosition: organizationSchema.welcomeButtonPosition,
      welcomeUseImageAccentForMenu:
        organizationSchema.welcomeUseImageAccentForMenu,
      welcomeGeneratedAccentColor:
        organizationSchema.welcomeGeneratedAccentColor,
      orderVisualNotificationsEnabled:
        organizationSchema.orderVisualNotificationsEnabled,
      orderSoundNotificationsEnabled:
        organizationSchema.orderSoundNotificationsEnabled,
      qrMode: organizationSchema.qrMode,
      qrFrameColor: organizationSchema.qrFrameColor,
      qrForegroundColor: organizationSchema.qrForegroundColor,
      qrBackgroundColor: organizationSchema.qrBackgroundColor,
      qrLabelText: organizationSchema.qrLabelText,
      qrShowRestaurantName: organizationSchema.qrShowRestaurantName,
      qrShowTableNumber: organizationSchema.qrShowTableNumber,
      qrStyleTemplate: organizationSchema.qrStyleTemplate,
      updatedAt: organizationSchema.updatedAt,
      createdAt: organizationSchema.createdAt,
    })
    .from(organizationSchema)
    .where(eq(organizationSchema.id, organizationId))
    .limit(1);

  return createJsonDownload(`wasl-settings-${organizationId}.json`, {
    exportType: 'restaurant_settings',
    exportedAt,
    organizationId,
    settings: organization ?? null,
  });
};

export const createRestaurantOrdersCsvExport = async (
  organizationId: string,
  locale: string,
  request: NextRequest,
) => {
  const period = normalizeOrderPeriod(
    request.nextUrl.searchParams.get('period') ?? undefined,
  );
  const selectedRange = getOrderRange(
    {
      from: request.nextUrl.searchParams.get('from') ?? undefined,
      period,
      to: request.nextUrl.searchParams.get('to') ?? undefined,
    },
    new Date(),
    ORDER_EXPORT_RANGE_LIMIT_DAYS,
  );

  if (!selectedRange.isValid) {
    return new Response(
      'For performance reasons, exports are limited to 90 days at a time.',
      {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
        status: 400,
      },
    );
  }

  const orderDateFilters = [
    eq(orderSchema.organizationId, organizationId),
    gte(orderSchema.createdAt, selectedRange.startDate ?? new Date(0)),
    ...(selectedRange.endDateExclusive
      ? [lt(orderSchema.createdAt, selectedRange.endDateExclusive)]
      : []),
  ];
  const orderPeriodWhere = and(...orderDateFilters);

  const [organization] = await db
    .select({
      restaurantDisplayName: organizationSchema.restaurantDisplayName,
      localCurrencyLabel: organizationSchema.localCurrencyLabel,
    })
    .from(organizationSchema)
    .where(eq(organizationSchema.id, organizationId))
    .limit(1);

  const restaurantDisplayName = organization?.restaurantDisplayName
    ?? 'Restaurant';
  const localCurrencyLabel = organization?.localCurrencyLabel ?? 'LL';

  const orders = await db
    .select({
      id: orderSchema.id,
      tableId: orderSchema.tableId,
      tableNumber: restaurantTableSchema.tableNumber,
      status: orderSchema.status,
      totalUsdCents: orderSchema.totalUsdCents,
      totalLbp: orderSchema.totalLbp,
      createdAt: orderSchema.createdAt,
    })
    .from(orderSchema)
    .leftJoin(
      restaurantTableSchema,
      eq(orderSchema.tableId, restaurantTableSchema.id),
    )
    .where(orderPeriodWhere)
    .orderBy(desc(orderSchema.createdAt));

  const orderIds = orders.map(order => order.id);
  const orderItems = orderIds.length > 0
    ? await db
      .select({
        orderId: orderItemSchema.orderId,
        orderItemId: orderItemSchema.id,
        quantity: orderItemSchema.quantity,
        itemName: menuItemSchema.name,
      })
      .from(orderItemSchema)
      .leftJoin(menuItemSchema, eq(orderItemSchema.menuItemId, menuItemSchema.id))
      .where(inArray(orderItemSchema.orderId, orderIds))
      .orderBy(orderItemSchema.id)
    : [];

  const itemsByOrderId = new Map<number, typeof orderItems>();

  for (const item of orderItems) {
    const currentItems = itemsByOrderId.get(item.orderId) ?? [];
    currentItems.push(item);
    itemsByOrderId.set(item.orderId, currentItems);
  }

  const rows = orders.map((order) => {
    const items = itemsByOrderId.get(order.id) ?? [];
    const itemSummaries = items.map((item) => {
      return `${item.quantity} x ${item.itemName ?? 'Deleted menu item'}`;
    });
    const quantitySummaries = items.map((item) => {
      return `${item.itemName ?? 'Deleted menu item'}: ${item.quantity}`;
    });
    const orderSourceLabel = order.tableId === null
      ? 'General menu'
      : order.tableNumber === null
        ? 'Deleted table'
        : `Table ${order.tableNumber}`;

    return [
      restaurantDisplayName,
      order.id,
      formatDateTime(order.createdAt, locale),
      order.status,
      orderSourceLabel,
      itemSummaries.join('; '),
      quantitySummaries.join('; '),
      formatUsdTotal(order.totalUsdCents),
      formatLocalTotal(order.totalLbp, localCurrencyLabel),
    ];
  });

  const csv = [
    csvHeaders,
    ...rows,
  ]
    .map(row => row.map(escapeCsvValue).join(','))
    .join('\n');

  const fileName = period === 'custom'
    ? `orders-${organizationId}-${selectedRange.from}-${selectedRange.to}.csv`
    : `orders-${organizationId}-${period}.csv`;

  return new Response(`\uFEFF${csv}\n`, {
    headers: {
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Type': 'text/csv; charset=utf-8',
    },
  });
};

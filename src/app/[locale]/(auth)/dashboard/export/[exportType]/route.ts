import { auth } from '@clerk/nextjs/server';
import { asc, eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';

import { db } from '@/libs/DB';
import {
  menuCategorySchema,
  menuItemSchema,
  organizationSchema,
  restaurantTableSchema,
} from '@/models/Schema';
import { getBaseUrl } from '@/utils/Helpers';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const EXPORT_TYPES = ['menu', 'tables', 'settings'] as const;

type ExportType = typeof EXPORT_TYPES[number];

const isExportType = (value: string): value is ExportType => {
  return EXPORT_TYPES.includes(value as ExportType);
};

const createJsonDownload = (
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

export const GET = async (
  _request: NextRequest,
  props: { params: { exportType: string; locale: string } },
) => {
  const { orgId } = await auth();

  if (!orgId) {
    return new Response(null, { status: 401 });
  }

  if (!isExportType(props.params.exportType)) {
    return new Response('Unknown export type.', {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
      status: 404,
    });
  }

  const exportedAt = new Date().toISOString();

  if (props.params.exportType === 'menu') {
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
        .where(eq(menuCategorySchema.organizationId, orgId))
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
          isAvailable: menuItemSchema.isAvailable,
          createdAt: menuItemSchema.createdAt,
          updatedAt: menuItemSchema.updatedAt,
        })
        .from(menuItemSchema)
        .where(eq(menuItemSchema.organizationId, orgId))
        .orderBy(asc(menuItemSchema.name)),
    ]);

    return createJsonDownload(`wasl-menu-${orgId}.json`, {
      exportType: 'menu',
      exportedAt,
      organizationId: orgId,
      categories,
      items: items.map(item => ({
        ...item,
        badges: [],
      })),
    });
  }

  if (props.params.exportType === 'tables') {
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
      .where(eq(organizationSchema.id, orgId))
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
      .where(eq(restaurantTableSchema.organizationId, orgId))
      .orderBy(asc(restaurantTableSchema.tableNumber));
    const baseUrl = getBaseUrl();
    const locale = props.params.locale;

    return createJsonDownload(`wasl-tables-qr-${orgId}.json`, {
      exportType: 'tables_qr',
      exportedAt,
      organizationId: orgId,
      qrSettings: organization ?? null,
      generalMenuUrl: `${baseUrl}/${locale}/r/${orgId}/menu`,
      tables: tables.map(table => ({
        ...table,
        publicMenuUrl: `${baseUrl}/${locale}/r/${orgId}/table/${table.id}`,
      })),
    });
  }

  const [organization] = await db
    .select({
      id: organizationSchema.id,
      restaurantDisplayName: organizationSchema.restaurantDisplayName,
      clientCategory: organizationSchema.clientCategory,
      restaurantAddress: organizationSchema.restaurantAddress,
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
    .where(eq(organizationSchema.id, orgId))
    .limit(1);

  return createJsonDownload(`wasl-settings-${orgId}.json`, {
    exportType: 'restaurant_settings',
    exportedAt,
    organizationId: orgId,
    settings: organization ?? null,
  });
};

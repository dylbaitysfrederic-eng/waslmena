import { auth } from '@clerk/nextjs/server';
import { and, desc, eq, gte, inArray, lt } from 'drizzle-orm';
import type { NextRequest } from 'next/server';

import { db } from '@/libs/DB';
import {
  menuItemSchema,
  orderItemSchema,
  orderSchema,
  organizationSchema,
  restaurantTableSchema,
} from '@/models/Schema';

import {
  getOrderRange,
  normalizeOrderPeriod,
  ORDER_EXPORT_RANGE_LIMIT_DAYS,
} from '../periods';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

export const GET = async (
  request: NextRequest,
  props: { params: { locale: string } },
) => {
  const { orgId } = await auth();

  if (!orgId) {
    return new Response(null, { status: 401 });
  }

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
    eq(orderSchema.organizationId, orgId),
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
    .where(eq(organizationSchema.id, orgId))
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
      formatDateTime(order.createdAt, props.params.locale),
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
    ? `orders-${selectedRange.from}-${selectedRange.to}.csv`
    : `orders-${period}.csv`;

  return new Response(`\uFEFF${csv}\n`, {
    headers: {
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Type': 'text/csv; charset=utf-8',
    },
  });
};

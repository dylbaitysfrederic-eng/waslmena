import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';

import { createRestaurantOrdersCsvExport } from '@/utils/RestaurantExports';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const GET = async (
  request: NextRequest,
  props: { params: { locale: string } },
) => {
  const { orgId } = await auth();

  if (!orgId) {
    return new Response(null, { status: 401 });
  }

  return createRestaurantOrdersCsvExport(orgId, props.params.locale, request);
};

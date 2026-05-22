import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';

import {
  createRestaurantJsonExport,
  isRestaurantJsonExportType,
} from '@/utils/RestaurantExports';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const GET = async (
  _request: NextRequest,
  props: { params: { exportType: string; locale: string } },
) => {
  const { orgId } = await auth();

  if (!orgId) {
    return new Response(null, { status: 401 });
  }

  if (!isRestaurantJsonExportType(props.params.exportType)) {
    return new Response('Unknown export type.', {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
      status: 404,
    });
  }

  return createRestaurantJsonExport(
    orgId,
    props.params.exportType,
    props.params.locale,
  );
};

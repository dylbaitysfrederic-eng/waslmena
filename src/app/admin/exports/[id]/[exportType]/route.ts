import { eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';

import { db } from '@/libs/DB';
import { organizationSchema } from '@/models/Schema';
import {
  createRestaurantJsonExport,
  isRestaurantJsonExportType,
} from '@/utils/RestaurantExports';

import { assertAdmin } from '../../../_helpers';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const GET = async (
  _request: NextRequest,
  props: { params: { exportType: string; id: string } },
) => {
  await assertAdmin();

  if (!isRestaurantJsonExportType(props.params.exportType)) {
    return new Response('Unknown export type.', {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
      status: 404,
    });
  }

  const [organization] = await db
    .select({ id: organizationSchema.id })
    .from(organizationSchema)
    .where(eq(organizationSchema.id, props.params.id))
    .limit(1);

  if (!organization) {
    return new Response('Restaurant organization not found.', {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
      status: 404,
    });
  }

  return createRestaurantJsonExport(
    props.params.id,
    props.params.exportType,
    'en',
  );
};

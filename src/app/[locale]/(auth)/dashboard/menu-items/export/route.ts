import { auth } from '@clerk/nextjs/server';

import { createMenuCsvExport } from '@/utils/MenuCsv';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const GET = async () => {
  const { orgId } = await auth();

  if (!orgId) {
    return new Response(null, { status: 401 });
  }

  return createMenuCsvExport(orgId);
};

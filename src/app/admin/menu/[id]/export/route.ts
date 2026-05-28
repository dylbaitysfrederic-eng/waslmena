import { notFound } from 'next/navigation';

import { assertAdmin, getAdminOrganizations } from '@/app/admin/_helpers';
import { createMenuCsvExport } from '@/utils/MenuCsv';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const GET = async (
  _request: Request,
  props: { params: { id: string } },
) => {
  await assertAdmin();

  const { ids } = await getAdminOrganizations();

  if (!ids.includes(props.params.id)) {
    notFound();
  }

  return createMenuCsvExport(props.params.id);
};

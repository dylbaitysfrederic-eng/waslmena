import { assertAdmin } from '@/app/admin/_helpers';
import { createMenuCsvSampleDownload } from '@/utils/MenuCsv';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const GET = async () => {
  await assertAdmin();

  return createMenuCsvSampleDownload();
};

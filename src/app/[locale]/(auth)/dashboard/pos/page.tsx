import { auth } from '@clerk/nextjs/server';
import { desc, eq } from 'drizzle-orm';
import { getTranslations } from 'next-intl/server';

import { DashboardSection } from '@/features/dashboard/DashboardSection';
import { TitleBar } from '@/features/dashboard/TitleBar';
import { db } from '@/libs/DB';
import {
  organizationSchema,
  posProviderConfigSchema,
} from '@/models/Schema';
import {
  formatPosProvider,
  formatPosSyncStatus,
  getPosProviderDescription,
} from '@/utils/POS';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata(props: { params: { locale: string } }) {
  const t = await getTranslations({
    locale: props.params.locale,
    namespace: 'DashboardPOS',
  });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

const formatDateTime = (date: Date, locale: string) => {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

const DashboardPOSPage = async (props: { params: { locale: string } }) => {
  const t = await getTranslations('DashboardPOS');
  const { orgId } = await auth();

  if (!orgId) {
    return null;
  }

  const [[organization], [posConfig]] = await Promise.all([
    db
      .select({
        posIntegrationEnabled: organizationSchema.posIntegrationEnabled,
      })
      .from(organizationSchema)
      .where(eq(organizationSchema.id, orgId))
      .limit(1),
    db
      .select()
      .from(posProviderConfigSchema)
      .where(eq(posProviderConfigSchema.organizationId, orgId))
      .orderBy(desc(posProviderConfigSchema.createdAt))
      .limit(1),
  ]);

  const moduleEnabled = organization?.posIntegrationEnabled ?? false;
  const provider = posConfig?.provider ?? 'csv_manual';

  return (
    <>
      <TitleBar
        title={t('title_bar')}
        description={t('title_bar_description')}
      />

      <DashboardSection
        title={t('section_title')}
        description={moduleEnabled
          ? t('section_description_enabled')
          : t('section_description_disabled')}
      >
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-md border bg-background p-4">
            <div className="text-sm font-semibold">{t('module_status')}</div>
            <div className="mt-3">
              <span className={moduleEnabled
                ? 'rounded-full border border-green-300 bg-green-50 px-2 py-1 text-xs font-semibold text-green-900'
                : 'rounded-full border bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground'}
              >
                {moduleEnabled ? t('enabled') : t('disabled')}
              </span>
            </div>
          </div>

          <div className="rounded-md border bg-background p-4">
            <div className="text-sm font-semibold">{t('provider')}</div>
            <p className="mt-2 text-sm text-foreground">
              {formatPosProvider(provider)}
            </p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              {getPosProviderDescription(provider)}
            </p>
          </div>

          <div className="rounded-md border bg-background p-4">
            <div className="text-sm font-semibold">{t('sync_status')}</div>
            <p className="mt-2 text-sm text-foreground">
              {formatPosSyncStatus(posConfig?.syncStatus)}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {posConfig?.lastSyncAt
                ? formatDateTime(posConfig.lastSyncAt, props.params.locale)
                : t('last_sync_placeholder')}
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-md border border-dashed bg-background p-4 text-sm text-muted-foreground">
          <div className="font-semibold text-foreground">
            {t('csv_manual_title')}
          </div>
          {!posConfig && (
            <p className="mt-2 leading-6">
              {t('empty_config')}
            </p>
          )}
          <p className="mt-2 leading-6">
            {t('csv_manual_description')}
          </p>
          <p className="mt-2 leading-6">
            {t('api_later_description')}
          </p>
        </div>
      </DashboardSection>
    </>
  );
};

export default DashboardPOSPage;

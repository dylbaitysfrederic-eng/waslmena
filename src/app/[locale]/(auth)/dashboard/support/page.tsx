import { eq } from 'drizzle-orm';
import { getTranslations } from 'next-intl/server';

import { DashboardSection } from '@/features/dashboard/DashboardSection';
import { TitleBar } from '@/features/dashboard/TitleBar';
import { db } from '@/libs/DB';
import { saasSettingsSchema } from '@/models/Schema';
import { AppConfig } from '@/utils/AppConfig';

const FAQ_ITEMS = [
  'pilot_setup',
  'qr_codes',
  'menu_prices',
] as const;

const TROUBLESHOOTING_ITEMS = [
  'qr_not_opening',
  'orders_not_appearing',
  'refresh_orders',
  'update_prices',
] as const;

export async function generateMetadata(props: { params: { locale: string } }) {
  const t = await getTranslations({
    locale: props.params.locale,
    namespace: 'Support',
  });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

const getWhatsappLink = (value: string | null | undefined) => {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return value;
    }
  } catch {
    // Phone number fallback below.
  }

  const normalized = value.replace(/[^\d+]/g, '');

  if (/^\+?\d{8,15}$/.test(normalized)) {
    return `https://wa.me/${normalized.replace(/^\+/, '')}`;
  }

  return null;
};

const SupportPage = async () => {
  const t = await getTranslations('Support');
  const [settings] = await db
    .select({
      supportEmail: saasSettingsSchema.supportEmail,
      whatsappNumberOrUrl: saasSettingsSchema.whatsappNumberOrUrl,
    })
    .from(saasSettingsSchema)
    .where(eq(saasSettingsSchema.id, 'social_links'))
    .limit(1);
  const supportEmail = settings?.supportEmail ?? AppConfig.supportEmail;
  const whatsappHref = getWhatsappLink(settings?.whatsappNumberOrUrl)
    ?? getWhatsappLink(AppConfig.whatsappNumberOrUrl);

  return (
    <>
      <TitleBar
        title={t('title_bar')}
        description={t('title_bar_description')}
      />

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <DashboardSection
          title={t('contact_title')}
          description={t('contact_description')}
        >
          <div className="space-y-4">
            <div className="rounded-md border bg-background p-4">
              <div className="text-sm font-semibold">
                {t('whatsapp_label')}
              </div>
              {whatsappHref
                ? (
                    <a
                      href={whatsappHref}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 block text-sm font-medium text-foreground underline-offset-4 hover:underline"
                    >
                      {t('whatsapp_link')}
                    </a>
                  )
                : (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {t('whatsapp_unavailable')}
                    </p>
                  )}
            </div>

            <div className="rounded-md border bg-background p-4">
              <div className="text-sm font-semibold">
                {t('email_label')}
              </div>
              <a
                href={`mailto:${supportEmail}`}
                className="mt-2 block text-sm font-medium text-foreground underline-offset-4 hover:underline"
              >
                {supportEmail}
              </a>
            </div>
          </div>
        </DashboardSection>

        <div className="space-y-6">
          <DashboardSection
            title={t('faq_title')}
            description={t('faq_description')}
          >
            <div className="space-y-3">
              {FAQ_ITEMS.map(item => (
                <details key={item} className="rounded-md border bg-background p-4">
                  <summary className="cursor-pointer text-sm font-semibold">
                    {t(`faq_${item}_question`)}
                  </summary>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {t(`faq_${item}_answer`)}
                  </p>
                </details>
              ))}
            </div>
          </DashboardSection>

          <DashboardSection
            title={t('troubleshooting_title')}
            description={t('troubleshooting_description')}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {TROUBLESHOOTING_ITEMS.map(item => (
                <div key={item} className="rounded-md border bg-background p-4">
                  <div className="text-sm font-semibold">
                    {t(`troubleshooting_${item}_title`)}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {t(`troubleshooting_${item}_description`)}
                  </p>
                </div>
              ))}
            </div>
          </DashboardSection>
        </div>
      </div>
    </>
  );
};

export default SupportPage;

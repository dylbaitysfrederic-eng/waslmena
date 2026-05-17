import { eq } from 'drizzle-orm';
import { Facebook, Instagram, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';

import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { Button } from '@/components/ui/button';
import { db } from '@/libs/DB';
import { saasSettingsSchema } from '@/models/Schema';
import { Logo } from '@/templates/Logo';
import { AppConfig } from '@/utils/AppConfig';
import { getI18nPath } from '@/utils/Helpers';

const FEATURE_KEYS = [
  'qr_menu',
  'table_ordering',
  'faster_service',
  'usd_lbp',
  'arabic_english',
  'dashboard',
] as const;

const HOW_IT_WORKS_KEYS = [
  'setup_menu',
  'print_qr',
  'customer_orders',
  'staff_manages',
] as const;

const MENA_KEYS = [
  'unstable_internet',
  'bilingual_service',
  'cash_reality',
] as const;

const TEMPLATE_KEYS = [
  'fast_food',
  'cafe',
  'table_service',
  'shisha_lounge',
] as const;

const FAQ_KEYS = [
  'payments',
  'languages',
  'setup',
  'templates',
] as const;

export async function generateMetadata(props: { params: { locale: string } }) {
  const t = await getTranslations({
    locale: props.params.locale,
    namespace: 'Index',
  });

  return {
    title: t('meta_title'),
    description: t('meta_description'),
  };
}

const IndexPage = async (props: { params: { locale: string } }) => {
  unstable_setRequestLocale(props.params.locale);

  const t = await getTranslations('Landing');
  const dashboardPath = getI18nPath('/dashboard', props.params.locale);
  const [saasSettings] = await db
    .select({
      supportEmail: saasSettingsSchema.supportEmail,
      instagramUrl: saasSettingsSchema.instagramUrl,
      whatsappNumberOrUrl: saasSettingsSchema.whatsappNumberOrUrl,
      facebookUrl: saasSettingsSchema.facebookUrl,
    })
    .from(saasSettingsSchema)
    .where(eq(saasSettingsSchema.id, 'social_links'))
    .limit(1);

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
      // not a URL
    }

    const normalized = value.replace(/[^\d+]/g, '');

    if (/^\+?\d{8,15}$/.test(normalized)) {
      return `https://wa.me/${normalized.replace(/^\+/, '')}`;
    }

    return null;
  };

  const contactSettings = saasSettings
    ? {
        supportEmail: saasSettings.supportEmail ?? AppConfig.supportEmail,
        instagramUrl: saasSettings.instagramUrl,
        whatsappNumberOrUrl: saasSettings.whatsappNumberOrUrl,
        facebookUrl: saasSettings.facebookUrl,
      }
    : {
        supportEmail: AppConfig.supportEmail,
        instagramUrl: AppConfig.instagramUrl,
        whatsappNumberOrUrl: AppConfig.whatsappNumberOrUrl,
        facebookUrl: AppConfig.facebookUrl,
      };

  const contactEmail = contactSettings.supportEmail;
  const whatsappHref = getWhatsappLink(contactSettings.whatsappNumberOrUrl);
  const socialLinks = [
    {
      href: contactSettings.instagramUrl,
      icon: Instagram,
      label: 'Instagram',
    },
    {
      href: whatsappHref,
      icon: MessageCircle,
      label: 'WhatsApp',
    },
    {
      href: contactSettings.facebookUrl,
      icon: Facebook,
      label: 'Facebook',
    },
  ].filter((link): link is {
    href: string;
    icon: typeof Instagram;
    label: string;
  } => Boolean(link.href));

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-background/95">
        <div className="mx-auto flex max-w-screen-xl flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
          <Logo />
          <div className="flex flex-wrap items-center gap-3">
            <LocaleSwitcher />
            <Button asChild size="sm">
              <Link href={dashboardPath}>{t('nav_dashboard')}</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="border-b bg-zinc-950 text-white">
        <div className="mx-auto grid max-w-screen-xl gap-10 px-4 py-14 md:grid-cols-[minmax(0,1fr)_440px] md:items-center md:py-20">
          <div className="max-w-3xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-emerald-300">
              {t('hero_eyebrow')}
            </p>
            <h1 className="text-4xl font-semibold leading-tight tracking-normal sm:text-6xl">
              {t('hero_title')}
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-200">
              {t('hero_description')}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="bg-emerald-500 text-zinc-950 hover:bg-emerald-400">
                <Link href={dashboardPath}>{t('hero_primary_cta')}</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-zinc-500 bg-transparent text-white hover:bg-zinc-900">
                <a href="#how-it-works">{t('hero_secondary_cta')}</a>
              </Button>
            </div>
            <div className="mt-8 grid gap-3 text-sm text-zinc-300 sm:grid-cols-3">
              <div className="rounded-md border border-zinc-700 bg-zinc-900 p-3">
                {t('hero_signal_qr')}
              </div>
              <div className="rounded-md border border-zinc-700 bg-zinc-900 p-3">
                {t('hero_signal_languages')}
              </div>
              <div className="rounded-md border border-zinc-700 bg-zinc-900 p-3">
                {t('hero_signal_currency')}
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-md border border-zinc-700 bg-zinc-900 p-4 shadow-2xl">
              <div className="mb-4 flex items-center justify-between border-b border-zinc-700 pb-3">
                <div>
                  <div className="text-sm font-semibold">{t('preview_title')}</div>
                  <div className="text-xs text-zinc-400">{t('preview_subtitle')}</div>
                </div>
                <span className="rounded-md bg-amber-200 px-2 py-1 text-xs font-semibold text-amber-950">
                  {t('preview_badge')}
                </span>
              </div>
              <div className="space-y-3">
                {[
                  ['#104', 'Table 7', '$12.00', '42 AED'],
                  ['#105', 'Table 3', '$10.00', '38 SAR'],
                  ['#106', 'Table 1', '', '16 QAR'],
                ].map(([orderId, table, usd, lbp]) => (
                  <div key={orderId} className="rounded-md border border-zinc-700 bg-zinc-950 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold">{orderId}</div>
                        <div className="text-sm text-zinc-400">{table}</div>
                      </div>
                      <div className="text-right text-sm font-semibold">
                        {usd && <div>{usd}</div>}
                        <div>{lbp}</div>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                      <span className="rounded-md bg-yellow-200 p-2 font-semibold text-yellow-950">
                        {t('status_pending')}
                      </span>
                      <span className="rounded-md bg-zinc-800 p-2 text-zinc-300">
                        {t('status_preparing')}
                      </span>
                      <span className="rounded-md bg-zinc-800 p-2 text-zinc-300">
                        {t('status_ready')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-md border border-zinc-700 bg-white p-4 text-zinc-950">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase text-emerald-700">
                    {t('phone_mockup_label')}
                  </div>
                  <div className="mt-1 text-xl font-semibold">{t('phone_mockup_title')}</div>
                </div>
                <div className="rounded-md bg-zinc-950 px-2 py-1 text-xs font-semibold text-white">
                  QR
                </div>
              </div>
              <div className="mt-4 rounded-md border p-3">
                <div className="text-sm font-semibold">{t('phone_category')}</div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium">{t('phone_item')}</div>
                    <div className="text-xs text-muted-foreground">{t('phone_item_note')}</div>
                  </div>
                  <div className="text-right text-sm font-semibold">
                    <div>$8.00</div>
                    <div>42 AED</div>
                  </div>
                </div>
                <div className="mt-3 rounded-md bg-emerald-600 px-3 py-2 text-center text-sm font-semibold text-white">
                  {t('phone_add_button')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b py-14">
        <div className="mx-auto max-w-screen-xl px-4">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-normal">{t('features_title')}</h2>
            <p className="mt-3 text-muted-foreground">{t('features_description')}</p>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURE_KEYS.map(key => (
              <div key={key} className="rounded-md border bg-card p-5">
                <div className="text-lg font-semibold">{t(`feature_${key}_title`)}</div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {t(`feature_${key}_description`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-b bg-muted py-14">
        <div className="mx-auto max-w-screen-xl px-4">
          <h2 className="text-3xl font-semibold tracking-normal">{t('how_title')}</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {HOW_IT_WORKS_KEYS.map((key, index) => (
              <div key={key} className="rounded-md bg-background p-5">
                <div className="mb-4 flex size-9 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
                  {index + 1}
                </div>
                <div className="font-semibold">{t(`how_${key}_title`)}</div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {t(`how_${key}_description`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b py-14">
        <div className="mx-auto grid max-w-screen-xl gap-8 px-4 lg:grid-cols-[360px_1fr]">
          <div>
            <h2 className="text-3xl font-semibold tracking-normal">{t('mena_title')}</h2>
            <p className="mt-3 text-muted-foreground">{t('mena_description')}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {MENA_KEYS.map(key => (
              <div key={key} className="rounded-md border bg-card p-5">
                <div className="font-semibold">{t(`mena_${key}_title`)}</div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {t(`mena_${key}_description`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b bg-zinc-950 py-14 text-white">
        <div className="mx-auto max-w-screen-xl px-4">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-normal">
              {t('templates_title')}
            </h2>
            <p className="mt-3 text-zinc-300">{t('templates_description')}</p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {TEMPLATE_KEYS.map(key => (
              <div key={key} className="rounded-md border border-zinc-700 bg-zinc-900 p-4">
                <div className="rounded-md border border-zinc-700 bg-zinc-950 p-3">
                  <div className="text-xs text-zinc-400">
                    {AppConfig.name}
                    {' '}
                    demo
                  </div>
                  <div className="mt-1 text-lg font-semibold">{t(`template_${key}_title`)}</div>
                  <div className="mt-4 rounded-md bg-zinc-900 p-3">
                    <div className="text-sm font-medium">{t('template_sample_category')}</div>
                    <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                      <span>{t('template_sample_item')}</span>
                      <span className="font-semibold">$8</span>
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-6 text-zinc-300">
                  {t(`template_${key}_description`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b bg-muted py-14">
        <div className="mx-auto max-w-screen-xl px-4">
          <div className="rounded-md bg-background p-6">
            <div className="grid gap-6 md:grid-cols-[1fr_280px] md:items-center">
              <div>
                <h2 className="text-3xl font-semibold tracking-normal">{t('pricing_title')}</h2>
                <p className="mt-3 text-muted-foreground">{t('pricing_description')}</p>
              </div>
              <div className="rounded-md border p-5">
                <div className="text-sm font-semibold text-muted-foreground">{t('pricing_plan_label')}</div>
                <div className="mt-2 text-3xl font-semibold">{t('pricing_plan_price')}</div>
                <p className="mt-2 text-sm text-muted-foreground">{t('pricing_plan_note')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b py-14">
        <div className="mx-auto max-w-screen-xl px-4">
          <div className="grid gap-6 md:grid-cols-[1fr_320px] md:items-center">
            <div>
              <h2 className="text-3xl font-semibold tracking-normal">{t('contact_title')}</h2>
              <p className="mt-3 text-muted-foreground">{t('contact_description')}</p>
            </div>
            <div className="rounded-md border bg-background p-6">
              <div>
                <div className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{t('contact_email_label')}</div>
                <a
                  href={`mailto:${contactEmail}`}
                  className="mt-2 block text-lg font-semibold text-foreground"
                >
                  {contactEmail}
                </a>
              </div>
              {whatsappHref && (
                <div className="mt-6">
                  <div className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{t('contact_whatsapp_label')}</div>
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 block text-lg font-semibold text-foreground"
                  >
                    {t('contact_whatsapp_button')}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b py-14">
        <div className="mx-auto max-w-screen-xl px-4">
          <h2 className="text-3xl font-semibold tracking-normal">{t('faq_title')}</h2>
          <div className="mt-8 grid gap-3 md:grid-cols-2">
            {FAQ_KEYS.map(key => (
              <details key={key} className="rounded-md border bg-card p-5">
                <summary className="cursor-pointer font-semibold">
                  {t(`faq_${key}_question`)}
                </summary>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {t(`faq_${key}_answer`)}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14">
        <div className="mx-auto max-w-screen-xl px-4 text-center">
          <h2 className="text-3xl font-semibold tracking-normal">{t('cta_title')}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">{t('cta_description')}</p>
          <Button asChild size="lg" className="mt-8">
            <Link href={dashboardPath}>{t('cta_button')}</Link>
          </Button>
        </div>
      </section>

      <footer className="border-t py-8">
        <div className="mx-auto flex max-w-screen-xl flex-col gap-4 px-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="font-semibold text-foreground">{AppConfig.name}</div>
            <p>{t('footer_text')}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {socialLinks.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium uppercase">
                  {t('footer_social_label')}
                </span>
                {socialLinks.map((link) => {
                  const Icon = link.icon;

                  return (
                    <a
                      key={link.label}
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={link.label}
                      className="inline-flex size-9 items-center justify-center rounded-md border bg-background text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <Icon className="size-4" aria-hidden="true" />
                    </a>
                  );
                })}
              </div>
            )}
            <LocaleSwitcher />
          </div>
        </div>
      </footer>
    </main>
  );
};

export default IndexPage;

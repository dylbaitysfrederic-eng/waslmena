import { eq } from 'drizzle-orm';
import {
  CheckCircle2,
  Clock3,
  Facebook,
  Instagram,
  MessageCircle,
  QrCode,
  Smartphone,
  Utensils,
} from 'lucide-react';
import Link from 'next/link';
import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';

import { FormSubmitButton } from '@/components/FormSubmitButton';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { db } from '@/libs/DB';
import { saasSettingsSchema } from '@/models/Schema';
import { Logo } from '@/templates/Logo';
import { AppConfig } from '@/utils/AppConfig';
import { getI18nPath } from '@/utils/Helpers';

import { sendLandingContactAction } from './actions';

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

const FAQ_KEYS = [
  'payments',
  'languages',
  'setup',
  'templates',
] as const;

const WASL_HELLO_EMAIL = 'hello@waslmena.com';
const WASL_SUPPORT_EMAIL = 'support@waslmena.com';

const OWNER_EXAMPLES = [
  {
    orderId: '#104',
    guest: 'Ali',
    table: 'Table 7',
    itemKey: 'owner_example_lebanon',
    local: '1,080,000 LBP / LL',
    usd: '$12.00',
  },
  {
    orderId: '#105',
    guest: 'Nour',
    table: 'Table 3',
    itemKey: 'owner_example_dubai',
    local: '92 AED',
    usd: '$25.00',
  },
  {
    orderId: '#106',
    guest: 'Karim',
    table: 'Table 1',
    itemKey: 'owner_example_doha',
    local: '218 QAR',
    usd: '$60.00',
  },
] as const;

const TEMPLATE_PRICE_EXAMPLES = [
  {
    key: 'fast_food',
    local: '1,080,000 LBP / LL',
    usd: '$12',
  },
  {
    key: 'cafe',
    local: '38 AED',
    usd: '$10',
  },
  {
    key: 'table_service',
    local: '44 QAR',
    usd: '$12',
  },
  {
    key: 'shisha_lounge',
    local: '55 AED',
    usd: '$15',
  },
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

const IndexPage = async (props: {
  params: { locale: string };
  searchParams?: { contact?: string };
}) => {
  unstable_setRequestLocale(props.params.locale);

  const t = await getTranslations('Landing');
  const dashboardPath = getI18nPath('/dashboard', props.params.locale);
  const landingPath = getI18nPath('/', props.params.locale);
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

  const contactEmail = WASL_HELLO_EMAIL;
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
      <header className="sticky top-0 z-40 border-b border-zinc-900/10 bg-background/95 shadow-sm backdrop-blur-sm">
        <div className="mx-auto flex max-w-screen-xl flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-4">
          <Logo />
          <div className="flex flex-wrap items-center gap-3">
            <LocaleSwitcher />
            <Button asChild size="sm" variant="outline">
              <Link href={dashboardPath}>{t('nav_dashboard')}</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="border-b bg-zinc-50">
        <div className="mx-auto grid max-w-screen-xl gap-10 px-4 py-10 md:grid-cols-[minmax(0,0.95fr)_minmax(360px,1.05fr)] md:items-center md:py-16 lg:py-20">
          <div className="max-w-2xl">
            <p className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase text-emerald-800">
              {t('hero_eyebrow')}
            </p>
            <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-normal text-zinc-950 sm:text-5xl lg:text-6xl">
              {t('hero_title')}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-zinc-600 sm:text-lg">
              {t('hero_description')}
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="bg-emerald-600 text-white hover:bg-emerald-700">
                <a href="#contact">{t('hero_primary_cta')}</a>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-zinc-300 bg-white">
                <a href="#how-it-works">{t('hero_secondary_cta')}</a>
              </Button>
            </div>
            <div className="mt-7 grid gap-2 text-sm text-zinc-700 sm:grid-cols-2">
              {[
                t('hero_signal_qr'),
                t('hero_signal_languages'),
                t('hero_signal_stable'),
                t('hero_signal_lightweight'),
              ].map(signal => (
                <div key={signal} className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                  <span>{signal}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mx-auto grid w-full max-w-xl gap-4">
            <div className="rounded-2xl border bg-white p-3 shadow-sm">
              <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
                <div className="rounded-2xl border bg-zinc-950 p-2 shadow-sm">
                  <div className="rounded-xl bg-white p-3 text-zinc-950">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-semibold uppercase text-emerald-700">
                          {t('customer_menu_label')}
                        </div>
                        <div className="text-lg font-semibold">{t('phone_category')}</div>
                      </div>
                      <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-semibold">
                        Table 7
                      </span>
                    </div>
                    <div className="mt-4 rounded-md border p-3">
                      <div className="flex items-start gap-2">
                        <Utensils className="mt-0.5 size-4 text-zinc-500" />
                        <div>
                          <div className="text-sm font-semibold">{t('phone_item')}</div>
                          <div className="text-xs text-muted-foreground">{t('phone_item_note')}</div>
                        </div>
                      </div>
                      <div className="mt-3 flex items-end justify-between gap-3 text-sm">
                        <div className="text-xs text-muted-foreground">
                          USD
                          <div className="font-semibold text-zinc-950">$8.00</div>
                        </div>
                        <div className="text-right text-xs text-muted-foreground">
                          LBP
                          <div className="font-semibold text-zinc-950">720,000 LBP / LL</div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 rounded-md bg-emerald-600 px-3 py-2 text-center text-sm font-semibold text-white">
                      {t('phone_add_button')}
                    </div>
                  </div>
                </div>

                <div className="grid content-between gap-3">
                  <div className="rounded-xl border bg-zinc-950 p-4 text-white">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold">{t('preview_title')}</div>
                        <div className="text-xs text-zinc-400">{t('preview_subtitle')}</div>
                      </div>
                      <span className="rounded-md bg-amber-200 px-2 py-1 text-xs font-semibold text-amber-950">
                        {t('preview_badge')}
                      </span>
                    </div>
                    <div className="mt-4 grid gap-2">
                      {OWNER_EXAMPLES.slice(0, 2).map(({ orderId, guest, table, itemKey, local }) => (
                        <div key={orderId} className="rounded-md border border-zinc-800 bg-zinc-900 p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-semibold">{orderId}</div>
                              <div className="text-xs text-zinc-400">
                                {guest}
                                {' · '}
                                {table}
                              </div>
                              <div className="mt-1 text-sm text-zinc-300">{t(itemKey)}</div>
                            </div>
                            <div className="text-right text-xs font-semibold text-zinc-200">
                              {local}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs font-semibold text-zinc-700">
                    <div className="rounded-md border bg-white p-3">
                      <QrCode className="mx-auto mb-1 size-4 text-emerald-600" />
                      {t('hero_visual_qr')}
                    </div>
                    <div className="rounded-md border bg-white p-3">
                      <Smartphone className="mx-auto mb-1 size-4 text-emerald-600" />
                      {t('hero_visual_no_app')}
                    </div>
                    <div className="rounded-md border bg-white p-3">
                      <Clock3 className="mx-auto mb-1 size-4 text-emerald-600" />
                      {t('hero_visual_tickets')}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border bg-white px-4 py-3 text-sm text-zinc-600 shadow-sm">
              {t('hero_stability_note')}
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
            {TEMPLATE_PRICE_EXAMPLES.map(({ key, local, usd }) => (
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
                      <span className="text-right font-semibold">
                        <span className="block">{local}</span>
                        <span className="block text-xs text-zinc-400">{usd}</span>
                      </span>
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

      <section id="contact" className="scroll-mt-6 border-b py-14">
        <div className="mx-auto max-w-screen-xl px-4">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(360px,520px)] lg:items-start">
            <div>
              <h2 className="text-3xl font-semibold tracking-normal">{t('contact_title')}</h2>
              <p className="mt-3 text-muted-foreground">{t('contact_description')}</p>
              <div className="mt-6 grid gap-3 text-sm">
                <div className="rounded-md border bg-card p-4">
                  <div className="font-semibold">{t('contact_hello_label')}</div>
                  <a
                    href={`mailto:${contactEmail}`}
                    className="mt-1 block font-semibold text-foreground"
                  >
                    {contactEmail}
                  </a>
                  <p className="mt-1 text-muted-foreground">{t('contact_hello_help')}</p>
                </div>
                <div className="rounded-md border bg-card p-4">
                  <div className="font-semibold">{t('contact_support_label')}</div>
                  <a
                    href={`mailto:${WASL_SUPPORT_EMAIL}`}
                    className="mt-1 block font-semibold text-foreground"
                  >
                    {WASL_SUPPORT_EMAIL}
                  </a>
                  <p className="mt-1 text-muted-foreground">{t('contact_support_help')}</p>
                </div>
              </div>
              {whatsappHref && (
                <Button asChild variant="outline" className="mt-6">
                  <a href={whatsappHref} target="_blank" rel="noreferrer">
                    {t('contact_whatsapp_button')}
                  </a>
                </Button>
              )}
            </div>

            <form action={sendLandingContactAction} className="rounded-md border bg-background p-5 shadow-sm">
              <input type="hidden" name="returnPath" value={landingPath} />
              <div className="mb-5">
                <h3 className="text-xl font-semibold">{t('contact_form_title')}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t('contact_form_description')}
                </p>
              </div>

              {props.searchParams?.contact === 'sent' && (
                <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-950">
                  {t('contact_form_success')}
                </div>
              )}
              {props.searchParams?.contact === 'invalid' && (
                <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm font-medium text-destructive">
                  {t('contact_form_invalid')}
                </div>
              )}
              {props.searchParams?.contact === 'error' && (
                <div className="mb-4 rounded-md border border-red-700 bg-red-900/10 p-3 text-sm font-medium text-red-200">
                  {t('contact_form_error')}
                </div>
              )}

              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="restaurantName">{t('contact_restaurant_name_label')}</Label>
                  <Input
                    id="restaurantName"
                    name="restaurantName"
                    required
                    maxLength={100}
                    placeholder={t('contact_restaurant_name_placeholder')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactName">{t('contact_name_label')}</Label>
                  <Input
                    id="contactName"
                    name="contactName"
                    required
                    maxLength={100}
                    placeholder={t('contact_name_placeholder')}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('contact_form_email_label')}</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      maxLength={120}
                      placeholder={t('contact_form_email_placeholder')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp">{t('contact_form_whatsapp_label')}</Label>
                    <Input
                      id="whatsapp"
                      name="whatsapp"
                      maxLength={32}
                      inputMode="tel"
                      placeholder={t('contact_form_whatsapp_placeholder')}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">{t('contact_message_label')}</Label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={5}
                    maxLength={1200}
                    placeholder={t('contact_message_placeholder')}
                    className="flex min-h-28 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
                <FormSubmitButton pendingLabel={t('contact_form_pending')}>
                  {t('contact_form_button')}
                </FormSubmitButton>
              </div>
            </form>
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
            <a href="#contact">{t('cta_button')}</a>
          </Button>
        </div>
      </section>

      <footer className="border-t py-8">
        <div className="mx-auto flex max-w-screen-xl flex-col gap-4 px-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="font-semibold text-foreground">{AppConfig.name}</div>
            <p>{t('footer_copyright', { year: new Date().getFullYear() })}</p>
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

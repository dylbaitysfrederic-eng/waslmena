import '@/styles/global.css';

import type { Metadata } from 'next';
import { NextIntlClientProvider, useMessages } from 'next-intl';
import { unstable_setRequestLocale } from 'next-intl/server';

import { NetworkStatusBanner } from '@/components/NetworkStatusBanner';
import { AllLocales } from '@/utils/AppConfig';

const RTL_LOCALES = ['ar'];

export const metadata: Metadata = {
  metadataBase: new URL('https://waslmena.com'),
  icons: [
    {
      rel: 'apple-touch-icon',
      url: '/wasl-logo.svg',
    },
    {
      rel: 'icon',
      type: 'image/svg+xml',
      url: '/wasl-logo.svg',
    },
    {
      rel: 'shortcut icon',
      type: 'image/svg+xml',
      url: '/wasl-logo.svg',
    },
  ],
  openGraph: {
    images: ['/wasl-logo.svg'],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/wasl-logo.svg'],
  },
};

export function generateStaticParams() {
  return AllLocales.map(locale => ({ locale }));
}

export default function RootLayout(props: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  unstable_setRequestLocale(props.params.locale);

  // Using internationalization in Client Components
  const messages = useMessages();

  // The `suppressHydrationWarning` in <html> is used to prevent hydration errors caused by `next-themes`.
  // Solution provided by the package itself: https://github.com/pacocoursey/next-themes?tab=readme-ov-file#with-app

  // The `suppressHydrationWarning` attribute in <body> is used to prevent hydration errors caused by Sentry Overlay,
  // which dynamically adds a `style` attribute to the body tag.
  return (
    <html
      lang={props.params.locale}
      dir={RTL_LOCALES.includes(props.params.locale) ? 'rtl' : 'ltr'}
      suppressHydrationWarning
    >
      <body className="bg-background text-foreground antialiased" suppressHydrationWarning>
        {/* PRO: Dark mode support for Shadcn UI */}
        <NextIntlClientProvider
          locale={props.params.locale}
          messages={messages}
        >
          {props.children}

          <NetworkStatusBanner />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

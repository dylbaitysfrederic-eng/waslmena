'use client';

import { useTranslations } from 'next-intl';

import { ErrorBoundaryFallback } from '@/components/ErrorBoundaryFallback';

export default function LocaleError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('ErrorBoundary');

  return (
    <ErrorBoundaryFallback
      scope="locale"
      error={props.error}
      reset={props.reset}
      title={t('title')}
      description={t('description')}
      retryLabel={t('retry')}
    />
  );
}

'use client';

import { useTranslations } from 'next-intl';

import { ErrorBoundaryFallback } from '@/components/ErrorBoundaryFallback';

export default function PublicMenuError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('ErrorBoundary');

  return (
    <ErrorBoundaryFallback
      scope="public_menu"
      error={props.error}
      reset={props.reset}
      title={t('public_menu_title')}
      description={t('public_menu_description')}
      retryLabel={t('retry')}
    />
  );
}

'use client';

import { useTranslations } from 'next-intl';

import { ErrorBoundaryFallback } from '@/components/ErrorBoundaryFallback';

export default function DashboardError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('ErrorBoundary');

  return (
    <ErrorBoundaryFallback
      scope="dashboard"
      error={props.error}
      reset={props.reset}
      title={t('dashboard_title')}
      description={t('dashboard_description')}
      retryLabel={t('retry')}
    />
  );
}

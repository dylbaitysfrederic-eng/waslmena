'use client';

import { ErrorBoundaryFallback } from '@/components/ErrorBoundaryFallback';

export default function AdminError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorBoundaryFallback
      scope="admin"
      error={props.error}
      reset={props.reset}
      title="Admin page unavailable"
      description="The admin workspace could not load safely. Please try again."
      retryLabel="Try again"
    />
  );
}

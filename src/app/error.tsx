'use client';

import { ErrorBoundaryFallback } from '@/components/ErrorBoundaryFallback';

export default function RootError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorBoundaryFallback
      scope="root"
      error={props.error}
      reset={props.reset}
      title="Something went wrong"
      description="The page could not load safely. Please try again."
      retryLabel="Try again"
    />
  );
}

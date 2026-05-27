'use client';

import { useEffect } from 'react';

import { Button } from '@/components/ui/button';

type ErrorBoundaryFallbackProps = {
  description: string;
  error: Error & { digest?: string };
  reset: () => void;
  scope: string;
  title: string;
  retryLabel: string;
};

export const ErrorBoundaryFallback = ({
  description,
  error,
  reset,
  scope,
  title,
  retryLabel,
}: ErrorBoundaryFallbackProps) => {
  useEffect(() => {
    console.error('wasl_error_boundary', {
      scope,
      message: error.message,
      digest: error.digest,
      name: error.name,
    });
  }, [error, scope]);

  return (
    <main className="min-h-[60vh] bg-background px-4 py-10 text-foreground">
      <section className="mx-auto flex min-h-[50vh] w-full max-w-xl items-center">
        <div className="w-full rounded-md border bg-card p-5 text-center shadow-sm sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Wasl
          </p>
          <h1 className="mt-3 text-xl font-semibold">{title}</h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            {description}
          </p>
          <Button type="button" className="mt-5 min-h-11" onClick={reset}>
            {retryLabel}
          </Button>
        </div>
      </section>
    </main>
  );
};

import { cn } from '@/utils/Helpers';

const SkeletonBlock = ({ className }: { className?: string }) => (
  <div className={cn('rounded-md bg-muted', className)} />
);

export const DashboardPageSkeleton = () => (
  <section className="grid gap-5">
    <div className="space-y-2">
      <SkeletonBlock className="h-7 w-44" />
      <SkeletonBlock className="h-4 w-full max-w-md" />
    </div>
    <div className="rounded-md border bg-card p-4 shadow-sm sm:p-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <SkeletonBlock className="h-24" />
        <SkeletonBlock className="h-24" />
        <SkeletonBlock className="h-24" />
      </div>
      <div className="mt-5 grid gap-3">
        <SkeletonBlock className="h-20" />
        <SkeletonBlock className="h-20" />
        <SkeletonBlock className="h-20" />
      </div>
    </div>
  </section>
);

export const PublicMenuSkeleton = () => (
  <main className="min-h-screen bg-background px-4 py-5 text-foreground">
    <div className="mx-auto w-full max-w-2xl space-y-5">
      <div className="rounded-md border bg-card p-4">
        <SkeletonBlock className="size-12" />
        <SkeletonBlock className="mt-4 h-7 w-44" />
        <SkeletonBlock className="mt-2 h-4 w-64 max-w-full" />
      </div>
      <div className="-mx-4 flex gap-2 overflow-hidden border-y px-4 py-2">
        <SkeletonBlock className="h-10 w-24 shrink-0 rounded-full" />
        <SkeletonBlock className="h-10 w-28 shrink-0 rounded-full" />
        <SkeletonBlock className="h-10 w-20 shrink-0 rounded-full" />
      </div>
      <div className="space-y-3">
        <SkeletonBlock className="h-6 w-36" />
        <SkeletonBlock className="h-32" />
        <SkeletonBlock className="h-32" />
        <SkeletonBlock className="h-32" />
      </div>
    </div>
  </main>
);

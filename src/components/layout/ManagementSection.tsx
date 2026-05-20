import type { ReactNode } from 'react';

import { cn } from '@/utils/Helpers';

type ManagementSectionProps = {
  children: ReactNode;
  className?: string;
  description?: string;
  title: string;
};

export const ManagementSection = (props: ManagementSectionProps) => (
  <section className={cn('rounded-md bg-background p-5', props.className)}>
    <div className="mb-4">
      <h3 className="font-semibold">{props.title}</h3>
      {props.description && (
        <p className="mt-1 text-sm text-muted-foreground">
          {props.description}
        </p>
      )}
    </div>
    {props.children}
  </section>
);

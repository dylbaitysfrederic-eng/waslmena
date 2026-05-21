import type { ReactNode } from 'react';

type AdvancedSettingsBlockProps = {
  children: ReactNode;
  description: string;
  title: string;
};

export const AdvancedSettingsBlock = (props: AdvancedSettingsBlockProps) => (
  <details className="group rounded-md border bg-card p-4 shadow-sm sm:p-5">
    <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
      <span className="grid gap-1">
        <span className="text-sm font-semibold">{props.title}</span>
        <span className="text-xs leading-5 text-muted-foreground">
          {props.description}
        </span>
      </span>
      <span
        aria-hidden="true"
        className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border bg-background text-xs font-semibold text-muted-foreground transition-transform group-open:rotate-180"
      >
        v
      </span>
    </summary>
    <div className="mt-5 border-t bg-background/40 pt-5">
      {props.children}
    </div>
  </details>
);

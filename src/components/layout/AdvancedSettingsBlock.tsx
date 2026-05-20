import type { ReactNode } from 'react';

type AdvancedSettingsBlockProps = {
  children: ReactNode;
  description: string;
  title: string;
};

export const AdvancedSettingsBlock = (props: AdvancedSettingsBlockProps) => (
  <details className="group border-t pt-5">
    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold">
      <span>{props.title}</span>
      <span
        aria-hidden="true"
        className="text-xs text-muted-foreground transition-transform group-open:rotate-180"
      >
        v
      </span>
    </summary>
    <p className="mt-2 text-xs leading-5 text-muted-foreground">
      {props.description}
    </p>
    <div className="mt-4">
      {props.children}
    </div>
  </details>
);

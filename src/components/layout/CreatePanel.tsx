import type { ReactNode } from 'react';

type CreatePanelProps = {
  children: ReactNode;
  description: string;
  title: string;
};

export const CreatePanel = (props: CreatePanelProps) => (
  <details className="wasl-panel p-4">
    <summary className="cursor-pointer text-sm font-semibold">
      {props.title}
    </summary>
    <p className="mt-2 text-xs leading-5 text-muted-foreground">
      {props.description}
    </p>
    {props.children}
  </details>
);

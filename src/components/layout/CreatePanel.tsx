import type { ReactNode } from 'react';

type CreatePanelProps = {
  children: ReactNode;
  description: string;
  title: string;
};

export const CreatePanel = (props: CreatePanelProps) => (
  <details className="rounded-md border p-4">
    <summary className="cursor-pointer font-medium">
      {props.title}
    </summary>
    <p className="mt-2 text-xs text-muted-foreground">
      {props.description}
    </p>
    {props.children}
  </details>
);

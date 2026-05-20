import type { ReactNode } from 'react';

type SettingsSectionProps = {
  children: ReactNode;
  description: string;
  title: string;
};

export const SettingsSection = (props: SettingsSectionProps) => (
  <section className="rounded-md border bg-background p-5">
    <div className="mb-4">
      <h4 className="font-semibold">{props.title}</h4>
      <p className="mt-1 text-sm text-muted-foreground">
        {props.description}
      </p>
    </div>
    {props.children}
  </section>
);

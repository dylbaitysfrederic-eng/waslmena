import type { ReactNode } from 'react';

type SettingsSectionProps = {
  children: ReactNode;
  description: string;
  title: string;
};

export const SettingsSection = (props: SettingsSectionProps) => (
  <section className="wasl-panel p-4 sm:p-5">
    <div className="mb-4">
      <h4 className="text-sm font-semibold sm:text-base">{props.title}</h4>
      <p className="mt-1 text-sm text-muted-foreground">
        {props.description}
      </p>
    </div>
    {props.children}
  </section>
);

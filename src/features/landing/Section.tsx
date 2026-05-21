import { cn } from '@/utils/Helpers';

export const Section = (props: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  description?: string;
  className?: string;
}) => (
  <div className={cn('px-3 py-12', props.className)}>
    {(props.title || props.subtitle || props.description) && (
      <div className="mx-auto mb-8 max-w-screen-md text-center">
        {props.subtitle && (
          <div className="wasl-eyebrow">
            {props.subtitle}
          </div>
        )}

        {props.title && (
          <div className="mt-2 text-2xl font-semibold sm:text-3xl">{props.title}</div>
        )}

        {props.description && (
          <div className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            {props.description}
          </div>
        )}
      </div>
    )}

    <div className="mx-auto max-w-screen-lg">{props.children}</div>
  </div>
);

import type { ChangeEventHandler } from 'react';

import { cn } from '@/utils/Helpers';

type SwitchFieldProps = {
  defaultChecked?: boolean;
  description?: string;
  disabled?: boolean;
  id: string;
  label: string;
  name: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
};

export const SwitchField = ({
  defaultChecked,
  description,
  disabled,
  id,
  label,
  name,
  onChange,
}: SwitchFieldProps) => {
  return (
    <label
      htmlFor={id}
      className={cn(
        'flex cursor-pointer items-center justify-between gap-3 rounded-md border bg-background p-3',
        disabled && 'cursor-not-allowed opacity-60',
      )}
    >
      <span className="min-w-0">
        <span className="block text-sm font-medium text-foreground">
          {label}
        </span>
        {description && (
          <span className="mt-1 block text-xs leading-5 text-muted-foreground">
            {description}
          </span>
        )}
      </span>
      <span className="relative inline-flex shrink-0 items-center">
        <input
          id={id}
          name={name}
          type="checkbox"
          defaultChecked={defaultChecked}
          disabled={disabled}
          onChange={onChange}
          className="peer sr-only"
        />
        <span
          aria-hidden="true"
          className="h-7 w-12 rounded-full bg-muted shadow-inner transition-colors peer-checked:bg-green-500 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring peer-disabled:opacity-60"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-1 size-5 rounded-full bg-background shadow transition-transform peer-checked:translate-x-5"
        />
      </span>
    </label>
  );
};

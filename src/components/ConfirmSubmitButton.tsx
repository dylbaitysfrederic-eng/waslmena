'use client';

import { useFormStatus } from 'react-dom';

import { Button, type ButtonProps } from '@/components/ui/button';

type ConfirmSubmitButtonProps = ButtonProps & {
  confirmMessage: string;
  pendingLabel: string;
};

export const ConfirmSubmitButton = ({
  children,
  confirmMessage,
  disabled,
  pendingLabel,
  onClick,
  ...props
}: ConfirmSubmitButtonProps) => {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={disabled || pending}
      onClick={(event) => {
        // eslint-disable-next-line no-alert
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
          return;
        }

        onClick?.(event);
      }}
      {...props}
    >
      {pending ? pendingLabel : children}
    </Button>
  );
};

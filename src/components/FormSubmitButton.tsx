'use client';

import { useFormStatus } from 'react-dom';

import { Button, type ButtonProps } from '@/components/ui/button';

type FormSubmitButtonProps = ButtonProps & {
  pendingLabel: string;
};

export const FormSubmitButton = ({
  children,
  disabled,
  pendingLabel,
  ...props
}: FormSubmitButtonProps) => {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={disabled || pending} {...props}>
      {pending ? pendingLabel : children}
    </Button>
  );
};

'use client';

import { useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';

import { Button, type ButtonProps } from '@/components/ui/button';

type FormSubmitButtonProps = ButtonProps & {
  pendingLabel: string;
};

export const FormSubmitButton = ({
  children,
  disabled,
  onClick,
  pendingLabel,
  ...props
}: FormSubmitButtonProps) => {
  const { pending } = useFormStatus();
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const sawPending = useRef(false);
  const isDisabled = disabled || pending || hasSubmitted;

  useEffect(() => {
    if (pending) {
      sawPending.current = true;
      return;
    }

    if (sawPending.current) {
      sawPending.current = false;
      setHasSubmitted(false);
    }
  }, [pending]);

  useEffect(() => {
    if (!hasSubmitted || pending) {
      return undefined;
    }

    const resetTimeout = window.setTimeout(() => {
      setHasSubmitted(false);
    }, 10_000);

    return () => window.clearTimeout(resetTimeout);
  }, [hasSubmitted, pending]);

  return (
    <Button
      type="submit"
      aria-disabled={isDisabled}
      disabled={isDisabled}
      onClick={(event) => {
        if (isDisabled) {
          event.preventDefault();
          return;
        }

        onClick?.(event);

        if (!event.defaultPrevented) {
          setHasSubmitted(true);
        }
      }}
      {...props}
    >
      {pending || hasSubmitted ? pendingLabel : children}
    </Button>
  );
};

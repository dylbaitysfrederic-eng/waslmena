'use client';

import { useEffect, useRef, useState } from 'react';
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

        // eslint-disable-next-line no-alert
        if (!window.confirm(confirmMessage)) {
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

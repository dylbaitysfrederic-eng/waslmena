'use client';

import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useState } from 'react';

import { Button, type ButtonProps } from '@/components/ui/button';
import { cn } from '@/utils/Helpers';

import { updateOrderStatusAction } from './actions';

type OrderStatusFormProps = {
  buttonClassName?: string;
  children: ReactNode;
  currentPath: string;
  disabled?: boolean;
  errorLabel: string;
  orderId: number;
  pendingLabel: string;
  size?: ButtonProps['size'];
  status: string;
  variant?: ButtonProps['variant'];
};

export const OrderStatusForm = ({
  buttonClassName,
  children,
  currentPath,
  disabled,
  errorLabel,
  orderId,
  pendingLabel,
  size,
  status,
  variant,
}: OrderStatusFormProps) => {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [hasError, setHasError] = useState(false);
  const isDisabled = disabled || isUpdating;

  return (
    <form
      action={async (formData) => {
        if (isDisabled) {
          return;
        }

        setHasError(false);
        setIsUpdating(true);

        try {
          const result = await updateOrderStatusAction(formData);

          if (!result?.ok) {
            setHasError(true);
            return;
          }

          router.refresh();
        } catch {
          setHasError(true);
        } finally {
          setIsUpdating(false);
        }
      }}
      className="grid gap-2"
    >
      <input type="hidden" name="currentPath" value={currentPath} />
      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="status" value={status} />
      <Button
        type="submit"
        aria-disabled={isDisabled}
        disabled={isDisabled}
        variant={variant}
        size={size}
        className={cn(buttonClassName)}
      >
        {isUpdating ? pendingLabel : children}
      </Button>
      {hasError && (
        <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-950">
          {errorLabel}
        </p>
      )}
    </form>
  );
};

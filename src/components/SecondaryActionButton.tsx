import type { ComponentProps } from 'react';

import { cn } from '@/utils/Helpers';

import { Button } from './ui/button';

type SecondaryActionButtonProps = ComponentProps<typeof Button>;

export const SecondaryActionButton = ({
  className,
  ...props
}: SecondaryActionButtonProps) => (
  <Button
    variant="outline"
    size="sm"
    className={cn('min-h-10 w-full', className)}
    {...props}
  />
);

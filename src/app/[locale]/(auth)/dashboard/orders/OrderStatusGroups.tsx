'use client';

import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';

type OrderStatusGroupsProps = {
  children: ReactNode;
  collapseAllLabel: string;
  expandAllLabel: string;
};

export const OrderStatusGroups = ({
  children,
  collapseAllLabel,
  expandAllLabel,
}: OrderStatusGroupsProps) => {
  const setAllGroupsOpen = (open: boolean) => {
    document
      .querySelectorAll<HTMLDetailsElement>('[data-order-status-group]')
      .forEach((group) => {
        group.open = open;
      });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setAllGroupsOpen(true)}
        >
          {expandAllLabel}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setAllGroupsOpen(false)}
        >
          {collapseAllLabel}
        </Button>
      </div>
      <div className="space-y-7">{children}</div>
    </div>
  );
};

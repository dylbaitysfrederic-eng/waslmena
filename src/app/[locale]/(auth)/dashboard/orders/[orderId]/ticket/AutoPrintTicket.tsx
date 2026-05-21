'use client';

import { useEffect } from 'react';

import { Button } from '@/components/ui/button';

export const AutoPrintTicket = ({
  label,
  ticketId,
}: {
  label: string;
  ticketId: string;
}) => {
  useEffect(() => {
    const ticket = document.getElementById(ticketId);
    ticket?.focus();

    const printTimeout = window.setTimeout(() => {
      window.focus();
      window.print();
    }, 250);

    return () => window.clearTimeout(printTimeout);
  }, [ticketId]);

  return (
    <Button type="button" onClick={() => window.print()}>
      {label}
    </Button>
  );
};

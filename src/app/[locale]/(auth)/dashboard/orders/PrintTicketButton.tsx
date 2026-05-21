'use client';

import { Button } from '@/components/ui/button';

type PrintTicketButtonProps = {
  href: string;
  label: string;
};

export const PrintTicketButton = ({ href, label }: PrintTicketButtonProps) => {
  const handlePrint = () => {
    const ticketWindow = window.open(
      href,
      '_blank',
      'noopener,noreferrer,width=420,height=720',
    );

    if (ticketWindow) {
      ticketWindow.focus();
      return;
    }

    window.location.href = href;
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      className="h-12 w-full"
      onClick={handlePrint}
    >
      {label}
    </Button>
  );
};

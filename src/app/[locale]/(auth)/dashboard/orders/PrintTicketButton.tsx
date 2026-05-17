'use client';

import { Button } from '@/components/ui/button';

type PrintTicketButtonProps = {
  label: string;
  ticketId: string;
};

export const PrintTicketButton = ({ label, ticketId }: PrintTicketButtonProps) => {
  const handlePrint = () => {
    const existingStyle = document.getElementById('order-ticket-print-style');
    existingStyle?.remove();

    const style = document.createElement('style');
    style.id = 'order-ticket-print-style';
    style.textContent = `
      @media print {
        @page {
          margin: 6mm;
        }

        body * {
          visibility: hidden !important;
        }

        #${ticketId},
        #${ticketId} * {
          visibility: visible !important;
        }

        #${ticketId} {
          display: block !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          width: 72mm !important;
          max-width: 100% !important;
          padding: 0 !important;
          color: #000 !important;
          background: #fff !important;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
          font-size: 12px !important;
          line-height: 1.35 !important;
        }

        #${ticketId} [data-order-ticket-divider] {
          border-top: 1px dashed #000 !important;
        }
      }
    `;

    document.head.appendChild(style);

    const removeStyle = () => {
      style.remove();
      window.removeEventListener('afterprint', removeStyle);
    };

    window.addEventListener('afterprint', removeStyle);
    window.print();
    window.setTimeout(removeStyle, 1000);
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

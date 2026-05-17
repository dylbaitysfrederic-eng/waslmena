'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';

type CopyTicketButtonProps = {
  copiedLabel: string;
  fallbackLabel: string;
  label: string;
  text: string;
};

export const CopyTicketButton = ({
  copiedLabel,
  fallbackLabel,
  label,
  text,
}: CopyTicketButtonProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
      return;
    }

    // eslint-disable-next-line no-alert
    window.prompt(fallbackLabel, text);
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      className="h-12 w-full"
      onClick={handleCopy}
    >
      {copied ? copiedLabel : label}
    </Button>
  );
};

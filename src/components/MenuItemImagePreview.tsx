'use client';

import { useState } from 'react';

import { cn } from '@/utils/Helpers';

type MenuItemImagePreviewProps = {
  alt: string;
  className?: string;
  src: string;
};

export const MenuItemImagePreview = ({
  alt,
  className,
  src,
}: MenuItemImagePreviewProps) => {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return null;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={cn(
        'aspect-[4/3] rounded-md border bg-muted object-cover',
        className,
      )}
      onError={() => setHasError(true)}
    />
  );
};

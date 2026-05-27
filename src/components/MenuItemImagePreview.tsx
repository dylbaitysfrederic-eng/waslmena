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
    return (
      <div
        className={cn(
          'flex aspect-[4/3] items-center justify-center rounded-md border bg-muted',
          className,
        )}
        role="img"
        aria-label={alt}
      >
        <span className="size-8 rounded-full border border-background/80 bg-background/70" />
      </div>
    );
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

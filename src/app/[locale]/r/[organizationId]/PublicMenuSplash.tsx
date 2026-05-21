'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { LocaleSwitcher } from '@/components/LocaleSwitcher';

type PublicMenuSplashProps = {
  buttonColor: string | null;
  buttonLabel: string;
  buttonPosition: string;
  imageAvifUrl: string | null;
  imageUrl: string;
  logoUrl: string | null;
  menuHref: string;
  restaurantName: string;
};

const BUTTON_POSITION_CLASS_NAMES: Record<string, string> = {
  center: 'top-1/2 -translate-y-1/2',
  lower_center: 'top-[70%] -translate-y-1/2',
  bottom_center: 'bottom-[max(2rem,env(safe-area-inset-bottom))]',
};

const getReadableTextColor = (hexColor: string | null) => {
  if (!hexColor || !/^#[0-9A-F]{6}$/i.test(hexColor)) {
    return '#000';
  }

  const red = Number.parseInt(hexColor.slice(1, 3), 16);
  const green = Number.parseInt(hexColor.slice(3, 5), 16);
  const blue = Number.parseInt(hexColor.slice(5, 7), 16);
  const luminance = ((red * 299) + (green * 587) + (blue * 114)) / 1000;

  return luminance > 150 ? '#111' : '#fff';
};

export const PublicMenuSplash = ({
  buttonColor,
  buttonLabel,
  buttonPosition,
  imageAvifUrl,
  imageUrl,
  logoUrl,
  menuHref,
  restaurantName,
}: PublicMenuSplashProps) => {
  const router = useRouter();
  const buttonTextColor = getReadableTextColor(buttonColor);
  const buttonPositionClassName = BUTTON_POSITION_CLASS_NAMES[buttonPosition]
    ?? BUTTON_POSITION_CLASS_NAMES.lower_center;

  return (
    <main className="fixed inset-0 h-dvh overflow-hidden overscroll-none bg-black text-white">
      <div className="relative mx-auto flex size-full max-w-md items-center justify-center overflow-hidden">
        <picture className="absolute inset-0">
          {imageAvifUrl && <source srcSet={imageAvifUrl} type="image/avif" />}
          <img
            src={imageUrl}
            alt=""
            className="size-full object-cover"
            loading="eager"
            decoding="async"
            onError={() => router.replace(menuHref)}
          />
        </picture>
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/10 to-black/55" />
        <div className="relative z-10 flex size-full flex-col px-5 py-6 text-center">
          <div className="flex w-full items-start justify-between gap-3">
            {logoUrl
              ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoUrl}
                    alt=""
                    className="mx-auto size-14 rounded-md border border-white/30 object-cover shadow-sm"
                    loading="lazy"
                  />
                )
              : (
                  <div className="max-w-[70%] text-left text-lg font-semibold drop-shadow">
                    {restaurantName}
                  </div>
                )}
            <div className="rounded-md bg-white/90 p-1 text-black shadow-sm">
              <LocaleSwitcher />
            </div>
          </div>

          <Link
            href={menuHref}
            prefetch={false}
            className={`absolute left-1/2 inline-flex min-h-12 min-w-44 -translate-x-1/2 items-center justify-center rounded-md bg-white px-6 py-3 text-base font-bold text-black shadow-lg ${buttonPositionClassName}`}
            style={buttonColor
              ? { backgroundColor: buttonColor, color: buttonTextColor }
              : undefined}
          >
            {buttonLabel}
          </Link>
        </div>
      </div>
    </main>
  );
};

'use client';

import { WifiOff } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

export const NetworkStatusBanner = () => {
  const t = useTranslations('NetworkStatus');
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    updateOnlineStatus();

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  if (isOnline) {
    return null;
  }

  return (
    <div
      role="status"
      className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-screen-sm items-center gap-2 rounded-md border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm font-medium text-yellow-950 shadow-md"
    >
      <WifiOff className="size-4 shrink-0" aria-hidden="true" />
      <span>{t('offline_banner')}</span>
    </div>
  );
};

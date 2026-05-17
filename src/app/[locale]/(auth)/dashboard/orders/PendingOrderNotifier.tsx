'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';

const STORAGE_ENABLED_KEY = 'wasl-orders-new-pending-sound-enabled';
const STORAGE_COUNT_KEY = 'wasl-orders-last-pending-count';

const playNotificationSound = () => {
  try {
    const AudioContextClass = window.AudioContext ?? (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      return;
    }

    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = 880;
    gain.gain.value = 0.12;

    oscillator.connect(gain);
    gain.connect(context.destination);

    oscillator.start();
    oscillator.stop(context.currentTime + 0.12);
    oscillator.onended = () => context.close();
  } catch {
    // Browser may block audio until user interaction or may not support AudioContext.
  }
};

const showBrowserNotification = (pendingDelta: number) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    void new Notification('New pending orders', {
      body: pendingDelta === 1
        ? '1 new pending order arrived.'
        : `${pendingDelta} new pending orders arrived.`,
      silent: true,
    });
  }
};

type PendingOrderNotifierProps = {
  pendingCount: number;
};

export const PendingOrderNotifier = ({ pendingCount }: PendingOrderNotifierProps) => {
  const t = useTranslations('Orders');
  const [enabled, setEnabled] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);

    if ('Notification' in window) {
      setPermission(Notification.permission);
    }

    const storedEnabled = window.localStorage.getItem(STORAGE_ENABLED_KEY);
    setEnabled(storedEnabled === 'true');
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    const previousRaw = window.localStorage.getItem(STORAGE_COUNT_KEY);
    const parsedCount = Number(previousRaw);
    const previousCount = Number.isFinite(parsedCount) ? parsedCount : null;

    if (enabled && previousCount !== null && pendingCount > previousCount) {
      const delta = pendingCount - previousCount;
      playNotificationSound();
      showBrowserNotification(delta);
    }

    window.localStorage.setItem(STORAGE_COUNT_KEY, String(pendingCount));
  }, [hydrated, enabled, pendingCount]);

  const toggleEnabled = async () => {
    const nextEnabled = !enabled;
    setEnabled(nextEnabled);
    window.localStorage.setItem(STORAGE_ENABLED_KEY, String(nextEnabled));

    if (nextEnabled && 'Notification' in window && Notification.permission === 'default') {
      const result = await Notification.requestPermission();
      setPermission(result);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2 text-right">
      <Button
        size="sm"
        variant={enabled ? 'secondary' : 'outline'}
        onClick={toggleEnabled}
      >
        {enabled
          ? t('pending_notification_disable')
          : t('pending_notification_enable')}
      </Button>
      <p className="max-w-xs text-xs text-muted-foreground">
        {enabled
          ? permission === 'denied'
            ? t('pending_notification_blocked')
            : t('pending_notification_enabled')
          : t('pending_notification_disabled')}
      </p>
    </div>
  );
};

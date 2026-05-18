'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';

const getStorageKey = (organizationId: string, key: string) => {
  return `wasl:${organizationId}:orders:${key}`;
};

const playNotificationSound = () => {
  try {
    const AudioContextClass = window.AudioContext
      ?? (window as any).webkitAudioContext;

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
    oscillator.stop(context.currentTime + 0.16);
    oscillator.onended = () => context.close();
  } catch {
    // Browser may block audio until user interaction or may not support AudioContext.
  }
};

const showBrowserNotification = (title: string, body: string) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    void new Notification(title, {
      body,
      silent: true,
    });
  }
};

type PendingOrderNotifierProps = {
  latestPendingOrderId: number | null;
  organizationId: string;
  pendingCount: number;
  soundEnabled: boolean;
  visualEnabled: boolean;
};

export const PendingOrderNotifier = ({
  latestPendingOrderId,
  organizationId,
  pendingCount,
  soundEnabled,
  visualEnabled,
}: PendingOrderNotifierProps) => {
  const t = useTranslations('Orders');
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [hasNewOrders, setHasNewOrders] = useState(false);
  const [newOrderCount, setNewOrderCount] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  const storageKeys = useMemo(() => ({
    count: getStorageKey(organizationId, 'last-pending-count'),
    latestId: getStorageKey(organizationId, 'latest-pending-id'),
    interacted: getStorageKey(organizationId, 'notification-interacted'),
  }), [organizationId]);

  useEffect(() => {
    setHydrated(true);

    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    const previousCount = Number(window.localStorage.getItem(storageKeys.count));
    const previousLatestId = Number(
      window.localStorage.getItem(storageKeys.latestId),
    );
    const hasPreviousCount = Number.isFinite(previousCount);
    const hasPreviousLatestId = Number.isFinite(previousLatestId);
    const latestOrderIncreased = latestPendingOrderId !== null
      && hasPreviousLatestId
      && latestPendingOrderId > previousLatestId;
    const pendingCountIncreased = hasPreviousCount
      && pendingCount > previousCount;
    const detectedNewOrders = latestOrderIncreased || pendingCountIncreased;
    const detectedCount = pendingCountIncreased
      ? pendingCount - previousCount
      : latestOrderIncreased
        ? 1
        : 0;

    if (detectedNewOrders) {
      setHasNewOrders(visualEnabled);
      setNewOrderCount(Math.max(1, detectedCount));

      if (visualEnabled) {
        const newCards = document.querySelectorAll<HTMLElement>(
          '[data-pending-order-id]',
        );

        newCards.forEach((card) => {
          const orderId = Number(card.dataset.pendingOrderId);

          if (
            Number.isFinite(orderId)
            && (!hasPreviousLatestId || orderId > previousLatestId)
          ) {
            card.classList.add('ring-4', 'ring-emerald-400', 'ring-offset-2');
          }
        });
      }

      if (soundEnabled) {
        playNotificationSound();
      }

      if (visualEnabled) {
        showBrowserNotification(
          t('pending_notification_browser_title'),
          t('pending_notification_browser_body', {
            count: Math.max(1, detectedCount),
          }),
        );
      }
    }

    window.localStorage.setItem(storageKeys.count, String(pendingCount));
    window.localStorage.setItem(
      storageKeys.latestId,
      String(latestPendingOrderId ?? 0),
    );
  }, [
    hydrated,
    latestPendingOrderId,
    pendingCount,
    soundEnabled,
    storageKeys,
    t,
    visualEnabled,
  ]);

  const requestPermission = async () => {
    window.localStorage.setItem(storageKeys.interacted, 'true');

    if ('Notification' in window && Notification.permission === 'default') {
      const result = await Notification.requestPermission();
      setPermission(result);
    }
  };

  const testNotification = () => {
    window.localStorage.setItem(storageKeys.interacted, 'true');

    if (soundEnabled) {
      playNotificationSound();
    }

    if (visualEnabled) {
      setHasNewOrders(true);
      setNewOrderCount(1);
      showBrowserNotification(
        t('pending_notification_browser_title'),
        t('pending_notification_browser_body', { count: 1 }),
      );
    }
  };

  return (
    <div className="grid gap-3">
      {hasNewOrders && visualEnabled && (
        <div className="sticky top-2 z-20 rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm font-medium text-emerald-950 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span>
              {t('pending_notification_banner', { count: newOrderCount })}
            </span>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setHasNewOrders(false)}
            >
              {t('pending_notification_dismiss')}
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-col items-start gap-2 rounded-md border bg-background p-3 text-left sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-semibold">
            {t('pending_notification_settings_title')}
          </div>
          <p className="max-w-2xl text-xs leading-5 text-muted-foreground">
            {soundEnabled
              ? t('pending_notification_sound_helper')
              : t('pending_notification_visual_helper')}
          </p>
          {visualEnabled && permission === 'denied' && (
            <p className="mt-1 text-xs font-medium text-destructive">
              {t('pending_notification_blocked')}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {visualEnabled && 'Notification' in globalThis && permission === 'default' && (
            <Button type="button" size="sm" variant="outline" onClick={requestPermission}>
              {t('pending_notification_permission_button')}
            </Button>
          )}
          <Button type="button" size="sm" variant="secondary" onClick={testNotification}>
            {t('pending_notification_test_button')}
          </Button>
        </div>
      </div>
    </div>
  );
};

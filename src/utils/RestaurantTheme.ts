import type { CSSProperties } from 'react';

export const RESTAURANT_THEME_MODES = ['day', 'night', 'auto'] as const;

export type RestaurantThemeMode = typeof RESTAURANT_THEME_MODES[number];

export const getRestaurantThemeMode = (
  value: string | null | undefined,
): RestaurantThemeMode => {
  if (RESTAURANT_THEME_MODES.includes(value as RestaurantThemeMode)) {
    return value as RestaurantThemeMode;
  }

  return 'day';
};

export const getRestaurantThemeClassName = (
  value: string | null | undefined,
) => {
  return `restaurant-theme-${getRestaurantThemeMode(value)}`;
};

export const getRestaurantBrandStyle = (
  primaryColor: string | null | undefined,
  accentColor: string | null | undefined,
): CSSProperties => ({
  '--restaurant-primary': primaryColor ?? '#111827',
  '--restaurant-accent': accentColor ?? primaryColor ?? '#111827',
} as CSSProperties);

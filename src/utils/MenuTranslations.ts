export type MenuLocale = 'en' | 'ar' | 'fr';

export const MENU_LOCALES: MenuLocale[] = ['en', 'ar', 'fr'];

export const normalizeMenuText = (value: FormDataEntryValue | null) => {
  const textValue = typeof value === 'string' ? value.trim() : '';

  return textValue.length > 0 ? textValue : null;
};

export const getMenuLocale = (locale: string): MenuLocale => {
  if (locale === 'ar' || locale === 'fr') {
    return locale;
  }

  return 'en';
};

export const getPrimaryMenuText = (
  values: {
    en?: string | null;
    ar?: string | null;
    fr?: string | null;
    legacy?: string | null;
  },
  fallback = '',
) => {
  return values.en || values.ar || values.fr || values.legacy || fallback;
};

export const getLocalizedMenuText = (
  locale: string,
  values: {
    en?: string | null;
    ar?: string | null;
    fr?: string | null;
    legacy?: string | null;
  },
  fallback = '',
) => {
  const menuLocale = getMenuLocale(locale);
  const localizedValue = values[menuLocale];

  return localizedValue || values.en || values.ar || values.fr || values.legacy || fallback;
};

export const hasAnyMenuText = (
  values: {
    en?: string | null;
    ar?: string | null;
    fr?: string | null;
  },
) => Boolean(values.en || values.ar || values.fr);

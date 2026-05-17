'use client';

import { useLocale } from 'next-intl';

import { Button } from '@/components/ui/button';
import { usePathname, useRouter } from '@/libs/i18nNavigation';
import { AppConfig } from '@/utils/AppConfig';

export const LocaleSwitcher = () => {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  const handleChange = (value: string) => {
    router.push(pathname, { locale: value });
    router.refresh();
  };

  return (
    <div className="flex flex-wrap items-center gap-1" aria-label="Language switcher">
      {AppConfig.locales.map(elt => (
        <Button
          key={elt.id}
          type="button"
          variant={locale === elt.id ? 'default' : 'outline'}
          size="sm"
          className="h-8 px-2 text-xs"
          aria-pressed={locale === elt.id}
          onClick={() => handleChange(elt.id)}
        >
          {elt.label}
        </Button>
      ))}
    </div>
  );
};

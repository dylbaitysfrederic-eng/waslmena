'use client';

import { useState } from 'react';

import { cn } from '@/utils/Helpers';

const RESTAURANT_TEMPLATE_STYLES = [
  'fast_food',
  'cafe',
  'casual_restaurant',
  'table_service',
  'shisha_lounge',
] as const;

type TemplateStyle = (typeof RESTAURANT_TEMPLATE_STYLES)[number];

const formatTemplateLabel = (value: string) => {
  return value
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

type TemplateStylePickerProps = {
  defaultValue: string | null | undefined;
  localCurrencyLabel: string;
  organizationId: string;
  restaurantName: string;
};

const templatePreviewClassNames: Record<TemplateStyle, {
  button: string;
  category: string;
  frame: string;
  header: string;
  item: string;
  price: string;
}> = {
  fast_food: {
    frame: 'border-2 border-red-200 bg-red-50',
    header: 'rounded-md border-2 border-red-200 bg-white p-3',
    category: 'text-lg font-black uppercase text-red-950',
    item: 'rounded-md border-2 border-red-200 bg-white p-3',
    price: 'text-sm font-black text-red-950',
    button: 'rounded-md bg-red-600 text-white',
  },
  cafe: {
    frame: 'border border-stone-200 bg-stone-50',
    header: 'rounded-lg border bg-white p-3',
    category: 'font-serif text-lg font-semibold text-stone-900',
    item: 'rounded-lg border bg-white/90 p-3',
    price: 'font-semibold text-stone-800',
    button: 'rounded-full bg-stone-800 text-white',
  },
  casual_restaurant: {
    frame: 'border bg-background',
    header: 'border-b pb-3',
    category: 'text-lg font-semibold',
    item: 'rounded-md border bg-card p-3',
    price: 'text-sm font-semibold',
    button: 'rounded-md bg-slate-900 text-white',
  },
  table_service: {
    frame: 'border bg-white',
    header: 'rounded-md border bg-slate-50 p-3',
    category: 'text-lg font-semibold tracking-normal',
    item: 'rounded-md border bg-white p-3 shadow-sm',
    price: 'text-sm font-semibold text-slate-800',
    button: 'rounded-md border border-slate-900 bg-white text-slate-950',
  },
  shisha_lounge: {
    frame: 'border border-zinc-700 bg-zinc-950 text-zinc-50',
    header: 'rounded-md border border-zinc-700 bg-zinc-900 p-3',
    category: 'text-lg font-semibold text-amber-200',
    item: 'rounded-md border border-zinc-700 bg-zinc-900 p-3',
    price: 'text-sm font-semibold text-amber-100',
    button: 'rounded-md bg-amber-300 text-zinc-950',
  },
};

const normalizeTemplateStyle = (value: string | null | undefined): TemplateStyle => {
  if (RESTAURANT_TEMPLATE_STYLES.includes(value as TemplateStyle)) {
    return value as TemplateStyle;
  }

  return 'casual_restaurant';
};

const TemplatePreview = (props: {
  isCompact?: boolean;
  localCurrencyLabel: string;
  restaurantName: string;
  templateStyle: TemplateStyle;
}) => {
  const classNames = templatePreviewClassNames[props.templateStyle];

  return (
    <div
      className={cn(
        'grid gap-3 rounded-md p-3 text-left',
        classNames.frame,
      )}
      dir="auto"
    >
      <div className={classNames.header}>
        <p className="text-xs font-medium opacity-70">{props.restaurantName}</p>
        <h4
          className={cn(
            'text-xl font-semibold',
            props.templateStyle === 'fast_food' && 'uppercase',
            props.templateStyle === 'cafe' && 'font-serif',
          )}
        >
          Menu
        </h4>
      </div>
      <div className="grid gap-2">
        <p className={classNames.category}>Main plates</p>
        <div className={classNames.item}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium">Chicken tawouk</p>
              {!props.isCompact && (
                <p className="mt-1 text-xs opacity-70">
                  Garlic sauce, pickles, fries
                </p>
              )}
            </div>
            <div className={cn('shrink-0 text-right', classNames.price)}>
              <div>$8.00</div>
              <div>
                42
                {' '}
                {props.localCurrencyLabel}
              </div>
            </div>
          </div>
          <button
            type="button"
            className={cn(
              'mt-3 min-h-9 w-full px-3 text-xs font-semibold',
              classNames.button,
            )}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

export const TemplateStylePicker = ({
  defaultValue,
  localCurrencyLabel,
  organizationId,
  restaurantName,
}: TemplateStylePickerProps) => {
  const [selectedStyle, setSelectedStyle] = useState(
    normalizeTemplateStyle(defaultValue),
  );

  return (
    <div className="grid gap-3">
      <div>
        <div className="text-xs font-medium text-muted-foreground">
          Visual public menu template
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Choose the public menu look before saving. This affects spacing,
          cards, headings, and primary buttons only.
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-5">
        {RESTAURANT_TEMPLATE_STYLES.map(templateStyle => (
          <label
            key={templateStyle}
            className={cn(
              'cursor-pointer rounded-md border p-2 transition-colors',
              selectedStyle === templateStyle
                ? 'border-foreground bg-muted/50'
                : 'bg-background hover:bg-muted/30',
            )}
          >
            <input
              className="sr-only"
              type="radio"
              name="restaurantTemplateStyle"
              value={templateStyle}
              checked={selectedStyle === templateStyle}
              onChange={() => setSelectedStyle(templateStyle)}
            />
            <div className="mb-2 text-sm font-semibold">
              {formatTemplateLabel(templateStyle)}
            </div>
            <TemplatePreview
              isCompact
              localCurrencyLabel={localCurrencyLabel}
              restaurantName={restaurantName}
              templateStyle={templateStyle}
            />
          </label>
        ))}
      </div>

      <div className="grid gap-2 rounded-md border bg-muted/30 p-3 md:grid-cols-[220px_1fr] md:items-start">
        <div>
          <div className="text-sm font-semibold">Live preview</div>
          <p className="mt-1 text-xs text-muted-foreground">
            Current selection for this client before saving.
          </p>
          <code className="mt-2 block text-xs text-muted-foreground">
            {organizationId}
          </code>
        </div>
        <TemplatePreview
          localCurrencyLabel={localCurrencyLabel}
          restaurantName={restaurantName}
          templateStyle={selectedStyle}
        />
      </div>
    </div>
  );
};

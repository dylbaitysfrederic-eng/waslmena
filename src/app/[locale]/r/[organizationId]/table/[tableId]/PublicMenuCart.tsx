'use client';

import { useTranslations } from 'next-intl';
import { useMemo, useState, useTransition } from 'react';

import { MenuItemImagePreview } from '@/components/MenuItemImagePreview';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/utils/Helpers';

import { submitPublicOrderAction } from './actions';

type MenuItem = {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  priceUsdCents: number | null;
  priceLbp: number | null;
  isAvailable: boolean | null | undefined;
};

type MenuCategory = {
  id: number;
  name: string;
  items: MenuItem[];
  subcategories: {
    id: number;
    name: string;
    items: MenuItem[];
  }[];
};

type CartItem = MenuItem & {
  quantity: number;
  customerNote: string;
};

type PublicMenuCartProps = {
  categories: MenuCategory[];
  locale: string;
  organizationId: string;
  accentColor: string | null;
  primaryColor: string | null;
  showMenuItemImages: boolean;
  tableId: number | null;
  orderingEnabled: boolean;
  templateStyle:
    | 'fast_food'
    | 'cafe'
    | 'casual_restaurant'
    | 'table_service'
    | 'shisha_lounge';
  localCurrencyLabel: string;
};

const TEMPLATE_CLASS_NAMES = {
  fast_food: {
    category: 'text-2xl font-black uppercase',
    list: 'grid gap-3',
    item: 'rounded-xl border-2 bg-white shadow-sm',
    itemName: 'text-lg font-black uppercase',
    price: 'text-base font-black',
    button: 'rounded-full px-4',
  },
  cafe: {
    category: 'font-serif text-2xl font-semibold',
    list: 'grid gap-3',
    item: 'rounded-xl border bg-white/90 shadow-sm',
    itemName: 'font-serif text-lg font-semibold',
    price: 'font-semibold text-stone-800',
    button: 'rounded-full px-4',
  },
  casual_restaurant: {
    category: 'text-xl font-semibold',
    list: 'grid gap-3',
    item: 'rounded-xl border bg-card shadow-sm',
    itemName: 'text-base font-semibold leading-6',
    price: 'text-sm font-bold',
    button: 'rounded-full px-4',
  },
  table_service: {
    category: 'text-xl font-semibold',
    list: 'grid gap-3',
    item: 'rounded-xl border bg-white shadow-sm',
    itemName: 'font-semibold leading-6',
    price: 'text-sm font-semibold text-slate-800',
    button: 'rounded-full px-4',
  },
  shisha_lounge: {
    category: 'text-xl font-semibold text-amber-200',
    list: 'grid gap-3',
    item: 'rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-50 shadow-sm shadow-black/20',
    itemName: 'font-semibold leading-6 text-zinc-50',
    price: 'text-sm font-semibold text-amber-100',
    button: 'rounded-full px-4',
  },
} as const;

const formatUsdCents = (amount: number, locale: string) => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
  }).format(amount / 100);
};

const formatLocalCurrency = (
  amount: number,
  locale: string,
  localCurrencyLabel: string,
) => {
  return `${new Intl.NumberFormat(locale).format(amount)} ${localCurrencyLabel}`;
};

const getReadableTextColor = (hexColor: string) => {
  const normalizedColor = /^#[0-9a-f]{6}$/i.test(hexColor)
    ? hexColor.slice(1)
    : '111827';
  const [red, green, blue] = [0, 2, 4].map((startIndex) => {
    const channel = Number.parseInt(
      normalizedColor.slice(startIndex, startIndex + 2),
      16,
    ) / 255;

    return channel <= 0.03928
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * red! + 0.7152 * green! + 0.0722 * blue!;

  return luminance > 0.55 ? '#111827' : '#ffffff';
};

const PriceLines = (props: {
  priceUsdCents: number | null;
  priceLbp: number | null;
  locale: string;
  localCurrencyLabel: string;
}) => (
  <div className="space-y-1">
    {props.priceUsdCents !== null && (
      <div>{formatUsdCents(props.priceUsdCents, props.locale)}</div>
    )}
    {props.priceLbp !== null && (
      <div>
        {formatLocalCurrency(
          props.priceLbp,
          props.locale,
          props.localCurrencyLabel,
        )}
      </div>
    )}
  </div>
);

export const PublicMenuCart = (props: PublicMenuCartProps) => {
  const t = useTranslations('PublicMenu');
  const [cartItems, setCartItems] = useState<Record<number, CartItem>>({});
  const [isSubmitting, startTransition] = useTransition();
  const [successOrderId, setSuccessOrderId] = useState<number | null>(null);
  const [hasOrderError, setHasOrderError] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [orderNote, setOrderNote] = useState('');
  const [hasCustomerNameError, setHasCustomerNameError] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    props.categories[0]?.id ?? 0,
  );
  const [isCartOpen, setIsCartOpen] = useState(false);

  const cart = useMemo(() => Object.values(cartItems), [cartItems]);
  const selectedCategory = useMemo(
    () => props.categories.find(category => category.id === selectedCategoryId)
      ?? props.categories[0],
    [props.categories, selectedCategoryId],
  );
  const cartQuantity = cart.reduce((total, item) => total + item.quantity, 0);
  const cartTotalUsdCents = cart.reduce(
    (total, item) => total + (item.priceUsdCents ?? 0) * item.quantity,
    0,
  );
  const cartTotalLbp = cart.reduce(
    (total, item) => total + (item.priceLbp ?? 0) * item.quantity,
    0,
  );
  const publicMenuAccentColor = props.accentColor ?? props.primaryColor;
  const primaryButtonStyle = publicMenuAccentColor
    ? {
        backgroundColor: publicMenuAccentColor,
        borderColor: publicMenuAccentColor,
        color: getReadableTextColor(publicMenuAccentColor),
      }
    : undefined;
  const templateClassNames = TEMPLATE_CLASS_NAMES[props.templateStyle];

  const addItem = (item: MenuItem) => {
    if (item.isAvailable === false) {
      return;
    }

    setHasOrderError(false);
    setCartItems(current => ({
      ...current,
      [item.id]: {
        ...item,
        quantity: (current[item.id]?.quantity ?? 0) + 1,
        customerNote: current[item.id]?.customerNote ?? '',
      },
    }));
  };

  const updateItemNote = (itemId: number, customerNote: string) => {
    setHasOrderError(false);
    setCartItems((current) => {
      const item = current[itemId];

      if (!item) {
        return current;
      }

      return {
        ...current,
        [itemId]: {
          ...item,
          customerNote,
        },
      };
    });
  };

  const decreaseItem = (itemId: number) => {
    setHasOrderError(false);
    setCartItems((current) => {
      const item = current[itemId];

      if (!item) {
        return current;
      }

      if (item.quantity <= 1) {
        const { [itemId]: _removedItem, ...remainingItems } = current;
        return remainingItems;
      }

      return {
        ...current,
        [itemId]: {
          ...item,
          quantity: item.quantity - 1,
        },
      };
    });
  };

  const removeItem = (itemId: number) => {
    setHasOrderError(false);
    setCartItems((current) => {
      const { [itemId]: _removedItem, ...remainingItems } = current;
      return remainingItems;
    });
  };

  const submitOrder = () => {
    if (isSubmitting || !props.orderingEnabled) {
      return;
    }

    setSuccessOrderId(null);
    setHasOrderError(false);
    setHasCustomerNameError(false);

    const trimmedCustomerName = customerName.trim();

    if (!trimmedCustomerName || trimmedCustomerName.length > 50) {
      setHasCustomerNameError(true);
      return;
    }

    startTransition(async () => {
      const result = await submitPublicOrderAction({
        organizationId: props.organizationId,
        tableId: props.tableId,
        customerName: trimmedCustomerName,
        customerNote: orderNote,
        items: cart.map(item => ({
          menuItemId: item.id,
          quantity: item.quantity,
          customerNote: item.customerNote,
        })),
      });

      if (result.ok) {
        setCartItems({});
        setCustomerName('');
        setOrderNote('');
        setSuccessOrderId(result.orderId);
        setIsCartOpen(false);
        return;
      }

      setHasOrderError(true);
    });
  };

  const renderMenuItem = (item: MenuItem) => {
    const quantity = cartItems[item.id]?.quantity ?? 0;
    const isItemAvailable = item.isAvailable !== false;
    const canOrderItem = props.orderingEnabled && isItemAvailable;

    return (
      <article
        key={item.id}
        className={cn(
          'flex flex-col gap-3 overflow-hidden p-3.5 transition-colors sm:flex-row sm:items-start sm:gap-4 sm:p-4',
          templateClassNames.item,
          !isItemAvailable && 'opacity-55',
        )}
      >
        {props.showMenuItemImages && item.imageUrl && (
          <div className="shrink-0 sm:order-last">
            <MenuItemImagePreview
              src={item.imageUrl}
              alt={item.name}
              className="h-36 w-full rounded-lg sm:size-24 sm:w-24"
            />
          </div>
        )}

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className={templateClassNames.itemName}>
                {item.name}
              </h3>
              {!isItemAvailable && (
                <div className="mt-1 inline-flex rounded-full border bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                  {t('not_available_label')}
                </div>
              )}
            </div>
            <div className={cn('shrink-0 text-right', templateClassNames.price)}>
              <PriceLines
                priceUsdCents={item.priceUsdCents}
                priceLbp={item.priceLbp}
                locale={props.locale}
                localCurrencyLabel={props.localCurrencyLabel}
              />
            </div>
          </div>
          {item.description && (
            <p className="text-sm leading-6 text-muted-foreground">
              {item.description}
            </p>
          )}
        </div>

        {canOrderItem && (
          <div className="flex shrink-0 items-center justify-between gap-2 border-t pt-3 sm:border-t-0 sm:pt-0">
            {quantity > 0 && (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => decreaseItem(item.id)}
                  aria-label={t('decrease_item_label', {
                    itemName: item.name,
                  })}
                >
                  -
                </Button>
                <span className="w-6 text-center text-sm font-medium">
                  {quantity}
                </span>
              </div>
            )}

            <Button
              type="button"
              size="sm"
              className={cn('min-h-10 flex-1 font-semibold sm:flex-none', templateClassNames.button)}
              style={primaryButtonStyle}
              onClick={() => addItem(item)}
            >
              {quantity > 0 ? t('increase_button') : t('add_button')}
            </Button>
          </div>
        )}
      </article>
    );
  };

  const renderCartContents = () => (
    <>
      <div className="space-y-3">
        {cart.map(item => (
          <div key={item.id} className="grid gap-2 rounded-md border p-3">
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">
                  {item.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {item.quantity}
                  {' x '}
                  <PriceLines
                    priceUsdCents={item.priceUsdCents}
                    priceLbp={item.priceLbp}
                    locale={props.locale}
                    localCurrencyLabel={props.localCurrencyLabel}
                  />
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => decreaseItem(item.id)}
              >
                -
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addItem(item)}
              >
                +
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeItem(item.id)}
              >
                {t('remove_button')}
              </Button>
            </div>
            <label className="grid gap-1 text-xs font-medium text-muted-foreground">
              {t('item_note_label')}
              <textarea
                value={item.customerNote}
                maxLength={200}
                rows={2}
                placeholder={t('item_note_placeholder')}
                className="min-h-16 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                onChange={event => updateItemNote(
                  item.id,
                  event.target.value,
                )}
              />
            </label>
          </div>
        ))}
      </div>

      <div className="mt-4 space-y-2">
        <Label htmlFor="customerName">
          {t('customer_name_label')}
        </Label>
        <Input
          id="customerName"
          value={customerName}
          maxLength={50}
          required
          placeholder={t('customer_name_placeholder')}
          onChange={(event) => {
            setCustomerName(event.target.value);
            setHasCustomerNameError(false);
          }}
        />
        {hasCustomerNameError && (
          <p className="text-sm font-medium text-destructive">
            {t('customer_name_error')}
          </p>
        )}
      </div>

      <div className="mt-4 space-y-2">
        <Label htmlFor="orderNote">
          {t('order_note_label')}
        </Label>
        <textarea
          id="orderNote"
          value={orderNote}
          maxLength={200}
          rows={3}
          placeholder={t('order_note_placeholder')}
          className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
          onChange={event => setOrderNote(event.target.value)}
        />
      </div>

      <Button
        type="button"
        className="mt-4 w-full"
        disabled={isSubmitting}
        style={primaryButtonStyle}
        onClick={submitOrder}
      >
        {isSubmitting ? t('submit_order_pending') : t('submit_order_button')}
      </Button>
    </>
  );

  return (
    <div className="space-y-6 pb-56 sm:pb-8">
      <div
        className="hidden flex-wrap gap-2 sm:flex"
        aria-label={t('category_nav_label')}
      >
        {props.categories.map(category => (
          <Button
            key={category.id}
            type="button"
            size="sm"
            variant={category.id === selectedCategory?.id ? 'default' : 'outline'}
            className="rounded-full px-4"
            style={
              category.id === selectedCategory?.id
                ? primaryButtonStyle
                : undefined
            }
            onClick={() => setSelectedCategoryId(category.id)}
          >
            {category.name}
          </Button>
        ))}
      </div>

      {selectedCategory && (
        <div className="max-h-[calc(100vh-250px)] overflow-y-auto pr-1 sm:max-h-none sm:overflow-visible sm:pr-0">
          <section className="space-y-5">
            <h2
              className={cn('px-1', templateClassNames.category)}
              style={props.primaryColor ? { color: props.primaryColor } : undefined}
            >
              {selectedCategory.name}
            </h2>

            {selectedCategory.items.length > 0 && (
              <div className={templateClassNames.list}>
                {selectedCategory.items.map(renderMenuItem)}
              </div>
            )}

            {selectedCategory.subcategories.map(subcategory => (
              <section key={subcategory.id} className="space-y-3">
                <h3 className="px-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {subcategory.name}
                </h3>
                <div className={templateClassNames.list}>
                  {subcategory.items.map(renderMenuItem)}
                </div>
              </section>
            ))}
          </section>
        </div>
      )}

      {cart.length > 0 && (
        <section className="hidden rounded-md border bg-card p-4 sm:block">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">{t('cart_title')}</h2>
            <div className="text-right text-sm font-semibold">
              {cartTotalUsdCents > 0 && (
                <div>{formatUsdCents(cartTotalUsdCents, props.locale)}</div>
              )}
              {cartTotalLbp > 0 && (
                <div>
                  {formatLocalCurrency(
                    cartTotalLbp,
                    props.locale,
                    props.localCurrencyLabel,
                  )}
                </div>
              )}
            </div>
          </div>
          {renderCartContents()}
        </section>
      )}

      {successOrderId && (
        <div className="rounded-md border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-950">
          <div className="mb-1 text-base font-semibold">
            {t('order_success_title')}
          </div>
          <div>{t('order_success', { orderId: successOrderId })}</div>
          <div className="mt-1 text-sm font-normal text-muted-foreground">
            {t('order_success_helper')}
          </div>
        </div>
      )}

      {hasOrderError && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm font-medium text-destructive">
          {t('order_error')}
        </div>
      )}

      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 px-3 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 shadow-lg backdrop-blur sm:hidden"
        aria-label={t('category_nav_label')}
      >
        <div className="mx-auto flex max-w-2xl gap-2 overflow-x-auto pb-1">
          {props.categories.map(category => (
            <Button
              key={category.id}
              type="button"
              size="sm"
              variant={category.id === selectedCategory?.id ? 'default' : 'outline'}
              className="min-h-10 shrink-0 rounded-full px-4 text-xs font-semibold"
              style={
                category.id === selectedCategory?.id
                  ? primaryButtonStyle
                  : undefined
              }
              onClick={() => setSelectedCategoryId(category.id)}
            >
              {category.name}
            </Button>
          ))}
        </div>
      </nav>

      {cart.length > 0 && (
        <button
          type="button"
          className="fixed inset-x-3 bottom-[4.75rem] z-40 rounded-2xl border bg-background px-4 py-3 text-left shadow-xl sm:hidden"
          style={primaryButtonStyle}
          onClick={() => setIsCartOpen(true)}
        >
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold">{t('cart_title')}</div>
              <div className="text-xs opacity-85">
                {t('cart_items_count', { count: cartQuantity })}
              </div>
            </div>
            <div className="text-right text-sm font-semibold">
              {cartTotalUsdCents > 0 && (
                <div>{formatUsdCents(cartTotalUsdCents, props.locale)}</div>
              )}
              {cartTotalLbp > 0 && (
                <div>
                  {formatLocalCurrency(
                    cartTotalLbp,
                    props.locale,
                    props.localCurrencyLabel,
                  )}
                </div>
              )}
            </div>
            <div className="rounded-full bg-white/15 px-3 py-1 text-sm font-semibold">
              {t('cart_bar_button')}
            </div>
          </div>
        </button>
      )}

      {isCartOpen && cart.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-black/45 px-3 pb-3 pt-10 sm:hidden"
          role="dialog"
          aria-modal="true"
          aria-label={t('cart_title')}
        >
          <button
            type="button"
            className="absolute inset-0 size-full cursor-default border-0 bg-transparent p-0"
            aria-label={t('cart_close_button')}
            onClick={() => setIsCartOpen(false)}
          />
          <section
            className="relative mx-auto max-h-[88vh] max-w-2xl overflow-y-auto rounded-2xl border bg-background p-4 shadow-2xl"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold">{t('cart_title')}</h2>
                <div className="text-xs text-muted-foreground">
                  {t('cart_items_count', { count: cartQuantity })}
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsCartOpen(false)}
              >
                {t('cart_close_button')}
              </Button>
            </div>

            {renderCartContents()}
          </section>
        </div>
      )}
    </div>
  );
};

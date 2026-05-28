'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';

import { MenuItemImagePreview } from '@/components/MenuItemImagePreview';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/utils/Helpers';

import {
  checkPendingPublicOrderAction,
  submitPublicOrderAction,
  trackPublicMenuCategoryViewAction,
} from './actions';

type MenuItem = {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  priceUsdCents: number | null;
  priceLbp: number | null;
  oldPriceUsdCents?: number | null;
  oldPriceLbp?: number | null;
  badges?: ('popular' | 'new' | 'spicy' | 'featured' | 'promo')[];
  isFeatured?: boolean;
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

type PendingAttempt = {
  idempotencyKey: string;
  createdAt: number;
  status: 'pending' | 'failed' | 'confirmed';
  payload: {
    items: { menuItemId: number; quantity: number; customerNote?: string | null }[];
    customerName: string;
    customerNote?: string | null;
    tableId?: number | null;
    orderType?: 'table' | 'counter' | 'delivery';
    deliveryAddress?: string | null;
    deliveryPhone?: string | null;
    deliveryNotes?: string | null;
  };
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
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
  deliveryFeeUsdCents: number | null;
  deliveryFeeLocal: number | null;
  minimumOrderAmountUsdCents: number | null;
  minimumOrderAmountLocal: number | null;
  deliveryEstimatedTime: string | null;
  deliveryCoverageNotes: string | null;
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
    item: 'rounded-md border-2 bg-white shadow-sm',
    itemName: 'text-lg font-black uppercase',
    price: 'text-base font-black',
    button: 'rounded-full px-4',
  },
  cafe: {
    category: 'font-serif text-2xl font-semibold',
    list: 'grid gap-3',
    item: 'rounded-md border bg-white/90 shadow-sm',
    itemName: 'font-serif text-lg font-semibold',
    price: 'font-semibold text-stone-800',
    button: 'rounded-full px-4',
  },
  casual_restaurant: {
    category: 'text-xl font-semibold',
    list: 'grid gap-3',
    item: 'rounded-md border bg-card shadow-sm',
    itemName: 'text-base font-semibold leading-6',
    price: 'text-sm font-bold',
    button: 'rounded-full px-4',
  },
  table_service: {
    category: 'text-xl font-semibold',
    list: 'grid gap-3',
    item: 'rounded-md border bg-white shadow-sm',
    itemName: 'font-semibold leading-6',
    price: 'text-sm font-semibold text-slate-800',
    button: 'rounded-full px-4',
  },
  shisha_lounge: {
    category: 'text-xl font-semibold text-amber-200',
    list: 'grid gap-3',
    item: 'rounded-md border border-zinc-700 bg-zinc-900 text-zinc-50 shadow-sm shadow-black/20',
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

const getClientDeviceType = () => {
  const userAgent = navigator.userAgent.toLowerCase();

  if (/ipad|tablet/.test(userAgent)) {
    return 'tablet';
  }

  if (/mobile|iphone|android/.test(userAgent)) {
    return 'mobile';
  }

  return 'desktop';
};

const PriceLines = (props: {
  oldPriceUsdCents?: number | null;
  oldPriceLbp?: number | null;
  priceUsdCents: number | null;
  priceLbp: number | null;
  locale: string;
  localCurrencyLabel: string;
}) => {
  const hasUsdDiscount = props.oldPriceUsdCents !== null
    && props.oldPriceUsdCents !== undefined
    && props.priceUsdCents !== null
    && props.oldPriceUsdCents > props.priceUsdCents;
  const hasLbpDiscount = props.oldPriceLbp !== null
    && props.oldPriceLbp !== undefined
    && props.priceLbp !== null
    && props.oldPriceLbp > props.priceLbp;

  return (
    <div className="space-y-1">
      {props.priceUsdCents !== null && (
        <div className="flex flex-wrap items-baseline justify-end gap-x-2">
          {hasUsdDiscount && (
            <span className="text-xs font-medium text-muted-foreground line-through">
              {formatUsdCents(props.oldPriceUsdCents!, props.locale)}
            </span>
          )}
          <span>{formatUsdCents(props.priceUsdCents, props.locale)}</span>
        </div>
      )}
      {props.priceLbp !== null && (
        <div className="flex flex-wrap items-baseline justify-end gap-x-2">
          {hasLbpDiscount && (
            <span className="text-xs font-medium text-muted-foreground line-through">
              {formatLocalCurrency(
                props.oldPriceLbp!,
                props.locale,
                props.localCurrencyLabel,
              )}
            </span>
          )}
          <span>
            {formatLocalCurrency(
              props.priceLbp,
              props.locale,
              props.localCurrencyLabel,
            )}
          </span>
        </div>
      )}
    </div>
  );
};

const BADGE_LABEL_KEYS = {
  popular: 'badge_popular',
  new: 'badge_new',
  spicy: 'badge_spicy',
  featured: 'badge_featured',
  promo: 'badge_promo',
} as const;

export const PublicMenuCart = (props: PublicMenuCartProps) => {
  const t = useTranslations('PublicMenu');
  const [cartItems, setCartItems] = useState<Record<number, CartItem>>({});
  const [isSubmitting, startTransition] = useTransition();
  const submitLockRef = useRef(false);
  const idempotencyRef = useRef<string | null>(null);
  const [isSubmitLocked, setIsSubmitLocked] = useState(false);
  const [isCheckingPending, setIsCheckingPending] = useState(false);
  const [hasCheckedPendingOnce, setHasCheckedPendingOnce] = useState(false);
  const [pendingAttempt, setPendingAttempt] = useState<PendingAttempt | null>(null);
  const [successOrderId, setSuccessOrderId] = useState<number | null>(null);
  const [hasDeliveryAddressError, setHasDeliveryAddressError] = useState(false);
  const [hasDeliveryPhoneError, setHasDeliveryPhoneError] = useState(false);
  const [orderType, setOrderType] = useState<'table' | 'counter' | 'delivery'>(() => {
    if (props.tableId !== null) {
      return 'table';
    }

    if (props.deliveryEnabled && !props.pickupEnabled) {
      return 'delivery';
    }

    return 'counter';
  });
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryPhone, setDeliveryPhone] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
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
  const isOrderSubmitting = isSubmitting || isSubmitLocked;
  const publicMenuAccentColor = props.accentColor ?? props.primaryColor;
  const primaryButtonStyle = publicMenuAccentColor
    ? {
        backgroundColor: publicMenuAccentColor,
        borderColor: publicMenuAccentColor,
        color: getReadableTextColor(publicMenuAccentColor),
      }
    : undefined;
  const templateClassNames = TEMPLATE_CLASS_NAMES[props.templateStyle];

  const CART_KEY = `wasl:cart:${props.organizationId}:${props.tableId ?? 'none'}`;
  const PENDING_KEY = `wasl:pending:${props.organizationId}:${props.tableId ?? 'none'}`;
  const CART_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

  const loadCartFromStorage = () => {
    try {
      const raw = localStorage.getItem(CART_KEY);

      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw as string) as { createdAt: number; expiresAt: number; customerName?: string; orderNote?: string; orderType?: 'table' | 'counter' | 'delivery'; deliveryAddress?: string; deliveryPhone?: string; deliveryNotes?: string; items?: { id: number; quantity: number; customerNote?: string }[] };

      if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
        localStorage.removeItem(CART_KEY);
        return;
      }

      if (parsed.items) {
        const itemsMap: Record<number, CartItem> = {};

        for (const it of parsed.items) {
          itemsMap[it.id] = {
            id: it.id,
            name: '',
            description: null,
            imageUrl: null,
            priceUsdCents: null,
            priceLbp: null,
            quantity: it.quantity,
            customerNote: it.customerNote ?? '',
            isAvailable: true,
          } as CartItem;
        }

        setCartItems(itemsMap);
      }

      if (parsed.customerName) {
        setCustomerName(parsed.customerName);
      }

      if (parsed.orderNote) {
        setOrderNote(parsed.orderNote);
      }

      if (props.tableId === null && parsed.orderType) {
        setOrderType(parsed.orderType);
      }

      if (parsed.deliveryAddress) {
        setDeliveryAddress(parsed.deliveryAddress);
      }

      if (parsed.deliveryPhone) {
        setDeliveryPhone(parsed.deliveryPhone);
      }

      if (parsed.deliveryNotes) {
        setDeliveryNotes(parsed.deliveryNotes);
      }
    } catch {
      // ignore corrupted storage
    }
  };

  const clearCartStorage = () => {
    try {
      localStorage.removeItem(CART_KEY);
    } catch {
      // ignore
    }
  };

  const loadPendingFromStorage = () => {
    try {
      const raw = localStorage.getItem(PENDING_KEY);

      if (!raw) {
        return null;
      }

      const p = JSON.parse(raw as string) as typeof pendingAttempt;

      // basic shape check
      if (p && p.idempotencyKey && p.payload) {
        setPendingAttempt(p as any);
        idempotencyRef.current = p.idempotencyKey;
        return p as any;
      }
    } catch {
      // ignore
    }

    return null;
  };

  const savePendingToStorage = (p: NonNullable<typeof pendingAttempt>) => {
    try {
      localStorage.setItem(PENDING_KEY, JSON.stringify(p));
    } catch {
      // ignore
    }
  };

  const clearPendingStorage = () => {
    try {
      localStorage.removeItem(PENDING_KEY);
    } catch {
      // ignore
    }
  };

  async function checkPendingOrderStatus() {
    if (!pendingAttempt?.idempotencyKey || !props.organizationId) {
      return;
    }

    setIsCheckingPending(true);

    try {
      const result = await checkPendingPublicOrderAction({
        organizationId: props.organizationId,
        idempotencyKey: pendingAttempt.idempotencyKey,
      });

      if (!result.ok) {
        return;
      }

      if (result.found) {
        setSuccessOrderId(result.orderId);
        setPendingAttempt(null);
        clearPendingStorage();
        clearCartStorage();
        setCartItems({});
        setCustomerName('');
        setOrderNote('');
        idempotencyRef.current = null;
        setIsCartOpen(false);
        return;
      }

      setPendingAttempt({ ...pendingAttempt, status: 'failed' } as any);
      try {
        savePendingToStorage({ ...pendingAttempt, status: 'failed' } as any);
      } catch {
        // ignore
      }
    } catch {
      // ignore network or action errors
    } finally {
      setIsCheckingPending(false);
    }
  }

  // restore on mount
  useEffect(() => {
    loadCartFromStorage();
    loadPendingFromStorage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // persist cart whenever it changes

  useEffect(() => {
    try {
      const payload = {
        createdAt: Date.now(),
        expiresAt: Date.now() + CART_TTL_MS,
        customerName: customerName ?? '',
        orderNote: orderNote ?? '',
        orderType,
        deliveryAddress,
        deliveryPhone,
        deliveryNotes,
        items: Object.values(cartItems).map(i => ({ id: i.id, quantity: i.quantity, customerNote: i.customerNote })),
      };

      localStorage.setItem(CART_KEY, JSON.stringify(payload));
    } catch {
      // ignore storage errors
    }
  }, [cartItems, customerName, orderNote, orderType, deliveryAddress, deliveryPhone, deliveryNotes, CART_KEY, CART_TTL_MS]);

  // connectivity awareness
  const [isOnline, setIsOnline] = useState<boolean>(() => typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  useEffect(() => {
    if (
      !pendingAttempt
      || pendingAttempt.status !== 'pending'
      || !isOnline
      || hasCheckedPendingOnce
    ) {
      return;
    }

    setHasCheckedPendingOnce(true);
    checkPendingOrderStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingAttempt, isOnline, hasCheckedPendingOnce]);

  useEffect(() => {
    if (!selectedCategory?.id) {
      return;
    }

    trackPublicMenuCategoryViewAction({
      organizationId: props.organizationId,
      categoryId: selectedCategory.id,
      locale: props.locale,
      deviceType: getClientDeviceType(),
    });
  }, [props.locale, props.organizationId, selectedCategory?.id]);

  const addItem = (item: MenuItem) => {
    if (item.isAvailable === false || isOrderSubmitting) {
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
    if (isOrderSubmitting) {
      return;
    }

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
    if (isOrderSubmitting) {
      return;
    }

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
    if (submitLockRef.current || isOrderSubmitting || !props.orderingEnabled) {
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

    if (orderType === 'delivery') {
      if (!deliveryAddress.trim() || deliveryAddress.length > 240) {
        setHasDeliveryAddressError(true);
        return;
      }

      if (!deliveryPhone.trim() || deliveryPhone.length > 40) {
        setHasDeliveryPhoneError(true);
        return;
      }
    }

    // ensure a stable idempotency key for this checkout attempt
    if (!idempotencyRef.current) {
      idempotencyRef.current = (globalThis.crypto as any)?.randomUUID?.() ?? (
        `wasl-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
      );
    }

    // create pending attempt snapshot and persist it before submitting
    const pending = {
      idempotencyKey: idempotencyRef.current!,
      createdAt: Date.now(),
      status: 'pending' as const,
      payload: {
        items: cart.map(item => ({ menuItemId: item.id, quantity: item.quantity, customerNote: item.customerNote })),
        customerName: trimmedCustomerName,
        customerNote: orderNote,
        tableId: props.tableId,
        orderType,
        deliveryAddress: deliveryAddress || undefined,
        deliveryPhone: deliveryPhone || undefined,
        deliveryNotes: deliveryNotes || undefined,
      },
    };

    setPendingAttempt(pending as any);
    try {
      savePendingToStorage(pending as any);
    } catch {
      // ignore
    }

    submitLockRef.current = true;
    setIsSubmitLocked(true);

    startTransition(async () => {
      try {
        const result = await submitPublicOrderAction({
          organizationId: props.organizationId,
          idempotencyKey: idempotencyRef.current ?? undefined,
          tableId: props.tableId,
          orderType,
          customerName: trimmedCustomerName,
          customerNote: orderNote,
          deliveryAddress: deliveryAddress || undefined,
          deliveryPhone: deliveryPhone || undefined,
          deliveryNotes: deliveryNotes || undefined,
          locale: props.locale,
          deviceType: getClientDeviceType(),
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
          // mark pending as confirmed, clear storage, then reset idempotency
          setPendingAttempt({ ...pending, status: 'confirmed' } as any);
          try {
            savePendingToStorage({ ...pending, status: 'confirmed' } as any);
          } catch {
            // ignore
          }
          clearPendingStorage();
          clearCartStorage();
          idempotencyRef.current = null;
          setIsCartOpen(false);
          return;
        }

        setHasOrderError(true);
        setPendingAttempt({ ...pending, status: 'failed' } as any);
        try {
          savePendingToStorage({ ...pending, status: 'failed' } as any);
        } catch {
          // ignore
        }
      } catch {
        setHasOrderError(true);
        setPendingAttempt({ ...pending, status: 'failed' } as any);
        try {
          savePendingToStorage({ ...pending, status: 'failed' } as any);
        } catch {
          // ignore
        }
      } finally {
        submitLockRef.current = false;
        setIsSubmitLocked(false);
      }
    });
  };

  const renderMenuItem = (item: MenuItem) => {
    const quantity = cartItems[item.id]?.quantity ?? 0;
    const isItemAvailable = item.isAvailable !== false;
    const canOrderItem = props.orderingEnabled && isItemAvailable;
    const itemBadges = [
      ...(item.isFeatured ? ['featured' as const] : []),
      ...(item.badges ?? []),
      ...(!isItemAvailable ? ['sold_out' as const] : []),
    ];

    return (
      <article
        key={item.id}
        className={cn(
          'flex flex-col gap-3 overflow-hidden p-3.5 transition-colors sm:flex-row sm:items-start sm:gap-4 sm:p-4',
          templateClassNames.item,
          item.isFeatured && 'border-[var(--restaurant-accent)] bg-[var(--restaurant-accent)]/5',
          !isItemAvailable && 'opacity-55',
        )}
      >
        {props.showMenuItemImages && item.imageUrl && (
          <div className="shrink-0 sm:order-last">
            <MenuItemImagePreview
              src={item.imageUrl}
              alt={item.name}
              className="h-36 w-full rounded-md sm:size-24 sm:w-24"
            />
          </div>
        )}

        <div className="min-w-0 flex-1 space-y-2">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
            <div className="min-w-0 space-y-1.5">
              {itemBadges.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {itemBadges.map(badge => (
                    <span
                      key={badge}
                      className={cn(
                        'rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase leading-4',
                        badge === 'sold_out'
                          ? 'bg-muted text-muted-foreground'
                          : 'bg-background/80 text-foreground',
                      )}
                    >
                      {badge === 'sold_out'
                        ? t('badge_sold_out')
                        : t(BADGE_LABEL_KEYS[badge])}
                    </span>
                  ))}
                </div>
              )}
              <h3 className={cn('break-words', templateClassNames.itemName)}>
                {item.name}
              </h3>
            </div>
            <div className={cn('min-w-0 text-left sm:text-right', templateClassNames.price)}>
              <PriceLines
                oldPriceUsdCents={item.oldPriceUsdCents}
                oldPriceLbp={item.oldPriceLbp}
                priceUsdCents={item.priceUsdCents}
                priceLbp={item.priceLbp}
                locale={props.locale}
                localCurrencyLabel={props.localCurrencyLabel}
              />
            </div>
          </div>
          {item.description && (
            <p className="text-[13px] leading-6 text-muted-foreground sm:text-sm">
              {item.description}
            </p>
          )}
        </div>

        {canOrderItem && (
          <div className="flex shrink-0 items-center justify-between gap-2 border-t pt-3 sm:border-t-0 sm:pt-0">
            {quantity === 0
              ? (
                  <Button
                    type="button"
                    size="sm"
                    className={cn(
                      'min-h-11 min-w-0 flex-1 whitespace-normal text-center font-semibold leading-5 sm:min-w-28 sm:flex-none',
                      templateClassNames.button,
                    )}
                    style={primaryButtonStyle}
                    disabled={isOrderSubmitting}
                    onClick={() => addItem(item)}
                  >
                    {t('add_button')}
                  </Button>
                )
              : (
                  <div className="grid min-h-11 flex-1 grid-cols-[44px_1fr_44px] items-center overflow-hidden rounded-full border bg-background sm:min-w-36 sm:flex-none">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="min-h-11 rounded-none border-r px-0 text-lg"
                      disabled={isOrderSubmitting}
                      onClick={() => decreaseItem(item.id)}
                      aria-label={t('decrease_item_label', {
                        itemName: item.name,
                      })}
                    >
                      -
                    </Button>
                    <span className="text-center text-sm font-semibold">
                      {quantity}
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      className="min-h-11 rounded-none px-0 text-lg font-semibold"
                      style={primaryButtonStyle}
                      disabled={isOrderSubmitting}
                      onClick={() => addItem(item)}
                      aria-label={t('increase_item_label', {
                        itemName: item.name,
                      })}
                    >
                      +
                    </Button>
                  </div>
                )}
          </div>
        )}
      </article>
    );
  };

  const renderCartContents = () => (
    <>
      <div className="space-y-2.5">
        {cart.map(item => (
          <div key={item.id} className="grid gap-3 rounded-md border bg-card p-3">
            <div className="grid grid-cols-[1fr_auto] gap-3">
              <div className="min-w-0 flex-1">
                <div className="break-words text-sm font-semibold">
                  {item.name}
                </div>
                <div className="mt-1 text-xs font-medium text-muted-foreground">
                  {t('quantity_label', { quantity: item.quantity })}
                </div>
              </div>

              <div className="text-right text-xs font-semibold">
                <PriceLines
                  oldPriceUsdCents={item.oldPriceUsdCents}
                  oldPriceLbp={item.oldPriceLbp}
                  priceUsdCents={item.priceUsdCents}
                  priceLbp={item.priceLbp}
                  locale={props.locale}
                  localCurrencyLabel={props.localCurrencyLabel}
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="grid min-h-10 grid-cols-[40px_44px_40px] items-center overflow-hidden rounded-full border bg-background">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="min-h-10 rounded-none border-r px-0 text-lg"
                  disabled={isOrderSubmitting}
                  onClick={() => decreaseItem(item.id)}
                  aria-label={t('decrease_item_label', {
                    itemName: item.name,
                  })}
                >
                  -
                </Button>
                <span className="text-center text-sm font-semibold">
                  {item.quantity}
                </span>
                <Button
                  type="button"
                  size="sm"
                  className="min-h-10 rounded-none px-0 text-lg font-semibold"
                  style={primaryButtonStyle}
                  disabled={isOrderSubmitting}
                  onClick={() => addItem(item)}
                  aria-label={t('increase_item_label', {
                    itemName: item.name,
                  })}
                >
                  +
                </Button>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs font-semibold text-muted-foreground"
                disabled={isOrderSubmitting}
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
                disabled={isOrderSubmitting}
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
          className="text-base sm:text-sm"
          value={customerName}
          maxLength={50}
          required
          disabled={isOrderSubmitting}
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

      {props.tableId === null && (props.deliveryEnabled || props.pickupEnabled) && (
        <div className="mt-4 grid gap-3">
          <Label>
            {t('order_type_label')}
          </Label>

          <div className="flex flex-wrap gap-2">
            {props.pickupEnabled && (
              <Button
                type="button"
                variant={orderType === 'counter' ? 'secondary' : 'outline'}
                disabled={isOrderSubmitting}
                onClick={() => {
                  setOrderType('counter');
                  setHasDeliveryAddressError(false);
                  setHasDeliveryPhoneError(false);
                }}
              >
                {t('order_type_counter_label')}
              </Button>
            )}

            {props.deliveryEnabled && (
              <Button
                type="button"
                variant={orderType === 'delivery' ? 'secondary' : 'outline'}
                disabled={isOrderSubmitting}
                onClick={() => {
                  setOrderType('delivery');
                }}
              >
                {t('order_type_delivery_label')}
              </Button>
            )}
          </div>
        </div>
      )}

      {orderType === 'delivery' && (
        <div className="mt-4 space-y-2">
          <Label htmlFor="deliveryAddress">
            {t('delivery_address_label')}
          </Label>
          <Input
            id="deliveryAddress"
            className="text-base sm:text-sm"
            value={deliveryAddress}
            maxLength={240}
            disabled={isOrderSubmitting}
            placeholder={t('delivery_address_placeholder')}
            onChange={(event) => {
              setDeliveryAddress(event.target.value);
              setHasDeliveryAddressError(false);
            }}
          />
          {hasDeliveryAddressError && (
            <p className="text-sm font-medium text-destructive">
              {t('delivery_address_error')}
            </p>
          )}

          <Label htmlFor="deliveryPhone">
            {t('delivery_phone_label')}
          </Label>
          <Input
            id="deliveryPhone"
            className="text-base sm:text-sm"
            value={deliveryPhone}
            maxLength={40}
            disabled={isOrderSubmitting}
            placeholder={t('delivery_phone_placeholder')}
            onChange={(event) => {
              setDeliveryPhone(event.target.value);
              setHasDeliveryPhoneError(false);
            }}
          />
          {hasDeliveryPhoneError && (
            <p className="text-sm font-medium text-destructive">
              {t('delivery_phone_error')}
            </p>
          )}

          <Label htmlFor="deliveryNotes">
            {t('delivery_notes_label')}
          </Label>
          <textarea
            id="deliveryNotes"
            value={deliveryNotes}
            maxLength={200}
            rows={3}
            disabled={isOrderSubmitting}
            placeholder={t('delivery_notes_placeholder')}
            className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-base text-foreground sm:text-sm"
            onChange={event => setDeliveryNotes(event.target.value)}
          />
        </div>
      )}

      <div className="mt-4 space-y-2">
        <Label htmlFor="orderNote">
          {t('order_note_label')}
        </Label>
        <textarea
          id="orderNote"
          value={orderNote}
          maxLength={200}
          rows={3}
          disabled={isOrderSubmitting}
          placeholder={t('order_note_placeholder')}
          className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-base text-foreground sm:text-sm"
          onChange={event => setOrderNote(event.target.value)}
        />
      </div>

      <p className="mt-3 text-xs font-medium text-muted-foreground">
        {t('submit_order_connection_helper')}
      </p>

      {/* lightweight connectivity & pending-order UX */}
      {!isOnline && (
        <div className="mt-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm font-medium text-amber-950">
          {t('connection_lost')}
        </div>
      )}

      {pendingAttempt && (
        <div className="mt-3 rounded-md border border-sky-300 bg-sky-50 p-3 text-sm font-medium text-sky-950">
          {pendingAttempt.status === 'pending' && (
            <div className="space-y-3">
              <div className="space-y-1">
                <div>{t('pending_order_title')}</div>
                <div className="text-xs text-muted-foreground">
                  {isCheckingPending
                    ? t('pending_order_checking')
                    : t('pending_order_check_again_online')}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  disabled={isOrderSubmitting || isCheckingPending}
                  onClick={checkPendingOrderStatus}
                >
                  {isCheckingPending ? t('checking_button') : t('check_order_status_button')}
                </Button>
              </div>
            </div>
          )}
          {pendingAttempt.status === 'failed' && (
            <div className="space-y-3">
              <div>
                {t('pending_order_title')}
                <div className="text-xs text-muted-foreground">
                  {t('order_failed_helper')}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  disabled={isOrderSubmitting || isCheckingPending}
                  onClick={checkPendingOrderStatus}
                >
                  {isCheckingPending ? t('checking_button') : t('check_again_button')}
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    if (submitLockRef.current || isOrderSubmitting) {
                      return;
                    }

                    idempotencyRef.current = pendingAttempt.idempotencyKey;
                    setHasOrderError(false);
                    submitOrder();
                  }}
                >
                  {t('retry_submission')}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {hasOrderError && (
        <div className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm font-medium text-destructive">
          {t('order_error')}
        </div>
      )}

      <Button
        type="button"
        className="mt-4 min-h-11 w-full font-semibold"
        aria-disabled={isOrderSubmitting}
        disabled={isOrderSubmitting}
        style={primaryButtonStyle}
        onClick={submitOrder}
      >
        {isOrderSubmitting ? t('submit_order_pending') : t('submit_order_button')}
      </Button>
    </>
  );

  return (
    <div className="scroll-pb-40 space-y-5 pb-[calc(9rem+env(safe-area-inset-bottom))] sm:pb-8">
      <div
        className="sticky top-[57px] z-30 -mx-4 mb-1 flex gap-2 overflow-x-auto border-y bg-background/95 px-4 py-2 shadow-sm backdrop-blur-sm sm:static sm:mx-0 sm:mb-0 sm:flex-wrap sm:overflow-visible sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none sm:backdrop-blur-0"
        aria-label={t('category_nav_label')}
      >
        {props.categories.map(category => (
          <Button
            key={category.id}
            type="button"
            size="sm"
            variant={category.id === selectedCategory?.id ? 'default' : 'outline'}
            className="min-h-10 shrink-0 rounded-full px-4 text-xs font-semibold sm:text-sm"
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
        <div>
          <section className="space-y-5">
            <h2
              className={cn('px-1 leading-tight', templateClassNames.category)}
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
        <section className="hidden rounded-md border bg-card p-4 shadow-sm sm:block">
          <div className="mb-3 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="font-semibold">{t('cart_title')}</h2>
              <div className="text-xs text-muted-foreground">
                {t('cart_items_count', { count: cartQuantity })}
              </div>
            </div>
            <div className="shrink-0 text-right text-sm font-semibold">
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

      {cart.length > 0 && (
        <button
          type="button"
          className="fixed inset-x-3 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40 rounded-lg border bg-background px-4 py-3 text-left shadow-lg sm:hidden"
          style={primaryButtonStyle}
          onClick={() => setIsCartOpen(true)}
        >
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-semibold">{t('cart_title')}</div>
              <div className="text-xs opacity-85">
                {t('cart_items_count', { count: cartQuantity })}
              </div>
            </div>
            <div className="shrink-0 text-right text-sm font-semibold">
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
            <div className="shrink-0 rounded-full bg-white/15 px-3 py-1 text-sm font-semibold">
              {t('cart_bar_button')}
            </div>
          </div>
        </button>
      )}

      {isCartOpen && cart.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-black/45 px-3 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))] sm:hidden"
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
            className="relative mx-auto max-h-[calc(100dvh_-_2rem_-_env(safe-area-inset-top)_-_env(safe-area-inset-bottom))] max-w-2xl overflow-y-auto overscroll-contain rounded-lg border bg-background p-4 shadow-lg"
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

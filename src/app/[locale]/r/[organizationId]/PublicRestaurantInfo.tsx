import { cn } from '@/utils/Helpers';

type PublicRestaurantInfoProps = {
  address: string | null;
  infoLabel: string;
  mapsLabel: string;
  phone: string | null;
  phoneLabel: string;
  restaurantName: string;
  whatsappLabel: string;
  whatsappUrl: string | null;
};

const getMapsUrl = (restaurantName: string, address: string) => {
  const query = encodeURIComponent(`${restaurantName} ${address}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
};

export const PublicRestaurantInfo = (props: PublicRestaurantInfoProps) => {
  const hasInfo = Boolean(props.address || props.phone || props.whatsappUrl);

  if (!hasInfo) {
    return null;
  }

  return (
    <details className="group rounded-md border bg-card/80 px-4 py-3 text-sm shadow-sm">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-left">
        <span className="min-w-0">
          <span className="block truncate font-semibold">
            {props.restaurantName}
          </span>
          {props.address && (
            <span className="mt-0.5 block truncate text-xs text-muted-foreground">
              {props.address}
            </span>
          )}
        </span>
        <span
          className={cn(
            'shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold text-muted-foreground',
            'group-open:bg-muted',
          )}
        >
          {props.infoLabel}
        </span>
      </summary>

      <div className="mt-3 grid gap-2 border-t pt-3 text-xs text-muted-foreground">
        {props.address && (
          <a
            href={getMapsUrl(props.restaurantName, props.address)}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border bg-background px-3 py-2 font-medium text-foreground"
          >
            {props.mapsLabel}
          </a>
        )}
        {props.phone && (
          <a
            href={`tel:${props.phone.replace(/[^\d+]/g, '')}`}
            className="rounded-md border bg-background px-3 py-2 font-medium text-foreground"
          >
            {props.phoneLabel}
            {': '}
            {props.phone}
          </a>
        )}
        {props.whatsappUrl && (
          <a
            href={props.whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border bg-background px-3 py-2 font-medium text-foreground"
          >
            {props.whatsappLabel}
          </a>
        )}
      </div>
    </details>
  );
};

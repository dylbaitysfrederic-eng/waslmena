import { cn } from '@/utils/Helpers';

type PublicRestaurantInfoProps = {
  address: string | null;
  googleMapsUrl: string | null;
  infoLabel: string;
  instagramLabel: string;
  instagramUrl: string | null;
  mapsLabel: string;
  openingHours: string | null;
  openingHoursLabel: string;
  phone: string | null;
  phoneLabel: string;
  restaurantName: string;
  whatsappLabel: string;
  whatsappUrl: string | null;
  wifiLabel: string;
  wifiName: string | null;
  wifiPassword: string | null;
  wifiPasswordLabel: string;
};

const getMapsUrl = (restaurantName: string, address: string) => {
  const query = encodeURIComponent(`${restaurantName} ${address}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
};

export const PublicRestaurantInfo = (props: PublicRestaurantInfoProps) => {
  const mapsUrl = props.googleMapsUrl
    ?? (props.address ? getMapsUrl(props.restaurantName, props.address) : null);
  const hasInfo = Boolean(
    props.address
    || props.openingHours
    || props.phone
    || props.whatsappUrl
    || props.instagramUrl
    || mapsUrl
    || props.wifiName,
  );

  if (!hasInfo) {
    return null;
  }

  return (
    <details className="wasl-card group px-4 py-3 text-sm">
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
        {props.openingHours && (
          <div className="rounded-md border bg-background px-3 py-2 font-semibold text-foreground">
            {props.openingHoursLabel}
            {': '}
            <span className="font-medium">{props.openingHours}</span>
          </div>
        )}
        {props.address && (
          <div className="rounded-md border bg-background px-3 py-2 font-semibold text-foreground">
            {props.address}
          </div>
        )}
        {mapsUrl && (
          <a href={mapsUrl} target="_blank" rel="noreferrer" className="rounded-md border bg-background px-3 py-2 font-semibold text-foreground">
            {props.mapsLabel}
          </a>
        )}
        {props.phone && (
          <a
            href={`tel:${props.phone.replace(/[^\d+]/g, '')}`}
            className="rounded-md border bg-background px-3 py-2 font-semibold text-foreground"
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
            className="rounded-md border bg-background px-3 py-2 font-semibold text-foreground"
          >
            {props.whatsappLabel}
          </a>
        )}
        {props.instagramUrl && (
          <a
            href={props.instagramUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-md border bg-background px-3 py-2 font-semibold text-foreground"
          >
            {props.instagramLabel}
          </a>
        )}
        {props.wifiName && (
          <div className="rounded-md border bg-background px-3 py-2 font-semibold text-foreground">
            {props.wifiLabel}
            {': '}
            <span className="font-medium">{props.wifiName}</span>
            {props.wifiPassword && (
              <span className="mt-1 block text-muted-foreground">
                {props.wifiPasswordLabel}
                {': '}
                {props.wifiPassword}
              </span>
            )}
          </div>
        )}
      </div>
    </details>
  );
};

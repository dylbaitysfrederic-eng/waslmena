import Link from 'next/link';

export const AdminRestaurantSearch = (props: {
  action: string;
  emptyMessage?: string;
  resultCount: number;
  searchQuery: string;
  totalCount: number;
}) => (
  <div className="mb-4 rounded-md border bg-muted/20 p-3">
    <form className="flex flex-col gap-2 sm:flex-row" action={props.action}>
      <input
        name="q"
        defaultValue={props.searchQuery}
        placeholder="Search restaurant, location/address, organization ID, contact, or status"
        className="h-10 rounded-md border border-input bg-background px-3 text-sm"
      />
      <button
        type="submit"
        className="inline-flex h-10 items-center justify-center rounded-md border bg-background px-3 text-sm font-semibold hover:bg-muted"
      >
        Search
      </button>
      {props.searchQuery && (
        <Link
          href={props.action}
          className="inline-flex h-10 items-center justify-center rounded-md border bg-background px-3 text-sm font-semibold hover:bg-muted"
        >
          Clear
        </Link>
      )}
    </form>
    <div className="mt-2 text-xs font-medium text-muted-foreground">
      {props.searchQuery
        ? `${props.resultCount} of ${props.totalCount} restaurants`
        : `${props.totalCount} restaurants`}
    </div>
    {props.searchQuery && props.resultCount === 0 && (
      <div className="mt-3 rounded-md border border-dashed bg-background p-4 text-sm text-muted-foreground">
        {props.emptyMessage ?? 'No restaurants match this search.'}
      </div>
    )}
  </div>
);

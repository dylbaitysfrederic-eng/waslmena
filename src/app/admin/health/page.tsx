import Link from 'next/link';

import { formatAdminLabel, formatDate, formatDateTime } from '../_helpers';
import {
  type AdminHealthFilter,
  type AdminHealthStatus,
  filterAdminHealthRows,
  getAdminHealthRows,
} from './queries';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const statusLabels: Record<AdminHealthStatus, string> = {
  healthy: 'Healthy',
  setup_incomplete: 'Setup incomplete',
  inactive: 'Inactive',
  needs_review: 'Needs review',
};

const statusClassNames: Record<AdminHealthStatus, string> = {
  healthy: 'border-emerald-300 bg-emerald-50 text-emerald-950',
  setup_incomplete: 'border-amber-300 bg-amber-50 text-amber-950',
  inactive: 'border-slate-300 bg-slate-50 text-slate-800',
  needs_review: 'border-red-300 bg-red-50 text-red-950',
};

const filterOptions: { label: string; value: AdminHealthFilter }[] = [
  { label: 'All clients', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Suspended', value: 'suspended' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Setup incomplete', value: 'setup_incomplete' },
];

const getSearchParam = (value: string | string[] | undefined) => {
  return Array.isArray(value) ? value.at(0) ?? '' : value ?? '';
};

const getStatusFilter = (
  value: string | string[] | undefined,
): AdminHealthFilter => {
  const status = getSearchParam(value);

  return filterOptions.some(option => option.value === status)
    ? status as AdminHealthFilter
    : 'all';
};

const StatusBadge = (props: { status: AdminHealthStatus }) => (
  <span className={`inline-flex w-fit rounded-md border px-2 py-1 text-xs font-semibold ${statusClassNames[props.status]}`}>
    {statusLabels[props.status]}
  </span>
);

const MetricCard = (props: {
  label: string;
  value: number | string;
  helper?: string;
}) => (
  <div className="rounded-md border bg-background p-4">
    <p className="text-xs font-semibold uppercase text-muted-foreground">
      {props.label}
    </p>
    <p className="mt-2 text-2xl font-semibold">{props.value}</p>
    {props.helper && (
      <p className="mt-1 text-xs text-muted-foreground">{props.helper}</p>
    )}
  </div>
);

const InlineMetric = (props: {
  label: string;
  value: number | string;
}) => (
  <div className="min-w-0">
    <p className="text-xs font-semibold uppercase text-muted-foreground">
      {props.label}
    </p>
    <p className="mt-1 truncate text-sm font-semibold">{props.value}</p>
  </div>
);

const AdminHealthPage = async (props: {
  searchParams?: {
    q?: string | string[];
    status?: string | string[];
  };
}) => {
  const rows = await getAdminHealthRows();
  const searchQuery = getSearchParam(props.searchParams?.q);
  const statusFilter = getStatusFilter(props.searchParams?.status);
  const filteredRows = filterAdminHealthRows(rows, searchQuery, statusFilter);
  const healthyCount = rows.filter(row => row.healthStatus === 'healthy').length;
  const setupIncompleteCount = rows.filter(
    row => row.healthStatus === 'setup_incomplete',
  ).length;
  const needsReviewCount = rows.filter(
    row => row.healthStatus === 'needs_review',
  ).length;
  const inactiveCount = rows.filter(row => row.healthStatus === 'inactive').length;

  return (
    <section className="rounded-md bg-background p-5">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Client health</h2>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Read-only operational view for beta restaurants. Metrics are computed
            from existing client, menu, table, module, and order data.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/beta"
            className="inline-flex w-fit rounded-md border border-input bg-background px-3 py-2 text-sm font-semibold hover:bg-muted"
          >
            Beta operations
          </Link>
          <Link
            href="/admin/field-test"
            className="inline-flex w-fit rounded-md border border-input bg-background px-3 py-2 text-sm font-semibold hover:bg-muted"
          >
            Field test
          </Link>
          <Link
            href="/admin/feedback"
            className="inline-flex w-fit rounded-md border border-input bg-background px-3 py-2 text-sm font-semibold hover:bg-muted"
          >
            Feedback
          </Link>
        </div>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard label="Restaurants" value={rows.length} helper="Tracked clients" />
        <MetricCard label="Healthy" value={healthyCount} helper="Ready and active" />
        <MetricCard label="Setup gaps" value={setupIncompleteCount} helper="Missing basics" />
        <MetricCard label="Needs review" value={needsReviewCount} helper="Suspended or flagged" />
        <MetricCard label="Inactive" value={inactiveCount} helper="No recent activity" />
      </div>

      <form className="mb-5 grid gap-3 rounded-md border bg-muted/30 p-4 md:grid-cols-[1fr_220px_auto]" action="/admin/health">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Search
          <input
            className="min-h-10 rounded-md border border-input bg-background px-3 text-sm"
            defaultValue={searchQuery}
            name="q"
            placeholder="Restaurant name or organization ID"
            type="search"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Filter
          <select
            className="min-h-10 rounded-md border border-input bg-background px-3 text-sm"
            defaultValue={statusFilter}
            name="status"
          >
            {filterOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end">
          <button
            className="min-h-10 w-full rounded-md border border-input bg-background px-4 text-sm font-semibold hover:bg-muted md:w-auto"
            type="submit"
          >
            Apply
          </button>
        </div>
      </form>

      {rows.length === 0
        ? (
            <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
              No restaurant clients found yet.
            </div>
          )
        : filteredRows.length === 0
          ? (
              <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
                No restaurants match the current health filters.
              </div>
            )
          : (
              <div className="grid gap-3">
                {filteredRows.map((row) => {
                  const organization = row.organization;
                  const restaurantName = organization.restaurantDisplayName
                    || 'Unnamed restaurant';
                  const activeModules = row.activeModules.length > 0
                    ? row.activeModules.join(', ')
                    : 'No modules enabled';
                  const accessLabel = organization.accessSuspended
                    ? 'Suspended'
                    : formatAdminLabel(organization.accessStatus);

                  return (
                    <article
                      key={organization.id}
                      className="rounded-md border bg-background p-4"
                    >
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link
                              href={`/admin/health/${organization.id}`}
                              className="text-base font-semibold hover:underline"
                            >
                              {restaurantName}
                            </Link>
                            <StatusBadge status={row.healthStatus} />
                            <span className="inline-flex w-fit rounded-md border bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">
                              {accessLabel}
                            </span>
                          </div>
                          <code className="mt-1 block max-w-full truncate text-xs text-muted-foreground">
                            {organization.id}
                          </code>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Created
                            {' '}
                            {formatDate(organization.createdAt)}
                            {' '}
                            · Modules:
                            {' '}
                            {activeModules}
                          </p>
                        </div>
                        <Link
                          href={`/admin/health/${organization.id}`}
                          className="inline-flex w-fit rounded-md border border-input bg-background px-3 py-2 text-xs font-semibold hover:bg-muted"
                        >
                          Open health detail
                        </Link>
                      </div>

                      <div className="mt-4 grid gap-4 border-t pt-4 sm:grid-cols-2 lg:grid-cols-6">
                        <InlineMetric label="Total orders" value={row.totalOrders} />
                        <InlineMetric label="Last 7 days" value={row.ordersLast7Days} />
                        <InlineMetric label="Last order" value={formatDateTime(row.lastOrderDate)} />
                        <InlineMetric label="Items" value={row.menuItemCount} />
                        <InlineMetric label="Categories" value={row.categoryCount} />
                        <InlineMetric label="Tables" value={row.tableCount} />
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {row.readinessIssues.length > 0
                          ? row.readinessIssues.slice(0, 5).map(issue => (
                            <span
                              key={issue}
                              className="inline-flex rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-950"
                            >
                              {issue}
                            </span>
                          ))
                          : (
                              <span className="inline-flex rounded-md border border-emerald-300 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-950">
                                No readiness warnings
                              </span>
                            )}
                        {row.readinessIssues.length > 5 && (
                          <span className="inline-flex rounded-md border bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">
                            +
                            {row.readinessIssues.length - 5}
                            {' '}
                            more
                          </span>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
    </section>
  );
};

export default AdminHealthPage;

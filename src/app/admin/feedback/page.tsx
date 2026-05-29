import { desc, eq } from 'drizzle-orm';
import Link from 'next/link';

import { FormSubmitButton } from '@/components/FormSubmitButton';
import { db } from '@/libs/DB';
import { betaFeedbackSchema, organizationSchema } from '@/models/Schema';
import {
  BETA_FEEDBACK_CATEGORIES,
  BETA_FEEDBACK_SEVERITIES,
  BETA_FEEDBACK_STATUSES,
  type BetaFeedbackCategory,
  type BetaFeedbackSeverity,
  type BetaFeedbackStatus,
} from '@/utils/BetaFeedback';

import { formatAdminLabel, formatDateTime } from '../_helpers';
import { updateBetaFeedbackAction } from './actions';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const getSearchParam = (value: string | string[] | undefined) => {
  return Array.isArray(value) ? value.at(0) ?? '' : value ?? '';
};

const optionOrAll = <T extends readonly string[]>(
  value: string,
  options: T,
) => options.includes(value) ? value as T[number] : 'all';

const severityClassNames: Record<BetaFeedbackSeverity, string> = {
  low: 'border-slate-300 bg-slate-50 text-slate-800',
  medium: 'border-blue-300 bg-blue-50 text-blue-900',
  high: 'border-amber-300 bg-amber-50 text-amber-950',
  blocker: 'border-red-300 bg-red-50 text-red-950',
};

const statusClassNames: Record<BetaFeedbackStatus, string> = {
  new: 'border-blue-300 bg-blue-50 text-blue-900',
  reviewed: 'border-slate-300 bg-slate-50 text-slate-800',
  planned: 'border-purple-300 bg-purple-50 text-purple-900',
  resolved: 'border-emerald-300 bg-emerald-50 text-emerald-950',
  dismissed: 'border-slate-300 bg-slate-100 text-slate-600',
};

const AdminFeedbackPage = async (props: {
  searchParams?: {
    category?: string | string[];
    q?: string | string[];
    severity?: string | string[];
    status?: string | string[];
    updated?: string | string[];
  };
}) => {
  const searchQuery = getSearchParam(props.searchParams?.q).trim().toLowerCase();
  const selectedCategory = optionOrAll(
    getSearchParam(props.searchParams?.category),
    BETA_FEEDBACK_CATEGORIES,
  );
  const selectedSeverity = optionOrAll(
    getSearchParam(props.searchParams?.severity),
    BETA_FEEDBACK_SEVERITIES,
  );
  const selectedStatus = optionOrAll(
    getSearchParam(props.searchParams?.status),
    BETA_FEEDBACK_STATUSES,
  );
  const rows = await db
    .select({
      id: betaFeedbackSchema.id,
      organizationId: betaFeedbackSchema.organizationId,
      submittedByUserId: betaFeedbackSchema.submittedByUserId,
      roleContext: betaFeedbackSchema.roleContext,
      category: betaFeedbackSchema.category,
      severity: betaFeedbackSchema.severity,
      message: betaFeedbackSchema.message,
      deviceInfo: betaFeedbackSchema.deviceInfo,
      pageContext: betaFeedbackSchema.pageContext,
      status: betaFeedbackSchema.status,
      adminNotes: betaFeedbackSchema.adminNotes,
      createdAt: betaFeedbackSchema.createdAt,
      restaurantDisplayName: organizationSchema.restaurantDisplayName,
    })
    .from(betaFeedbackSchema)
    .leftJoin(
      organizationSchema,
      eq(betaFeedbackSchema.organizationId, organizationSchema.id),
    )
    .orderBy(desc(betaFeedbackSchema.createdAt))
    .limit(200);
  const filteredRows = rows.filter((row) => {
    const category = row.category as BetaFeedbackCategory;
    const severity = row.severity as BetaFeedbackSeverity;
    const status = row.status as BetaFeedbackStatus;
    const restaurantName = row.restaurantDisplayName ?? row.organizationId ?? '';
    const matchesSearch = searchQuery.length === 0
      || row.message.toLowerCase().includes(searchQuery)
      || restaurantName.toLowerCase().includes(searchQuery);

    return matchesSearch
      && (selectedCategory === 'all' || category === selectedCategory)
      && (selectedSeverity === 'all' || severity === selectedSeverity)
      && (selectedStatus === 'all' || status === selectedStatus);
  });

  return (
    <section className="rounded-md bg-background p-5">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Beta feedback</h2>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Structured pilot feedback from authenticated restaurant dashboards.
            No emails, notifications, or external services are sent.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/beta"
            className="inline-flex rounded-md border border-input bg-background px-3 py-2 text-sm font-semibold hover:bg-muted"
          >
            Beta operations
          </Link>
          <Link
            href="/admin/field-test"
            className="inline-flex rounded-md border border-input bg-background px-3 py-2 text-sm font-semibold hover:bg-muted"
          >
            Field test
          </Link>
        </div>
      </div>

      {props.searchParams?.updated === '1' && (
        <div className="mb-4 rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm font-medium text-emerald-950">
          Feedback updated.
        </div>
      )}

      <form className="mb-5 grid gap-3 rounded-md border bg-muted/30 p-4 lg:grid-cols-[1fr_170px_170px_170px_auto]" action="/admin/feedback">
        <label className="grid gap-1 text-sm font-medium">
          Search
          <input
            className="min-h-10 rounded-md border border-input bg-background px-3 text-sm"
            defaultValue={searchQuery}
            name="q"
            placeholder="Restaurant or message"
            type="search"
          />
        </label>
        {[
          ['category', selectedCategory, BETA_FEEDBACK_CATEGORIES],
          ['severity', selectedSeverity, BETA_FEEDBACK_SEVERITIES],
          ['status', selectedStatus, BETA_FEEDBACK_STATUSES],
        ].map(([name, selectedValue, options]) => (
          <label key={name as string} className="grid gap-1 text-sm font-medium">
            {formatAdminLabel(name as string)}
            <select
              className="min-h-10 rounded-md border border-input bg-background px-3 text-sm"
              defaultValue={selectedValue as string}
              name={name as string}
            >
              <option value="all">All</option>
              {(options as readonly string[]).map(option => (
                <option key={option} value={option}>
                  {formatAdminLabel(option)}
                </option>
              ))}
            </select>
          </label>
        ))}
        <div className="flex items-end">
          <button
            className="min-h-10 w-full rounded-md border border-input bg-background px-4 text-sm font-semibold hover:bg-muted lg:w-auto"
            type="submit"
          >
            Apply
          </button>
        </div>
      </form>

      {filteredRows.length === 0
        ? (
            <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
              No beta feedback matches the current filters.
            </div>
          )
        : (
            <div className="grid gap-4">
              {filteredRows.map((row) => {
                const category = row.category as BetaFeedbackCategory;
                const severity = row.severity as BetaFeedbackSeverity;
                const status = row.status as BetaFeedbackStatus;
                const restaurantName = row.restaurantDisplayName
                  ?? row.organizationId
                  ?? 'Unknown restaurant';

                return (
                  <article key={row.id} className="rounded-md border bg-background p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold">{restaurantName}</h3>
                          <span className={`rounded-md border px-2 py-1 text-xs font-semibold ${severityClassNames[severity]}`}>
                            {formatAdminLabel(severity)}
                          </span>
                          <span className={`rounded-md border px-2 py-1 text-xs font-semibold ${statusClassNames[status]}`}>
                            {formatAdminLabel(status)}
                          </span>
                          <span className="rounded-md border bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground">
                            {formatAdminLabel(category)}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatDateTime(row.createdAt)}
                          {row.roleContext ? ` · ${row.roleContext}` : ''}
                        </p>
                      </div>
                    </div>

                    <p className="mt-4 whitespace-pre-wrap rounded-md border bg-muted/20 p-3 text-sm leading-6">
                      {row.message}
                    </p>

                    <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                      <div>
                        <span className="font-semibold text-foreground">Page: </span>
                        {row.pageContext || 'Not provided'}
                      </div>
                      <div>
                        <span className="font-semibold text-foreground">Device: </span>
                        {row.deviceInfo || 'Not provided'}
                      </div>
                    </div>

                    <form action={updateBetaFeedbackAction} className="mt-4 grid gap-3 md:grid-cols-[180px_1fr_auto]">
                      <input type="hidden" name="feedbackId" value={row.id} />
                      <label className="grid gap-1 text-sm font-medium">
                        Status
                        <select
                          name="status"
                          defaultValue={status}
                          className="min-h-10 rounded-md border border-input bg-background px-3 text-sm"
                        >
                          {BETA_FEEDBACK_STATUSES.map(option => (
                            <option key={option} value={option}>
                              {formatAdminLabel(option)}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="grid gap-1 text-sm font-medium">
                        Admin notes
                        <textarea
                          name="adminNotes"
                          defaultValue={row.adminNotes ?? ''}
                          rows={2}
                          maxLength={2000}
                          className="min-h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                        />
                      </label>
                      <div className="flex items-end">
                        <FormSubmitButton pendingLabel="Saving...">
                          Save
                        </FormSubmitButton>
                      </div>
                    </form>
                  </article>
                );
              })}
            </div>
          )}
    </section>
  );
};

export default AdminFeedbackPage;

import Link from 'next/link';
import { notFound } from 'next/navigation';

import { formatAdminLabel, formatDate, formatDateTime } from '../../_helpers';
import { type AdminHealthStatus, getAdminHealthDetail } from '../queries';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type QuickLink = {
  href: string;
  label: string;
};

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

const StatusBadge = (props: { status: AdminHealthStatus }) => (
  <span className={`inline-flex w-fit rounded-md border px-2 py-1 text-xs font-semibold ${statusClassNames[props.status]}`}>
    {statusLabels[props.status]}
  </span>
);

const Section = (props: {
  children: React.ReactNode;
  description?: string;
  title: string;
}) => (
  <section className="rounded-md border bg-background p-4">
    <div className="mb-4">
      <h3 className="text-base font-semibold">{props.title}</h3>
      {props.description && (
        <p className="mt-1 text-sm text-muted-foreground">
          {props.description}
        </p>
      )}
    </div>
    {props.children}
  </section>
);

const DetailItem = (props: {
  label: string;
  value: React.ReactNode;
}) => (
  <div>
    <p className="text-xs font-semibold uppercase text-muted-foreground">
      {props.label}
    </p>
    <div className="mt-1 text-sm font-medium">{props.value}</div>
  </div>
);

const TextBadge = (props: {
  children: React.ReactNode;
  tone?: 'default' | 'good' | 'warn';
}) => {
  const className = props.tone === 'good'
    ? 'border-emerald-300 bg-emerald-50 text-emerald-950'
    : props.tone === 'warn'
      ? 'border-amber-300 bg-amber-50 text-amber-950'
      : 'border-muted bg-muted text-muted-foreground';

  return (
    <span className={`inline-flex w-fit rounded-md border px-2 py-1 text-xs font-semibold ${className}`}>
      {props.children}
    </span>
  );
};

const AdminHealthDetailPage = async (props: {
  params: { id: string };
}) => {
  const health = await getAdminHealthDetail(props.params.id);

  if (!health) {
    notFound();
  }

  const organization = health.organization;
  const restaurantName = organization.restaurantDisplayName || 'Unnamed restaurant';
  const activeModules = health.activeModules.length > 0
    ? health.activeModules
    : ['No modules enabled'];
  const tablePreviewUrl = health.firstTable
    ? `/en/r/${organization.id}/table/${health.firstTable.id}`
    : null;
  const publicMenuUrl = `/en/r/${organization.id}/menu`;
  const accessLabel = organization.accessSuspended
    ? 'Suspended'
    : formatAdminLabel(organization.accessStatus);
  const deliveryReady = organization.deliveryEnabled
    && (organization.deliveryFeeUsdCents || organization.deliveryFeeLocal)
    && organization.deliveryEstimatedTime;
  const quickLinks: QuickLink[] = [
    { label: 'Identity', href: `/admin/identity/${organization.id}` },
    { label: 'Menu', href: `/admin/menu/${organization.id}` },
    { label: 'Modules', href: `/admin/modules/${organization.id}` },
    { label: 'Exports', href: `/admin/exports/${organization.id}` },
    { label: 'QR and tables', href: `/admin/templates/${organization.id}` },
    { label: 'Dashboard preview', href: '/dashboard' },
  ];

  return (
    <div className="grid gap-5">
      <section className="rounded-md bg-background p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <Link
              href="/admin/health"
              className="text-sm font-semibold text-muted-foreground hover:underline"
            >
              Back to client health
            </Link>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold">{restaurantName}</h2>
              <StatusBadge status={health.healthStatus} />
              <TextBadge>{accessLabel}</TextBadge>
            </div>
            <code className="mt-1 block max-w-full truncate text-xs text-muted-foreground">
              {organization.id}
            </code>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/admin/clients/${organization.id}`}
              className="inline-flex rounded-md border border-input bg-background px-3 py-2 text-xs font-semibold hover:bg-muted"
            >
              Client record
            </Link>
            <Link
              href={publicMenuUrl}
              className="inline-flex rounded-md border border-input bg-background px-3 py-2 text-xs font-semibold hover:bg-muted"
            >
              Public menu
            </Link>
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="grid gap-5">
          <Section title="Restaurant identity">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <DetailItem label="Created" value={formatDate(organization.createdAt)} />
              <DetailItem label="Access status" value={accessLabel} />
              <DetailItem
                label="Suspended"
                value={organization.accessSuspended ? 'Yes' : 'No'}
              />
              <DetailItem
                label="Logo"
                value={organization.restaurantLogoUrl ? 'Configured' : 'Missing'}
              />
              <DetailItem
                label="Opening hours"
                value={organization.restaurantOpeningHours || 'Missing'}
              />
              <DetailItem
                label="WhatsApp"
                value={organization.restaurantWhatsappNumber || 'Missing'}
              />
            </div>
          </Section>

          <Section
            title="Module status"
            description="Flags shown here are read-only beta readiness markers."
          >
            <div className="flex flex-wrap gap-2">
              {activeModules.map(module => (
                <TextBadge
                  key={module}
                  tone={module === 'No modules enabled' ? 'default' : 'good'}
                >
                  {module}
                </TextBadge>
              ))}
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <DetailItem
                label="Payment module"
                value={organization.onlinePaymentsEnabled
                  ? 'Enabled marker, still coming soon'
                  : 'Disabled'}
              />
              <DetailItem
                label="POS module"
                value={organization.posIntegrationEnabled
                  ? health.posConfigured
                    ? 'Configured marker present'
                    : 'Enabled marker, not configured'
                  : 'Disabled'}
              />
            </div>
          </Section>

          <Section title="Menu readiness">
            <div className="grid gap-4 sm:grid-cols-3">
              <DetailItem label="Menu items" value={health.menuItemCount} />
              <DetailItem label="Categories" value={health.categoryCount} />
              <DetailItem label="Tables" value={health.tableCount} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {health.readinessIssues.length > 0
                ? health.readinessIssues.map(issue => (
                  <TextBadge key={issue} tone="warn">
                    {issue}
                  </TextBadge>
                ))
                : (
                    <TextBadge tone="good">No readiness warnings</TextBadge>
                  )}
            </div>
          </Section>

          <Section title="Order activity summary">
            <div className="grid gap-4 sm:grid-cols-3">
              <DetailItem label="Total orders" value={health.totalOrders} />
              <DetailItem label="Orders last 7 days" value={health.ordersLast7Days} />
              <DetailItem
                label="Last order"
                value={formatDateTime(health.lastOrderDate)}
              />
            </div>
          </Section>
        </div>

        <div className="grid gap-5">
          <Section title="Delivery readiness">
            <div className="grid gap-4">
              <DetailItem
                label="Delivery"
                value={organization.deliveryEnabled ? 'Enabled' : 'Disabled'}
              />
              <DetailItem
                label="Pickup"
                value={organization.pickupEnabled ? 'Enabled' : 'Disabled'}
              />
              <DetailItem
                label="Delivery fee"
                value={
                  organization.deliveryFeeLocal
                  ?? organization.deliveryFeeUsdCents
                  ?? 'Missing'
                }
              />
              <DetailItem
                label="Estimated time"
                value={organization.deliveryEstimatedTime || 'Missing'}
              />
              <TextBadge tone={deliveryReady ? 'good' : 'warn'}>
                {deliveryReady
                  ? 'Delivery settings look ready'
                  : 'Review delivery fee and timing before pilot'}
              </TextBadge>
            </div>
          </Section>

          <Section title="QR and public links">
            <div className="grid gap-2">
              <Link
                href={publicMenuUrl}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm font-semibold hover:bg-muted"
              >
                General menu preview
              </Link>
              {tablePreviewUrl
                ? (
                    <Link
                      href={tablePreviewUrl}
                      className="rounded-md border border-input bg-background px-3 py-2 text-sm font-semibold hover:bg-muted"
                    >
                      First table QR preview
                    </Link>
                  )
                : (
                    <div className="rounded-md border bg-muted px-3 py-2 text-sm text-muted-foreground">
                      Table QR preview unavailable until a table exists.
                    </div>
                  )}
            </div>
          </Section>

          <Section title="Pilot notes">
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                Use this page before and after a pilot shift to check setup gaps,
                order activity, and public QR availability.
              </p>
              <p>
                This overview is read-only. Update restaurant configuration from
                the existing admin setup pages.
              </p>
            </div>
          </Section>

          <Section title="Quick admin links">
            <div className="grid gap-2">
              {quickLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm font-semibold hover:bg-muted"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
};

export default AdminHealthDetailPage;

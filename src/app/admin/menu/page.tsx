import { desc } from 'drizzle-orm';
import Link from 'next/link';

import { db } from '@/libs/DB';
import { organizationSchema } from '@/models/Schema';

export const dynamic = 'force-dynamic';

export default async function AdminMenuListPage() {
  const organizations = await db
    .select({
      id: organizationSchema.id,
      restaurantDisplayName: organizationSchema.restaurantDisplayName,
    })
    .from(organizationSchema)
    .orderBy(desc(organizationSchema.createdAt));

  return (
    <div className="space-y-6">
      <div className="rounded-md border bg-background p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-foreground">
          Menu setup previews
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Select a hospitality client to manage categories and starter menu items during onboarding.
        </p>
      </div>

      <div className="grid gap-3">
        {organizations.map(org => (
          <div
            key={org.id}
            className="flex items-center justify-between rounded-lg border bg-card p-4 transition-colors hover:bg-accent/5"
          >
            <div className="flex flex-col gap-1">
              <span className="font-medium text-foreground">
                {org.restaurantDisplayName || 'Unnamed venue'}
              </span>

              <code className="text-[10px] text-muted-foreground">
                {org.id}
              </code>
            </div>

            <Link
              href={`/admin/menu/${org.id}`}
              className="inline-flex h-9 items-center justify-center rounded-md border bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Setup menu
            </Link>
          </div>
        ))}

        {organizations.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center text-sm text-muted-foreground">
            No hospitality clients found.
          </div>
        )}
      </div>
    </div>
  );
}

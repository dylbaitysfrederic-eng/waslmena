# Migration Safety

Wasl uses Drizzle SQL migrations from `migrations/` and the Drizzle journal at `migrations/meta/_journal.json`.

## Normal Workflow

- Create migrations with `npm run db:generate` or add a deliberate forward-only SQL migration.
- Commit the SQL migration and `migrations/meta/_journal.json` together.
- Run `npm run verify` before pushing.
- Run `npm run db:migrate` before deployment when schema changes are included.
- Deploy only after Vercel is Ready and a quick smoke test covers the homepage, public QR menu, dashboard orders, and admin.
- Never edit old migrations that may already have been applied to production.

## Production Mismatch Recovery

If a migration file exists locally but was not present in the journal during deployment, do not rewrite old applied history. Add a new recovery migration with `IF NOT EXISTS` / idempotent DDL, apply it with `npm run db:migrate`, and document the recovered gap in `scripts/check-migrations.mjs`.

The historical `0033`-`0035` gap is recovered by `0039_recover_missing_access_columns.sql`.

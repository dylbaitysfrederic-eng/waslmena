ALTER TABLE "order"
  ADD COLUMN IF NOT EXISTS "idempotency_key" text;

CREATE UNIQUE INDEX IF NOT EXISTS order_org_idempotency_idx
  ON "order" ("organization_id", "idempotency_key");

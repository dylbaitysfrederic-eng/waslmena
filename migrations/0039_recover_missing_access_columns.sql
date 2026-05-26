ALTER TABLE "organization"
  ADD COLUMN IF NOT EXISTS "delivery_enabled" boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS "online_payments_enabled" boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS "pos_integration_enabled" boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS "whatsapp_business_enabled" boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS "loyalty_enabled" boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS "pickup_enabled" boolean DEFAULT true NOT NULL,
  ADD COLUMN IF NOT EXISTS "delivery_fee_usd_cents" integer,
  ADD COLUMN IF NOT EXISTS "delivery_fee_local" integer,
  ADD COLUMN IF NOT EXISTS "minimum_order_amount_usd_cents" integer,
  ADD COLUMN IF NOT EXISTS "minimum_order_amount_local" integer,
  ADD COLUMN IF NOT EXISTS "delivery_estimated_time" text,
  ADD COLUMN IF NOT EXISTS "delivery_coverage_notes" text;
--> statement-breakpoint
ALTER TABLE "order"
  ADD COLUMN IF NOT EXISTS "idempotency_key" text,
  ADD COLUMN IF NOT EXISTS "order_type" text,
  ADD COLUMN IF NOT EXISTS "delivery_address" text,
  ADD COLUMN IF NOT EXISTS "delivery_phone" text,
  ADD COLUMN IF NOT EXISTS "delivery_notes" text,
  ADD COLUMN IF NOT EXISTS "delivery_map_link" text,
  ADD COLUMN IF NOT EXISTS "delivery_fee_usd_cents" integer,
  ADD COLUMN IF NOT EXISTS "delivery_fee_local" integer,
  ADD COLUMN IF NOT EXISTS "delivery_estimated_time" text;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS order_org_idempotency_idx
  ON "order" ("organization_id", "idempotency_key");

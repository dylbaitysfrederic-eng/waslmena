ALTER TABLE "order"
  ADD COLUMN IF NOT EXISTS "payment_status" text DEFAULT 'unpaid' NOT NULL,
  ADD COLUMN IF NOT EXISTS "payment_session_id" integer;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payment_session" (
  "id" serial PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL,
  "order_id" integer,
  "provider" text NOT NULL,
  "provider_session_id" text,
  "provider_payment_id" text,
  "provider_status" text,
  "payment_status" text DEFAULT 'pending_payment' NOT NULL,
  "amount_usd_cents" integer,
  "amount_local" integer,
  "local_currency_label" text,
  "idempotency_key" text,
  "webhook_event_id" text,
  "checkout_url" text,
  "metadata" text,
  "manual_reconciliation_notes" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "pos_provider_config" (
  "id" serial PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL,
  "provider" text DEFAULT 'csv_manual' NOT NULL,
  "enabled" boolean DEFAULT false NOT NULL,
  "sync_enabled" boolean DEFAULT false NOT NULL,
  "test_mode" boolean DEFAULT true NOT NULL,
  "last_sync_at" timestamp,
  "sync_status" text DEFAULT 'not_configured' NOT NULL,
  "sync_error_message" text,
  "provider_merchant_id" text,
  "provider_metadata" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pos_item_mapping" (
  "id" serial PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL,
  "menu_item_id" integer,
  "pos_sku" text,
  "pos_external_id" text,
  "pos_name" text,
  "pos_category" text,
  "pos_price_usd_cents" integer,
  "pos_price_local" integer,
  "sync_status" text DEFAULT 'pending' NOT NULL,
  "conflict_reason" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pos_category_mapping" (
  "id" serial PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL,
  "category_id" integer,
  "pos_category_id" text,
  "pos_name" text,
  "sync_status" text DEFAULT 'pending' NOT NULL,
  "conflict_reason" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pos_order_mapping" (
  "id" serial PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL,
  "order_id" integer NOT NULL,
  "pos_order_id" text,
  "push_status" text DEFAULT 'pending' NOT NULL,
  "pos_status" text,
  "status_synced_at" timestamp,
  "error_message" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pos_sync_log" (
  "id" serial PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL,
  "sync_type" text NOT NULL,
  "resource_type" text,
  "resource_id" text,
  "status" text DEFAULT 'pending' NOT NULL,
  "message" text,
  "payload_snapshot" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "analytics_event" (
  "id" serial PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL,
  "event_type" text NOT NULL,
  "locale" text,
  "device_type" text,
  "table_id" integer,
  "category_id" integer,
  "order_id" integer,
  "metadata" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "analytics_event_org_created_idx"
  ON "analytics_event" ("organization_id", "created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "analytics_event_type_created_idx"
  ON "analytics_event" ("event_type", "created_at");

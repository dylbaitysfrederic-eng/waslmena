CREATE TABLE IF NOT EXISTS "beta_feedback" (
  "id" serial PRIMARY KEY NOT NULL,
  "organization_id" text,
  "submitted_by_user_id" text,
  "role_context" text,
  "category" text DEFAULT 'other' NOT NULL,
  "severity" text DEFAULT 'medium' NOT NULL,
  "message" text NOT NULL,
  "device_info" text,
  "page_context" text,
  "status" text DEFAULT 'new' NOT NULL,
  "admin_notes" text,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "beta_feedback_org_created_idx"
  ON "beta_feedback" ("organization_id", "created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "beta_feedback_status_created_idx"
  ON "beta_feedback" ("status", "created_at");

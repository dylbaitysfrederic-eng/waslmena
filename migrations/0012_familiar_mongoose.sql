ALTER TABLE "organization" ADD COLUMN "subscription_payment_method" text;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "billing_cycle" text;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "subscription_amount_usd" integer;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "subscription_status" text DEFAULT 'trial' NOT NULL;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "last_payment_date" timestamp;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "next_payment_due_date" timestamp;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "overdue_since" timestamp;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "admin_payment_notes" text;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "access_suspended" boolean DEFAULT false NOT NULL;
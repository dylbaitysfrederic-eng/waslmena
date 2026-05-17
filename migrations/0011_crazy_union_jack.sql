ALTER TABLE "organization" ADD COLUMN "setup_fee_amount_usd" integer;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "monthly_subscription_amount_usd" integer;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "next_billing_date" timestamp;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "payment_method_note" text;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "internal_admin_notes" text;
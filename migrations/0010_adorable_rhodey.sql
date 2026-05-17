ALTER TABLE "organization" ADD COLUMN "restaurant_profile" text DEFAULT 'table_service' NOT NULL;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "ordering_mode" text DEFAULT 'table_ordering' NOT NULL;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "enable_table_numbers" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "enable_named_tables" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "enable_customer_name" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "enable_whatsapp_contact" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "qr_mode" text DEFAULT 'per_table' NOT NULL;
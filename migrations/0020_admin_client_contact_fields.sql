ALTER TABLE "organization" ADD COLUMN "client_category" text DEFAULT 'restaurant' NOT NULL;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "main_contact_first_name" text;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "main_contact_last_name" text;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "main_contact_whatsapp_number" text;

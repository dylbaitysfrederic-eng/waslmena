ALTER TABLE "organization" ADD COLUMN "qr_frame_color" text DEFAULT '#111827' NOT NULL;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "qr_foreground_color" text DEFAULT '#111827' NOT NULL;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "qr_background_color" text DEFAULT '#ffffff' NOT NULL;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "qr_label_text" text;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "qr_show_restaurant_name" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "qr_show_table_number" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "qr_style_template" text DEFAULT 'classic' NOT NULL;
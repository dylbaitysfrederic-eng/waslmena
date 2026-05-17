CREATE TABLE IF NOT EXISTS "saas_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"instagram_url" text,
	"whatsapp_url" text,
	"facebook_url" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

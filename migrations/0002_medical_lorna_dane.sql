ALTER TABLE "menu_item" ALTER COLUMN "price_usd_cents" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "menu_item" ADD COLUMN "price_lbp" integer;
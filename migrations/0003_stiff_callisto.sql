ALTER TABLE "order_item" ALTER COLUMN "unit_price_usd_cents" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "order" ALTER COLUMN "total_usd_cents" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "order_item" ADD COLUMN "unit_price_lbp" integer;--> statement-breakpoint
ALTER TABLE "order" ADD COLUMN "total_lbp" integer;
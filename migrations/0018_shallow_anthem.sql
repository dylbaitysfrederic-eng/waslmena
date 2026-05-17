ALTER TABLE "menu_category" ADD COLUMN "name_en" text;--> statement-breakpoint
ALTER TABLE "menu_category" ADD COLUMN "name_ar" text;--> statement-breakpoint
ALTER TABLE "menu_category" ADD COLUMN "name_fr" text;--> statement-breakpoint
ALTER TABLE "menu_item" ADD COLUMN "name_en" text;--> statement-breakpoint
ALTER TABLE "menu_item" ADD COLUMN "name_ar" text;--> statement-breakpoint
ALTER TABLE "menu_item" ADD COLUMN "name_fr" text;--> statement-breakpoint
ALTER TABLE "menu_item" ADD COLUMN "description_en" text;--> statement-breakpoint
ALTER TABLE "menu_item" ADD COLUMN "description_ar" text;--> statement-breakpoint
ALTER TABLE "menu_item" ADD COLUMN "description_fr" text;--> statement-breakpoint
UPDATE "menu_category"
SET "name_en" = "name"
WHERE "name_en" IS NULL;--> statement-breakpoint
UPDATE "menu_item"
SET "name_en" = "name"
WHERE "name_en" IS NULL;--> statement-breakpoint
UPDATE "menu_item"
SET "description_en" = "description"
WHERE "description_en" IS NULL AND "description" IS NOT NULL;

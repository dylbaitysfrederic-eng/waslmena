ALTER TABLE "menu_item"
  ADD COLUMN IF NOT EXISTS "original_price_usd_cents" integer,
  ADD COLUMN IF NOT EXISTS "original_price_lbp" integer,
  ADD COLUMN IF NOT EXISTS "is_popular" boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS "is_new" boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS "is_spicy" boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS "is_featured" boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS "is_promo" boolean DEFAULT false NOT NULL;

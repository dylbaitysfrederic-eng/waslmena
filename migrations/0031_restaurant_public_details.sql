ALTER TABLE "organization"
  ADD COLUMN IF NOT EXISTS "restaurant_opening_hours" text,
  ADD COLUMN IF NOT EXISTS "restaurant_instagram_url" text,
  ADD COLUMN IF NOT EXISTS "restaurant_wifi_name" text,
  ADD COLUMN IF NOT EXISTS "restaurant_wifi_password" text,
  ADD COLUMN IF NOT EXISTS "restaurant_google_maps_url" text;

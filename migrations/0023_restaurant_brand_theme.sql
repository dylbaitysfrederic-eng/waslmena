ALTER TABLE "organization"
  ADD COLUMN "restaurant_accent_color" text,
  ADD COLUMN "restaurant_theme_mode" text DEFAULT 'day' NOT NULL;

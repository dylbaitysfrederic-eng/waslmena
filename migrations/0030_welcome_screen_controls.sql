ALTER TABLE "organization"
  ADD COLUMN IF NOT EXISTS "welcome_button_position" text DEFAULT 'lower_center' NOT NULL,
  ADD COLUMN IF NOT EXISTS "welcome_use_image_accent_for_menu" boolean DEFAULT false NOT NULL;

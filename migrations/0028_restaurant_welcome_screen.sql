ALTER TABLE "organization"
  ADD COLUMN "welcome_screen_enabled" boolean DEFAULT false NOT NULL,
  ADD COLUMN "welcome_image_url" text,
  ADD COLUMN "welcome_image_avif_url" text,
  ADD COLUMN "welcome_button_label" text,
  ADD COLUMN "welcome_button_color" text,
  ADD COLUMN "welcome_generated_accent_color" text;

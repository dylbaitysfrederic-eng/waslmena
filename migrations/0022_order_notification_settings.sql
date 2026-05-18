ALTER TABLE "organization"
  ADD COLUMN "order_visual_notifications_enabled" boolean DEFAULT true NOT NULL,
  ADD COLUMN "order_sound_notifications_enabled" boolean DEFAULT false NOT NULL;

ALTER TABLE "organization"
  ADD COLUMN IF NOT EXISTS "delivery_enabled" boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS "online_payments_enabled" boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS "pos_integration_enabled" boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS "whatsapp_business_enabled" boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS "loyalty_enabled" boolean DEFAULT false NOT NULL;

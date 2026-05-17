ALTER TABLE "organization" ADD COLUMN "access_status" text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
UPDATE "organization"
SET "access_status" = CASE
  WHEN "access_suspended" = true THEN 'suspended'
  WHEN "subscription_status" = 'cancelled' THEN 'revoked'
  ELSE 'active'
END;

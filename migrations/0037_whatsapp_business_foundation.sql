CREATE TABLE IF NOT EXISTS "whatsapp_message" (
  "id" serial PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL,
  "order_id" integer,
  "recipient_phone" text NOT NULL,
  "template_key" text,
  "message_type" text NOT NULL,
  "message_status" text DEFAULT 'pending' NOT NULL,
  "provider" text DEFAULT 'internal' NOT NULL,
  "provider_message_id" text,
  "provider_status" text,
  "idempotency_key" text,
  "retry_count" integer DEFAULT 0 NOT NULL,
  "last_attempt_at" timestamp,
  "delivered_at" timestamp,
  "read_at" timestamp,
  "failed_at" timestamp,
  "failure_reason" text,
  "payload_snapshot" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "whatsapp_webhook_event" (
  "id" serial PRIMARY KEY NOT NULL,
  "organization_id" text,
  "provider" text NOT NULL,
  "event_type" text NOT NULL,
  "provider_event_id" text,
  "payload_snapshot" text NOT NULL,
  "processed" boolean DEFAULT false NOT NULL,
  "processed_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL
);

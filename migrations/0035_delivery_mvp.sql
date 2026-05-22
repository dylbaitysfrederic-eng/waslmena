ALTER TABLE organization
  ADD COLUMN pickup_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN delivery_fee_usd_cents integer,
  ADD COLUMN delivery_fee_local integer,
  ADD COLUMN minimum_order_amount_usd_cents integer,
  ADD COLUMN minimum_order_amount_local integer,
  ADD COLUMN delivery_estimated_time text,
  ADD COLUMN delivery_coverage_notes text;

ALTER TABLE "order"
  ADD COLUMN order_type text,
  ADD COLUMN delivery_address text,
  ADD COLUMN delivery_phone text,
  ADD COLUMN delivery_notes text,
  ADD COLUMN delivery_map_link text,
  ADD COLUMN delivery_fee_usd_cents integer,
  ADD COLUMN delivery_fee_local integer,
  ADD COLUMN delivery_estimated_time text;

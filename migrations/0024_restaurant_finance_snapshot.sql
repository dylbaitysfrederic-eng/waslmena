ALTER TABLE "organization"
  ADD COLUMN "finance_goods_cost_usd_cents" integer,
  ADD COLUMN "finance_goods_cost_local" integer,
  ADD COLUMN "finance_rent_cost_usd_cents" integer,
  ADD COLUMN "finance_rent_cost_local" integer,
  ADD COLUMN "finance_staff_cost_usd_cents" integer,
  ADD COLUMN "finance_staff_cost_local" integer,
  ADD COLUMN "finance_utilities_cost_usd_cents" integer,
  ADD COLUMN "finance_utilities_cost_local" integer,
  ADD COLUMN "finance_other_cost_usd_cents" integer,
  ADD COLUMN "finance_other_cost_local" integer;

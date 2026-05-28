# Admin Client Health

The Admin Client Health page is a read-only beta operations view for Wasl
restaurants. It is available at `/admin/health` for platform admins and uses
only existing organization, menu, table, module, POS configuration, and order
data.

## Status meanings

- **Healthy**: access is active, core setup is present, and the restaurant has
  order activity in the last 7 days.
- **Setup incomplete**: core pilot setup is missing, such as menu items,
  categories, tables, opening hours, or a public WhatsApp number.
- **Inactive**: access is not active or there are no orders in the last 7 days.
- **Needs review**: access is suspended/revoked, or a coming-soon/configuration
  flag needs manual admin review.

## Readiness checks

The page computes lightweight warnings from existing data:

- Missing menu
- Missing categories
- No tables
- No logo
- No opening hours
- No WhatsApp number
- Delivery enabled but missing fee/time
- Payment module enabled but still coming soon
- POS module enabled but not configured

These checks are intentionally simple. They are meant to help beta operators
spot obvious setup gaps before a pilot shift, not to replace manual review.

## Beta usage

Use `/admin/health` before and after pilot service to:

- confirm that the public menu and table QR setup are ready,
- check whether recent orders are reaching the system,
- find restaurants with incomplete onboarding data,
- open the restaurant-specific health detail page,
- jump to existing admin setup pages for identity, menu, modules, QR/tables, and
  exports.

The health pages do not write to the database, create notes, send messages, run
jobs, or change restaurant configuration.

# Wasl-Restaurant-SaaS

Wasl is a restaurant-focused SaaS product for QR menus, public ordering,
restaurant-owned delivery, dashboard operations, analytics foundations, and
controlled beta pilots.

Before making changes, read:

- `CODEX_CONTEXT.md`
- `PROJECT_RULES.md`

## Project Purpose

Wasl helps restaurants launch and manage a modern digital ordering presence
without becoming dependent on a marketplace model. It is built for practical
restaurant service conditions: mobile-first guest flows, stable printed QR
codes, weak-connection tolerance, multilingual presentation, and clear staff
workflows during service.

## Current Status

Wasl is beta-ready for controlled pilots with friendly restaurants and patient
staff.

Beta-ready means:

- Core public menu and ordering flows exist.
- Restaurant dashboard and admin support tools exist.
- Smoke-test and pilot runbooks exist.
- Demo restaurant seeding exists for sales walkthroughs and QA.
- Staff should keep a manual fallback path during service.
- Wider rollout depends on pilot outcomes, support load, and verified
  production behavior.

## Main Features

- Localized public homepage routes.
- Public restaurant menu routes.
- General QR and per-table QR menu access.
- Welcome screen configuration.
- Menu categories, subcategories, item merchandising, availability, badges,
  prices, translations, and images.
- Cart and order submission for table, pickup, and restaurant-owned delivery
  where enabled.
- Duplicate-submit and idempotency protections.
- Dashboard order visibility and kitchen ticket print/preview.
- Restaurant branding, public details, address, hours, contact details, and
  theme controls.
- QR/table management with stable public URLs.
- Menu CSV import/export and bounded export workflows.
- Restaurant statistics and finance snapshot foundations.
- Admin tools for client access, onboarding, health, support, beta operations,
  field testing, demos, exports, usage, settings, menu, billing, identity,
  modules, and POS foundation pages.
- Image upload validation for menu media.
- Beta feedback collection.

## Foundation-Only Modules

The following modules are foundations or roadmap surfaces only unless future
work explicitly implements live integrations:

- Payments: Stripe package and payment foundations may exist, but online
  payment collection is not live unless a provider integration, configuration,
  tests, and production readiness are implemented.
- WhatsApp Business: foundation only; automated WhatsApp messaging is not live.
- POS: foundation only; no live POS sync, inventory sync, order push, menu
  import, or provider integration should be claimed.
- Loyalty: foundation or roadmap only; do not claim live points, rewards,
  wallets, campaigns, or customer identity infrastructure.

## Development Commands

```sh
npm run dev
npm run build
npm run start
npm run lint
npm run check-types
npm run test
npm run test:e2e
npm run check:migrations
npm run verify
```

Useful pilot/admin commands:

```sh
npm run smoke:checklist
npm run seed:demos
npm run db:generate
npm run db:migrate
npm run db:studio
```

## Migration Safety

- Migrations are managed with Drizzle Kit.
- Run `npm run check:migrations` before deployment work.
- Run `npm run verify` when feasible before merging or deploying.
- Do not create migrations for cleanup-only changes.
- Do not edit migration history casually.
- Keep migration and schema decisions scoped to restaurant menus, ordering,
  dashboards, admin operations, analytics foundations, and pilot support.

## Deployment Smoke Test

Use `docs/post-deploy-smoke-test.md` after every deployment and before/after
beta restaurant pilots.

At minimum, verify:

- Homepage routes in EN, FR, and AR.
- Public general menu QR URL.
- Public table QR URL.
- Pickup, table, and delivery order flows where enabled.
- Dashboard orders and kitchen ticket print/preview.
- Exports, setup wizard, support, statistics, modules, and POS foundation page.
- Admin access, health, beta operations, field test, feedback, demo, exports,
  and support pages.
- Data safety: stable QR URLs, scoped exports, no secret leakage, and image
  upload validation.
- Claims accuracy: payments, WhatsApp Business, POS, and loyalty remain
  foundation/roadmap unless live integrations are explicitly built and verified.

## Repository Boundary

Wasl-Restaurant-SaaS must never be confused with Emergency-Law-Database. Do not
use legal-domain assumptions, legal database models, country notices,
constitutional law concepts, emergency powers models, legal AI workflows, or
documentation from that project.

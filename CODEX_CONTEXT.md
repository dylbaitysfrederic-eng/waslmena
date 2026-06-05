# CODEX Context: Wasl-Restaurant-SaaS

## Repository Identity

This repository is **Wasl-Restaurant-SaaS**.

It is a restaurant-focused SaaS product for restaurant owners, managers, and staff. It must always be treated as a hospitality, menu, ordering, QR, dashboard, and restaurant operations product.

## Project Purpose

Wasl helps restaurants launch and manage a modern digital ordering presence:

- Public mobile menus for guests.
- Table QR and general QR menu access.
- Pickup, table, and restaurant-owned delivery order flows.
- Restaurant dashboard tools for menu, orders, settings, exports, and operations.
- Admin tools for beta pilots, client access, restaurant setup, health checks, support, and demos.
- Clear foundations for future commercial modules without claiming that unfinished provider integrations are live.

The goal is to make restaurants more operationally capable without forcing them into a marketplace model.

## Product Philosophy

- Build for real restaurant service conditions: mobile-first, quick to scan, tolerant of weak connections, and clear for staff during service.
- Keep claims accurate. Roadmap and foundation modules must be labeled honestly.
- Prefer practical restaurant workflows over abstract platform complexity.
- Support multilingual restaurant presentation, including English, French, and Arabic/RTL where applicable.
- Keep QR URLs stable because printed QR codes must continue to work.
- Make beta pilots safe, observable, and reversible with manual fallback paths.
- Protect restaurant data boundaries across dashboard, admin, exports, and public pages.

## Current Product Status

Wasl is **beta-ready** for controlled restaurant pilots.

Current readiness means:

- Core public menu and ordering flows exist.
- Restaurant dashboard and admin support tools exist.
- Smoke-test and pilot runbooks exist.
- Demo restaurant seeding exists for sales walkthroughs and QA.
- Payment, WhatsApp Business, POS, and loyalty remain foundation or roadmap modules unless future work explicitly implements live integrations.
- Production claims must not overstate unfinished integrations.

## Implemented Features

- Public localized homepage routes.
- Public restaurant menu routes.
- General QR and per-table QR entry points.
- Welcome screen configuration.
- Menu categories, subcategories, item merchandising, availability, badges, prices, translations, and images.
- Cart and order submission flows for table, pickup, and restaurant-owned delivery where enabled.
- Duplicate-submit and idempotency protections.
- Dashboard order visibility and kitchen ticket print/preview support.
- Restaurant branding, public details, address, hours, contact details, and theme controls.
- QR/table management and stable public URLs.
- Menu CSV import/export and bounded export workflows.
- Restaurant statistics and finance snapshot foundations.
- Admin client access, onboarding, health, support, beta, field-test, demo, exports, usage, settings, menu, billing, identity, modules, and POS pages.
- Image upload validation for menu media.
- Beta feedback collection.
- Smoke-test, pilot, support, anti-spam, migration, menu image, menu CSV, demo seed, field-test, and admin-health documentation.

## Foundation Modules Only

These modules are present as foundations, planned surfaces, or roadmap positioning unless future implementation explicitly changes their status.

### Payments

- Payment foundation exists.
- Do not present online payments as live unless a real provider integration, configuration, tests, and production readiness have been implemented.
- Stripe is available in the technical stack, but provider availability does not automatically mean live payment collection.

### WhatsApp Business

- WhatsApp Business foundation exists.
- Do not claim automated WhatsApp messaging is live.
- Future WhatsApp work must respect opt-in, anti-spam, support, and restaurant communication boundaries.

### POS

- POS foundation exists.
- POS pages and migrations are foundations/planned surfaces.
- Do not claim live POS sync, inventory sync, order push, menu import, or provider integration until implemented and verified.

### Loyalty

- Loyalty is a foundation or roadmap module only.
- Do not add loyalty claims that imply live points, rewards, wallets, campaigns, or customer identity infrastructure unless implemented intentionally.

## Technical Stack

- Next.js 14 App Router.
- React 18.
- TypeScript.
- Tailwind CSS.
- Shadcn/Radix-style component foundations.
- Clerk authentication and organization support.
- Drizzle ORM and Drizzle Kit migrations.
- PostgreSQL production database support, with PGlite/local development support.
- next-intl internationalization.
- Zod and T3 Env validation.
- React Hook Form.
- Stripe package available for payment foundations.
- Vercel Blob for media storage foundations.
- Pino logging and Better Stack-compatible log transport.
- Sentry error monitoring.
- Checkly monitoring as code.
- Vitest and React Testing Library for unit/component tests.
- Playwright for E2E tests.
- Storybook for UI development.
- ESLint, Prettier/format tooling, Commitlint, Husky, lint-staged, and Semantic Release.

## Development Rules

- Keep all future code, migrations, architecture decisions, documentation, and copy scoped to Wasl-Restaurant-SaaS.
- Preserve stable QR URLs and restaurant organization boundaries.
- Do not overpromise foundation modules in UI, docs, seeds, demos, admin pages, or sales copy.
- Treat payment, WhatsApp Business, POS, and loyalty as foundation-only until live integrations are explicitly built and verified.
- Keep public guest flows mobile-first and service-friendly.
- Keep admin flows operational and precise, not marketing-heavy.
- Use existing project patterns before introducing new abstractions.
- Validate data and environment assumptions with typed schemas where possible.
- Run migration checks before deployment work.
- Use `npm run verify` for full local verification when feasible.
- Keep exports scoped to the intended restaurant and never leak secrets.
- Keep beta pilot documentation aligned with actual product behavior.
- Avoid introducing unrelated domains, data models, or terminology.

## Never Confuse This Repository With Emergency-Law-Database

This repository must **never** be confused with **Emergency-Law-Database**.

Wasl-Restaurant-SaaS is a restaurant SaaS product. Emergency-Law-Database is a separate legal-domain concept and must not influence this repository.

Do not reuse, import, adapt, or reference any of the following inside Wasl-Restaurant-SaaS:

- Legal database concepts.
- Emergency powers models.
- Constitutional law structures.
- Legal notices.
- Country profiles.
- Legal AI architecture.
- Legal classification systems.
- Jurisdictional comparison models.
- Emergency-law taxonomies.
- Legal research workflows.
- Statutory, constitutional, or regulatory metadata structures.

No feature, migration, table, route, component, prompt, documentation page, seed data, admin workflow, or architecture decision in this repository should be based on legal-domain assumptions. If a future task appears to mix Wasl with Emergency-Law-Database, stop and keep this repository scoped to restaurants.

## Beta-Ready Status

Wasl-Restaurant-SaaS is beta-ready for controlled pilots with friendly restaurants and patient staff.

Beta-ready means:

- The current product can support guided pilots.
- Staff should have a manual fallback during service.
- Smoke checks should be run after deploys.
- Restaurant setup data must be reviewed before pilot use.
- Foundation modules must be described honestly.
- Feedback should be collected after pilot services.
- Wider rollout should depend on pilot outcomes, support load, and verified production behavior.

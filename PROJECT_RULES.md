# Wasl-Restaurant-SaaS Project Rules

Wasl-Restaurant-SaaS is a restaurant operations SaaS for QR menus, ordering,
restaurant-owned delivery, dashboards, analytics foundations, and beta pilot
operations. Keep every change scoped to this product.

## Product Direction

- Build mobile-first guest flows. Public menu, QR, cart, and order screens must
  work well on small phones before desktop polish.
- Prioritize Lebanon and MENA restaurant conditions: multilingual content,
  Arabic/RTL support where applicable, local currency labels, WhatsApp contact
  expectations, and service workflows common to independent restaurants.
- Keep the product weak-connection friendly. Avoid heavy client assumptions,
  keep feedback states clear, and preserve manual fallback paths during pilots.
- Preserve QR stability. Printed general QR and table QR URLs must continue to
  work after menu, branding, dashboard, or deployment changes.
- Follow a beta-first approach. Optimize for controlled pilots, safe rollback,
  founder/admin visibility, and staff feedback before broad rollout.
- Prefer lightweight infrastructure. Use the existing Next.js, Drizzle,
  PostgreSQL/PGlite, Clerk, and monitoring setup before adding new services.
- Avoid overengineering. Choose practical restaurant workflows and simple data
  paths over abstract platform complexity.

## Foundation Modules

- Payments are foundation-only until a real provider integration,
  configuration, tests, and production readiness are implemented.
- WhatsApp Business is foundation-only until opt-in, anti-spam, provider setup,
  and message-sending behavior are intentionally built and verified.
- POS is foundation-only until a provider-specific sync integration is designed,
  implemented, tested, and made production-ready.
- Loyalty is foundation or roadmap only until customer identity, rewards,
  campaigns, and wallet behavior are intentionally implemented.
- Do not claim live payment collection, automated WhatsApp messaging, live POS
  sync, inventory sync, order push, menu import, loyalty points, or rewards
  unless those systems are explicitly built and verified.

## Engineering Rules

- Read `CODEX_CONTEXT.md` before significant work.
- Keep dashboard and admin flows operational, precise, and honest about module
  maturity.
- Keep public guest flows service-friendly and clear for restaurant staff.
- Use existing project patterns before introducing new abstractions.
- Validate data and environment assumptions with typed schemas where possible.
- Run `npm run check:migrations` before deployment work and `npm run verify`
  when feasible.
- Keep exports scoped to the intended restaurant and never leak secrets.
- Keep beta pilot documentation aligned with actual behavior.

## Repository Boundary

Never confuse this repository with Emergency-Law-Database.

Do not use assumptions, architecture, terminology, database models, migrations,
legal structures, country notices, constitutional law concepts, emergency
powers models, legal AI workflows, or documentation from Emergency-Law-Database.
Wasl is a restaurant SaaS, not a legal-domain system.

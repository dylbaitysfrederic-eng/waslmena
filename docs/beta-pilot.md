# Wasl Beta Pilot Runbook

This runbook is for internal Wasl admin use. It does not create data or change restaurant settings by itself.

## Beta Readiness Checklist

### Product readiness
- Public menu opens on mobile without horizontal overflow.
- Table ordering, general menu, and cart states are understandable.
- Order success and failure states are clear for guests.
- Kitchen ticket page is readable and printable.
- Exports, statistics, modules, and POS foundation pages load cleanly.

### Restaurant setup readiness
- Restaurant name, colors, contact details, hours, and public info are filled.
- Menu categories and items are reviewed in EN/FR/AR where possible.
- Item availability, prices, badges, and local currency labels are accurate.
- Tables and QR codes match the physical restaurant layout.
- Pickup and delivery settings are enabled only when the restaurant can operate them.

### Production safety
- `npm run check:migrations` passes before deployment.
- Public QR links are tested after deployment.
- Image uploads are small and valid JPG, PNG, or WEBP files.
- Demo seed is not run against production unless intentionally needed.
- Payment, POS, and WhatsApp are positioned as foundations until live integrations exist.

### Commercial readiness
- Sales story is specific to the restaurant type and current Wasl scope.
- Roadmap modules are presented without implying live provider integrations.
- Pricing, trial, setup fee, and subscription notes are ready.
- Owner knows how support and feedback will be handled during pilot.
- Before/after pilot success criteria are agreed.

### Pilot feedback readiness
- Staff knows when and how to refresh orders.
- Owner knows what feedback will be collected after service.
- A low-volume first service window is selected.
- One staff device is assigned to dashboard orders.
- A fallback manual ordering path is available during the pilot.

## Pilot Launch Process

1. Choose a friendly restaurant with patient staff and a clear pilot window.
2. Configure branding, public info, menu, prices, and QR settings.
3. Test the general menu QR on at least one mobile device.
4. Test table QR links for multiple tables.
5. Submit one test order from the public menu.
6. Confirm the order appears clearly on dashboard orders.
7. Print or preview the kitchen ticket.
8. Export menu/settings/orders where relevant.
9. Run the first pilot during low-volume hours.
10. Collect owner and staff feedback after service.

## Onboarding Template

- Identity / branding: restaurant display name, colors, logo decision, public address, hours, WhatsApp, Instagram, Wi-Fi.
- Menu categories / items: categories, item names, descriptions, EN/FR/AR fields, prices, availability, badges, and image choices.
- Tables / QR: general QR vs per-table QR, table numbers, QR colors, labels, downloads, and print checks.
- Delivery / pickup: pickup status, delivery coverage notes, fees, minimum order, estimated time, and customer phone/address requirements.
- Staff / team: owner/manager contact, dashboard device owner, kitchen ticket workflow, support contact path.
- Modules roadmap: delivery MVP, payment foundation, POS foundation, WhatsApp foundation.
- Exports / backups: menu export, tables/QR export, settings export, bounded order CSV export.

## Demo / Showcase Guidance

Use `/admin/demo` for demo restaurant guidance.

Demo restaurants are created manually with `npm run seed:demos`. Use staging demos for sales walkthroughs, QR/menu testing, multilingual review, and dashboard QA. The seed is idempotent and uses `demo-wasl-*` organization IDs.

## Deployment Smoke Checklist

- Homepage EN/FR/AR
- Public menu
- Table QR
- Submit order
- Dashboard orders
- Modules
- POS page
- Admin access
- Exports
- Image upload

## Risk Register

- Migrations: migration drift can break deploys. Mitigation: migration integrity check. Manual check: run `npm run check:migrations`.
- Public QR availability: printed QR codes must keep working. Mitigation: stable QR URLs. Manual check: scan live QR codes after deployment.
- Weak connections: customers may submit on unstable mobile networks. Mitigation: pending/order retry messaging. Manual check: test on mobile data.
- Image uploads: oversized or invalid files can hurt UX. Mitigation: MIME/size validation and image fallback. Manual check: test valid and invalid uploads in staging.
- Order duplicates: repeated submits can create confusion. Mitigation: idempotency and reconciliation. Manual check: submit once, refresh, and verify duplicate prevention.
- Claims accuracy: sales copy can overpromise. Mitigation: foundation wording. Manual check: review pitch before pilot.
- Payment/POS/WhatsApp not live yet: integrations are foundations only. Mitigation: clear module positioning. Manual check: tell restaurant staff during onboarding.

## Pilot Feedback Script

- Was the menu easy to open?
- Did orders appear clearly?
- Was ticket printing usable?
- Were delivery/pickup options clear?
- What slowed staff down?
- What confused customers?
- What should be improved before wider rollout?

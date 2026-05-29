# Post-Deploy Smoke Test

Use this checklist after every Vercel deploy and before/after beta restaurant
pilots. It is manual by design: no browser automation, no network calls, no
credentials, and no real orders unless a tester intentionally submits them.

## Placeholders

- Deployment URL: `https://<deployment-url>`
- Restaurant org ID: `<restaurant-org-id>`
- Table ID: `<table-id>`
- General menu URL: `https://<deployment-url>/en/r/<restaurant-org-id>/menu`
- Table QR URL: `https://<deployment-url>/en/r/<restaurant-org-id>/table/<table-id>`

## 1. Deployment

- [ ] Vercel deployment is Ready.
- [ ] GitHub CI `verify` passed.
- [ ] `npm run verify` passed locally if local confirmation is needed.

## 2. Public Pages

- [ ] Homepage `/fr` loads.
- [ ] Homepage `/en` loads.
- [ ] Homepage `/ar` loads and RTL layout is readable.
- [ ] Public menu general QR opens the correct restaurant.
- [ ] Public table QR opens the correct table.
- [ ] Welcome screen appears if enabled.

## 3. Public Order Flow

- [ ] Pickup order can be submitted intentionally.
- [ ] Table order can be submitted intentionally.
- [ ] Delivery order can be submitted intentionally if delivery is enabled.
- [ ] Duplicate tap prevention keeps repeated submit taps from creating confusion.
- [ ] Pending/retry state is readable on weak connection.
- [ ] Local draft recovery works after refresh.

## 4. Dashboard

- [ ] Dashboard home loads.
- [ ] Orders page loads and active orders are readable on mobile.
- [ ] Ticket print page opens and prints/previews clearly.
- [ ] Statistics page loads.
- [ ] Exports page loads and downloads expected files.
- [ ] Modules page marks roadmap items clearly.
- [ ] POS page is foundation/planned, not live integration.
- [ ] Setup Wizard loads.
- [ ] Support page loads.

## 5. Admin

- [ ] Admin access works for allowed admin account.
- [ ] Clients page loads.
- [ ] Health page loads.
- [ ] Beta Operations page loads.
- [ ] Field Test page loads.
- [ ] Demo page loads.
- [ ] Modules page loads.
- [ ] POS page loads.
- [ ] Exports page loads.
- [ ] Support page loads.

## 6. Data Safety

- [ ] QR URL is unchanged after menu/branding edits.
- [ ] Exports are scoped to the intended restaurant.
- [ ] No secrets are exported.
- [ ] Image upload still validates type and size.
- [ ] Menu CSV import/export still works on a staging/test restaurant.

## 7. Claims Accuracy

- [ ] Payments are marked coming soon/foundation.
- [ ] WhatsApp Business is marked coming soon/premium.
- [ ] POS is marked planned/foundation with no live integration.
- [ ] Delivery is described as restaurant-owned delivery.

## Notes

Record:

- Deployment URL
- Tester
- Device/browser
- Restaurant org ID
- Table ID
- Issues found
- Decision: ready for pilot, needs fix, or rollback/manual fallback

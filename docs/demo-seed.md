# Demo Restaurant Seed

`npm run seed:demos` creates five Wasl demo restaurant organizations:

- Café / bakery
- Fast casual burger/snack
- Lebanese restaurant
- Shisha lounge
- Beach club / casual dining

The seed is intended for staging, sales demos, QA, and local environments connected to a disposable PostgreSQL database. It creates organizations, public settings, menu categories, menu items, and tables with clear `demo-wasl-*` organization IDs.

## Safety

The script only resets records for the known demo organization IDs. It does not fetch remote images, call external APIs, create auth users, or touch real restaurant organizations.

Re-running the script is idempotent for demo content: it updates the demo organization rows and recreates their demo categories, items, tables, and demo-owned operational rows.

## Usage

Make sure `DATABASE_URL` points to the intended staging or local database, then run:

```bash
npm run seed:demos
```

Avoid running this against production unless you intentionally want demo restaurants visible there.

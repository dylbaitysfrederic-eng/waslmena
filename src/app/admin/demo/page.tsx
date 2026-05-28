import type { CSSProperties } from 'react';

const demoProfiles = [
  {
    title: 'Cafe / bakery',
    demoId: 'demo-wasl-cafe-bakery',
    useCase: 'Morning sales demos, pickup/delivery testing, bakery menu browsing, and lightweight mobile ordering.',
    demonstrates: [
      'Cafe branding style',
      'Multilingual coffee, bakery, breakfast, sandwich, and drink menus',
      'Popular, new, promo, and featured badges',
      'Pickup and delivery settings',
      'General QR plus table QR setup',
    ],
  },
  {
    title: 'Fast casual burger/snack',
    demoId: 'demo-wasl-burger-snack',
    useCase: 'High-speed counter ordering, delivery/pickup positioning, promo bundles, and snack-heavy menu demos.',
    demonstrates: [
      'Fast food visual style',
      'Multilingual burger, chicken, fries, snack box, and shake menus',
      'Popular, spicy, promo, and featured badges',
      'Delivery and pickup flow',
      'QR/table ordering for dine-in demos',
    ],
  },
  {
    title: 'Lebanese restaurant',
    demoId: 'demo-wasl-lebanese-restaurant',
    useCase: 'Full-service table ordering, family mezza sales demos, kitchen ticket readability, and multilingual menu depth.',
    demonstrates: [
      'Table-service branding style',
      'Cold mezza, hot mezza, grill, oven, dessert, and drink categories',
      'Popular, spicy, new, promo, and featured badges',
      'Delivery/pickup settings for restaurant-owned orders',
      'Per-table QR ordering',
    ],
  },
  {
    title: 'Shisha lounge',
    demoId: 'demo-wasl-shisha-lounge',
    useCase: 'Night-mode public menu demos, lounge table service, premium positioning, and non-delivery ordering.',
    demonstrates: [
      'Shisha lounge visual style',
      'Multilingual shisha, mocktail, platter, bite, and dessert menus',
      'Popular, new, spicy, promo, and featured badges',
      'Table-only service setup',
      'Per-table QR ordering',
    ],
  },
  {
    title: 'Beach club / casual dining',
    demoId: 'demo-wasl-beach-club',
    useCase: 'Seasonal venue demos, poolside ordering, casual dining, and visual brand variety without external assets.',
    demonstrates: [
      'Casual dining branding style',
      'Breakfast, salad, seafood, pool snack, and sunset drink menus',
      'Popular, new, spicy, promo, and featured badges',
      'Pickup/counter flow',
      'General QR plus table QR setup',
    ],
  },
];

const panelStyle: CSSProperties = {
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  background: '#ffffff',
  padding: '20px',
};

const calloutStyle: CSSProperties = {
  border: '1px solid #f59e0b',
  borderRadius: '8px',
  background: '#fffbeb',
  padding: '16px',
};

const codeStyle: CSSProperties = {
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  background: '#f9fafb',
  padding: '2px 6px',
  fontFamily:
    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
  fontSize: '0.875em',
};

const DemoShowcasePage = () => (
  <div className="grid gap-6">
    <section className="rounded-md border bg-background p-5 shadow-sm" style={panelStyle}>
      <p className="text-xs font-semibold uppercase text-muted-foreground">
        Admin documentation
      </p>
      <h2 className="mt-2 text-xl font-semibold">Demo & Showcase</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
        Use this page as the admin reference for Wasl demo restaurants. It does
        not create data, run seed scripts, or modify restaurant records.
      </p>

      <div className="mt-5 rounded-md border border-amber-300 bg-amber-50 p-4" style={calloutStyle}>
        <div className="text-sm font-semibold text-amber-950">Safety note</div>
        <p className="mt-2 text-sm leading-6 text-amber-950">
          Demo restaurants are created only when an admin manually runs
          {' '}
          <code style={codeStyle}>npm run seed:demos</code>
          . The seed is idempotent and uses clear organization IDs like
          {' '}
          <code style={codeStyle}>demo-wasl-*</code>
          . Run it in local or staging by default; do not run it against
          production unless demo restaurants are intentionally needed there.
        </p>
      </div>
    </section>

    <section className="rounded-md border bg-background p-5 shadow-sm" style={panelStyle}>
      <h3 className="text-lg font-semibold">How to use the demos</h3>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-md border p-4">
          <div className="text-sm font-semibold">1. Read the seed docs</div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            See
            {' '}
            <code style={codeStyle}>docs/demo-seed.md</code>
            {' '}
            for usage and safety guidance.
          </p>
        </div>
        <div className="rounded-md border p-4">
          <div className="text-sm font-semibold">2. Run manually</div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Confirm
            {' '}
            <code style={codeStyle}>DATABASE_URL</code>
            {' '}
            points to the intended local or staging database, then run
            {' '}
            <code style={codeStyle}>npm run seed:demos</code>
            .
          </p>
        </div>
        <div className="rounded-md border p-4">
          <div className="text-sm font-semibold">3. Showcase flows</div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Use the demo restaurants for sales walkthroughs, public QR/menu
            testing, ordering flows, multilingual review, and dashboard QA.
          </p>
        </div>
      </div>
    </section>

    <section className="rounded-md border bg-background p-5 shadow-sm" style={panelStyle}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold">Demo restaurant profiles</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            The seed creates five commercial demo profiles with stable,
            offline-friendly content and no remote image dependency.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {demoProfiles.map(profile => (
          <article key={profile.demoId} className="rounded-md border bg-background p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h4 className="text-base font-semibold">{profile.title}</h4>
                <p className="mt-1 text-xs font-medium text-muted-foreground">
                  <code style={codeStyle}>{profile.demoId}</code>
                </p>
              </div>
            </div>

            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {profile.useCase}
            </p>

            <div className="mt-4">
              <div className="text-sm font-semibold">Demonstrates</div>
              <ul className="mt-2 grid gap-2 text-sm leading-6 text-muted-foreground">
                {profile.demonstrates.map(point => (
                  <li key={point} className="rounded-md border bg-muted/30 px-3 py-2">
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>
    </section>
  </div>
);

export default DemoShowcasePage;

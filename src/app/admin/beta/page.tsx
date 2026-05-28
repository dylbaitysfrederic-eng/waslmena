import Link from 'next/link';
import type { CSSProperties } from 'react';

const readinessSections = [
  {
    title: 'Product readiness',
    items: [
      'Public menu opens on mobile without horizontal overflow.',
      'Table ordering, general menu, and cart states are understandable.',
      'Order success and failure states are clear for guests.',
      'Kitchen ticket page is readable and printable.',
      'Exports, statistics, modules, and POS foundation pages load cleanly.',
    ],
  },
  {
    title: 'Restaurant setup readiness',
    items: [
      'Restaurant name, colors, contact details, hours, and public info are filled.',
      'Menu categories and items are reviewed in EN/FR/AR where possible.',
      'Item availability, prices, badges, and local currency labels are accurate.',
      'Tables and QR codes match the physical restaurant layout.',
      'Pickup and delivery settings are enabled only when the restaurant can operate them.',
    ],
  },
  {
    title: 'Production safety',
    items: [
      'Migrations check passes before deployment.',
      'Public QR links are tested after deployment.',
      'Image uploads are small and valid JPG, PNG, or WEBP files.',
      'Demo seed is not run against production unless intentionally needed.',
      'Payment, POS, and WhatsApp are positioned as foundations until live integrations exist.',
    ],
  },
  {
    title: 'Commercial readiness',
    items: [
      'Sales story is specific to the restaurant type and current Wasl scope.',
      'Roadmap modules are presented without implying live provider integrations.',
      'Pricing, trial, setup fee, and subscription notes are ready.',
      'Owner knows how support and feedback will be handled during pilot.',
      'Before/after pilot success criteria are agreed.',
    ],
  },
  {
    title: 'Pilot feedback readiness',
    items: [
      'Staff knows when and how to refresh orders.',
      'Owner knows what feedback will be collected after service.',
      'A low-volume first service window is selected.',
      'One staff device is assigned to dashboard orders.',
      'A fallback manual ordering path is available during the pilot.',
    ],
  },
];

const launchSteps = [
  'Choose a friendly restaurant with patient staff and a clear pilot window.',
  'Configure branding, public info, menu, prices, and QR settings.',
  'Test the general menu QR on at least one mobile device.',
  'Test table QR links for multiple tables.',
  'Submit one test order from the public menu.',
  'Confirm the order appears clearly on dashboard orders.',
  'Print or preview the kitchen ticket.',
  'Export menu/settings/orders where relevant.',
  'Run the first pilot during low-volume hours.',
  'Collect owner and staff feedback after service.',
];

const onboardingSections = [
  {
    title: 'Identity / branding',
    items: ['Restaurant display name', 'Primary and accent colors', 'Logo or no-logo decision', 'Public address, hours, WhatsApp, Instagram, Wi-Fi'],
  },
  {
    title: 'Menu categories / items',
    items: ['Core categories', 'Item names and descriptions', 'EN/FR/AR fields where possible', 'Prices, availability, badges, and image choices'],
  },
  {
    title: 'Tables / QR',
    items: ['General QR vs per-table QR', 'Table numbers', 'QR colors and labels', 'Download and print checks'],
  },
  {
    title: 'Delivery / pickup',
    items: ['Pickup enabled only if staff can handle it', 'Delivery coverage notes', 'Fees, minimum order, and estimated time', 'Customer phone/address requirements'],
  },
  {
    title: 'Staff / team',
    items: ['Owner/manager contact', 'Dashboard device owner', 'Kitchen ticket workflow', 'Support contact path during pilot'],
  },
  {
    title: 'Modules roadmap',
    items: ['Delivery MVP positioning', 'Payment foundation wording', 'POS foundation wording', 'WhatsApp foundation wording'],
  },
  {
    title: 'Exports / backups',
    items: ['Menu export', 'Tables/QR export', 'Settings export', 'Bounded order CSV export'],
  },
];

const smokeTests = [
  'Homepage in EN, FR, and AR',
  'Public general menu',
  'Public table QR menu',
  'Submit order',
  'Dashboard orders',
  'Modules page',
  'POS foundation page',
  'Admin access',
  'Exports',
  'Image upload',
];

const risks = [
  {
    issue: 'Migration drift',
    mitigation: 'Migration integrity check and recovered exception tracking are in place.',
    check: 'Run npm run check:migrations before deploy.',
  },
  {
    issue: 'Public QR availability',
    mitigation: 'Stable public routes and QR URLs are used.',
    check: 'Scan printed and dashboard QR codes after deployment.',
  },
  {
    issue: 'Weak connections',
    mitigation: 'Public cart has pending/order retry messaging and lightweight screens.',
    check: 'Test on mobile data before service.',
  },
  {
    issue: 'Image uploads',
    mitigation: 'Client and server MIME/size checks plus broken image fallback.',
    check: 'Upload one small valid image and try one invalid file in staging.',
  },
  {
    issue: 'Order duplicates',
    mitigation: 'Public order idempotency key and reconciliation flow are in place.',
    check: 'Submit once, refresh, and verify duplicate prevention behavior.',
  },
  {
    issue: 'Claims accuracy',
    mitigation: 'Roadmap/foundation wording is used for unfinished modules.',
    check: 'Review sales copy before each pilot pitch.',
  },
  {
    issue: 'Payment/POS/WhatsApp not live yet',
    mitigation: 'Admin modules and POS pages position these as foundations.',
    check: 'Tell restaurant staff these integrations are not active during pilot.',
  },
];

const feedbackQuestions = [
  'Was the menu easy to open?',
  'Did orders appear clearly?',
  'Was ticket printing usable?',
  'Were delivery/pickup options clear?',
  'What slowed staff down?',
  'What confused customers?',
  'What should be improved before wider rollout?',
];

const panelStyle: CSSProperties = {
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  background: '#ffffff',
  padding: '20px',
};

const cardStyle: CSSProperties = {
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  background: '#ffffff',
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

const BetaOperationsPage = () => (
  <div className="grid gap-6">
    <section className="rounded-md border bg-background p-5 shadow-sm" style={panelStyle}>
      <p className="text-xs font-semibold uppercase text-muted-foreground">
        Internal pilot runbook
      </p>
      <h2 className="mt-2 text-xl font-semibold">Beta Operations</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
        A read-only operations center for preparing, managing, and presenting
        Wasl beta restaurant pilots. This page does not save checklist state,
        create data, or modify restaurant records.
      </p>
    </section>

    <section className="rounded-md border bg-background p-5 shadow-sm" style={panelStyle}>
      <h3 className="text-lg font-semibold">Beta readiness checklist</h3>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {readinessSections.map(section => (
          <article key={section.title} className="rounded-md border p-4" style={cardStyle}>
            <h4 className="text-base font-semibold">{section.title}</h4>
            <ul className="mt-3 grid gap-2 text-sm leading-6 text-muted-foreground">
              {section.items.map(check => (
                <li key={check} className="rounded-md border bg-muted/30 px-3 py-2">
                  {check}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>

    <section className="rounded-md border bg-background p-5 shadow-sm" style={panelStyle}>
      <h3 className="text-lg font-semibold">Pilot launch process</h3>
      <div className="mt-4 grid gap-2">
        {launchSteps.map((step, index) => (
          <div key={step} className="flex gap-3 rounded-md border bg-background p-3">
            <div className="grid size-8 shrink-0 place-items-center rounded-full border bg-muted text-sm font-semibold">
              {index + 1}
            </div>
            <p className="pt-1 text-sm leading-6 text-muted-foreground">{step}</p>
          </div>
        ))}
      </div>
    </section>

    <section className="rounded-md border bg-background p-5 shadow-sm" style={panelStyle}>
      <h3 className="text-lg font-semibold">Restaurant onboarding template</h3>
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {onboardingSections.map(section => (
          <article key={section.title} className="rounded-md border p-4" style={cardStyle}>
            <h4 className="text-base font-semibold">{section.title}</h4>
            <ul className="mt-3 grid gap-2 text-sm leading-6 text-muted-foreground">
              {section.items.map(item => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>

    <section className="rounded-md border bg-background p-5 shadow-sm" style={panelStyle}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold">Demo / showcase guidance</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Demo restaurants are created manually with
            {' '}
            <code style={codeStyle}>npm run seed:demos</code>
            . Use staging demos for sales walkthroughs, QR/menu testing,
            multilingual review, and dashboard QA. The seed is idempotent and
            uses
            {' '}
            <code style={codeStyle}>demo-wasl-*</code>
            {' '}
            organization IDs.
          </p>
        </div>
        <Link
          href="/admin/demo"
          className="inline-flex w-fit rounded-md border bg-muted px-3 py-2 text-sm font-semibold hover:bg-muted/70"
        >
          Open Demo
        </Link>
        <Link
          href="/admin/field-test"
          className="inline-flex w-fit rounded-md border bg-background px-3 py-2 text-sm font-semibold hover:bg-muted"
        >
          Open Field Test
        </Link>
      </div>
    </section>

    <section className="rounded-md border bg-background p-5 shadow-sm" style={panelStyle}>
      <h3 className="text-lg font-semibold">Deployment smoke checklist</h3>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {smokeTests.map(test => (
          <div key={test} className="rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
            {test}
          </div>
        ))}
      </div>
    </section>

    <section className="rounded-md border bg-background p-5 shadow-sm" style={panelStyle}>
      <h3 className="text-lg font-semibold">Risk register</h3>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {risks.map(risk => (
          <article key={risk.issue} className="rounded-md border p-4" style={cardStyle}>
            <h4 className="text-base font-semibold">{risk.issue}</h4>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              <span className="font-semibold text-foreground">Mitigation: </span>
              {risk.mitigation}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              <span className="font-semibold text-foreground">Manual check: </span>
              {risk.check}
            </p>
          </article>
        ))}
      </div>
    </section>

    <section className="rounded-md border bg-background p-5 shadow-sm" style={panelStyle}>
      <h3 className="text-lg font-semibold">Pilot feedback script</h3>
      <div className="mt-4 grid gap-2">
        {feedbackQuestions.map(question => (
          <div key={question} className="rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
            {question}
          </div>
        ))}
      </div>
    </section>
  </div>
);

export default BetaOperationsPage;

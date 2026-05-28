import Link from 'next/link';
import type { CSSProperties } from 'react';

const supportSections = [
  {
    title: 'Pilot setup checklist',
    items: [
      'Confirm restaurant identity, branding, hours, contact links, and currency labels.',
      'Review menu categories, menu items, prices, badges, and availability.',
      'Create tables, download QR codes, and test public general/table menus.',
      'Submit a test order and confirm dashboard orders and ticket print are usable.',
    ],
  },
  {
    title: 'Restaurant access issues',
    items: [
      'Confirm the restaurant organization exists in Clerk and the local organization record.',
      'Check access status, suspension state, and assigned organization membership.',
      'Use admin access controls before assuming a product issue.',
      'Ask the user to sign out/in only after access status looks correct.',
    ],
  },
  {
    title: 'QR/menu troubleshooting',
    items: [
      'Scan the QR with a fresh mobile browser session.',
      'Check that the table still exists and belongs to the expected organization.',
      'Confirm organization access is active and not suspended.',
      'For printed QR issues, verify contrast, size, lighting, and camera focus.',
    ],
  },
  {
    title: 'Migration/deployment checklist',
    items: [
      'Run npm run check:migrations before release.',
      'Run npm run verify before commit/deploy.',
      'Smoke test homepage EN/FR/AR and public menu after deployment.',
      'Check orders, exports, modules, POS foundation, admin pages, and image upload.',
    ],
  },
  {
    title: 'Claims accuracy reminders',
    items: [
      'Payment, POS, WhatsApp Business, and loyalty are roadmap/foundation modules unless explicitly activated.',
      'Do not promise marketplace delivery, automatic POS sync, payment processing, or WhatsApp sending.',
      'Describe exports as bounded operational exports, not full backup/restore infrastructure.',
      'Keep pilot commitments practical and measurable.',
    ],
  },
];

const panelStyle: CSSProperties = {
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  background: '#ffffff',
  padding: '20px',
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

const AdminSupportPage = () => (
  <div className="grid gap-6">
    <section className="rounded-md border bg-background p-5 shadow-sm" style={panelStyle}>
      <p className="text-xs font-semibold uppercase text-muted-foreground">
        Internal support runbook
      </p>
      <h2 className="mt-2 text-xl font-semibold">Admin Help & Support</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
        Static support guidance for Wasl pilots. This page does not create
        tickets, send emails, send WhatsApp messages, or modify restaurant data.
      </p>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Full markdown runbook:
        {' '}
        <code style={codeStyle}>docs/support-runbook.md</code>
      </p>
    </section>

    <section className="grid gap-4 lg:grid-cols-2">
      {supportSections.map(section => (
        <article key={section.title} className="rounded-md border bg-background p-5 shadow-sm" style={panelStyle}>
          <h3 className="text-base font-semibold">{section.title}</h3>
          <ul className="mt-3 grid gap-2 text-sm leading-6 text-muted-foreground">
            {section.items.map(item => (
              <li key={item} className="rounded-md border bg-muted/30 px-3 py-2">
                {item}
              </li>
            ))}
          </ul>
        </article>
      ))}
    </section>

    <section className="rounded-md border bg-background p-5 shadow-sm" style={panelStyle}>
      <h3 className="text-lg font-semibold">Related admin centers</h3>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/admin/beta" className="rounded-md border bg-muted px-3 py-2 text-sm font-semibold hover:bg-muted/70">
          Beta Operations
        </Link>
        <Link href="/admin/demo" className="rounded-md border bg-muted px-3 py-2 text-sm font-semibold hover:bg-muted/70">
          Demo & Showcase
        </Link>
        <Link href="/admin/access" className="rounded-md border bg-muted px-3 py-2 text-sm font-semibold hover:bg-muted/70">
          Access
        </Link>
        <Link href="/admin/templates" className="rounded-md border bg-muted px-3 py-2 text-sm font-semibold hover:bg-muted/70">
          QR & Tables
        </Link>
      </div>
    </section>
  </div>
);

export default AdminSupportPage;

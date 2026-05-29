import Link from 'next/link';
import type { CSSProperties } from 'react';

const fieldTestSections = [
  {
    title: 'Device checks',
    items: [
      'iPhone Safari opens the public menu and checkout without horizontal scrolling.',
      'Android Chrome opens the public menu, cart, and confirmation states.',
      'Tablet works for dashboard orders if available.',
      'Low brightness and outdoor use remain readable.',
      'Weak 4G or restaurant Wi-Fi can still load menu, cart, and dashboard.',
    ],
  },
  {
    title: 'QR checks',
    items: [
      'Printed QR scans from normal table distance.',
      'General menu QR opens the right restaurant.',
      'Table QR opens the correct table number.',
      'QR still works after a menu edit.',
      'QR still works after a branding edit.',
    ],
  },
  {
    title: 'Order flow checks',
    items: [
      'Pickup order submits successfully.',
      'Table order submits successfully.',
      'Delivery order includes address and phone.',
      'Submit remains readable on a weak connection.',
      'Refresh during pending order does not lose the order state.',
      'Duplicate tap prevention stops repeated submits.',
      'Order appears in dashboard orders.',
    ],
  },
  {
    title: 'Restaurant operations checks',
    items: [
      'Orders dashboard is visible on a staff phone and laptop.',
      'Status update buttons are easy to tap.',
      'Ticket print opens and prints clearly.',
      'Kitchen readability works in black and white.',
      'Order export downloads.',
      'Statistics page loads and uses current order data.',
    ],
  },
  {
    title: 'Staff checks',
    items: [
      'Owner login works before the restaurant goes live.',
      'Staff/team page guidance is understood.',
      'Mobile dashboard can be used during service.',
      'Role guidance is clear: owner/manager/staff expectations are manual for pilot.',
    ],
  },
  {
    title: 'Failure checks',
    items: [
      'Oversized image upload shows a friendly error.',
      'Missing table route fails safely.',
      'Unavailable item cannot be ordered.',
      'Suspended restaurant cannot use dashboard access.',
      'Slow network shows pending/retry states clearly.',
    ],
  },
];

const quickLinks = [
  { href: '/admin/health', label: 'Admin Health' },
  { href: '/admin/beta', label: 'Beta Operations' },
  { href: '/admin/support', label: 'Support' },
  { href: '/admin/demo', label: 'Demo' },
  { href: '/admin/exports', label: 'Exports' },
];

const panelStyle: CSSProperties = {
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  background: '#ffffff',
  padding: '20px',
};

const FieldTestPage = () => (
  <div className="grid gap-6">
    <section className="rounded-md border bg-background p-5 shadow-sm" style={panelStyle}>
      <p className="text-xs font-semibold uppercase text-muted-foreground">
        Internal pre-beta runbook
      </p>
      <h2 className="mt-2 text-xl font-semibold">Field Test</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
        Use this read-only checklist before giving a restaurant access. It does
        not save checklist state or change restaurant data.
      </p>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
        Post-deploy smoke guidance lives in
        {' '}
        <code className="rounded-md border bg-muted px-1.5 py-0.5">docs/post-deploy-smoke-test.md</code>
        . You can also print it with
        {' '}
        <code className="rounded-md border bg-muted px-1.5 py-0.5">npm run smoke:checklist</code>
        .
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {quickLinks.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className="inline-flex rounded-md border border-input bg-background px-3 py-2 text-sm font-semibold hover:bg-muted"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </section>

    <section className="grid gap-4 lg:grid-cols-2">
      {fieldTestSections.map(section => (
        <article
          key={section.title}
          className="rounded-md border bg-background p-5 shadow-sm"
          style={panelStyle}
        >
          <h3 className="text-lg font-semibold">{section.title}</h3>
          <ul className="mt-4 grid gap-2 text-sm leading-6 text-muted-foreground">
            {section.items.map(item => (
              <li key={item} className="rounded-md border bg-muted/30 px-3 py-2">
                {item}
              </li>
            ))}
          </ul>
        </article>
      ))}
    </section>
  </div>
);

export default FieldTestPage;

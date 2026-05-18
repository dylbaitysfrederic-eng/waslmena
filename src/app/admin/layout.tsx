import '@/styles/global.css';

import Link from 'next/link';
import type { CSSProperties } from 'react';

import { getCurrentAdminEmail } from './_helpers';

const adminNavigation = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/onboarding', label: 'Onboarding' },
  { href: '/admin/clients', label: 'Clients' },
  { href: '/admin/billing', label: 'Billing' },
  { href: '/admin/access', label: 'Access' },
  { href: '/admin/templates', label: 'Templates' },
  { href: '/admin/menu', label: 'Menu setup' },
  { href: '/admin/usage', label: 'Usage' },
  { href: '/admin/settings', label: 'Settings' },
];

const pageStyle: CSSProperties = {
  minHeight: '100vh',
  background: '#f6f7f9',
  color: '#111827',
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

const headerStyle: CSSProperties = {
  borderBottom: '1px solid #e5e7eb',
  background: 'rgba(255,255,255,0.95)',
  backdropFilter: 'blur(10px)',
};

const containerStyle: CSSProperties = {
  width: '100%',
  maxWidth: '1536px',
  margin: '0 auto',
  padding: '16px',
};

const titleRowStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '16px',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
};

const navStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
  marginTop: '16px',
};

const navLinkStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  minHeight: '36px',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  background: '#ffffff',
  padding: '8px 12px',
  color: '#111827',
  fontSize: '14px',
  fontWeight: 600,
  textDecoration: 'none',
};

const dashboardLinkStyle: CSSProperties = {
  ...navLinkStyle,
  background: '#f3f4f6',
};

const AdminLayout = async (props: { children: React.ReactNode }) => {
  const adminEmail = await getCurrentAdminEmail();

  return (
    <html lang="en">
      <body className="bg-muted text-foreground antialiased">
        <div className="min-h-screen" style={pageStyle}>
          <header className="sticky top-0 z-40 border-b bg-background/95 shadow-sm backdrop-blur-sm" style={headerStyle}>
            <div className="mx-auto max-w-screen-2xl p-3 sm:p-4" style={containerStyle}>
              <div
                className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
                style={titleRowStyle}
              >
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    SaaS owner workspace
                  </p>
                  <h1 className="mt-1 text-2xl font-semibold">
                    Founder Admin
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Signed in as
                    {' '}
                    {adminEmail}
                  </p>
                </div>

                <Link
                  href="/dashboard"
                  className="inline-flex w-fit items-center rounded-md border bg-muted px-3 py-2 text-sm font-medium hover:bg-muted/70"
                  style={dashboardLinkStyle}
                >
                  Restaurant dashboard
                </Link>
              </div>

              <nav className="mt-4 flex gap-2 overflow-x-auto text-sm" style={navStyle}>
                {adminNavigation.map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="whitespace-nowrap rounded-md border bg-background px-3 py-2 font-medium hover:bg-muted"
                    style={navLinkStyle}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </header>

          <main
            className="mx-auto max-w-screen-2xl px-4 py-6"
            style={{ ...containerStyle, paddingTop: '24px', paddingBottom: '24px' }}
          >
            {props.children}
          </main>
        </div>
      </body>
    </html>
  );
};

export default AdminLayout;

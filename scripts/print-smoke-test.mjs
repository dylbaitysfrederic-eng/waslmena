const deploymentUrl = process.env.DEPLOYMENT_URL || '<deployment-url>';
const organizationId = process.env.RESTAURANT_ORG_ID || '<restaurant-org-id>';
const tableId = process.env.TABLE_ID || '<table-id>';

const sections = [
  {
    title: '1. Deployment',
    items: [
      'Vercel deployment is Ready.',
      'GitHub CI verify passed.',
      'npm run verify passed locally if needed.',
    ],
  },
  {
    title: '2. Public pages',
    items: [
      `Homepage FR: ${deploymentUrl}/fr`,
      `Homepage EN: ${deploymentUrl}/en`,
      `Homepage AR: ${deploymentUrl}/ar`,
      `Public menu general QR: ${deploymentUrl}/en/r/${organizationId}/menu`,
      `Public table QR: ${deploymentUrl}/en/r/${organizationId}/table/${tableId}`,
      'Welcome screen appears if enabled.',
    ],
  },
  {
    title: '3. Public order flow',
    items: [
      'Pickup order can be submitted intentionally.',
      'Table order can be submitted intentionally.',
      'Delivery order can be submitted intentionally if enabled.',
      'Duplicate tap prevention is understandable.',
      'Pending/retry state is readable on weak connection.',
      'Local draft recovery works after refresh.',
    ],
  },
  {
    title: '4. Dashboard',
    items: [
      'Dashboard home loads.',
      'Orders page loads and active orders are readable on mobile.',
      'Ticket print opens and prints/previews clearly.',
      'Statistics page loads.',
      'Exports page loads and downloads expected files.',
      'Modules page marks roadmap items clearly.',
      'POS page is foundation/planned, not live integration.',
      'Setup Wizard loads.',
      'Support page loads.',
    ],
  },
  {
    title: '5. Admin',
    items: [
      'Admin access works for allowed admin account.',
      'Clients page loads.',
      'Health page loads.',
      'Beta Operations page loads.',
      'Field Test page loads.',
      'Demo page loads.',
      'Modules page loads.',
      'POS page loads.',
      'Exports page loads.',
      'Support page loads.',
    ],
  },
  {
    title: '6. Data safety',
    items: [
      'QR URL is unchanged after menu/branding edits.',
      'Exports are scoped to the intended restaurant.',
      'No secrets are exported.',
      'Image upload still validates type and size.',
      'Menu CSV import/export works on staging/test restaurant.',
    ],
  },
  {
    title: '7. Claims accuracy',
    items: [
      'Payments are marked coming soon/foundation.',
      'WhatsApp Business is marked coming soon/premium.',
      'POS is marked planned/foundation with no live integration.',
      'Delivery is described as restaurant-owned delivery.',
    ],
  },
];

console.log('Wasl Post-Deploy Smoke Test');
console.log('===========================');
console.log('');
console.log(`Deployment URL: ${deploymentUrl}`);
console.log(`Restaurant org ID: ${organizationId}`);
console.log(`Table ID: ${tableId}`);
console.log('');

for (const section of sections) {
  console.log(section.title);
  for (const item of section.items) {
    console.log(`- [ ] ${item}`);
  }
  console.log('');
}

console.log('Notes');
console.log('- Tester:');
console.log('- Device/browser:');
console.log('- Issues found:');
console.log('- Decision: ready for pilot, needs fix, or rollback/manual fallback');

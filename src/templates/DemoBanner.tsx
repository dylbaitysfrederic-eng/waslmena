import Link from 'next/link';

import { StickyBanner } from '@/features/landing/StickyBanner';

export const DemoBanner = () => (
  <StickyBanner>
    Wasl restaurant pilot -
    {' '}
    <Link href="/sign-up">Open the dashboard</Link>
  </StickyBanner>
);

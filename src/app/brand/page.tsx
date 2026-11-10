import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { BrandPage } from '@/components/brand/brand-page';
import { GridPage } from '@/components/layout/grid-page';
import { TopBar } from '@/components/onboarding/top-bar';
import { LEARN_BRAND } from '@/lib/brand/learn-brand';
import { ROUTES } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Brand',
  description:
    "Intuition's logo, colors, type and atoms, with every picture to download as SVG or PNG.",
  alternates: { canonical: ROUTES.brand },
};

/**
 * Intuition's brand page, rendered from its config, under the site's top
 * bar. The bar is the site's, not the brand page's, so it stays here. The
 * grid's lines are the whole page's, so they start at its top, behind the bar.
 */
export default function BrandRoute(): ReactNode {
  return (
    <GridPage className="flex min-h-dvh flex-col">
      <TopBar />
      <BrandPage config={LEARN_BRAND} filesBase={ROUTES.brandFiles} />
    </GridPage>
  );
}

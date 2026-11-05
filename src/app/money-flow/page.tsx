import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { MoneyFlow } from '@/components/money-flow/money-flow';
import { TopBar } from '@/components/onboarding/top-bar';

export const metadata: Metadata = {
  title: 'Money flow',
  robots: { index: false },
};

/**
 * The next chapter's picture, on a page of its own until it joins the film:
 * nothing links here, and the sitemap leaves it out.
 */
export default function MoneyFlowPage(): ReactNode {
  return (
    <div className="flex min-h-dvh flex-col">
      <TopBar />
      <main className="flex flex-1 items-center justify-center px-4 pb-16 md:px-6">
        <h1 className="sr-only">Where a deposit goes</h1>
        <MoneyFlow />
      </main>
    </div>
  );
}

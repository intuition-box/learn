import type { ReactNode } from 'react';

import { LogoMark } from '@/components/onboarding/logo-mark';
import { OnboardingLink } from '@/components/onboarding/onboarding-link';
import { docs } from '@/lib/docs';
import { ROUTES } from '@/lib/site';

/*
 * The whole shell: sidebar, search trigger, skip link and the grid.
 * It renders inside your application's root layout, which owns
 * `<html>` and `<body>`, and which imports the stylesheet.
 */
export default function DocsLayout({
  children,
}: {
  children: ReactNode;
}): ReactNode {
  return (
    <>
      <OnboardingLink />
      <docs.Layout
        /*
         * The mark and the name, as the top bar sets them, at the top of the
         * sidebar. The package links them to the site's root, where the
         * film opens (`OnboardingLink`).
         */
        brand={
          <span className="inline-flex items-center gap-2 font-medium text-graphite-900">
            <LogoMark className="h-5 text-graphite-900" />
            Learn
          </span>
        }
        brandHref={ROUTES.play}
      >
        {children}
      </docs.Layout>
    </>
  );
}

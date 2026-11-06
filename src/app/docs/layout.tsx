import type { ReactNode } from 'react';

import { OnboardingLink } from '@/components/onboarding/onboarding-link';
import { docs } from '@/lib/docs';

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
      <docs.Layout>{children}</docs.Layout>
    </>
  );
}

import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { Providers } from '@/components/onboarding/providers';
import { TimeFieldCanvas } from '@/components/onboarding/time-field-canvas';
import { SITE_URL } from '@/lib/site';

// The documentation stylesheet is loaded for every page, not only `/docs`:
// globals.css takes the site's colours and typefaces from its tokens. It
// comes first so the rules in globals.css follow it.
import '@waveso/docs/styles.css';
import './globals.css';

export const metadata: Metadata = {
  // What relative URLs in metadata, such as a page's canonical, resolve to.
  metadataBase: new URL(SITE_URL),
  title: { default: 'Intuition', template: '%s · Intuition' },
  description:
    'Build a knowledge graph on your machine. Publish it, and others build on it with you. As they do, your share of it gains value.',
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}): ReactNode {
  return (
    // No `data-theme` on <html>: the documentation stylesheet is light unless
    // the page asks for dark, and this site does not.
    <html lang="en">
      <head>
        {/*
         * Sends a returning visitor past the welcome page to where they chose
         * last time (see `landing.ts`). Blocking on purpose: it has to run
         * before the welcome page paints, or it flashes by on the way.
         */}
        {/* oxlint-disable-next-line nextjs/no-sync-scripts -- it must run before the first paint. */}
        <script src="/landing.js" />
      </head>
      <body className="min-h-dvh bg-bg font-sans text-fg antialiased">
        <Providers>
          {/*
           * The field is here, above the pages, so one field carries across
           * every change of route.
           */}
          <TimeFieldCanvas />
          {children}
        </Providers>
      </body>
    </html>
  );
}

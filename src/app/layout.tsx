import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { SITE_URL } from '@/lib/site';

// The documentation stylesheet is loaded for every page, not only `/docs`:
// globals.css takes the site's colors and typefaces from its tokens. It
// comes first so the rules in globals.css follow it.
import '@waveso/docs/styles.css';
import './globals.css';

export const metadata: Metadata = {
  // What relative URLs in metadata, such as a page's canonical, resolve to.
  metadataBase: new URL(SITE_URL),
  title: { default: 'Intuition', template: '%s · Intuition' },
  description: 'Your data, made multiplayer.',
  // The mark two by two, from `mark.svg/route.ts`.
  icons: { icon: { url: '/mark.svg', type: 'image/svg+xml' } },
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}): ReactNode {
  return (
    // No `data-theme` on <html>: the documentation stylesheet is light unless
    // the page asks for dark, and this site does not. The script in the head
    // may add `data-entrance` before React arrives, which is expected.
    <html lang="en" suppressHydrationWarning>
      <head>
        {/*
         * Sends a returning visitor past the film to where they chose last
         * time, and marks the film's entrance to play (see `landing.ts`).
         * Blocking on purpose: it has to run before the page paints, or the
         * film flashes by on the way.
         */}
        {/* oxlint-disable-next-line nextjs/no-sync-scripts -- it must run before the first paint. */}
        <script src="/landing.js" />
      </head>
      <body className="min-h-dvh bg-bg font-sans text-fg antialiased">
        {children}
      </body>
    </html>
  );
}

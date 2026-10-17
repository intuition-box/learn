'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

import { rememberLanding } from './landing';
import { ROUTES } from './stations';

/*
 * Each link has a patch of the page's colour behind it, a little see-through
 * and blurred, because the field's atoms pass under the bar. The negative
 * margin keeps the words on the bar's edge, where they were before the patch.
 */
const LINK_CLASS =
  '-mx-2 rounded-md bg-bg/80 px-2 py-1 outline-accent backdrop-blur-sm focus-visible:outline-2';

/**
 * The bar at the top of the video and playground pages. It stays in place
 * during a trip, and its links are plain: skipping to the documentation is
 * not a trip. Skipping is remembered: the site opens on the docs next time.
 */
export function TopBar(): ReactNode {
  return (
    <header className="flex items-center justify-between px-6 py-5">
      <Link href={ROUTES.watch} className={`font-medium ${LINK_CLASS}`}>
        Intuition
      </Link>
      <nav aria-label="Main">
        <Link
          href={ROUTES.docs}
          className={`text-sm text-fg-muted hover:text-fg ${LINK_CLASS}`}
          onClick={() => {
            rememberLanding('docs');
          }}
        >
          Skip to docs
        </Link>
      </nav>
    </header>
  );
}

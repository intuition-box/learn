'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

import { ROUTES } from '@/lib/site';

import { rememberLanding } from './landing';
import { LogoMark } from './logo-mark';

/*
 * Each link has a patch of the page's color behind it, a little see-through
 * and blurred, because the stars pass under the bar. The negative
 * margin keeps the words on the bar's edge, where they were before the patch.
 */
const LINK_CLASS =
  '-mx-2 rounded-md bg-graphite-0/80 px-2 py-1 outline-graphite-900 backdrop-blur-sm focus-visible:outline-2';

/**
 * The bar at the top of the film's page. While the entrance's stars come
 * in, it waits above; once they have formed the logo, it fades in and
 * slides down. Skipping to the documentation is remembered: the site opens
 * on the docs next time.
 */
export function TopBar(): ReactNode {
  return (
    <header className="flex items-center justify-between px-6 py-5 in-data-[entrance=welcome]:invisible in-data-[entrance=welcome]:-translate-y-4 in-data-[entrance=welcome]:opacity-0 motion-safe:transition-[opacity,translate,visibility] motion-safe:duration-700 motion-safe:ease-out">
      <Link
        href={ROUTES.play}
        className={`flex items-center gap-2 font-medium ${LINK_CLASS}`}
      >
        <LogoMark className="h-5 text-graphite-900" />
        Intuition
      </Link>
      <nav aria-label="Main">
        <Link
          href={ROUTES.docs}
          className={`text-sm text-graphite-500 hover:text-graphite-900 ${LINK_CLASS}`}
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

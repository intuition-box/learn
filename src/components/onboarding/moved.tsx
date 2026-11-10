'use client';

import { useEffect, type ReactNode } from 'react';

export interface MovedProps {
  /** Where the page is now. */
  to: string;
}

/**
 * An old address, sending its visitor on to where its page is now, with
 * the query and the fragment they came with, so a link to a step of the
 * film still opens on it. Without scripts, a plain link does it.
 */
export function Moved({ to }: MovedProps): ReactNode {
  useEffect(() => {
    window.location.replace(
      `${to}${window.location.search}${window.location.hash}`,
    );
  }, [to]);

  return (
    <main className="flex min-h-dvh items-center justify-center px-6 text-graphite-500">
      <a href={to} className="underline underline-offset-[0.2em]">
        This page has moved.
      </a>
    </main>
  );
}

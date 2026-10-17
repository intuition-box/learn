'use client';

import Link from 'next/link';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import { type Landing, rememberLanding } from './landing';
import { useTravel } from './use-travel';

/** A link's own attributes, `data-variant` say, pass through to it. */
export interface TravelLinkProps extends Omit<
  ComponentPropsWithoutRef<typeof Link>,
  'href' | 'onClick'
> {
  href: string;
  /** Where the site opens next time, once this link is followed. */
  landing?: Landing;
  children: ReactNode;
}

/**
 * A link to another page of the onboarding that gets there as a trip.
 *
 * It is a real link: it has an href, the route is prefetched, and a click
 * with a modifier key or the middle button opens it the browser's way. Only
 * a plain click travels.
 */
export function TravelLink({
  href,
  landing,
  children,
  ...link
}: TravelLinkProps): ReactNode {
  const travel = useTravel();

  return (
    <Link
      {...link}
      href={href}
      onClick={(event) => {
        if (landing !== undefined) {
          rememberLanding(landing);
        }
        const isPlainClick =
          event.button === 0 &&
          !event.metaKey &&
          !event.ctrlKey &&
          !event.shiftKey &&
          !event.altKey;
        if (isPlainClick) {
          event.preventDefault();
          travel(href);
        }
      }}
    >
      {children}
    </Link>
  );
}

'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import { JourneyContext } from './journey-context';

export interface StageProps {
  className?: string;
  children: ReactNode;
}

/**
 * What a page of the onboarding puts on screen. It comes in from a distance
 * when the page appears and flies past the viewer when a trip leaves it.
 *
 * Both animations are in globals.css and run only when motion is allowed.
 */
export function Stage({ className = '', children }: StageProps): ReactNode {
  const pathname = usePathname();
  // Leaving from the moment a trip starts until this page is replaced: the
  // route changes partway through, and this page must stay gone until then.
  const isLeaving = JourneyContext.useSelector(
    (state) =>
      state.matches('leaving') ||
      (state.matches('arriving') && state.context.destination !== pathname),
  );

  return (
    <div
      // Nothing on a page that is flying past can be clicked or focused.
      inert={isLeaving}
      className={`${isLeaving ? 'motion-safe:animate-stage-leave' : 'motion-safe:animate-stage-arrive'} ${className}`}
    >
      {children}
    </div>
  );
}

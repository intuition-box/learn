'use client';

import { useEffect } from 'react';

import { forgetLanding } from '@/components/onboarding/landing';
import { ROUTES } from '@/lib/site';

/**
 * "Try the onboarding", in the docs, plays the universe again: a link to the
 * front page forgets where the visitor went on, then loads it in full, so
 * the gate script runs and marks the entrance, as on a first visit.
 *
 * It listens in the capture phase, before the link's own client-side
 * navigation, which would skip the gate. A click that opens a new tab or
 * window only forgets, and the new page loads in full anyway.
 */
export function OnboardingLink(): null {
  useEffect(() => {
    function handleClick(event: MouseEvent): void {
      const link =
        event.target instanceof Element
          ? event.target.closest('a[href]')
          : null;
      if (!(link instanceof HTMLAnchorElement)) {
        return;
      }

      const url = new URL(link.href);
      if (
        url.origin !== window.location.origin ||
        url.pathname !== ROUTES.play
      ) {
        return;
      }

      forgetLanding();
      const isNewTab =
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        link.target === '_blank';
      if (isNewTab) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      window.location.assign(url.href);
    }

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, []);

  return null;
}

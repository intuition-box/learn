'use client';

import { useEffect } from 'react';

import { rememberLanding } from '@/components/onboarding/landing';
import { ROUTES } from '@/lib/site';

/**
 * A link to the front page from the docs opens the film, whatever the
 * visitor chose before: "Onboarding" on the docs' homepage, and the logo
 * atop the sidebar. It remembers the film as where the site opens, then
 * loads the page in full, so the gate script runs, finds the film
 * remembered, and plays neither the universe nor a redirect to the docs.
 *
 * It listens in the capture phase, before the link's own client-side
 * navigation, which would skip the gate. A click that opens a new tab or
 * window only remembers, and the new page loads in full anyway.
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

      rememberLanding('film');
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

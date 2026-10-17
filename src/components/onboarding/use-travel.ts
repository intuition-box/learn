import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

import { JourneyContext } from './journey-context';

/**
 * Returns the function that takes the user to another page of the
 * onboarding as a trip: the page flies past, the field flies, the next page
 * comes in. With `prefers-reduced-motion` there is no trip: the route just
 * changes.
 */
export function useTravel(): (href: string) => void {
  const router = useRouter();
  const journey = JourneyContext.useActorRef();

  return useCallback(
    (href: string) => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        router.push(href);
      } else {
        journey.send({ type: 'travel.started', href });
      }
    },
    [router, journey],
  );
}

'use client';

import { useRouter } from 'next/navigation';
import { type ReactNode, useMemo } from 'react';

import { JourneyContext } from './journey-context';
import { journeyMachine } from './journey-machine';

export interface ProvidersProps {
  children: ReactNode;
}

/**
 * The state every page of the onboarding shares: the journey between pages.
 * Rendered once, in the root layout, so it survives a change of route.
 */
export function Providers({ children }: ProvidersProps): ReactNode {
  const router = useRouter();
  // The machine with its `navigate` action wired to the router.
  const journey = useMemo(
    () =>
      journeyMachine.provide({
        actions: {
          navigate: (_, { href }) => {
            router.push(href);
          },
        },
      }),
    [router],
  );

  return (
    <JourneyContext.Provider logic={journey}>
      {children}
    </JourneyContext.Provider>
  );
}

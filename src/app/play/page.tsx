import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { Stage } from '@/components/onboarding/stage';
import { TopBar } from '@/components/onboarding/top-bar';
import { Playground } from '@/components/playground/playground';

export const metadata: Metadata = {
  title: 'Playground',
};

/**
 * The second page of the onboarding: the playground, one card that tells
 * the story of Intuition as a short film in chapters. The card is centred
 * on the page, as wide as the welcome video and, from tablet width up, its
 * shape too.
 */
export default function PlayPage(): ReactNode {
  return (
    <div className="flex min-h-dvh flex-col">
      <TopBar />
      <main className="flex flex-1 items-center justify-center px-6 pb-16">
        <Stage className="w-full max-w-4xl">
          <h1 className="sr-only">Playground</h1>
          <Playground />
        </Stage>
      </main>
    </div>
  );
}

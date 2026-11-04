import type { ReactNode } from 'react';

import { Entrance } from '@/components/onboarding/entrance';
import { TopBar } from '@/components/onboarding/top-bar';
import { Playground } from '@/components/playground/playground';

/**
 * The front page: the film that tells the story of Intuition in chapters,
 * in one card that takes the first view, behind its entrance: stars that
 * form the mark round "Play", then part for the card.
 */
export default function FilmPage(): ReactNode {
  return (
    <div className="flex min-h-dvh flex-col">
      <TopBar />
      <main className="flex flex-1 items-center justify-center px-6 pb-16">
        <h1 className="sr-only">Intuition, in a short film</h1>
        <Entrance className="w-full max-w-7xl">
          <Playground />
        </Entrance>
      </main>
    </div>
  );
}

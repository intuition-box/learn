import type { ReactNode } from 'react';

import { PageHeading } from '@/components/onboarding/page-heading';
import { Stage } from '@/components/onboarding/stage';
import { ROUTES } from '@/components/onboarding/stations';
import { TopBar } from '@/components/onboarding/top-bar';
import { TravelLink } from '@/components/onboarding/travel-link';

/**
 * The first page of the onboarding: the welcome video and one way forward,
 * to the playground.
 */
export default function WatchPage(): ReactNode {
  return (
    <div className="flex min-h-dvh flex-col">
      <TopBar />
      <main className="flex flex-1 items-center justify-center px-6 pb-16">
        <Stage className="flex w-full max-w-4xl flex-col items-center gap-10 text-center">
          <PageHeading
            title="Your data, made multiplayer."
            description="Build a knowledge graph on your machine. Publish it, and others build on it with you. As they do, your share of it gains value."
          />
          {/*
           * Where the welcome video goes. The video is not made yet, so this
           * is an empty frame of its shape: replace it with the <video>.
           */}
          <div className="grid aspect-video w-full place-items-center rounded-2xl border border-border bg-bg text-sm text-fg-muted shadow-2xl shadow-fg/10">
            Welcome video
          </div>
          {/* The documentation's own primary button, as on its home page. */}
          <TravelLink
            href={ROUTES.play}
            landing="play"
            className="wave-docs-hero__action"
            data-variant="primary"
          >
            Try it
          </TravelLink>
        </Stage>
      </main>
    </div>
  );
}

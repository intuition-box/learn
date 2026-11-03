import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { Moved } from '@/components/onboarding/moved';
import { ROUTES } from '@/components/onboarding/stations';

export const metadata: Metadata = {
  title: 'Moved',
  alternates: { canonical: ROUTES.play },
  robots: { index: false },
};

/** Where the film was before it became the front page: on to it, at the step asked for. */
export default function PlayPage(): ReactNode {
  return <Moved to={ROUTES.play} />;
}

import { createActorContext } from '@xstate/react';

import { journeyMachine } from './journey-machine';

/**
 * The one journey actor, shared by every page: the links that start a trip,
 * the pages that animate out and in, and the field that flies. Provided in
 * `providers.tsx`.
 */
export const JourneyContext = createActorContext(journeyMachine);

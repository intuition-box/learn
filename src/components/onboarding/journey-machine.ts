/**
 * One trip from a page of the onboarding to the next.
 *
 * A trip has three moments. `leaving`: the page on screen flies past and the
 * field behind starts its flight. Then the route changes, and for a moment
 * only the field is on screen. `arriving`: the new page comes in. `resting`
 * is every other time.
 *
 * `destination` is set for the whole trip. The field reads it to start
 * flying the moment a trip starts, before the route has changed.
 */

import { assign, setup } from 'xstate';

/**
 * How long after a trip starts the route changes. The page's `stage-leave`
 * animation (500ms, in globals.css) has ended by then.
 */
export const NAVIGATE_AFTER_MS = 700;
/**
 * How long the new page takes to come in: the duration of `stage-arrive` in
 * globals.css. The two together are the field's flight, `FLIGHT_MS`.
 */
export const ARRIVE_MS = 700;

interface JourneyContext {
  /** The path being travelled to, or `null` when resting. */
  destination: string | null;
}

type JourneyEvent = {
  type: 'travel.started';
  href: string;
};

export const journeyMachine = setup({
  types: {
    context: {} as JourneyContext,
    events: {} as JourneyEvent,
  },
  actions: {
    // Changes the route. The provider supplies it, since it needs the
    // router. Left as it is here, a trip would end nowhere, so it says so.
    navigate: (_, params: { href: string }) => {
      throw new Error(`No navigate action was provided for ${params.href}`);
    },
  },
  delays: { NAVIGATE_AFTER_MS, ARRIVE_MS },
}).createMachine({
  id: 'journey',
  context: { destination: null },
  initial: 'resting',
  states: {
    resting: {
      entry: assign({ destination: null }),
      on: {
        'travel.started': {
          target: 'leaving',
          actions: assign({
            destination: ({ event }) => event.href,
          }),
        },
      },
    },
    // A second `travel.started` during a trip is ignored: one trip at a time.
    leaving: {
      after: { NAVIGATE_AFTER_MS: { target: 'arriving' } },
    },
    arriving: {
      entry: {
        type: 'navigate',
        // Never empty here: every way into this state sets a destination.
        params: ({ context }) => ({ href: context.destination ?? '/' }),
      },
      after: { ARRIVE_MS: { target: 'resting' } },
    },
  },
});

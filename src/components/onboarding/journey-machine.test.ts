import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createActor } from 'xstate';

import {
  ARRIVE_MS,
  journeyMachine,
  NAVIGATE_AFTER_MS,
} from './journey-machine';

/** A journey whose `navigate` action records where it was told to go. */
function startJourney() {
  const navigate = vi.fn<(href: string) => void>();
  const actor = createActor(
    journeyMachine.provide({
      actions: {
        navigate: (_, { href }) => {
          navigate(href);
        },
      },
    }),
  ).start();

  return { actor, navigate };
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('journeyMachine', () => {
  it('rests with no destination', () => {
    const { actor } = startJourney();

    expect(actor.getSnapshot().value).toBe('resting');
    expect(actor.getSnapshot().context.destination).toBeNull();
  });

  it('names the destination the moment a trip starts, before the route changes', () => {
    const { actor, navigate } = startJourney();
    actor.send({ type: 'travel.started', href: '/play' });

    expect(actor.getSnapshot().value).toBe('leaving');
    expect(actor.getSnapshot().context.destination).toBe('/play');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('changes the route once the page has had time to leave', () => {
    const { actor, navigate } = startJourney();
    actor.send({ type: 'travel.started', href: '/play' });

    vi.advanceTimersByTime(NAVIGATE_AFTER_MS - 1);
    expect(navigate).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(navigate).toHaveBeenCalledExactlyOnceWith('/play');
    expect(actor.getSnapshot().value).toBe('arriving');
    expect(actor.getSnapshot().context.destination).toBe('/play');
  });

  it('rests again, with no destination, once the new page has arrived', () => {
    const { actor } = startJourney();
    actor.send({ type: 'travel.started', href: '/play' });

    vi.advanceTimersByTime(NAVIGATE_AFTER_MS + ARRIVE_MS);

    expect(actor.getSnapshot().value).toBe('resting');
    expect(actor.getSnapshot().context.destination).toBeNull();
  });

  it('ignores a second trip while one is under way', () => {
    const { actor, navigate } = startJourney();
    actor.send({ type: 'travel.started', href: '/play' });
    actor.send({ type: 'travel.started', href: '/docs' });
    vi.advanceTimersByTime(NAVIGATE_AFTER_MS);
    actor.send({ type: 'travel.started', href: '/docs' });
    vi.advanceTimersByTime(ARRIVE_MS);

    expect(navigate).toHaveBeenCalledExactlyOnceWith('/play');
  });

  it('can travel again after a trip ends', () => {
    const { actor, navigate } = startJourney();
    actor.send({ type: 'travel.started', href: '/play' });
    vi.advanceTimersByTime(NAVIGATE_AFTER_MS + ARRIVE_MS);
    actor.send({ type: 'travel.started', href: '/docs' });
    vi.advanceTimersByTime(NAVIGATE_AFTER_MS);

    expect(navigate).toHaveBeenLastCalledWith('/docs');
  });
});

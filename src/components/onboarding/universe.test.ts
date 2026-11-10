import { describe, expect, it } from 'vitest';

import { ROLES } from '@/components/playground/story-shapes';
import { INTUITION_LOGO } from '@/lib/intuition-logo';

import {
  createStars,
  PARTED_LOOK,
  SETTLE_SECONDS,
  STAR_STRIDE,
  createTimeline,
  createWake,
  type Pointer,
  type TimelineInput,
  updateWake,
} from './universe';

/** A landscape screen with the mark in its middle and the film across most of it. */
const INPUT: TimelineInput = {
  still: false,
  rotation: { x: 0, y: 0 },
  width: 1440,
  height: 900,
  mark: { x: 720, y: 450, size: 540 },
  column: { left: 80, right: 1360 },
};

/** Plays `timeline` for `seconds` at 60 frames a second, and returns the last frame. */
function play(
  timeline: ReturnType<typeof createTimeline>,
  seconds: number,
  input: TimelineInput = INPUT,
) {
  let frame = timeline.update(0, input);
  for (let t = 0; t < seconds; t += 1 / 60) {
    frame = timeline.update(1 / 60, input);
  }
  return frame;
}

describe('createStars', () => {
  const stars = createStars();
  const count = stars.length / STAR_STRIDE;
  const field = (index: number) =>
    Array.from(
      { length: count },
      (_, star) => stars[star * STAR_STRIDE + index] ?? NaN,
    );

  it('draws the same stars on every visit', () => {
    expect(createStars()).toEqual(stars);
  });

  it('gives every star a role, every role some stars, and only finite values', () => {
    const roles = new Set(field(9));
    expect([...roles].sort((a, b) => a - b)).toEqual(
      ROLES.map((_, index) => index),
    );
    expect(stars.every(Number.isFinite)).toBe(true);
  });

  it('keeps some stars out in the sky, and spreads the rest over every band of the Intuition logo', () => {
    const bands = field(10);
    const sky = bands.filter((band) => band === -1).length;
    expect(sky).toBeGreaterThan(0);
    expect(sky).toBeLessThan(count / 2);
    expect(new Set(bands.filter((band) => band >= 0)).size).toBe(
      INTUITION_LOGO.bands.length,
    );
  });

  it('has twice as many big stars once parted, small ones grown to a big one’s size', () => {
    const sizes = field(8);
    const parted = field(PARTED_LOOK);
    // A big star's size is at least 1.8; a small one's at most 1.76.
    const isBig = (size: number) => size >= 1.8;
    const big = sizes.filter(isBig);
    const grown = parted.filter(
      (size, star) => isBig(size) && !isBig(sizes[star] ?? NaN),
    );
    expect(big.length).toBeGreaterThan(0);
    expect(parted.filter(isBig)).toHaveLength(2 * big.length);
    expect(grown).toHaveLength(big.length);
    expect(grown.every((size) => big.includes(size))).toBe(true);
    expect(
      parted.every(
        (size, star) =>
          isBig(sizes[star] ?? NaN) === false || size === sizes[star],
      ),
    ).toBe(true);
    expect(
      parted.every((size, star) => isBig(size) || size === sizes[star]),
    ).toBe(true);
  });
});

describe('createTimeline', () => {
  it('brings the stars in from the sky, then holds them on the mark', () => {
    const timeline = createTimeline(false);
    expect(timeline.update(0, INPUT).intro).toBe(0);
    const formed = play(timeline, 6);
    expect(formed.intro).toBe(1);
    expect(formed.scatter).toBe(0);
  });

  it('parts the stars to the film’s sides, smaller', () => {
    const timeline = createTimeline(false);
    play(timeline, 6);
    timeline.part();
    const parting = play(timeline, 0.6);
    expect(parting.scatter).toBeGreaterThan(0);
    expect(parting.scatter).toBeLessThan(1);
    const parted = play(timeline, 4);
    expect(parted.scatter).toBe(1);
    expect(parted.scatterMove).toBe(1);
    expect(parted.shrink).toBeLessThan(1);
  });

  it('opens parted, with no intro, when the film is already on screen', () => {
    const frame = createTimeline(true).update(0, INPUT);
    expect(frame.intro).toBe(1);
    expect(frame.scatter).toBe(1);
  });

  it('holds still for reduced motion, and parts at once', () => {
    const still = { ...INPUT, still: true };
    const timeline = createTimeline(false);
    const formed = timeline.update(0.5, still);
    expect(formed.intro).toBe(1);
    expect(formed.time).toBe(0);
    timeline.part();
    expect(timeline.update(0.5, still).scatter).toBe(1);
  });

  it('places the mark and the film in world units, centred on the screen', () => {
    const frame = createTimeline(false).update(0, INPUT);
    expect(frame.markCenter[0]).toBeCloseTo(0);
    expect(frame.markCenter[1]).toBeCloseTo(0);
    expect(frame.markSize).toBeCloseTo((540 / 900) * frame.view[1]);
    expect(frame.column[0]).toBeCloseTo(-frame.column[1]);
  });

  it('follows a drag', () => {
    const turned = play(createTimeline(false), 6, {
      ...INPUT,
      rotation: { x: 0.2, y: -0.5 },
    });
    expect(turned.turn[0]).toBeCloseTo(0.2, 3);
    expect(turned.turn[1]).toBeCloseTo(-0.5, 3);
  });
});

describe('updateWake', () => {
  const hovering = (x: number, y: number): Pointer => ({
    isOver: true,
    isDragging: false,
    x,
    y,
  });

  it('pushes along the pointer’s path once it has one', () => {
    const wake = createWake();
    updateWake(wake, hovering(0, 0), true, 1 / 60);
    expect(wake.impulse).toEqual([0, 0]);
    updateWake(wake, hovering(0.1, 0), true, 1 / 60);
    expect(wake.impulse[0]).toBeCloseTo(0.1);
    expect(wake.remaining).toBeCloseTo(SETTLE_SECONDS - 1 / 60);
  });

  it('does not push while dragging', () => {
    const wake = createWake();
    updateWake(wake, hovering(0, 0), true, 1 / 60);
    updateWake(wake, { ...hovering(0.3, 0), isDragging: true }, true, 1 / 60);
    expect(wake.impulse).toEqual([0, 0]);
  });

  it('drops every push at once when turned off', () => {
    const wake = createWake();
    updateWake(wake, hovering(0, 0), true, 1 / 60);
    updateWake(wake, hovering(0.2, 0), true, 1 / 60);
    const { epoch } = wake;
    updateWake(wake, hovering(0.4, 0), false, 1 / 60);
    expect(wake.epoch).toBe(epoch + 1);
    expect(wake.remaining).toBe(0);
  });
});

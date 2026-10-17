import { describe, expect, it } from 'vitest';

import { type Dot, dotsAlong } from './story-dots';

const LENGTH = 400;

/** A dot's own look, which it keeps as it flows: how to find it again. */
const looks = (dot: Dot): string => `${dot.offset} ${dot.radius}`;

describe('dotsAlong', () => {
  it('gives the same dots for the same line at the same moment', () => {
    expect(dotsAlong('a', LENGTH, 60, 5000, 1)).toEqual(
      dotsAlong('a', LENGTH, 60, 5000, 1),
    );
  });

  it('gives each line a texture of its own', () => {
    expect(dotsAlong('a', LENGTH, 60, 0, 1)).not.toEqual(
      dotsAlong('b', LENGTH, 60, 0, 1),
    );
  });

  it('puts about as many dots as asked on a whole line, all on it', () => {
    const dots = dotsAlong('a', LENGTH, 60, 1234, 1);

    expect(dots.length).toBeGreaterThan(40);
    expect(dots.length).toBeLessThan(80);
    for (const dot of dots) {
      expect(dot.along).toBeGreaterThanOrEqual(0);
      expect(dot.along).toBeLessThan(1);
      expect(Math.abs(dot.offset)).toBeLessThanOrEqual(0.8);
    }
  });

  it('only dots the part of the line drawn so far', () => {
    const half = dotsAlong('a', LENGTH, 60, 0, 0.5);

    expect(half.length).toBeGreaterThan(15);
    expect(half.length).toBeLessThan(45);
    expect(half.every((dot) => dot.along < 0.5)).toBe(true);
    expect(dotsAlong('a', LENGTH, 60, 0, 0)).toEqual([]);
  });

  it('flows from the subject toward the object as the film plays', () => {
    const before = new Map(
      dotsAlong('a', LENGTH, 60, 90_000, 1).map((dot) => [looks(dot), dot]),
    );
    const after = dotsAlong('a', LENGTH, 60, 90_100, 1);
    const moved = after.flatMap((dot) => {
      const was = before.get(looks(dot));

      return was === undefined ? [] : [(dot.along - was.along) * LENGTH];
    });

    // A tenth of a second moves each dot a little way, never back.
    expect(moved.length).toBeGreaterThan(30);
    for (const distance of moved) {
      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThan(5);
    }
  });

  it('keeps each dot where it is as the line grows, late in the film', () => {
    // Late in the film, when the dots have flowed a long way: a line a
    // quarter longer keeps every dot as far from the subject as it was.
    const time = 110_000;
    const longer = new Map(
      dotsAlong('a', LENGTH * 1.25, 75, time, 1).map((dot) => [
        looks(dot),
        dot.along * LENGTH * 1.25,
      ]),
    );
    const dots = dotsAlong('a', LENGTH, 60, time, 1);

    expect(dots.length).toBeGreaterThan(30);
    for (const dot of dots) {
      expect(longer.get(looks(dot))).toBeCloseTo(dot.along * LENGTH, 6);
    }
  });
});

import { describe, expect, it } from 'vitest';

import { morphOutline, outlinePath, roundedOutline } from './story-shapes';

const radius = ([x, y]: readonly [number, number]): number => Math.hypot(x, y);

describe('morphOutline', () => {
  it('draws a circle as one radius all round', () => {
    for (const point of morphOutline('identity', 'identity', 0)) {
      expect(radius(point)).toBeCloseTo(0.4, 9);
    }
  });

  it('reaches the square’s corners and the triangle’s apex exactly', () => {
    const square = morphOutline('object', 'object', 1);
    const triangle = morphOutline('predicate', 'predicate', 1);
    const farthest = (outline: typeof square): number =>
      Math.max(...outline.map(radius));

    expect(farthest(square)).toBeCloseTo(0.34 * Math.SQRT2, 9);
    // The first sample points straight up, at the apex.
    expect(triangle[0]?.[1]).toBeCloseTo(-0.36, 9);
  });

  it('stands every shape level: as far above its middle as below', () => {
    for (const role of [
      'identity',
      'predicate',
      'object',
      'subjectAndObject',
    ] as const) {
      const ys = morphOutline(role, role, 1).map(([, y]) => y);

      expect(Math.min(...ys) + Math.max(...ys)).toBeCloseTo(0, 2);
    }
  });

  it('starts on the first shape and ends on the second', () => {
    const circle = 'identity';
    const square = 'object';

    expect(morphOutline(circle, square, 0)).toEqual(
      morphOutline(circle, circle, 0),
    );
    expect(morphOutline(circle, square, 1)).toEqual(
      morphOutline(square, square, 1),
    );
  });

  it('passes between them', () => {
    const halfway = morphOutline('identity', 'object', 0.5);
    // Toward a corner, halfway between the circle and the square's corner.
    const corner = halfway.map(radius).reduce((a, b) => Math.max(a, b));

    expect(corner).toBeCloseTo((0.4 + 0.34 * Math.SQRT2) / 2, 9);
  });

  it('draws the hexagon with its points left and right, where the lines meet it', () => {
    const hexagon = morphOutline('subjectAndObject', 'subjectAndObject', 1);
    const at = (degrees: number): number =>
      radius(hexagon[((degrees + 90) / 3) % hexagon.length] ?? [0, 0]);

    // Points to the left and the right, flat across the top and the bottom.
    expect(at(0)).toBeCloseTo(0.44, 9);
    expect(at(180)).toBeCloseTo(0.44, 9);
    expect(at(-90)).toBeCloseTo((0.44 * Math.sqrt(3)) / 2, 9);
    expect(at(90)).toBeCloseTo((0.44 * Math.sqrt(3)) / 2, 9);
  });
});

describe('roundedOutline', () => {
  const ROLES = [
    'identity',
    'predicate',
    'object',
    'subjectAndObject',
  ] as const;

  it('rounds every shape at rest as a convex outline, one arc a point', () => {
    for (const role of ROLES) {
      const corners = roundedOutline(role, role, 1);

      expect(corners).toHaveLength(morphOutline(role, role, 1).length);
      // Round a closed convex outline the arcs turn one whole turn.
      const turned = corners.reduce(
        (sum, corner) => sum + corner.to - corner.from,
        0,
      );
      expect(turned).toBeCloseTo(2 * Math.PI, 9);
    }
  });

  it('keeps every point of every step between two shapes, rounded', () => {
    // A circle on its way to a triangle bends inward a little near the
    // triangle's corners: there a point has its two ends instead of an arc.
    for (const from of ROLES) {
      for (const to of ROLES) {
        for (let step = 0; step <= 10; step++) {
          const outline = morphOutline(from, to, step / 10);
          const corners = roundedOutline(from, to, step / 10);
          const points = new Set(corners.map(({ x, y }) => `${x} ${y}`));

          expect(points.size).toBe(outline.length);
          for (const corner of corners) {
            expect(corner.to).toBeGreaterThanOrEqual(corner.from);
          }
        }
      }
    }
  });

  it('grows a shape by its rounding all round', () => {
    // The circle: its radius and the rounding, at every arc.
    for (const corner of roundedOutline('identity', 'identity', 0)) {
      const middle = (corner.from + corner.to) / 2;
      const x = corner.x + 0.05 * Math.cos(middle);
      const y = corner.y + 0.05 * Math.sin(middle);

      expect(Math.hypot(x, y)).toBeCloseTo(0.45, 3);
    }
  });
});

describe('outlinePath', () => {
  it('draws a shape as an SVG path along the same rounded outline the canvases fill', () => {
    const path = outlinePath('predicate', 10, 5);
    const points = [...path.matchAll(/[ML](-?[\d.]+) (-?[\d.]+)/g)].map(
      ([, x, y]) => [Number(x), Number(y)] as const,
    );
    const outline = morphOutline('predicate', 'predicate', 1);

    expect(path.endsWith('Z')).toBe(true);
    expect(points).toHaveLength(outline.length);
    // Each arc starts the rounding, half a unit at this size, out from its point.
    points.forEach(([x, y], index) => {
      const [px = 0, py = 0] = outline[index] ?? [];

      expect(Math.hypot(x - (5 + px * 10), y - (5 + py * 10))).toBeCloseTo(
        0.5,
        2,
      );
    });
  });
});

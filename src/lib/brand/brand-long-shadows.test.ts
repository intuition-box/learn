import { describe, expect, it } from 'vitest';

import {
  LONG_SHADOW,
  LONG_SHADOWS_PARTS,
  longShadowsPlacement,
  longShadowsShown,
  longShadowsSolid,
  longShadowsSvg,
  longShadowsTop,
} from './brand-long-shadows';

type Point = readonly [number, number];

// Each picture draws a dithered floor the size of half its frame: seconds, not milliseconds.
const DRAWING = 60_000;

const DESKTOP = { width: 2560, height: 1440 };
const PHONE = { width: 1179, height: 2556 };
const X_BANNER = {
  width: 1500,
  height: 500,
  clear: { x: 0, y: 300, width: 420, height: 200 },
};
const LINKEDIN_BANNER = {
  width: 1584,
  height: 396,
  clear: { x: 0, y: 196, width: 560, height: 200 },
};

/** How far apart two convex polygons stand, or how deep they overlap (negative), by their separating axes. */
function gapBetween(a: readonly Point[], b: readonly Point[]): number {
  let widest = -Infinity;
  for (const polygon of [a, b]) {
    for (const [index, [ax, ay]] of polygon.entries()) {
      const [bx, by] = polygon[(index + 1) % polygon.length] ?? [ax, ay];
      const length = Math.hypot(bx - ax, by - ay);
      if (length < 1e-9) {
        continue;
      }
      const nx = (by - ay) / length;
      const ny = -(bx - ax) / length;
      const along = (points: readonly Point[]) =>
        points.map(([x, y]) => x * nx + y * ny);
      const gap = Math.max(
        Math.min(...along(b)) - Math.max(...along(a)),
        Math.min(...along(a)) - Math.max(...along(b)),
      );
      widest = Math.max(widest, gap);
    }
  }
  return widest;
}

/** The desktop picture, drawn once for the tests that read it. */
let desktop: string | undefined;
const drawnDesktop = (): string => {
  desktop ??= longShadowsSvg(DESKTOP);
  return desktop;
};

describe('longShadowsSvg', () => {
  it(
    'draws the same picture every time',
    () => {
      expect(longShadowsSvg(DESKTOP)).toBe(drawnDesktop());
    },
    DRAWING,
  );

  it(
    'lays the floor over the whole frame as one image',
    () => {
      for (const [frame, svg] of [
        [DESKTOP, drawnDesktop()],
        [PHONE, longShadowsSvg(PHONE)],
        [X_BANNER, longShadowsSvg(X_BANNER)],
      ] as const) {
        expect(svg).toContain(
          `x="0" y="0" width="${frame.width}" height="${frame.height}" preserveAspectRatio="none"/>`,
        );
      }
    },
    DRAWING,
  );

  it(
    "paints in the reference's colors, none of the roles'",
    () => {
      const svg = drawnDesktop();
      for (const role of ['#7a86ff', '#2fe08b', '#ff4f5e', '#ff5fd2']) {
        expect(svg).not.toContain(role);
      }
    },
    DRAWING,
  );

  it(
    'clips each top it shows to its atom, and draws a side where the camera sees one, on the right',
    () => {
      const svg = drawnDesktop();
      // Fifteen in the reference's frame; the two below it throw only their shadows in.
      expect(svg.match(/<clipPath id="long-shadows-top-\d+">/g)).toHaveLength(
        15,
      );
      // Those standing right of 1480 in the design: two thin sides in the crowd, two wide on the right.
      expect(svg.match(/fill="url\(#long-shadows-side-\d+\)"/g)).toHaveLength(
        4,
      );
    },
    DRAWING,
  );
});

describe("the long shadows' shapes", () => {
  it('stand edge to edge at most, as solids: none in another', () => {
    const solids = LONG_SHADOWS_PARTS.map(longShadowsSolid);
    for (const [index, solid] of solids.entries()) {
      for (const other of solids.slice(index + 1)) {
        expect(gapBetween(solid, other)).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('meet edge to edge where the reference crowds its cubes', () => {
    // The five at the top right: each touches another, a pixel apart at most.
    const crowded = LONG_SHADOWS_PARTS.slice(0, 5).map(longShadowsSolid);
    for (const [index, solid] of crowded.entries()) {
      const nearest = Math.min(
        ...crowded
          .filter((_, other) => other !== index)
          .map((other) => gapBetween(solid, other)),
      );
      expect(nearest).toBeLessThanOrEqual(1.5);
    }
  });

  it('are four of each kind, but one more square', () => {
    const count = (role: string) =>
      LONG_SHADOWS_PARTS.filter((part) => part.role === role).length;
    expect([
      count('identity'),
      count('predicate'),
      count('object'),
      count('bridge'),
    ]).toEqual([4, 4, 5, 4]);
  });

  it("stand each square as big as the reference's cubes, 183 pixels", () => {
    const widths = LONG_SHADOWS_PARTS.filter((part) => part.role === 'object')
      .map(longShadowsTop)
      .map((top) => top.map(([x]) => x))
      .map((xs) => Math.max(...xs) - Math.min(...xs));
    expect(widths).toHaveLength(5);
    for (const width of widths) {
      expect(width).toBeCloseTo(183, 6);
    }
  });

  it('throw their long shadows up the picture and a little right', () => {
    expect(LONG_SHADOW[1]).toBeLessThan(0);
    expect(LONG_SHADOW[0] / -LONG_SHADOW[1]).toBeCloseTo(0.17, 2);
  });
});

describe('longShadowsPlacement', () => {
  it('fills a desktop frame with the whole design', () => {
    expect(longShadowsPlacement(DESKTOP)).toEqual({ scale: 1.28, x: 0, y: 0 });
  });

  it('keeps the corner a platform covers clear of shapes', () => {
    for (const frame of [X_BANNER, LINKEDIN_BANNER]) {
      const { scale, x, y } = longShadowsPlacement(frame);
      const shown = longShadowsShown(frame);
      expect(shown.length).toBeGreaterThan(LONG_SHADOWS_PARTS.length - 3);
      for (const part of shown) {
        const solid = longShadowsSolid(part);
        const isOutside =
          x + Math.max(...solid.map(([px]) => px)) * scale <= frame.clear.x ||
          x + Math.min(...solid.map(([px]) => px)) * scale >=
            frame.clear.x + frame.clear.width ||
          y + Math.max(...solid.map(([, py]) => py)) * scale <= frame.clear.y ||
          y + Math.min(...solid.map(([, py]) => py)) * scale >=
            frame.clear.y + frame.clear.height;
        expect(isOutside).toBe(true);
      }
    }
  });

  it("leaves a phone's top quarter clear for the clock", () => {
    const { scale, y } = longShadowsPlacement(PHONE);
    for (const part of LONG_SHADOWS_PARTS) {
      const top = Math.min(...longShadowsSolid(part).map(([, py]) => py));
      expect(y + top * scale).toBeGreaterThan(PHONE.height / 4);
    }
  });
});

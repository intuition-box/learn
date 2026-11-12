import { describe, expect, it } from 'vitest';

import {
  MULTIPLAYER_SCENE,
  REFERENCE_BOUNDS,
  fillBubbles,
  isClearOfShapes,
  multiplayerSvg,
} from './brand-multiplayer';
import { MULTIPLAYER_BUBBLES } from './multiplayer-bubbles';

const ROLE_COLORS = {
  identity: '#7a86ff',
  predicate: '#2fe08b',
  object: '#ff4f5e',
  bridge: '#ff5fd2',
} as const;
const PRISMS = ['predicate', 'object', 'bridge'] as const;

const channels = (hex: string): number[] =>
  [1, 3, 5].map((at) => Number.parseInt(hex.slice(at, at + 2), 16));

/** A light's bounds, as its bloom draws its silhouette, in the scene's units. */
function silhouetteBounds(svg: string, role: keyof typeof ROLE_COLORS) {
  const start = svg.indexOf(`filter="url(#remake-light-${role}-bloom-0)"`);
  const drawn = svg.slice(start, svg.indexOf('</g>', start));
  const circle = /<circle cx="([\d.-]+)" cy="([\d.-]+)" r="([\d.-]+)"/.exec(
    drawn,
  );
  if (circle !== null) {
    const [x = 0, y = 0, r = 0] = circle.slice(1).map(Number);
    return { left: x - r, top: y - r, right: x + r, bottom: y + r };
  }
  const numbers = [...drawn.matchAll(/ d="([^"]+)"/g)].flatMap(([, d = '']) =>
    (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number),
  );
  const xs = numbers.filter((_, index) => index % 2 === 0);
  const ys = numbers.filter((_, index) => index % 2 === 1);
  return {
    left: Math.min(...xs),
    top: Math.min(...ys),
    right: Math.max(...xs),
    bottom: Math.max(...ys),
  };
}

describe('multiplayerSvg', () => {
  const frame = { width: 1920, height: 1080 };
  const svg = multiplayerSvg(frame);

  it('draws the same picture every time', () => {
    expect(multiplayerSvg(frame)).toBe(svg);
  });

  it('draws all four shapes in their role colors', () => {
    for (const color of Object.values(ROLE_COLORS)) {
      expect(svg).toContain(color);
    }
  });

  it('has no words: the shapes alone', () => {
    expect(MULTIPLAYER_SCENE.overlay).toBeUndefined();
    expect(svg).not.toContain('<text');
  });

  it("centers the four shapes as a group on the frame's center, at their size", () => {
    const bounds = Object.keys(ROLE_COLORS).map((role) =>
      silhouetteBounds(svg, role as keyof typeof ROLE_COLORS),
    );
    const left = Math.min(...bounds.map((box) => box.left));
    const top = Math.min(...bounds.map((box) => box.top));
    const right = Math.max(...bounds.map((box) => box.right));
    const bottom = Math.max(...bounds.map((box) => box.bottom));
    // The scene's (970, 560) is every frame's center.
    expect((left + right) / 2).toBeCloseTo(970, 0);
    expect((top + bottom) / 2).toBeCloseTo(560, 0);
    expect(right - left).toBeCloseTo(
      REFERENCE_BOUNDS.right - REFERENCE_BOUNDS.left,
      0,
    );
    expect(bottom - top).toBeCloseTo(
      REFERENCE_BOUNDS.bottom - REFERENCE_BOUNDS.top,
      0,
    );
  });

  it('keeps its core light in its own color: the front faces never whiter than it', () => {
    for (const role of PRISMS) {
      const gradient = new RegExp(
        `<radialGradient id="remake-light-${role}-cap"[^>]*>(.*?)</radialGradient>`,
      ).exec(svg)?.[1];
      const stops = [
        ...(gradient ?? '').matchAll(/stop-color="(#[0-9a-f]{6})"/g),
      ].map(([, color = '']) => color);
      expect(stops[0]).toBe(ROLE_COLORS[role]);
      const own = channels(ROLE_COLORS[role]);
      for (const stop of stops) {
        channels(stop).forEach((value, index) => {
          expect(value).toBeLessThanOrEqual(own[index] ?? 0);
        });
      }
    }
  });

  it('lights every side of a shape the same: its own color, at full', () => {
    for (const role of PRISMS) {
      const capAt = svg.indexOf(`fill="url(#remake-light-${role}-cap)"`);
      const bloomEnd = svg.indexOf(
        '</g>',
        svg.lastIndexOf(`filter="url(#remake-light-${role}-bloom-`, capAt),
      );
      const sides = svg.slice(bloomEnd, capAt);
      const fills = [...sides.matchAll(/ fill="(#[0-9a-f]{6})"/g)].map(
        ([, color = '']) => color,
      );
      expect(fills.length).toBeGreaterThan(0);
      expect(new Set(fills)).toEqual(new Set([ROLE_COLORS[role]]));
    }
  });

  it('draws a thin white line where two faces meet, and round every shape', () => {
    const groups = [...svg.matchAll(/<g opacity="0.1">(.*?)<\/g>/g)].map(
      ([, lines = '']) => lines,
    );
    expect(groups).toHaveLength(4);
    // The circle has no faces meeting: its outline alone.
    const [circle = '', ...prisms] = groups;
    expect(circle).toMatch(/^<circle [^>]*stroke="#ffffff"[^>]*\/>$/);
    // Each prism: one run where its front meets its sides, then its outline.
    for (const prism of prisms) {
      expect(prism.match(/<path /g)).toHaveLength(2);
      expect(prism).toMatch(/Z" fill="none" stroke="#ffffff"/);
    }
  });
});

describe('fillBubbles', () => {
  const added = fillBubbles();
  // The shapes' row once centered: their bounds' height round the center.
  const half = (REFERENCE_BOUNDS.bottom - REFERENCE_BOUNDS.top) / 2;

  it("keeps the reference's bubbles where they were, but those too near the shapes", () => {
    const placed = new Set(
      MULTIPLAYER_SCENE.solids.map((solid) => `${solid.x},${solid.y}`),
    );
    for (const [x, y, across] of MULTIPLAYER_BUBBLES) {
      expect(placed.has(`${x},${y}`)).toBe(isClearOfShapes(x, y, across * 4));
    }
  });

  it('keeps the dark round the four shapes: no small solid near them', () => {
    for (const solid of MULTIPLAYER_SCENE.solids) {
      expect(isClearOfShapes(solid.x, solid.y, solid.size)).toBe(true);
    }
  });

  it('adds them above and below the shapes, never beside them', () => {
    expect(added.filter(([, y]) => y < 560 - half).length).toBeGreaterThan(50);
    expect(added.filter(([, y]) => y > 560 + half).length).toBeGreaterThan(50);
    for (const [, y] of added) {
      expect(y < 560 - half || y > 560 + half).toBe(true);
    }
  });

  it('keeps each clear of every other bubble', () => {
    const all = [...MULTIPLAYER_BUBBLES, ...added];
    for (const [x, y] of added) {
      const nearest = Math.min(
        ...all
          .filter(([ox, oy]) => ox !== x || oy !== y)
          .map(([ox, oy]) => Math.hypot(ox - x, oy - y)),
      );
      expect(nearest).toBeGreaterThanOrEqual(14);
    }
  });

  it("sizes them as the reference's own", () => {
    const sizes = new Set(MULTIPLAYER_BUBBLES.map(([, , across]) => across));
    for (const [, , across] of added) {
      expect(sizes.has(across)).toBe(true);
    }
  });
});

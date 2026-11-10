import { describe, expect, it } from 'vitest';

import {
  OBSERVED_GROUND,
  OBSERVED_SHADOW,
  observedSvg,
} from './brand-observed';
import { GRAPHITE } from './learn-artwork';

describe('observedSvg', () => {
  const frame = { width: 1920, height: 1080 };

  it('draws the same picture every time', () => {
    expect(observedSvg(frame)).toBe(observedSvg(frame));
  });

  it('lights the triple in its role colors, and no hexagon in color', () => {
    const svg = observedSvg(frame);
    for (const color of ['#7a86ff', '#2fe08b', '#ff4f5e']) {
      expect(svg).toContain(color);
    }
    expect(svg).not.toContain('#ff5fd2');
  });

  it('stands on Graphite 950, its shadows toward Graphite 800', () => {
    expect(OBSERVED_GROUND).toBe(GRAPHITE[950]);
    expect(OBSERVED_SHADOW).toBe(GRAPHITE[800]);
  });

  it('draws the spheres and the pool as dithered images', () => {
    const images = observedSvg(frame).match(
      /<image href="data:image\/png;base64,/g,
    );
    // The pool, the big sphere and the small one.
    expect(images).toHaveLength(3);
  });

  it("runs both bonds straight through the triangle's center", () => {
    const beams = [
      ...observedSvg(frame).matchAll(
        /<line x1="([-\d.]+)" y1="([-\d.]+)" x2="([-\d.]+)" y2="([-\d.]+)" stroke="#ffffff"/g,
      ),
    ].map((match) => match.slice(1).map(Number));
    // The two soft beams, then the two bonds: each pair meets at the
    // triangle's center, the second going on at the first's angle.
    expect(beams).toHaveLength(4);
    const angle = (line: number[] | undefined) =>
      Math.atan2(
        (line?.[3] ?? 0) - (line?.[1] ?? 0),
        (line?.[2] ?? 0) - (line?.[0] ?? 0),
      );
    for (const [first, second] of [
      [beams[0], beams[1]],
      [beams[2], beams[3]],
    ]) {
      expect(first?.[2]).toBeCloseTo(second?.[0] ?? Number.NaN, 1);
      expect(first?.[3]).toBeCloseTo(second?.[1] ?? Number.NaN, 1);
      expect(angle(first)).toBeCloseTo(angle(second), 3);
    }
  });
});

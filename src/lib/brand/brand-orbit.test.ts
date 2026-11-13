import { describe, expect, it } from 'vitest';

import { ORBIT_SCENE, orbitSvg } from './brand-orbit';
import { outsideOutline, turnedLights } from './brand-observed';

describe('orbitSvg', () => {
  const frame = { width: 1920, height: 1080 };

  it('draws the same picture every time', () => {
    expect(orbitSvg(frame)).toBe(orbitSvg(frame));
  });

  it('lights the triple in its role colors, and no hexagon in color', () => {
    const svg = orbitSvg(frame);
    for (const color of ['#7a86ff', '#2fe08b', '#ff4f5e']) {
      expect(svg).toContain(color);
    }
    expect(svg).not.toContain('#ff5fd2');
  });

  it('draws its spheres and the pool as dithered images', () => {
    // The pool, the big sphere, the small one, and the subject, a sphere itself.
    expect(
      orbitSvg(frame).match(/<image href="data:image\/png;base64,/g),
    ).toHaveLength(4);
  });

  it('draws its bonds as the bond rules say, with no glow under them', () => {
    expect(orbitSvg(frame)).not.toContain('remake-beam');
  });

  it('keeps the triangle and the small sphere apart', () => {
    const [, triangle] = turnedLights(ORBIT_SCENE);
    const small = ORBIT_SCENE.solids[1];
    expect(triangle?.role).toBe('predicate');
    expect(small?.size).toBe(160);
    if (triangle === undefined || small === undefined) {
      return;
    }
    // From the sphere's edge to the triangle's outline, in the design.
    expect(
      outsideOutline(triangle, [small.x, small.y]) - small.size / 2,
    ).toBeGreaterThan(40);
  });

  it("meets its two bonds at the triangle's center", () => {
    const lines = [
      ...orbitSvg(frame).matchAll(
        /<line x1="([-\d.]+)" y1="([-\d.]+)" x2="([-\d.]+)" y2="([-\d.]+)" stroke="#ffffff"/g,
      ),
    ].map((match) => match.slice(1).map(Number));
    // The two bonds, with no glow under them: they meet.
    expect(lines).toHaveLength(2);
    for (const [first, second] of [[lines[0], lines[1]]]) {
      expect(first?.[2]).toBeCloseTo(second?.[0] ?? Number.NaN, 1);
      expect(first?.[3]).toBeCloseTo(second?.[1] ?? Number.NaN, 1);
    }
  });
});

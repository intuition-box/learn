import { describe, expect, it } from 'vitest';

import {
  INTUITION_LOGO,
  INTUITION_LOGO_REACH,
  intuitionLogoSvg,
} from './intuition-logo';

describe('intuitionLogoSvg', () => {
  const cx = 500;
  const cy = 400;
  const diameter = 2 * INTUITION_LOGO_REACH * 10;
  const svg = intuitionLogoSvg({ cx, cy, diameter, color: '#000000' });

  it('draws the ring as a circle and each arc as a path', () => {
    expect(svg.match(/<circle /g)).toHaveLength(1);
    expect(svg.match(/<path /g)).toHaveLength(5);
    expect(svg).toContain('<g fill="none" stroke="#000000">');
    // The ring at its middle radius, as wide as its band: 10 px a unit.
    expect(svg).toContain(
      '<circle cx="500" cy="400" r="189.7" stroke-width="37.8"/>',
    );
  });

  it('starts and ends each arc where its band does, counterclockwise from the right', () => {
    const arcs = Array.from(
      svg.matchAll(/d="M(\S+) (\S+)A\S+ \S+ 0 ([01]) 0 (\S+) (\S+)"/g),
      ([, x1, y1, large, x2, y2]) => ({
        start: [Number(x1), Number(y1)] as const,
        end: [Number(x2), Number(y2)] as const,
        large,
      }),
    );
    const bands = INTUITION_LOGO.bands.filter(({ span }) => span < 360);
    expect(arcs).toHaveLength(bands.length);
    // The angle of a point round the centre, y up, as `INTUITION_LOGO` measures it.
    const angleOf = ([x, y]: readonly [number, number]) =>
      (Math.atan2(cy - y, x - cx) * 180) / Math.PI;
    const sameAngle = (a: number, b: number) =>
      Math.abs(((a - b + 540) % 360) - 180) < 0.01;
    arcs.forEach((arc, index) => {
      const band = bands[index];
      expect(band).toBeDefined();
      if (band === undefined) {
        return;
      }
      expect(sameAngle(angleOf(arc.start), band.start)).toBe(true);
      expect(sameAngle(angleOf(arc.end), band.start + band.span)).toBe(true);
      expect(arc.large).toBe(band.span > 180 ? '1' : '0');
      expect(Math.hypot(arc.start[0] - cx, arc.start[1] - cy)).toBeCloseTo(
        band.radius * 10,
        2,
      );
    });
  });
});

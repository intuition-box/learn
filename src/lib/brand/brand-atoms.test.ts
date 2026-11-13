import { describe, expect, it } from 'vitest';

import { parseHex, rgbToOklch } from '@/components/brand/color';

import { atomsInFrame, atomsSvg, smallAtoms } from './brand-atoms';
import { ATOMS_DESIGN, atomsPlacement } from './brand-atoms-frame';

describe('atomsSvg', () => {
  it('draws the same picture every time', () => {
    expect(atomsSvg(ATOMS_DESIGN, 'dark')).toBe(atomsSvg(ATOMS_DESIGN, 'dark'));
  });

  it('draws the small atoms filled, outlined none, before the four shapes', () => {
    for (const ground of ['dark', 'light'] as const) {
      const svg = atomsSvg(ATOMS_DESIGN, ground);
      const shapes = svg.indexOf('remake-light-identity');
      const dots = svg.slice(0, shapes);
      expect(dots.match(/<use href="#atoms-dot-/g)).toHaveLength(
        smallAtoms().length,
      );
      expect(dots).not.toContain('stroke');
    }
  });

  it('draws the four shapes by the 3D recipe: a sphere and three prisms, lined at 10%', () => {
    const svg = atomsSvg(ATOMS_DESIGN, 'dark');
    // The sphere, one dithered image; each prism's front, its core light.
    expect(svg.match(/<image href="data:image\/png;base64,/g)).toHaveLength(1);
    for (const role of ['predicate', 'object', 'bridge']) {
      expect(svg).toContain(`fill="url(#remake-light-${role}-cap)"`);
    }
    expect(svg.match(/<g opacity="0.1">/g)).toHaveLength(4);
  });

  it('glows on Midnight, and not on white, where light added shows nothing', () => {
    expect(atomsSvg(ATOMS_DESIGN, 'dark')).toContain('mix-blend-mode:screen');
    expect(atomsSvg(ATOMS_DESIGN, 'light')).not.toContain(
      'mix-blend-mode:screen',
    );
  });
});

describe('atomsSvg on either ground', () => {
  it.each(['dark', 'light'] as const)(
    'keeps every front no more saturated than its role color, on %s',
    (ground) => {
      const svg = atomsSvg(ATOMS_DESIGN, ground);
      for (const [role, hex] of [
        ['predicate', '#2fe08b'],
        ['object', '#ff4f5e'],
        ['bridge', '#ff5fd2'],
      ] as const) {
        const gradient = new RegExp(
          `<radialGradient id="remake-light-${role}-cap"[^>]*>(.*?)</radialGradient>`,
        ).exec(svg)?.[1];
        const stops = [
          ...(gradient ?? '').matchAll(/stop-color="(#[0-9a-f]{6})"/g),
        ].map(([, color = '#000000']) => color);
        expect(stops.length).toBeGreaterThan(0);
        const [, own] = rgbToOklch(parseHex(hex));
        for (const stop of stops) {
          // Rounded to whole channels: a hair over, no more.
          expect(rgbToOklch(parseHex(stop))[1]).toBeLessThanOrEqual(
            own + 0.003,
          );
        }
      }
    },
  );
});

describe('atomsPlacement', () => {
  it('draws the design as it is at its own size', () => {
    expect(atomsPlacement(ATOMS_DESIGN)).toEqual({
      scale: 1,
      x: 1210,
      y: 540,
    });
  });

  it('fits a tall frame across, its cluster in the middle', () => {
    const phone = { width: 1179, height: 2556 };
    const { scale, x, y } = atomsPlacement(phone);
    expect(x).toBe(phone.width / 2);
    expect(y).toBe(phone.height / 2);
    expect(1180 * scale).toBeLessThanOrEqual(phone.width);
  });
});

describe('atomsInFrame', () => {
  it('keeps the corner a platform covers clear of atoms', () => {
    const clear = { x: 0, y: 300, width: 420, height: 200 };
    const banner = { width: 1500, height: 500, clear };
    const shown = atomsInFrame(banner);
    expect(shown.length).toBeGreaterThan(0);
    for (const { x, y, reach } of shown) {
      const overlaps =
        x + reach >= clear.x &&
        x - reach <= clear.x + clear.width &&
        y + reach >= clear.y &&
        y - reach <= clear.y + clear.height;
      expect(overlaps).toBe(false);
    }
  });

  it('shows every small atom where nothing is kept clear', () => {
    expect(atomsInFrame(ATOMS_DESIGN)).toHaveLength(smallAtoms().length);
  });
});

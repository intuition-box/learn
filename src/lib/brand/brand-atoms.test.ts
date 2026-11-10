import { describe, expect, it } from 'vitest';

import {
  ATOMS_DESIGN,
  atomsInFrame,
  atomsPlacement,
  atomsSvg,
  smallAtoms,
} from './brand-atoms';

describe('atomsSvg', () => {
  it('draws the same picture every time', () => {
    expect(atomsSvg(ATOMS_DESIGN, 'dark')).toBe(atomsSvg(ATOMS_DESIGN, 'dark'));
  });

  it('fills every shape and outlines none, on either ground', () => {
    for (const ground of ['dark', 'light'] as const) {
      const svg = atomsSvg(ATOMS_DESIGN, ground);
      expect(svg).not.toContain('stroke');
      expect(svg).not.toContain('fill="none"');
    }
  });

  it('sinks the sides into Midnight, and keeps them one shade on white', () => {
    // The circle's layers, back to front: its sides, its face's rim, its face.
    const fills = (ground: 'dark' | 'light') =>
      Array.from(
        atomsSvg(ATOMS_DESIGN, ground).matchAll(
          /<use href="#atoms-identity"[^>]*fill="([^"]+)"/g,
        ),
        ([, fill]) => fill,
      );
    // On white, the subject's #7a86ff 28% darker, front to back.
    const light = fills('light');
    expect(light[0]).toBe('#5860b8');
    expect(light.at(-4)).toBe('#5860b8');
    // On Midnight, darker than its face and half sunk into #16161e at the back.
    expect(fills('dark')[0]).toBe('#282a4a');
  });
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

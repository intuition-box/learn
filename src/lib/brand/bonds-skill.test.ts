import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { describe, expect, it } from 'vitest';

import { dotsAlong, PIXELS_PER_DOT } from '@/components/playground/story-dots';
import type { Dot } from '@/components/playground/story-dots';
import { layoutPlane, PLANE } from '@/components/playground/story-plane';

/** The bonds skill's script, as an agent runs it: plain JavaScript, no types. */
interface BondScript {
  FILM_ATOM_SIZE: number;
  bondDots: (
    id: string,
    length: number,
    timeMs?: number,
    progress?: number,
  ) => Dot[];
  bondSvg: (options: {
    id: string;
    from: { x: number; y: number };
    to: { x: number; y: number };
    atomSize?: number;
    ground?: 'light' | 'dark';
    devicePixel?: number;
  }) => string;
  tripleCenters: (
    nameWidths: readonly number[],
    options?: { atomSize?: number; x?: number },
  ) => number[];
}

const SCRIPT = path.join(
  import.meta.dirname,
  '..',
  '..',
  '..',
  'skills',
  'intuition-brand-skill',
  'scripts',
  'bond.mjs',
);
const bond = (await import(pathToFileURL(SCRIPT).href)) as BondScript;

describe("the brand skill's bond script", () => {
  it("draws the film's own dots, dot for dot, at any moment", () => {
    for (const [id, length, time] of [
      ['belief:0', 120, 0],
      ['worth:1', 333.5, 4210],
      ['more:0', 58, 99_999],
    ] as const) {
      const film = dotsAlong(
        id,
        length,
        Math.round(length / PIXELS_PER_DOT),
        time,
        1,
      );
      expect(bond.bondDots(id, length, time)).toEqual(film);
    }
  });

  it("sizes its measures to the film's atom", () => {
    expect(bond.FILM_ATOM_SIZE).toBe(PLANE.atomSize);
  });

  it("places a claim's atoms where the film does", () => {
    const widths = { elonMusk: 72.5, believes: 58, spacex: 49 } as const;
    const { atoms } = layoutPlane(
      {
        triple: {
          id: 'belief',
          subject: { atom: 'elonMusk' },
          predicate: 'believes',
          object: { atom: 'spacex' },
        },
      },
      (id) => widths[id as keyof typeof widths],
    );
    expect(
      bond.tripleCenters([widths.elonMusk, widths.believes, widths.spacex]),
    ).toEqual(atoms.map((atom) => Number(atom.x.toFixed(3))));
  });

  it('scales a bond with its atoms, keeping its grain', () => {
    const at34 = bond.bondSvg({
      id: 'belief:0',
      from: { x: 0, y: 0 },
      to: { x: 100, y: 0 },
    });
    const at68 = bond.bondSvg({
      id: 'belief:0',
      from: { x: 0, y: 0 },
      to: { x: 200, y: 0 },
      atomSize: 68,
    });
    const count = (svg: string) => svg.match(/<circle /g)?.length ?? 0;
    expect(count(at68)).toBe(count(at34));
    expect(at34).toContain('stroke-width="1"');
    expect(at68).toContain('stroke-width="2"');
    expect(at34).toContain('stroke-opacity="0.16"');
  });

  it('draws a plain line under 12px atoms, one device pixel wide, at 40% (30% on dark)', () => {
    const options = {
      id: 'belief:0',
      from: { x: 0, y: 0 },
      to: { x: 60, y: 0 },
      atomSize: 11,
    };
    const plain = bond.bondSvg(options);
    expect(plain).not.toContain('<circle');
    expect(plain).toContain('stroke-opacity="0.4" stroke-width="1"');
    expect(bond.bondSvg({ ...options, devicePixel: 0.5 })).toContain(
      'stroke-width="0.5"',
    );
    expect(bond.bondSvg({ ...options, ground: 'dark' })).toContain(
      'stroke="#ffffff" stroke-opacity="0.3"',
    );
    // From 12px, the dots.
    expect(bond.bondSvg({ ...options, atomSize: 12 })).toContain('<circle');
  });

  it("keeps the film's own bond from 12px to 34px atoms", () => {
    const options = {
      id: 'belief:0',
      from: { x: 0, y: 0 },
      to: { x: 120, y: 0 },
    };
    const film = bond.bondSvg({ ...options, atomSize: 34 });
    for (const atomSize of [12, 17, 33]) {
      expect(bond.bondSvg({ ...options, atomSize })).toBe(film);
    }
  });

  it('holds a bond at its 68px values over 68px atoms', () => {
    const options = {
      id: 'belief:0',
      from: { x: 0, y: 0 },
      to: { x: 400, y: 0 },
    };
    expect(bond.bondSvg({ ...options, atomSize: 1000 })).toBe(
      bond.bondSvg({ ...options, atomSize: 68 }),
    );
    expect(bond.bondSvg({ ...options, atomSize: 136 })).toContain(
      'stroke-width="2"',
    );
  });

  it('draws a bond for a dark ground in Graphite 0, the hairline at 12%, every dot at 0.8 of its opacity', () => {
    const options = {
      id: 'belief:0',
      from: { x: 0, y: 0 },
      to: { x: 120, y: 0 },
    };
    const light = bond.bondSvg(options);
    const dark = bond.bondSvg({ ...options, ground: 'dark' });
    expect(dark).toContain('stroke="#ffffff" stroke-opacity="0.12"');
    const opacities = (svg: string) =>
      Array.from(svg.matchAll(/fill-opacity="([\d.]+)"/g), ([, a]) =>
        Number(a),
      );
    const lightDots = opacities(light);
    expect(opacities(dark)).toHaveLength(lightDots.length);
    for (const [index, alpha] of opacities(dark).entries()) {
      expect(alpha).toBeCloseTo((lightDots[index] ?? 0) * 0.8, 2);
    }
    // Where the dots stand and how large they are does not change.
    const shapes = (svg: string) =>
      svg.replace(/ (stroke|fill)(-opacity)?="[^"]*"/g, '');
    expect(shapes(dark)).toBe(shapes(light));
  });
});

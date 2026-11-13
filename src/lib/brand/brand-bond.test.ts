import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { describe, expect, it } from 'vitest';

import { bondSvg, curvedBondSvg } from './brand-bond';
import type { BondOptions } from './brand-bond';

/** The brand skill's bond script, as an agent runs it. */
interface BondScript {
  bondSvg: (options: BondOptions) => string;
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
const skill = (await import(pathToFileURL(SCRIPT).href)) as BondScript;

describe("the brand pictures' bond", () => {
  it("draws exactly the skill's bond, at every size, on both grounds", () => {
    for (const ground of ['light', 'dark'] as const) {
      for (const atomSize of [4, 11, 12, 20, 34, 51, 68, 136, 1000]) {
        for (const devicePixel of [1, 0.5]) {
          const options: BondOptions = {
            id: `pictures:${atomSize}`,
            from: { x: 10.5, y: 40 },
            to: { x: 10.5 + 4 * atomSize, y: 40 },
            atomSize,
            ground,
            devicePixel,
          };
          expect(bondSvg(options)).toBe(skill.bondSvg(options));
        }
      }
    }
  });

  it('draws vertical bonds as the skill does, for branches', () => {
    const options: BondOptions = {
      id: 'branch:0',
      from: { x: 200, y: 300 },
      to: { x: 200, y: 120 },
      atomSize: 48,
      ground: 'dark',
    };
    expect(bondSvg(options)).toBe(skill.bondSvg(options));
  });
});

/** Every dot of a bond: where it stands, how big, how dark. */
function dotsOf(svg: string): number[][] {
  return [
    ...svg.matchAll(
      /<circle cx="([-\d.]+)" cy="([-\d.]+)" r="([\d.]+)" fill="[^"]+" fill-opacity="([\d.]+)"/g,
    ),
  ].map((match) => match.slice(1).map(Number));
}

describe('the curved bond', () => {
  const straight: BondOptions = {
    id: 'molecule:3',
    from: { x: 283, y: 292 },
    to: { x: 1012, y: 650 },
    atomSize: 344,
    ground: 'dark',
  };

  it("puts every dot where the skill's bond does when it does not bend", () => {
    const skillDots = dotsOf(bondSvg(straight));
    const curvedDots = dotsOf(curvedBondSvg({ ...straight, bend: 0 }));
    expect(curvedDots).toHaveLength(skillDots.length);
    for (const [index, dot] of curvedDots.entries()) {
      const skillDot = skillDots[index] ?? [];
      for (const [part, value] of dot.entries()) {
        expect(value).toBeCloseTo(skillDot[part] ?? Number.NaN, 1);
      }
    }
  });

  it("holds it at double the film's, as the skill does, unless a picture holds it larger", () => {
    expect(curvedBondSvg({ ...straight, bend: 0.1 })).toContain(
      'stroke-opacity="0.12" stroke-width="2"',
    );
    expect(curvedBondSvg({ ...straight, bend: 0.1, heldAt: 3 })).toContain(
      'stroke-opacity="0.12" stroke-width="3"',
    );
  });

  it('bends its middle up the picture, as far as asked', () => {
    const bent = curvedBondSvg({ ...straight, bend: 0.1 });
    const control = /Q([-\d.]+) ([-\d.]+) /.exec(bent);
    const [x, y] = [Number(control?.[1]), Number(control?.[2])];
    const middle = { x: (283 + 1012) / 2, y: (292 + 650) / 2 };
    const length = Math.hypot(1012 - 283, 650 - 292);
    // Twice the bend away, as a quadratic curve reaches half way to it; up.
    expect(Math.hypot(x - middle.x, y - middle.y)).toBeCloseTo(0.2 * length, 1);
    expect(y).toBeLessThan(middle.y);
  });
});

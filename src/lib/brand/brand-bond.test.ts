import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { describe, expect, it } from 'vitest';

import { bondSvg } from './brand-bond';
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

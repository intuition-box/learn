import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { describe, expect, it } from 'vitest';

import type { Role } from '@/components/playground/story-model';
import {
  morphOutline,
  outlinePath,
  roundedOutline,
  ROLES,
  shapeSize,
} from '@/components/playground/story-shapes';

/** The brand skill's atom script, as an agent runs it: plain JavaScript, no types. */
interface AtomScript {
  outlinePath: (role: string, size: number, centre: number) => string;
  roundedOutline: (
    from: string,
    to: string,
    t: number,
  ) => { x: number; y: number; from: number; to: number }[];
  morphOutline: (from: string, to: string, t: number) => [number, number][];
  shapeSize: (role: string) => { width: number; height: number };
}

const SCRIPT = path.join(
  import.meta.dirname,
  '..',
  '..',
  '..',
  'skills',
  'intuition-brand-skill',
  'scripts',
  'atom.mjs',
);
const atom = (await import(pathToFileURL(SCRIPT).href)) as AtomScript;

describe("the brand skill's atom script", () => {
  it('draws every atom as the film does, path for path', () => {
    for (const role of ROLES) {
      for (const [size, centre] of [
        [1, 0],
        [34, 17],
        [100, 50],
        [520, 0],
      ] as const) {
        expect(atom.outlinePath(role, size, centre)).toBe(
          outlinePath(role, size, centre),
        );
      }
    }
  });

  it("calls the subject by the brand's name too", () => {
    expect(atom.outlinePath('subject', 100, 50)).toBe(
      outlinePath('identity', 100, 50),
    );
  });

  it('morphs and rounds as the film does, at any point between two roles', () => {
    const pairs: [Role, Role][] = [
      ['object', 'bridge'],
      ['identity', 'predicate'],
      ['predicate', 'object'],
    ];
    for (const [from, to] of pairs) {
      for (const t of [0, 0.25, 0.5, 1]) {
        expect(atom.morphOutline(from, to, t)).toEqual(
          morphOutline(from, to, t).map(([x, y]) => [x, y]),
        );
        expect(atom.roundedOutline(from, to, t)).toEqual(
          roundedOutline(from, to, t),
        );
      }
    }
  });

  it('sizes every atom as the film does', () => {
    for (const role of ROLES) {
      expect(atom.shapeSize(role)).toEqual(shapeSize(role));
    }
  });
});

import { describe, expect, it } from 'vitest';

import {
  atomField,
  chainAtoms,
  seededRandom,
  segmentsCross,
} from './atom-field';
import type {
  AtomField,
  AtomFieldOptions,
  FieldAtom,
  Rect,
} from './atom-field';

const OPTIONS: AtomFieldOptions = {
  width: 1600,
  height: 900,
  seed: 11,
  claims: 14,
  bridges: 1 / 3,
  size: { min: 30, max: 60 },
  keepClear: [{ x: 600, y: 300, width: 400, height: 300 }],
};

const FIELD = atomField(OPTIONS);

/** Each bond's two atoms. */
const bondsOf = (field: AtomField) =>
  field.bonds.map(({ from, to }) => {
    const a = field.atoms[from];
    const b = field.atoms[to];
    if (a === undefined || b === undefined) {
      throw new Error(`Bond ${from}–${to} joins a missing atom`);
    }
    return { a, b };
  });

const distanceToRect = ({ x, y }: { x: number; y: number }, rect: Rect) =>
  Math.hypot(
    Math.max(rect.x - x, 0, x - (rect.x + rect.width)),
    Math.max(rect.y - y, 0, y - (rect.y + rect.height)),
  );

describe('seededRandom', () => {
  it('gives the same numbers for the same seed, in [0, 1)', () => {
    const a = seededRandom(5);
    const b = seededRandom(5);
    const numbers = Array.from({ length: 100 }, () => a());
    expect(Array.from({ length: 100 }, () => b())).toEqual(numbers);
    expect(numbers.every((value) => value >= 0 && value < 1)).toBe(true);
  });
});

describe('atomField', () => {
  it('is the same field for the same seed, and another for another', () => {
    expect(atomField(OPTIONS)).toEqual(FIELD);
    expect(atomField({ ...OPTIONS, seed: 12 })).not.toEqual(FIELD);
  });

  it('places most of its claims', () => {
    expect(FIELD.bonds.length).toBeGreaterThanOrEqual(2 * 10);
  });

  it('keeps atoms apart, clear of the keep-clear areas, and on the canvas give or take its bleed', () => {
    const { width, height, keepClear = [] } = OPTIONS;
    const offCanvas = FIELD.atoms.filter(
      ({ x, y }) =>
        x < -0.05 * width ||
        x > 1.05 * width ||
        y < -0.05 * height ||
        y > 1.05 * height,
    );
    expect(offCanvas).toEqual([]);
    const inKeepClear = FIELD.atoms.filter((atom) =>
      keepClear.some((rect) => distanceToRect(atom, rect) < atom.size / 2),
    );
    expect(inKeepClear).toEqual([]);
    const crowded = FIELD.atoms.flatMap((atom) =>
      FIELD.atoms.filter(
        (other) =>
          other !== atom &&
          Math.hypot(other.x - atom.x, other.y - atom.y) <
            (1.6 * (atom.size + other.size)) / 2,
      ),
    );
    expect(crowded).toEqual([]);
  });

  it('bonds a predicate to each side, and a bridge object to two predicates', () => {
    const bonds = bondsOf(FIELD);
    const partnersOf = (atom: FieldAtom) =>
      bonds.flatMap(({ a, b }) => (a === atom ? [b] : b === atom ? [a] : []));
    const notOnePredicate = bonds.filter(
      ({ a, b }) =>
        [a.role, b.role].filter((role) => role === 'predicate').length !== 1,
    );
    expect(notOnePredicate).toEqual([]);
    const wrongCount = FIELD.atoms.filter(
      (atom) =>
        partnersOf(atom).length !==
        (atom.role === 'predicate' || atom.role === 'bridge' ? 2 : 1),
    );
    expect(wrongCount).toEqual([]);
    const bridges = FIELD.atoms.filter(({ role }) => role === 'bridge');
    expect(bridges.length).toBeGreaterThan(0);
    expect(
      bridges.filter(
        (bridge) =>
          !partnersOf(bridge).every(({ role }) => role === 'predicate'),
      ),
    ).toEqual([]);
  });

  it('lays each triple level, two sizes apart, and rises a bridged one straight up, 96 ÷ 34 sizes a row', () => {
    const notLaidOut = bondsOf(FIELD).filter(({ a, b }) => {
      const isLevel =
        a.y === b.y && Math.abs(Math.abs(b.x - a.x) - 2 * a.size) < 1e-9;
      const rises =
        a.x === b.x && Math.abs(a.y - b.y - (96 / 34) * a.size) < 1e-9;
      return !(isLevel || rises);
    });
    expect(notLaidOut).toEqual([]);
    // A triple rises only from a bridge object.
    const risesFrom = bondsOf(FIELD)
      .filter(({ a, b }) => a.x === b.x && a.role !== 'predicate')
      .map(({ a }) => a.role);
    expect(new Set(risesFrom)).toEqual(new Set(['bridge']));
  });

  it('crosses no bond with another', () => {
    const bonds = bondsOf(FIELD);
    for (const bond of bonds) {
      for (const other of bonds) {
        expect(segmentsCross(bond.a, bond.b, other.a, other.b)).toBe(false);
      }
    }
  });
});

describe('chainAtoms', () => {
  it('stands every atom upright and bonds each to the next', () => {
    const chain = chainAtoms(
      [
        { x: 0, y: 0 },
        { x: 80, y: 0 },
        { x: 160, y: 0 },
        { x: 160, y: -113 },
        { x: 160, y: -226 },
      ],
      ['identity', 'predicate', 'bridge', 'predicate', 'object'],
      40,
    );
    // No atom carries a turn: the triangle's point is up, the hexagon's
    // points left and right, as drawn.
    for (const atom of chain.atoms) {
      expect(Object.keys(atom).sort()).toEqual(['role', 'size', 'x', 'y']);
    }
    expect(chain.bonds).toEqual([
      { from: 0, to: 1 },
      { from: 1, to: 2 },
      { from: 2, to: 3 },
      { from: 3, to: 4 },
    ]);
  });

  it('wants a role for every point', () => {
    expect(() => chainAtoms([{ x: 0, y: 0 }], [], 10)).toThrow(/one of each/);
  });
});

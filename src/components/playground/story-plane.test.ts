import { describe, expect, it } from 'vitest';

import type { AtomId } from './story-model';
import {
  ATOM_BOTTOM,
  ATOM_TOP,
  layoutPlane,
  PLANE,
  type PlaneBranch,
  type PlaneClaim,
  type PlaneList,
  planeAt,
  type PlaneTerm,
  type PlaneVaults,
  planeSentence,
} from './story-plane';

const LABELS: Partial<Record<AtomId, string>> = {
  elonMusk: 'Elon Musk',
  believes: 'believes',
  spacex: 'SpaceX',
  willBeWorth: 'will be worth',
  ordersOfMagnitude: 'orders of magnitude',
  moreThan: 'more than',
  currentEarthEconomy: 'current Earth economy',
};
const labelOf = (atom: AtomId): string => LABELS[atom] ?? atom;
/** About seven pixels a letter. */
const measure = (atom: AtomId): number => labelOf(atom).length * 7;

const DEEPEST: PlaneTerm = {
  triple: {
    id: 'belief',
    subject: { atom: 'elonMusk' },
    predicate: 'believes',
    object: {
      triple: {
        id: 'worth',
        subject: { atom: 'spacex' },
        predicate: 'willBeWorth',
        object: {
          triple: {
            id: 'more',
            subject: { atom: 'ordersOfMagnitude' },
            predicate: 'moreThan',
            object: { atom: 'currentEarthEconomy' },
          },
        },
      },
    },
  },
};

const READING_ORDER: AtomId[] = [
  'elonMusk',
  'believes',
  'spacex',
  'willBeWorth',
  'ordersOfMagnitude',
  'moreThan',
  'currentEarthEconomy',
];

describe('layoutPlane', () => {
  it('lays a lone atom out as its shape over its name, framed by nothing', () => {
    const layout = layoutPlane({ atom: 'elonMusk' }, measure);

    expect(layout.frames).toEqual([]);
    expect(layout.atoms).toEqual([
      {
        id: 'elonMusk',
        role: 'identity',
        x: layout.width / 2,
        y: 0,
        width: measure('elonMusk') + PLANE.badge.padding * 2,
      },
    ]);
    expect(layout.top).toBe(ATOM_TOP);
    expect(layout.bottom).toBe(ATOM_BOTTOM);
  });

  it('puts the atoms on one line in the order the claim reads', () => {
    const { atoms } = layoutPlane(DEEPEST, measure);

    expect(atoms.map((atom) => atom.id)).toEqual(READING_ORDER);
    // Names never meet: there is room for the line between them.
    const gaps = atoms
      .slice(1)
      .map(
        (next, index) =>
          next.x -
          next.width / 2 -
          ((atoms[index]?.x ?? 0) + (atoms[index]?.width ?? 0) / 2),
      );
    expect(Math.min(...gaps)).toBeGreaterThanOrEqual(PLANE.gap);
  });

  it('frames only the triples inside the claim, each inside the one that holds it', () => {
    const { frames, atoms } = layoutPlane(DEEPEST, measure);
    const [worth, more] = frames;
    if (worth === undefined || more === undefined) {
      throw new Error('A frame is missing');
    }
    const atomX = (id: AtomId): number =>
      atoms.find((atom) => atom.id === id)?.x ?? Number.NaN;

    expect(frames.map((frame) => frame.id)).toEqual(['worth', 'more']);
    expect(worth.x).toBeLessThan(more.x);
    expect(worth.x + worth.width).toBeGreaterThan(more.x + more.width);
    expect(worth.top).toBeLessThan(more.top);
    expect(worth.bottom).toBeGreaterThan(more.bottom);
    expect(more.top).toBeLessThan(ATOM_TOP);
    expect(more.bottom).toBeGreaterThan(ATOM_BOTTOM);
    // SpaceX is in the outer of the two, orders of magnitude in both.
    expect(atomX('spacex')).toBeGreaterThan(worth.x);
    expect(atomX('spacex')).toBeLessThan(more.x);
    expect(atomX('ordersOfMagnitude')).toBeGreaterThan(more.x);
  });

  it('gives each atom its role, and each inner triple the role it fills', () => {
    const { atoms, frames } = layoutPlane(DEEPEST, measure);
    const role = (id: AtomId) => atoms.find((atom) => atom.id === id)?.role;

    expect(role('elonMusk')).toBe('identity');
    expect(role('believes')).toBe('predicate');
    expect(role('spacex')).toBe('identity');
    expect(role('ordersOfMagnitude')).toBe('identity');
    expect(role('currentEarthEconomy')).toBe('object');
    expect(frames.map((frame) => frame.role)).toEqual(['object', 'object']);
  });

  it('draws each triple from its subject to its object, ending at the frame of a triple in the object place', () => {
    const { links } = layoutPlane(DEEPEST, measure);

    expect(links).toEqual([
      { id: 'belief:0', from: { atom: 'elonMusk' }, to: { atom: 'believes' } },
      { id: 'belief:1', from: { atom: 'believes' }, to: { frame: 'worth' } },
      { id: 'worth:0', from: { atom: 'spacex' }, to: { atom: 'willBeWorth' } },
      { id: 'worth:1', from: { atom: 'willBeWorth' }, to: { frame: 'more' } },
      {
        id: 'more:0',
        from: { atom: 'ordersOfMagnitude' },
        to: { atom: 'moreThan' },
      },
      {
        id: 'more:1',
        from: { atom: 'moreThan' },
        to: { atom: 'currentEarthEconomy' },
      },
    ]);
  });
});

describe('a branch', () => {
  const ESTIMATE: PlaneBranch = {
    id: 'estimate',
    subject: { atom: 'currentEarthEconomy' },
    predicate: 'estimatedAt',
    object: 'hundredTrillion',
  };

  it('rises from its subject in a column, and makes the subject both roles', () => {
    const plain = layoutPlane(DEEPEST, measure);
    const layout = layoutPlane(DEEPEST, measure, { branches: [ESTIMATE] });
    const atom = (id: AtomId) => layout.atoms.find((a) => a.id === id);
    const economy = atom('currentEarthEconomy');

    // Their names beside them, so the line up through them stays clear.
    expect(atom('estimatedAt')).toMatchObject({
      role: 'predicate',
      x: economy?.x,
      y: -PLANE.branchStep,
      nameSide: 'right',
    });
    expect(atom('hundredTrillion')).toMatchObject({
      role: 'object',
      x: economy?.x,
      y: -PLANE.branchStep * 2,
      nameSide: 'right',
    });
    expect(economy?.nameSide).toBeUndefined();
    expect(economy?.role).toBe('subjectAndObject');
    expect(layout.links.slice(-2)).toEqual([
      {
        id: 'estimate:0',
        from: { atom: 'currentEarthEconomy' },
        to: { atom: 'estimatedAt' },
      },
      {
        id: 'estimate:1',
        from: { atom: 'estimatedAt' },
        to: { atom: 'hundredTrillion' },
      },
    ]);
    // The rest of the claim is where it was; there is more of it above.
    expect(layout.width).toBe(plain.width);
    expect(layout.top).toBeLessThan(plain.top);
    expect(layout.bottom).toBe(plain.bottom);
  });

  it('grows after the claim makes room: atoms, then lines, then the new role', () => {
    const measureText = (text: string): number => text.length * 7;
    const at = (t: number) =>
      planeAt(
        { term: DEEPEST },
        { term: DEEPEST, branches: [ESTIMATE] },
        t,
        measureText,
        labelOf,
      );
    const atom = (plane: ReturnType<typeof at>, id: AtomId) =>
      plane.atoms.find((a) => a.id === id);
    const link = (plane: ReturnType<typeof at>, id: string) =>
      plane.links.find((l) => l.id === id);

    // The room above grows first.
    expect(at(0.3).top).toBeLessThan(at(0).top);
    expect(atom(at(0.3), 'estimatedAt')?.presence).toBe(0);
    // Then the atoms, then the lines up to them.
    expect(atom(at(0.6), 'hundredTrillion')?.presence).toBe(1);
    expect(link(at(0.6), 'estimate:0')?.presence).toBe(0);
    expect(link(at(0.85), 'estimate:1')?.presence).toBe(1);
    // Then the current Earth economy takes both roles.
    expect(atom(at(0.85), 'currentEarthEconomy')).toMatchObject({
      fromRole: 'object',
      role: 'subjectAndObject',
      roleProgress: 0,
    });
    expect(atom(at(1), 'currentEarthEconomy')?.roleProgress).toBe(1);
  });
});

describe('a branch from a whole claim', () => {
  const SOURCE: PlaneBranch = {
    id: 'source',
    subject: { frame: 'belief' },
    predicate: 'willBeWorth',
    object: 'currentEarthEconomy',
  };
  const measureText = (text: string): number => text.length * 7;

  it('frames the whole claim, and rises from the middle of the frame', () => {
    const layout = layoutPlane(
      { atom: 'elonMusk' } satisfies PlaneTerm,
      measure,
    );
    const framed = layoutPlane(
      {
        triple: {
          id: 'belief',
          subject: { atom: 'elonMusk' },
          predicate: 'believes',
          object: { atom: 'spacex' },
        },
      },
      measure,
      { frame: 'object', branches: [SOURCE] },
    );
    const frame = framed.frames.find((candidate) => candidate.id === 'belief');
    const predicate = framed.atoms.find((atom) => atom.id === 'willBeWorth');

    expect(layout.frames).toEqual([]);
    expect(frame).toMatchObject({ role: 'object', x: 0, width: framed.width });
    expect(predicate?.x).toBeCloseTo((frame?.width ?? 0) / 2, 9);
    expect(predicate?.y).toBeLessThan(frame?.top ?? 0);
    expect(framed.links.find((link) => link.id === 'source:0')?.from).toEqual({
      frame: 'belief',
      isTop: true,
    });
  });

  it('stands side by side columns on the same rows', () => {
    const ESTIMATE: PlaneBranch = {
      id: 'estimate',
      subject: { atom: 'currentEarthEconomy' },
      predicate: 'believes',
      object: 'elonMusk',
    };
    const layout = layoutPlane(DEEPEST, measure, {
      frame: 'object',
      branches: [ESTIMATE, SOURCE],
    });
    const y = (id: AtomId) => layout.atoms.find((atom) => atom.id === id)?.y;

    expect(y('believes')).toBe(y('willBeWorth'));
    expect(y('elonMusk')).toBe(y('currentEarthEconomy'));
  });

  it('stands a column, from the start, on the rows it will share with those to come', () => {
    const ESTIMATE: PlaneBranch = {
      id: 'estimate',
      subject: { atom: 'currentEarthEconomy' },
      predicate: 'believes',
      object: 'elonMusk',
    };
    const fit: PlaneClaim = {
      term: DEEPEST,
      frame: 'object',
      branches: [ESTIMATE, SOURCE],
    };
    const estimated: PlaneClaim = { term: DEEPEST, branches: [ESTIMATE] };
    const y = (plane: ReturnType<typeof planeAt>, id: AtomId) =>
      plane.atoms.find((atom) => atom.id === id)?.y;
    const first = planeAt(
      { term: DEEPEST },
      estimated,
      1,
      measureText,
      labelOf,
      fit,
    );
    const then = planeAt(estimated, fit, 0.5, measureText, labelOf, fit);

    // Already as high as beside the column rising from the frame.
    expect(y(first, 'believes')).toBe(y(then, 'willBeWorth'));
    // And nothing in it moves as the other rises beside it.
    expect(y(then, 'believes')).toBe(y(first, 'believes'));
    expect(y(then, 'elonMusk')).toBe(y(first, 'elonMusk'));
    expect(then.top).toBe(first.top);
  });

  it('moves the claim into place, then forms the frame, then grows what rises from it', () => {
    const from: PlaneClaim = { term: DEEPEST };
    const to: PlaneClaim = {
      term: DEEPEST,
      frame: 'object',
      branches: [SOURCE],
    };
    const at = (t: number) => planeAt(from, to, t, measureText, labelOf);
    const frame = (plane: ReturnType<typeof at>) =>
      plane.frames.find((candidate) => candidate.id === 'belief');

    expect(frame(at(0.3))?.presence).toBe(0);
    expect(frame(at(0.5))?.presence).toBe(1);
    expect(at(0.5).links.find((link) => link.id === 'source:0')?.presence).toBe(
      0,
    );
    expect(
      at(0.92).links.find((link) => link.id === 'source:1')?.presence,
    ).toBe(1);
  });
});

describe("a triple's vaults", () => {
  const measureText = (text: string): number => text.length * 7;
  const ESTIMATE: PlaneBranch = {
    id: 'estimate',
    subject: { atom: 'currentEarthEconomy' },
    predicate: 'estimatedAt',
    object: 'hundredTrillion',
  };
  const SOURCE: PlaneBranch = {
    id: 'source',
    subject: { frame: 'belief' },
    predicate: 'sourcedBy',
    object: 'tweet',
  };
  const POSITIONS: PlaneVaults = {
    frame: 'belief',
    against: [400, 200, 20],
    for: [200, 150, 80],
  };
  const SOURCED: PlaneClaim = {
    term: DEEPEST,
    frame: 'object',
    branches: [ESTIMATE, SOURCE],
  };
  const HUNG: PlaneClaim = {
    term: DEEPEST,
    frame: 'object',
    vaults: POSITIONS,
  };
  const WEIGHED: PlaneClaim = {
    ...HUNG,
    vaults: { ...POSITIONS, isWeighed: true, isSided: true },
  };
  const hanging = (t: number) =>
    planeAt(SOURCED, HUNG, t, measureText, labelOf, WEIGHED);
  const weighing = (t: number) =>
    planeAt(HUNG, WEIGHED, t, measureText, labelOf, WEIGHED);

  it('hangs from the middle of the bottom of its frame, splits in two, and reaches three people on each side', () => {
    const layout = layoutPlane(DEEPEST, measure, {
      frame: 'object',
      vaults: POSITIONS,
    });
    const frame = layout.frames.find((candidate) => candidate.id === 'belief');
    const [trunk, ...rest] = layout.vaultLines;

    expect(trunk?.from).toEqual({
      x: (frame?.x ?? 0) + (frame?.width ?? 0) / 2,
      y: frame?.bottom,
    });
    expect(trunk?.side).toBeNull();
    expect(rest.filter((line) => line.from === trunk?.to)).toHaveLength(2);
    // Against on the left, for on the right, each person's position on
    // their line, left to right as given.
    const people = layout.people.toSorted((a, b) => a.x - b.x);
    expect(people.map((person) => person.side)).toEqual([
      'against',
      'against',
      'against',
      'for',
      'for',
      'for',
    ]);
    expect(
      people.map(
        (person) =>
          layout.vaultLines.find((line) => line.id === person.id)?.weight
            ?.value,
      ),
    ).toEqual([400, 200, 20, 200, 150, 80]);
    expect(layout.bottom).toBe(
      Math.max(...people.map((person) => person.y)) + PLANE.atomSize / 2,
    );
  });

  it('is as tall as the claim rising from the top, so the plane keeps its zoom from chapter to chapter', () => {
    const sourced = planeAt(null, SOURCED, 1, measureText, labelOf, SOURCED);
    const hung = hanging(1);

    expect((hung.fit?.bottom ?? 0) - (hung.fit?.top ?? 0)).toBeCloseTo(
      (sourced.fit?.bottom ?? 0) - (sourced.fit?.top ?? 0),
      9,
    );
    expect(hung.fit?.width).toBeCloseTo(sourced.fit?.width ?? 0, 9);
    // Every atom of the claim where it stood.
    for (const [id, x] of hung.fit?.xs ?? []) {
      expect(sourced.fit?.xs.get(id)).toBe(x);
    }
  });

  it('starts where the last chapter left the plane', () => {
    const left = planeAt(
      { term: DEEPEST, branches: [ESTIMATE] },
      SOURCED,
      1,
      measureText,
      labelOf,
      SOURCED,
    );
    const start = hanging(0);
    const place = (plane: ReturnType<typeof hanging>) =>
      plane.atoms.map(({ id, x, y, presence }) => ({ id, x, y, presence }));

    expect(place(start)).toEqual(place(left));
    expect([start.top, start.bottom]).toEqual([left.top, left.bottom]);
    expect(start.people.every((person) => person.presence === 0)).toBe(true);
    expect(start.vaultLines.every((line) => line.presence === 0)).toBe(true);
  });

  it('at once takes away what rose from it and moves it up; then the people arrive, then the lines grow down to them', () => {
    const atom = (plane: ReturnType<typeof hanging>, id: AtomId) =>
      plane.atoms.find((candidate) => candidate.id === id);
    const middle = (plane: ReturnType<typeof hanging>) =>
      (plane.top + plane.bottom) / 2;
    const halfway = hanging(0.17);

    // Together: what rose from it goes, the current Earth economy turns
    // back into a square, and the claim moves up, the plane's middle lower
    // on it.
    expect(atom(halfway, 'tweet')?.presence).toBeGreaterThan(0);
    expect(atom(halfway, 'tweet')?.presence).toBeLessThan(1);
    expect(atom(halfway, 'currentEarthEconomy')?.roleProgress).toBeGreaterThan(
      0,
    );
    expect(middle(halfway)).toBeGreaterThan(middle(hanging(0)));
    expect(middle(halfway)).toBeLessThan(middle(hanging(0.35)));
    expect(atom(hanging(0.35), 'tweet')?.presence).toBe(0);
    expect(atom(hanging(0.35), 'currentEarthEconomy')).toMatchObject({
      fromRole: 'subjectAndObject',
      role: 'object',
      roleProgress: 1,
    });
    expect(middle(hanging(0.35))).toBe(middle(hanging(1)));
    expect(hanging(0.35).people.every((person) => person.presence === 0)).toBe(
      true,
    );
    // The people, then the lines.
    expect(hanging(0.55).people.every((person) => person.presence === 1)).toBe(
      true,
    );
    expect(hanging(0.6).vaultLines.every((line) => line.presence === 0)).toBe(
      true,
    );
    expect(hanging(0.95).vaultLines.every((line) => line.presence === 1)).toBe(
      true,
    );
    // Grey until weighed.
    expect(
      hanging(1).vaultLines.every(
        (line) => line.sided === 0 && line.weighed === 0,
      ),
    ).toBe(true);
  });

  it('grows each line once the one it leaves from is drawn', () => {
    const early: string[] = [];
    for (let step = 0; step <= 60; step++) {
      const lines = hanging(0.6 + (0.4 * step) / 60).vaultLines;
      for (const line of lines) {
        const parent = lines.find(
          (candidate) =>
            candidate.to.x === line.from.x && candidate.to.y === line.from.y,
        );
        if (line.presence > 0 && (parent?.presence ?? 1) < 1) {
          early.push(line.id);
        }
      }
    }

    expect(early).toEqual([]);
    expect(hanging(0.7).vaultLines.map((line) => line.presence)).toContain(1);
    expect(hanging(0.7).vaultLines.map((line) => line.presence)).toContain(0);
  });

  it('shows the positions, then the side each line leads to', () => {
    const line = (plane: ReturnType<typeof weighing>) =>
      plane.vaultLines.find((candidate) => candidate.id === 'belief:against:0');

    expect(line(weighing(0))).toMatchObject({ weighed: 0, sided: 0 });
    expect(line(weighing(0.4))).toMatchObject({ weighed: 1, sided: 0 });
    expect(line(weighing(1))).toMatchObject({ weighed: 1, sided: 1 });
    // Nothing else moves.
    expect(weighing(0.5).atoms).toEqual(weighing(0).atoms);
    expect(weighing(0.5).people).toEqual(weighing(0).people);
  });
});

describe('a list', () => {
  const measureText = (text: string): number => text.length * 7;
  const BEST: PlaneList = {
    id: 'best',
    members: [
      { atom: 'xai', weight: 780 },
      { atom: 'openai', weight: 910 },
      { atom: 'anthropic', weight: 640 },
    ],
    predicate: 'best',
    object: 'aiCompany',
    isWeighed: true,
  };
  const LISTED: PlaneClaim = { term: { list: BEST } };
  const RANKED: PlaneClaim = { term: { list: { ...BEST, isRanked: true } } };
  const atom = <T extends { id: AtomId }>(
    layout: { atoms: readonly T[] },
    id: AtomId,
  ): T | undefined => layout.atoms.find((candidate) => candidate.id === id);

  it('stands its members in a column, names to their left, the one predicate and the one object across from them', () => {
    const layout = layoutPlane(LISTED.term, measure);
    const members = ['xai', 'openai', 'anthropic'] as const;
    const ys = members.map((id) => atom(layout, id)?.y ?? Number.NaN);

    expect(new Set(members.map((id) => atom(layout, id)?.x)).size).toBe(1);
    expect(ys).toEqual([-PLANE.list.rowStep, 0, PLANE.list.rowStep]);
    expect(members.every((id) => atom(layout, id)?.nameSide === 'left')).toBe(
      true,
    );
    expect(atom(layout, 'best')).toMatchObject({ role: 'predicate', y: 0 });
    expect(atom(layout, 'aiCompany')).toMatchObject({ role: 'object', y: 0 });
    // Its lines are the triples' own, out of the cloud: it adds only each
    // one's weight, on the line from its member to the predicate.
    expect(layout.links).toEqual([]);
    expect(
      layout.weights.map(({ from, to, value }) => [from, to, value]),
    ).toEqual([
      ['xai', 'best', 780],
      ['openai', 'best', 910],
      ['anthropic', 'best', 640],
    ]);
  });

  it('ranks its members by weight, the heaviest on top, each keeping its weight', () => {
    const layout = layoutPlane(RANKED.term, measure);

    expect(
      ['openai', 'xai', 'anthropic'].map((id) => atom(layout, id as AtomId)?.y),
    ).toEqual([-PLANE.list.rowStep, 0, PLANE.list.rowStep]);
    expect(layout.weights).toEqual(layoutPlane(LISTED.term, measure).weights);
  });

  it('opens with every atom at once, then shows the weights', () => {
    const at = (t: number) => planeAt(null, LISTED, t, measureText, labelOf);

    expect(
      at(0.3).atoms.every(
        (made) => made.presence === at(0.3).atoms[0]?.presence,
      ),
    ).toBe(true);
    expect(at(0.55).atoms.every((made) => made.presence === 1)).toBe(true);
    expect(at(0.65).weights.every((weight) => weight.weighed === 0)).toBe(true);
    expect(at(0.9).weights.every((weight) => weight.weighed === 1)).toBe(true);
  });

  it('moves the members into order, and nothing else', () => {
    const at = (t: number) => planeAt(LISTED, RANKED, t, measureText, labelOf);
    const y = (plane: ReturnType<typeof at>, id: AtomId) =>
      plane.atoms.find((made) => made.id === id)?.y ?? Number.NaN;

    expect(y(at(0.5), 'openai')).toBeLessThan(0);
    expect(y(at(0.5), 'openai')).toBeGreaterThan(-PLANE.list.rowStep);
    expect(y(at(1), 'openai')).toBe(-PLANE.list.rowStep);
    expect(at(0.5).weights.every((weight) => weight.weighed === 1)).toBe(true);
    expect(atom(at(0.5), 'best')).toMatchObject({ presence: 1 });
  });

  it('ranks its members once they stand in order, and their ranks go first as it closes', () => {
    const ranking = (t: number) =>
      planeAt(LISTED, RANKED, t, measureText, labelOf);
    const closing = (t: number) =>
      planeAt(RANKED, null, t, measureText, labelOf);
    const member = (plane: ReturnType<typeof ranking>, id: AtomId) =>
      plane.atoms.find((made) => made.id === id);

    expect(member(ranking(1), 'openai')).toMatchObject({ rank: 0, ranked: 1 });
    expect(member(ranking(1), 'anthropic')).toMatchObject({ rank: 2 });
    expect(member(ranking(1), 'best')?.rank).toBeUndefined();
    // Not while they move.
    expect(member(ranking(0.7), 'openai')?.ranked).toBe(0);
    expect(member(closing(0.225), 'openai')?.ranked).toBe(0);
    expect(member(closing(0.225), 'openai')?.presence).toBeGreaterThan(0);
  });

  it('closes: its weights and its atoms go', () => {
    const at = (t: number) => planeAt(RANKED, null, t, measureText, labelOf);

    expect(at(0).weights.every((weight) => weight.weighed === 1)).toBe(true);
    expect(at(0.225).weights.every((weight) => weight.weighed === 0)).toBe(
      true,
    );
    expect(at(0.225).atoms.every((made) => made.presence > 0)).toBe(true);
    expect(at(0.45).atoms.every((made) => made.presence === 0)).toBe(true);
  });
});

describe('planeSentence', () => {
  it('says a claim in words, each inner triple in brackets', () => {
    expect(planeSentence(DEEPEST, labelOf)).toBe(
      'Elon Musk believes (SpaceX will be worth (orders of magnitude more than current Earth economy))',
    );
  });
});

describe('planeAt', () => {
  const measureText = (text: string): number => text.length * 7;
  const at = (from: PlaneClaim | null, to: PlaneClaim | null, t: number) =>
    planeAt(from, to, t, measureText, labelOf);
  const SPELLED: AtomId[] = READING_ORDER.slice(2);
  const FOLDED: PlaneClaim = {
    term: DEEPEST,
    spelled: SPELLED,
    folded: ['worth'],
  };
  const DIVIDED: PlaneClaim = { term: DEEPEST, spelled: SPELLED };
  const MADE: PlaneClaim = { term: DEEPEST };
  const ELON: PlaneClaim = { term: { atom: 'elonMusk' } };
  const BELIEF: PlaneClaim = {
    term: {
      triple: {
        id: 'belief',
        subject: { atom: 'elonMusk' },
        predicate: 'believes',
        object: { atom: 'spacex' },
      },
    },
  };
  const atom = (plane: ReturnType<typeof at>, id: AtomId) =>
    plane.atoms.find((candidate) => candidate.id === id);
  const words = (plane: ReturnType<typeof at>, id: string) =>
    plane.words.find((candidate) => candidate.id === id);
  const frame = (plane: ReturnType<typeof at>, id: string) =>
    plane.frames.find((candidate) => candidate.id === id);
  const link = (plane: ReturnType<typeof at>, id: string) =>
    plane.links.find((candidate) => candidate.id === id);

  it('grows new lines one after another, from the subject on, as one stroke', () => {
    // The words made atoms, the triples inside the frame get their lines:
    // SpaceX to will be worth to its frame, then orders of magnitude to more
    // than to the current Earth economy.
    const isNew = new Set(
      at(DIVIDED, MADE, 0)
        .links.filter((line) => line.presence === 0)
        .map((line) => line.id),
    );
    const grown = (t: number): number[] =>
      at(DIVIDED, MADE, t)
        .links.filter((line) => isNew.has(line.id))
        .map((line) => line.presence);

    expect(isNew.size).toBeGreaterThan(1);
    for (let step = 0; step <= 50; step++) {
      const presences = grown(step / 50);
      // Each starts only once the one before it is done: never two at once.
      const isEarly = presences
        .slice(1)
        .some((presence, index) => presence > 0 && presences[index] !== 1);
      expect(isEarly).toBe(false);
    }
    // Part way, the first has reached its predicate and the last not begun.
    const halfway = grown(0.8);
    expect(halfway[0]).toBe(1);
    expect(halfway.at(-1)).toBe(0);
    expect(grown(1).every((presence) => presence === 1)).toBe(true);
  });

  it('opens on its first atom, then shows the rest, then joins them', () => {
    const leading = at(null, FOLDED, 0.4);
    const shown = at(null, FOLDED, 0.8);
    const joined = at(null, FOLDED, 1);

    // Elon Musk first, alone.
    expect(atom(leading, 'elonMusk')?.presence).toBeGreaterThan(0);
    expect(atom(leading, 'believes')?.presence).toBe(0);
    expect(frame(leading, 'worth')?.presence).toBe(0);
    expect(words(leading, 'spacex')?.alpha).toBe(0);
    // Then believes, a predicate already, and the rest of the claim as one
    // line of words in its frame, the object; no line yet.
    expect(atom(shown, 'believes')).toMatchObject({
      presence: 1,
      fromRole: 'predicate',
      role: 'predicate',
    });
    expect(frame(shown, 'worth')?.presence).toBe(1);
    expect(frame(shown, 'more')).toBeUndefined();
    expect(words(shown, 'spacex')?.alpha).toBe(1);
    expect(link(shown, 'belief:0')?.presence).toBe(0);
    // Then the lines: to believes, and from it to the frame. None to a word.
    expect(link(joined, 'belief:0')?.presence).toBe(1);
    expect(link(joined, 'belief:1')).toMatchObject({
      to: { frame: 'worth' },
      presence: 1,
    });
    expect(joined.links).toHaveLength(2);
  });

  it('breaks the words in the frame apart, then frames the claim inside it', () => {
    const broken = at(FOLDED, DIVIDED, 0.45);
    const framed = at(FOLDED, DIVIDED, 1);
    const gap = (plane: ReturnType<typeof at>): number =>
      (words(plane, 'willBeWorth')?.x ?? 0) -
      measureText('will be worth') / 2 -
      ((words(plane, 'spacex')?.x ?? 0) + measureText('SpaceX') / 2);

    expect(gap(broken)).toBeGreaterThan(gap(at(FOLDED, DIVIDED, 0)));
    expect(frame(broken, 'more')?.presence).toBe(0);
    expect(frame(framed, 'more')?.presence).toBe(1);
    // Each word stands where its atom will, and the frames are as wide as
    // they will be, but only a line of words high: making them atoms brings
    // the words down, and only then do the frames grow to hold them.
    const made = at(DIVIDED, MADE, 1);
    for (const id of SPELLED) {
      expect(words(framed, id)?.x).toBeCloseTo(atom(made, id)?.x ?? 0, 9);
    }
    for (const id of ['worth', 'more']) {
      expect(frame(framed, id)).toMatchObject({
        x: frame(made, id)?.x,
        width: frame(made, id)?.width,
      });
      expect(frame(framed, id)?.bottom).toBeLessThan(
        frame(made, id)?.bottom ?? 0,
      );
    }
    // Still words: no new atom, and only the lines already there.
    expect(framed.atoms.map((made) => made.id)).toEqual([
      'elonMusk',
      'believes',
    ]);
    expect(framed.links.map((line) => [line.id, line.presence])).toEqual([
      ['belief:0', 1],
      ['belief:1', 1],
    ]);
  });

  it('moves the words down, makes them atoms in their shapes, names them with their words, then joins them', () => {
    const down = at(DIVIDED, MADE, 0.15);
    const made = at(DIVIDED, MADE, 0.55);
    const named = at(DIVIDED, MADE, 0.65);
    const joined = at(DIVIDED, MADE, 0.95);

    // Straight down to where the names go, before any atom shows.
    expect(words(down, 'willBeWorth')?.x).toBe(
      words(at(DIVIDED, MADE, 0), 'willBeWorth')?.x,
    );
    expect(words(down, 'willBeWorth')?.y).toBeGreaterThan(0);
    expect(words(down, 'willBeWorth')?.x).toBeCloseTo(
      atom(down, 'willBeWorth')?.x ?? 0,
      9,
    );
    expect(atom(down, 'willBeWorth')?.presence).toBe(0);
    // The atoms come in their shapes, with no name of their own: the word
    // in place is the name, and grows its pill.
    expect(atom(made, 'willBeWorth')).toMatchObject({
      presence: 1,
      fromRole: 'predicate',
      role: 'predicate',
      named: 0,
    });
    expect(words(made, 'willBeWorth')?.alpha).toBe(1);
    expect(words(made, 'willBeWorth')?.pill).toBeLessThan(1);
    expect(words(named, 'willBeWorth')).toMatchObject({ alpha: 1, pill: 1 });
    expect(link(named, 'worth:0')?.presence).toBe(0);
    // The line to the frame was there all along, and stays.
    expect(link(down, 'belief:1')?.presence).toBe(1);
    // Then the new lines, to the frame where a whole triple is the object.
    expect(link(joined, 'worth:1')).toMatchObject({
      to: { frame: 'more' },
      presence: 1,
    });
    expect(link(joined, 'more:1')?.presence).toBe(1);
  });

  it('stands every step where the claim it builds to will stand, sized by that claim', () => {
    const fit: PlaneClaim = { term: DEEPEST, frame: 'object' };
    const steps = [
      planeAt(null, FOLDED, 1, measureText, labelOf, fit),
      planeAt(FOLDED, DIVIDED, 1, measureText, labelOf, fit),
      planeAt(DIVIDED, MADE, 1, measureText, labelOf, fit),
    ];
    const last = planeAt(MADE, fit, 1, measureText, labelOf, fit);
    const elon = (plane: ReturnType<typeof at>) =>
      plane.atoms.find((made) => made.id === 'elonMusk')?.x ?? Number.NaN;

    for (const step of steps) {
      // Elon Musk never moves; the claim only grows to the right.
      expect(elon(step)).toBeCloseTo(elon(last), 9);
      expect(step.left).toBeGreaterThanOrEqual(last.left);
      expect(step.fit).toEqual(last.fit);
    }
    expect(last.fit?.width).toBeCloseTo(last.right - last.left, 9);
  });

  it('grows a claim in order: room, then atoms, then lines', () => {
    const moving = at(ELON, BELIEF, 0.2);
    const arriving = at(ELON, BELIEF, 0.5);
    const connecting = at(ELON, BELIEF, 0.75);

    expect(atom(moving, 'elonMusk')?.x).toBeLessThan(0);
    expect(atom(moving, 'believes')?.presence).toBe(0);
    expect(atom(arriving, 'believes')?.presence).toBeGreaterThan(0);
    expect(link(arriving, 'belief:0')?.presence).toBe(0);
    expect(atom(connecting, 'spacex')?.presence).toBe(1);
    expect(link(connecting, 'belief:0')?.presence).toBeGreaterThan(0);
  });
});

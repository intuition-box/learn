import { describe, expect, it } from 'vitest';

import { VAULT_ICON, VAULT_SIZE } from '@/lib/icons';

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
  STILL_LINE,
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
    vaults: { ...POSITIONS, isWeighed: true, isTotalled: true },
  };
  const hanging = (t: number) =>
    planeAt(SOURCED, HUNG, t, measureText, labelOf, WEIGHED);
  const weighing = (t: number) =>
    planeAt(HUNG, WEIGHED, t, measureText, labelOf, WEIGHED);

  it('hangs from the middle of the bottom of its frame through one vault, splits in two, and reaches three people on each side', () => {
    const layout = layoutPlane(DEEPEST, measure, {
      frame: 'object',
      vaults: POSITIONS,
    });
    const frame = layout.frames.find((candidate) => candidate.id === 'belief');
    const [trunk, ...rest] = layout.vaultLines;
    const [vault] = layout.vaults;
    // Where a line meets one of the vault's faces, on the plane.
    const { box, ports, size } = VAULT_ICON;
    const port = (face: keyof typeof ports) => ({
      x:
        (vault?.x ?? 0) +
        (ports[face].x - (box.x + box.width / 2)) * (VAULT_SIZE / size),
      y:
        (vault?.y ?? 0) +
        (ports[face].y - (box.y + box.height / 2)) * (VAULT_SIZE / size),
    });

    // One vault, under the middle of the frame. From the people up: the
    // trunk leaves the top of the vault and ends at the middle of the
    // bottom of the frame; every person's line ends at the vault's face
    // for their side, and a side's lines run together from where they meet.
    expect(layout.vaults).toHaveLength(1);
    expect(vault?.x).toBe((frame?.x ?? 0) + (frame?.width ?? 0) / 2);
    expect(trunk?.points[0]).toEqual(port('subject'));
    expect(trunk?.points.at(-1)).toEqual({
      x: (frame?.x ?? 0) + (frame?.width ?? 0) / 2,
      y: frame?.bottom,
    });
    expect(trunk?.side).toBeNull();
    for (const side of ['against', 'for'] as const) {
      const lines = rest.filter((line) => line.side === side);
      expect(lines).toHaveLength(3);
      expect(lines.every((line) => line.points.length === 3)).toBe(true);
      expect(
        lines.every((line) => line.points[1] === lines[0]?.points[1]),
      ).toBe(true);
      for (const line of lines) {
        expect(line.points.at(-1)).toEqual(port(side));
      }
    }
    // The face against the triple on the left, the face for it on the right.
    expect(port('against').x).toBeLessThan(vault?.x ?? 0);
    expect(port('for').x).toBeGreaterThan(vault?.x ?? 0);
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
    expect(hanging(0.35).vaults.every((vault) => vault.presence === 0)).toBe(
      true,
    );
    // The vault and the people, then the lines.
    expect(hanging(0.55).people.every((person) => person.presence === 1)).toBe(
      true,
    );
    expect(hanging(0.55).vaults.every((vault) => vault.presence === 1)).toBe(
      true,
    );
    expect(hanging(0.6).vaultLines.every((line) => line.presence === 0)).toBe(
      true,
    );
    expect(hanging(0.95).vaultLines.every((line) => line.presence === 1)).toBe(
      true,
    );
    // No positions or totals until weighed.
    expect(
      hanging(1).vaultLines.every(
        (line) => line.totalled === 0 && line.weighed === 0,
      ),
    ).toBe(true);
  });

  it('grows each person’s line from them up, 150ms after the one before, and the trunk on from the first to reach it', () => {
    // The change 4400ms long: its lines' stage, 0.6 to 0.95, 1540ms.
    const durationMs = 4400;
    const timed = (t: number) =>
      planeAt(SOURCED, HUNG, t, measureText, labelOf, WEIGHED, durationMs)
        .vaultLines;
    const [trunk, ...people] = timed(0.6);
    const startOf = (id: string): number => {
      for (let step = 0; step <= 3500; step++) {
        const t = 0.6 + (0.35 * step) / 3500;
        if ((timed(t).find((line) => line.id === id)?.presence ?? 0) > 0) {
          return t;
        }
      }

      return 1;
    };
    const starts = people.map((line) => startOf(line.id) * durationMs);

    // In turn, left to right, each about 150ms after the one before.
    for (const [index, start] of starts.slice(1).entries()) {
      expect(start - (starts[index] ?? 0)).toBeCloseTo(150, -1);
    }
    // The trunk once the first line reaches it, and so before the last
    // person's line has.
    const trunkStart = startOf(trunk?.id ?? '');
    const atTrunk = timed(trunkStart);
    expect(
      atTrunk.filter((line) => line.presence === 1).length,
    ).toBeGreaterThan(0);
    expect(
      atTrunk.some((line) => line.id !== trunk?.id && line.presence < 1),
    ).toBe(true);
    // All of it drawn as the stage ends.
    expect(timed(0.95).every((line) => line.presence === 1)).toBe(true);
    // Without a duration, the people's lines start together.
    expect(
      hanging(0.601)
        .vaultLines.filter((line) => line.turn !== undefined)
        .every((line) => line.presence > 0),
    ).toBe(true);
  });

  describe('from what he believes, the whole claim set back', () => {
    const INNER: PlaneClaim = {
      ...HUNG,
      isFrameHidden: true,
      vaults: { ...POSITIONS, frame: 'worth' },
      faded: ['elonMusk', 'believes'],
    };
    const settingBack = (t: number) =>
      planeAt(SOURCED, INNER, t, measureText, labelOf, INNER);
    const atom = (plane: ReturnType<typeof settingBack>, id: AtomId) =>
      plane.atoms.find((candidate) => candidate.id === id);
    const link = (plane: ReturnType<typeof settingBack>, id: string) =>
      plane.links.find((candidate) => candidate.id === id);
    const frame = (plane: ReturnType<typeof settingBack>, id: string) =>
      plane.frames.find((candidate) => candidate.id === id);

    it('hangs from the middle of the bottom of the inner frame, its rows where the whole claim’s would be', () => {
      const inner = layoutPlane(DEEPEST, measure, {
        frame: 'object',
        vaults: { ...POSITIONS, frame: 'worth' },
      });
      const whole = layoutPlane(DEEPEST, measure, {
        frame: 'object',
        vaults: POSITIONS,
      });
      const worth = inner.frames.find((candidate) => candidate.id === 'worth');
      const [trunk] = inner.vaultLines;

      expect(trunk?.points.at(-1)).toEqual({
        x: (worth?.x ?? 0) + (worth?.width ?? 0) / 2,
        y: worth?.bottom,
      });
      expect(trunk?.points[0]?.y).toBe(whole.vaultLines[0]?.points[0]?.y);
      expect(inner.people.map((person) => person.y)).toEqual(
        whole.people.map((person) => person.y),
      );
      expect(inner.bottom).toBe(whole.bottom);
    });

    it('takes the whole claim’s frame away as it rises, and keeps its room', () => {
      expect(frame(settingBack(0), 'belief')?.presence).toBe(1);
      expect(frame(settingBack(0.17), 'belief')?.presence).toBeGreaterThan(0);
      expect(frame(settingBack(0.17), 'belief')?.presence).toBeLessThan(1);
      expect(frame(settingBack(0.35), 'belief')?.presence).toBe(0);
      expect(frame(settingBack(1), 'worth')?.presence).toBe(1);
      expect(settingBack(1).fit?.width).toBe(hanging(1).fit?.width);
      expect(settingBack(1).atoms.map(({ id, x }) => ({ id, x }))).toEqual(
        hanging(1).atoms.map(({ id, x }) => ({ id, x })),
      );
    });

    it('sets back Elon Musk, believes and the lines from them as it rises, and nothing else', () => {
      expect(atom(settingBack(0), 'elonMusk')?.faded).toBe(0);
      expect(atom(settingBack(0.17), 'believes')?.faded).toBeGreaterThan(0);
      expect(atom(settingBack(0.35), 'believes')?.faded).toBe(1);
      expect(atom(settingBack(0.35), 'elonMusk')?.faded).toBe(1);
      expect(link(settingBack(1), 'belief:0')?.faded).toBe(1);
      expect(link(settingBack(1), 'belief:1')?.faded).toBe(1);
      expect(atom(settingBack(1), 'spacex')?.faded).toBe(0);
      expect(link(settingBack(1), 'worth:0')?.faded).toBe(0);
    });

    it('brings them back as the plane closes', () => {
      const closing = planeAt(INNER, null, 0.45, measureText, labelOf);

      expect(atom(closing, 'elonMusk')?.faded).toBe(0);
      expect(frame(closing, 'belief')?.presence).toBe(0);
    });
  });

  it('shows the positions, then all the positions on each side', () => {
    const line = (plane: ReturnType<typeof weighing>) =>
      plane.vaultLines.find((candidate) => candidate.id === 'belief:against:0');

    expect(line(weighing(0))).toMatchObject({ weighed: 0, totalled: 0 });
    expect(line(weighing(0.4))).toMatchObject({ weighed: 1, totalled: 0 });
    expect(line(weighing(1))).toMatchObject({ weighed: 1, totalled: 1 });
    // Where a side's lines run together, all the positions on it, once.
    const totals = (plane: ReturnType<typeof weighing>) =>
      plane.vaultLines.flatMap((candidate) =>
        candidate.total === undefined
          ? []
          : [{ side: candidate.side, value: candidate.total.value }],
      );
    expect(totals(weighing(1))).toEqual([
      { side: 'against', value: 620 },
      { side: 'for', value: 430 },
    ]);
    expect(line(weighing(0.4))?.totalled).toBe(0);
    // Nothing else moves.
    expect(weighing(0.5).atoms).toEqual(weighing(0).atoms);
    expect(weighing(0.5).people).toEqual(weighing(0).people);
  });
});

describe('one person left alone with the triple', () => {
  const measureText = (text: string): number => text.length * 7;
  const POSITIONED: PlaneClaim = {
    term: DEEPEST,
    frame: 'object',
    isFrameHidden: true,
    vaults: {
      frame: 'worth',
      against: [400, 200, 20],
      for: [200, 100, 80],
      isWeighed: true,
      isTotalled: true,
    },
    faded: ['elonMusk', 'believes'],
  };
  const ALONE: PlaneClaim = {
    ...POSITIONED,
    alone: { side: 'for', index: 1 },
  };
  const clearing = (t: number) =>
    planeAt(POSITIONED, ALONE, t, measureText, labelOf, ALONE);
  const present = (plane: ReturnType<typeof clearing>) => ({
    atoms: plane.atoms.filter((atom) => atom.presence > 0).map((a) => a.id),
    frames: plane.frames.filter((frame) => frame.presence > 0).map((f) => f.id),
    links: plane.links.filter((link) => link.presence > 0).map((l) => l.id),
    lines: plane.vaultLines
      .filter((line) => line.presence > 0)
      .map((line) => line.id),
    vaults: plane.vaults.filter((v) => v.presence > 0).map((v) => v.id),
    people: plane.people.filter((p) => p.presence > 0).map((p) => p.id),
  });

  it('keeps the person, their line up to the vault, the vault, its line on to the triple, and the triple', () => {
    expect(present(clearing(1))).toEqual({
      atoms: [
        'spacex',
        'willBeWorth',
        'ordersOfMagnitude',
        'moreThan',
        'currentEarthEconomy',
      ],
      frames: ['worth', 'more'],
      links: ['worth:0', 'worth:1', 'more:0', 'more:1'],
      lines: ['worth:vaults', 'worth:for:1'],
      vaults: ['worth:vault'],
      people: ['worth:for:1'],
    });
    // The person, and their line, stay still on the screen.
    const settled = clearing(1);
    expect(
      settled.people.find((person) => person.id === 'worth:for:1')?.isStill,
    ).toBe(true);
    expect(
      settled.vaultLines.find((line) => line.id === 'worth:for:1')?.isStill,
    ).toBe(true);
  });

  it('takes all else away, the lines drawing back with their positions and totals, him and believes set back as they go', () => {
    const halfway = clearing(0.2);
    const going = halfway.vaultLines.filter(
      (line) => line.id !== 'worth:vaults' && line.id !== 'worth:for:1',
    );

    expect(going.every((line) => line.presence < 1)).toBe(true);
    expect(going.every((line) => line.weighed === line.presence)).toBe(true);
    expect(halfway.atoms.find((atom) => atom.id === 'elonMusk')).toMatchObject({
      faded: 1,
    });
    expect(
      halfway.atoms.find((atom) => atom.id === 'elonMusk')?.presence,
    ).toBeGreaterThan(0);
    // The person's own position stays on their line.
    expect(
      halfway.vaultLines.find((line) => line.id === 'worth:for:1'),
    ).toMatchObject({ presence: 1, weighed: 1 });
    // What goes goes where it stands on the screen: the people and their
    // lines still, him and believes along their row with the claim, not up.
    expect(
      halfway.people
        .filter((person) => person.id !== 'worth:for:1')
        .every((person) => person.isStill === true),
    ).toBe(true);
    expect(going.every((line) => line.isGoing === true)).toBe(true);
    expect(
      halfway.atoms
        .filter((atom) => atom.id === 'elonMusk' || atom.id === 'believes')
        .every((atom) => atom.keepsRow === true),
    ).toBe(true);
    expect(
      halfway.atoms
        .filter((atom) => atom.id !== 'elonMusk' && atom.id !== 'believes')
        .every((atom) => atom.keepsRow === undefined),
    ).toBe(true);
  });

  it('moves what they sent down their line as the rest goes, to where it stands as the deposit is followed', () => {
    const at = (t: number) =>
      clearing(t).vaultLines.find((each) => each.id === 'worth:for:1')
        ?.weightAt;

    expect(at(0)).toBe(PLANE.vaults.weightAt);
    expect(at(0.4)).toBeGreaterThan(PLANE.vaults.weightAt);
    expect(at(0.4)).toBeLessThan(1 - STILL_LINE.sent);
    expect(at(0.8)).toBeCloseTo(1 - STILL_LINE.sent, 9);
  });

  it('takes the lines beside the one left alone off where they ran together with theirs at once, the total going as every number does', () => {
    const start = clearing(0.01);
    const beside = start.vaultLines.filter(
      (line) => line.side === 'for' && line.id !== 'worth:for:1',
    );
    const across = start.vaultLines.filter((line) => line.side === 'against');

    // Only from each person to where the side's lines meet.
    expect(beside.map((line) => line.points.length)).toEqual([2, 2]);
    expect(beside.every((line) => line.presence > 0.9)).toBe(true);
    // The side's total fades with the rest.
    expect(
      beside.find((line) => line.id === 'worth:for:0')?.totalled,
    ).toBeGreaterThan(0.9);
    // The other side draws back whole, its total with it.
    expect(across.every((line) => line.points.length === 3)).toBe(true);
    expect(
      across.find((line) => line.id === 'worth:against:0')?.totalled,
    ).toBeGreaterThan(0.9);
  });

  it('keeps the plane’s room, so it holds still while the rest goes', () => {
    expect([clearing(1).top, clearing(1).bottom]).toEqual([
      clearing(0).top,
      clearing(0).bottom,
    ]);
    expect(clearing(1).fit).toEqual(clearing(0).fit);
  });
});

describe('a deposit followed up the line of the person left alone', () => {
  const measureText = (text: string): number => text.length * 7;
  const ALONE: PlaneClaim = {
    term: DEEPEST,
    frame: 'object',
    isFrameHidden: true,
    vaults: {
      frame: 'worth',
      against: [400, 200, 20],
      for: [200, 100, 80],
      isWeighed: true,
      isTotalled: true,
    },
    faded: ['elonMusk', 'believes'],
    alone: { side: 'for', index: 1 },
  };
  const DEPOSITING: PlaneClaim = {
    ...ALONE,
    deposit: {
      sent: { value: 100, label: 'sent' },
      builderFee: { value: 0.5, label: 'builder fee' },
      deposit: { value: 99.5 },
      fees: { value: 2.64, label: 'fees' },
      position: { value: 96.86, label: 'position' },
    },
  };
  const following = (t: number) =>
    planeAt(ALONE, DEPOSITING, t, measureText, labelOf, DEPOSITING);
  const line = 'worth:for:1';

  it('takes the builder’s fee halfway up their line, the fees where it turns for the vault, and shows what goes on between and the position after', () => {
    const { depositFees, depositAmounts } = following(1);

    expect(
      depositFees.map(({ id, at, amount }) => ({
        id,
        at,
        value: amount.value,
      })),
    ).toEqual([
      {
        id: `${line}:builder`,
        at: { line, stretch: 0, along: STILL_LINE.builder },
        value: 0.5,
      },
      { id: `${line}:fees`, at: { line, stretch: 0, along: 1 }, value: 2.64 },
    ]);
    // Both off to the left of the line, where the fees go.
    expect(depositFees.every((fee) => fee.isLeft === true)).toBe(true);
    expect(
      depositAmounts.map(({ id, at, amount }) => ({
        id,
        at,
        value: amount.value,
      })),
    ).toEqual([
      {
        id: `${line}:deposit`,
        at: { line, stretch: 0, along: STILL_LINE.deposit },
        value: 99.5,
      },
      {
        id: `${line}:position`,
        at: { line, stretch: 1, along: 0.5 },
        value: 96.86,
      },
    ]);
  });

  it('keeps what they sent where it already stands, below the builder’s fee', () => {
    const at = (t: number) =>
      following(t).vaultLines.find((each) => each.id === line)?.weightAt;

    expect(at(0)).toBeCloseTo(1 - STILL_LINE.sent, 9);
    expect(at(0.5)).toBeCloseTo(1 - STILL_LINE.sent, 9);
    // Their position, 100, stays on the line.
    expect(
      following(1).vaultLines.find((each) => each.id === line)?.weighed,
    ).toBe(1);
  });

  it('brings each in, in turn, as the money rises: a fee’s icon, then its line out, then its amount', () => {
    // At once, with no wait: the builder's fee's icon already coming in.
    expect(following(0).depositFees.every((fee) => fee.icon === 0)).toBe(true);
    expect(
      following(0.02).depositFees.find((fee) => fee.id === `${line}:builder`)
        ?.icon,
    ).toBeGreaterThan(0);
    // In turn: the builder's fee, the app it goes to, what goes on, the
    // fees, the position.
    const order: string[] = [];
    for (let step = 0; step <= 200; step++) {
      const plane = following(step / 200);
      for (const id of [
        ...plane.depositFees
          .filter((fee) => fee.icon > 0)
          .map((fee) => `${fee.id}:icon`),
        ...plane.depositFees
          .filter((fee) => fee.branch > 0)
          .map((fee) => `${fee.id}:line`),
        ...plane.depositFees
          .filter((fee) => fee.shown > 0)
          .map((fee) => fee.id),
        ...plane.depositFees
          .filter((fee) => fee.appLine > 0)
          .map((fee) => `${fee.id}:app:line`),
        ...plane.depositFees
          .filter((fee) => fee.appIcon > 0)
          .map((fee) => `${fee.id}:app`),
        ...plane.depositAmounts
          .filter((amount) => amount.shown > 0)
          .map((amount) => amount.id),
      ]) {
        if (!order.includes(id)) {
          order.push(id);
        }
      }
    }
    expect(order).toEqual([
      `${line}:builder:icon`,
      `${line}:builder:line`,
      `${line}:builder`,
      `${line}:builder:app:line`,
      `${line}:builder:app`,
      `${line}:deposit`,
      `${line}:fees:icon`,
      `${line}:fees:line`,
      `${line}:fees`,
      `${line}:position`,
    ]);
    const end = following(1);
    expect(
      end.depositFees.every(
        (fee) => fee.icon === 1 && fee.branch === 1 && fee.shown === 1,
      ),
    ).toBe(true);
    // Only the builder's fee goes on to an app.
    expect(
      end.depositFees.map(({ id, appLine, appIcon }) => ({
        id,
        appLine,
        appIcon,
      })),
    ).toEqual([
      { id: `${line}:builder`, appLine: 1, appIcon: 1 },
      { id: `${line}:fees`, appLine: 0, appIcon: 0 },
    ]);
    expect(end.depositAmounts.every((amount) => amount.shown === 1)).toBe(true);
  });

  describe('then its fees, shared out', () => {
    const SHARING: PlaneClaim = {
      ...DEPOSITING,
      deposit: {
        ...(DEPOSITING.deposit ?? {
          sent: { value: 0 },
          builderFee: { value: 0 },
          deposit: { value: 0 },
          fees: { value: 0 },
          position: { value: 0 },
        }),
        shared: {
          protocol: { value: 1.24, label: 'protocol' },
          entry: 0.5,
          perTerm: 0.3,
        },
      },
    };
    const sharing = (t: number) =>
      planeAt(DEPOSITING, SHARING, t, measureText, labelOf, SHARING);

    it('keeps the person, their line and the fees, holds back the rest of the deposit, and lets the position go', () => {
      const end = sharing(1);
      const { held } = PLANE.deposit;

      expect(
        end.people.map(({ id, presence, strength }) => ({
          id,
          presence,
          strength,
        })),
      ).toEqual([{ id: line, presence: 1, strength: expect.closeTo(held, 9) }]);
      expect(end.vaultLines.find((each) => each.id === line)).toMatchObject({
        presence: 1,
        weighed: expect.closeTo(held, 9),
        strength: expect.closeTo(held, 9),
      });
      // The triple's own line, from its vault, stays as strong.
      expect(
        end.vaultLines.find((each) => each.id === 'worth:vaults')?.strength,
      ).toBe(1);
      expect(
        end.depositFees.map(({ id, icon, branch, shown, strength }) => ({
          id,
          icon,
          branch,
          shown,
          strength,
        })),
      ).toEqual([
        {
          id: `${line}:builder`,
          icon: 1,
          branch: 1,
          shown: 1,
          strength: expect.closeTo(held, 9),
        },
        { id: `${line}:fees`, icon: 1, branch: 1, shown: 1, strength: 1 },
      ]);
      expect(
        end.depositAmounts.map(({ id, shown }) => ({ id, shown })),
      ).toEqual([
        { id: `${line}:deposit`, shown: expect.closeTo(held, 9) },
        { id: `${line}:position`, shown: 0 },
      ]);
      // The fees go on from their own fee.
      expect(end.sharedFrom).toBe(`${line}:fees`);
    });

    it('hangs the vaults of the triple’s terms beside its own, and shares the fees into each', () => {
      const shares = sharing(1).feeShares;
      const vault = sharing(1).vaults[0];
      const atomAt = (id: AtomId) =>
        sharing(1).atoms.find((atom) => atom.id === id)?.x;
      const inner = sharing(1).frames.find((frame) => frame.id === 'more');

      expect(shares.map(({ of, x, y, gain }) => ({ of, x, y, gain }))).toEqual([
        { of: 'triple', x: vault?.x, y: vault?.y, gain: 0.5 },
        { of: 'atom', x: atomAt('spacex'), y: vault?.y, gain: 0.3 },
        { of: 'atom', x: atomAt('willBeWorth'), y: vault?.y, gain: 0.3 },
        {
          of: 'triple',
          x: (inner?.x ?? 0) + (inner?.width ?? 0) / 2,
          y: vault?.y,
          gain: 0.3,
        },
      ]);
      // The triple's own vault hangs there already; each term's its own line
      // up to the term.
      expect(shares[0]?.reach).toBeUndefined();
      expect(shares[1]?.reach).toEqual({
        x: atomAt('spacex'),
        y: PLANE.atomSize / 2,
      });
      expect(shares[3]?.reach?.y).toBe(inner?.bottom);
      // The protocol’s share level with the builder’s fee.
      expect(sharing(1).protocolFee).toMatchObject({
        value: 1.24,
        label: 'protocol',
        level: { line, stretch: 0, along: STILL_LINE.builder },
      });
    });

    it('stands the fees’ amount where they are shared out from, in the widest gap between the vaults, from the moment they are taken', () => {
      const fee = (plane: ReturnType<typeof sharing>, id: string) =>
        plane.depositFees.find((each) => each.id === `${line}:${id}`);
      const vault = sharing(1).vaults[0];
      const worth = sharing(1).atoms.find((atom) => atom.id === 'willBeWorth');
      const middle = ((worth?.x ?? 0) + (vault?.x ?? 0)) / 2;

      // Between will be worth’s vault and the triple’s own, as the deposit
      // is followed and as its fees are shared out: it never moves.
      expect(fee(following(1), 'fees')?.rowAt).toBeCloseTo(middle, 9);
      expect(fee(sharing(0), 'fees')?.rowAt).toBeCloseTo(middle, 9);
      expect(fee(sharing(1), 'fees')?.rowAt).toBeCloseTo(middle, 9);
      // The builder’s stays out on its line.
      expect(fee(sharing(1), 'builder')?.rowAt).toBeUndefined();
    });

    it('goes as the plane closes, what was held back no stronger than it was', () => {
      const closing = (t: number) =>
        planeAt(SHARING, null, t, measureText, labelOf, SHARING);
      const { held } = PLANE.deposit;
      const start = closing(0);

      expect(
        start.depositAmounts.find((amount) => amount.id === `${line}:deposit`)
          ?.shown,
      ).toBeCloseTo(held, 9);
      expect(start.vaultLines.find((each) => each.id === line)).toMatchObject({
        weighed: expect.closeTo(held, 9),
        strength: expect.closeTo(held, 9),
      });
      expect(start.people.find((each) => each.id === line)?.strength).toBe(
        held,
      );
      expect(
        start.depositFees.find((fee) => fee.id === `${line}:builder`)?.strength,
      ).toBe(held);
      // And all of it gone by the end.
      expect(
        closing(1).depositAmounts.every((amount) => amount.shown === 0),
      ).toBe(true);
    });

    it('holds the deposit back, then brings the vaults, then grows the lines, then shows each share', () => {
      const builder = (t: number) =>
        sharing(t).depositFees.find((fee) => fee.id === `${line}:builder`);

      expect(builder(0)?.strength).toBe(1);
      expect(builder(0.3)?.strength).toBeCloseTo(PLANE.deposit.held, 9);
      expect(
        sharing(0.3).feeShares.every((share) => share.presence === 0),
      ).toBe(true);
      expect(
        sharing(0.45).feeShares.every((share) => share.presence === 1),
      ).toBe(true);
      // The protocol’s logo arrives with the vaults.
      expect(sharing(0.3).protocolFee?.presence).toBe(0);
      expect(sharing(0.45).protocolFee?.presence).toBe(1);
      expect(sharing(0.45).feeShares.every((share) => share.grown === 0)).toBe(
        true,
      );
      expect(sharing(0.85).feeShares.every((share) => share.grown === 1)).toBe(
        true,
      );
      expect(sharing(0.85).protocolFee).toMatchObject({ grown: 1, shown: 0 });
      expect(sharing(1).feeShares.every((share) => share.shown === 1)).toBe(
        true,
      );
      expect(sharing(1).protocolFee?.shown).toBe(1);
    });
  });

  it('keeps the plane as the person was left alone with the triple', () => {
    expect([following(1).top, following(1).bottom]).toEqual([
      following(0).top,
      following(0).bottom,
    ]);
    expect(following(1).people.map((person) => person.id)).toEqual([line]);
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

describe('a list seen through a perspective', () => {
  const measureText = (text: string): number => text.length * 7;
  const OPTIONS = ['Elon Musk', 'Sam Altman', 'My developer friends'];
  const LIST: PlaneList = {
    id: 'best',
    members: [
      { atom: 'xai', weight: 910 },
      { atom: 'anthropic', weight: 780 },
      { atom: 'openai', weight: 640 },
    ],
    predicate: 'best',
    object: 'aiCompany',
    isWeighed: true,
    isRanked: true,
  };
  const RANKED: PlaneClaim = { term: { list: LIST } };
  const SEEN: PlaneClaim = {
    ...RANKED,
    perspective: { options: OPTIONS, chosen: 0 },
  };
  const SWITCHED: PlaneClaim = {
    term: {
      list: {
        ...LIST,
        members: LIST.members.map((member) =>
          member.atom === 'openai' ? { ...member, weight: 960 } : member,
        ),
      },
    },
    perspective: { options: OPTIONS, chosen: 1 },
  };
  const presenting = (t: number) =>
    planeAt(RANKED, SEEN, t, measureText, labelOf, SEEN);
  const switching = (t: number) =>
    planeAt(SEEN, SWITCHED, t, measureText, labelOf, SWITCHED);
  const atom = (plane: ReturnType<typeof switching>, id: AtomId) =>
    plane.atoms.find((candidate) => candidate.id === id);
  const weight = (plane: ReturnType<typeof switching>, id: AtomId) =>
    plane.weights.find((candidate) => candidate.from === id)?.value;

  it('shows a menu above the list, centred on it, as the list moves down to make room', () => {
    const layout = layoutPlane(SEEN.term, measure, { pickerWidth: 180 });
    const bare = layoutPlane(RANKED.term, measure);

    expect(layout.picker).toMatchObject({
      x: (layout.width - 180) / 2,
      y: bare.top - PLANE.picker.gap - PLANE.picker.drop - PLANE.picker.height,
      width: 180,
      height: PLANE.picker.height,
    });
    expect(layout.top).toBe(layout.picker?.y);
    // A frame round the list, as far from it all round, the menu just
    // above the middle of its top.
    const { gap } = PLANE.picker;
    const frame = layout.picker?.frame;
    expect(frame).toEqual({
      x: -gap,
      y: bare.top - gap,
      width: bare.width + gap * 2,
      height: bare.bottom - bare.top + gap * 2,
    });
    expect(
      (layout.picker?.y ?? 0) + PLANE.picker.height + PLANE.picker.drop,
    ).toBe(frame?.y);
    expect((layout.picker?.x ?? 0) + 90).toBe(
      (frame?.x ?? 0) + (frame?.width ?? 0) / 2,
    );
    expect(layout.bottom).toBe((frame?.y ?? 0) + (frame?.height ?? 0));
    expect(presenting(0).picker?.presence).toBe(0);
    expect(presenting(1).picker).toMatchObject({
      presence: 1,
      open: 0,
      chosen: 0,
    });
    expect(presenting(1).top).toBeLessThan(presenting(0).top);
    // Placed on the plane, the frame moves with the list it holds.
    const placed = presenting(1);
    const xs = placed.atoms.map((atom) => atom.x);
    expect(placed.picker?.frame.x).toBeLessThan(Math.min(...xs));
    expect(
      (placed.picker?.frame.x ?? 0) + (placed.picker?.frame.width ?? 0),
    ).toBeGreaterThan(Math.max(...xs));
  });

  it('opens, moves to the one chosen, and closes on it; then the weights change, the members move, and their ranks follow', () => {
    // The menu, first.
    expect(switching(0.05).picker?.open).toBeGreaterThan(0);
    // Open by the time the highlight starts to move, three tenths in.
    expect(switching(0.36 * 0.3).picker?.open).toBeCloseTo(1, 6);
    expect(switching(0.36 * 0.3).picker?.highlight).toBeCloseTo(0, 6);
    expect(switching(0.24).picker?.highlight).toBe(1);
    expect(switching(0.24).picker?.chosen).toBe(0);
    expect(switching(0.36).picker).toMatchObject({ open: 0, chosen: 1 });
    expect(atom(switching(0.36), 'openai')?.y).toBe(
      atom(switching(0), 'openai')?.y,
    );
    expect(weight(switching(0.36), 'openai')).toBe(640);
    // Then OpenAI's weight counts up to the new one.
    expect(weight(switching(0.45), 'openai')).toBeGreaterThan(640);
    expect(weight(switching(0.45), 'openai')).toBeLessThan(960);
    expect(weight(switching(0.52), 'openai')).toBe(960);
    // Then it moves to the top, and the others down.
    expect(atom(switching(0.82), 'openai')?.y).toBeLessThan(
      atom(switching(0.82), 'xai')?.y ?? 0,
    );
    // Then its medal changes: the old one goes, then the new one comes.
    expect(atom(switching(0.84), 'openai')).toMatchObject({
      rank: 2,
      ranked: 1,
    });
    expect(atom(switching(0.97), 'openai')).toMatchObject({
      rank: 0,
      ranked: 1,
    });
    expect(atom(switching(0.97), 'xai')).toMatchObject({ rank: 1, ranked: 1 });
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

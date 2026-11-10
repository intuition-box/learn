/**
 * Fields of atoms for the brand's pictures, as the film draws them: claims,
 * each a chain of atoms in their roles' shapes, joined by bonds. A claim is
 * a subject, a predicate and an object; some run on through a bridge
 * object, an object that is a subject too, to a second predicate and
 * object. Few and clear, never a web: no bond crosses another, or runs
 * through an atom it does not join.
 *
 * Pure, and seeded: the same options always give the same field, so a
 * picture changes only when its options do.
 */

import type { Role } from '@/components/playground/story-model';

export interface Point {
  x: number;
  y: number;
}

/** A rectangle, from its top left, in the canvas's pixels. */
export interface Rect extends Point {
  width: number;
  height: number;
}

export interface FieldAtom extends Point {
  role: Role;
  /** Across, in pixels, as `outlinePath` measures a shape's size. */
  size: number;
}

/** Two atoms joined, by their places in the field's atoms. */
export interface FieldBond {
  from: number;
  to: number;
}

export interface AtomField {
  atoms: readonly FieldAtom[];
  bonds: readonly FieldBond[];
}

/** mulberry32: a small, fast generator of numbers in [0, 1), the same for the same seed. */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Atoms at `points`, in `roles`, all `size` across, each bonded to the
 * next. No atom ever turns: the triangle's point is always up, the
 * hexagon's points left and right, as the film draws them.
 */
export function chainAtoms(
  points: readonly Point[],
  roles: readonly Role[],
  size: number,
): AtomField {
  if (points.length !== roles.length) {
    throw new Error(
      `${points.length} points for ${roles.length} roles: a chain needs one of each per atom`,
    );
  }
  const atoms = points.map((point, index): FieldAtom => ({
    role: roles[index] ?? 'identity',
    x: point.x,
    y: point.y,
    size,
  }));
  const bonds = atoms
    .slice(1)
    .map((_, index): FieldBond => ({ from: index, to: index + 1 }));
  return { atoms, bonds };
}

export interface AtomFieldOptions {
  width: number;
  height: number;
  seed: number;
  /** How many claims to place. One that cannot be placed in 50 tries is left out. */
  claims: number;
  /** The share of claims, 0 to 1, that run on through a bridge object. */
  bridges: number;
  /** How big a claim's atoms are, in pixels: each claim draws one size between these. */
  size: { min: number; max: number };
  /** Areas no atom or bond may touch: a clock, an avatar, a logo. */
  keepClear?: readonly Rect[];
  /** How far past the canvas an atom's centre may sit, as a share of each side. */
  bleed?: number;
}

const CLAIM: readonly Role[] = ['identity', 'predicate', 'object'];
const BRIDGED_CLAIM: readonly Role[] = [
  'identity',
  'predicate',
  'bridge',
  'predicate',
  'object',
];

/**
 * A triple's layout, as `triples.md` in the brand skill lays it out, with no
 * names: each atom's slot is its size, and slots stand one atom's size
 * apart (34px at the film's 34px), so neighbors' centres are two sizes
 * apart, on one line. The fields' own choice, not a rule: a triple through
 * a bridge object goes on straight up from it, a row of 96 ÷ 34 sizes, as
 * the film's plane stacks its rows.
 */
const STEP = 2;
const RISE = 96 / 34;
const TRIES = 50;
/** Atoms keep this many times their mean size apart, centre to centre. */
const SPACING = 1.6;
/** A bond passes no closer than this many times an atom's size to an atom it does not join. */
const BOND_CLEARANCE = 0.75;

/** How far a point is from a rectangle: nothing inside it. */
function distanceToRect(point: Point, rect: Rect): number {
  const dx = Math.max(rect.x - point.x, 0, point.x - (rect.x + rect.width));
  const dy = Math.max(rect.y - point.y, 0, point.y - (rect.y + rect.height));
  return Math.hypot(dx, dy);
}

/** How far a point is from the segment `a` to `b`. */
function distanceToSegment(point: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = dx * dx + dy * dy;
  const t =
    length === 0
      ? 0
      : Math.min(
          1,
          Math.max(0, ((point.x - a.x) * dx + (point.y - a.y) * dy) / length),
        );
  return Math.hypot(point.x - (a.x + t * dx), point.y - (a.y + t * dy));
}

/** Which side of the line `a` to `b` a point is on: its sign. */
const side = (a: Point, b: Point, point: Point): number =>
  (b.x - a.x) * (point.y - a.y) - (b.y - a.y) * (point.x - a.x);

/** Whether two segments cross, each one's ends strictly either side of the other. */
export function segmentsCross(a: Point, b: Point, c: Point, d: Point): boolean {
  return side(a, b, c) * side(a, b, d) < 0 && side(c, d, a) * side(c, d, b) < 0;
}

/** Whether a segment touches a rectangle: an end inside it, or crossing an edge. */
function segmentTouchesRect(a: Point, b: Point, rect: Rect): boolean {
  if (distanceToRect(a, rect) === 0 || distanceToRect(b, rect) === 0) {
    return true;
  }
  const corners = [
    { x: rect.x, y: rect.y },
    { x: rect.x + rect.width, y: rect.y },
    { x: rect.x + rect.width, y: rect.y + rect.height },
    { x: rect.x, y: rect.y + rect.height },
  ];
  return corners.some((corner, index) =>
    segmentsCross(a, b, corner, corners[(index + 1) % 4] ?? corner),
  );
}

interface Segment {
  a: FieldAtom;
  b: FieldAtom;
}

const segmentsOf = (field: AtomField): Segment[] =>
  field.bonds.flatMap(({ from, to }) => {
    const a = field.atoms[from];
    const b = field.atoms[to];
    return a === undefined || b === undefined ? [] : [{ a, b }];
  });

/** Whether a candidate chain sits among the placed atoms and bonds without breaking a rule. */
function fits(
  chain: AtomField,
  placed: { atoms: readonly FieldAtom[]; segments: readonly Segment[] },
  options: AtomFieldOptions,
): boolean {
  const { width, height, keepClear = [], bleed = 0.05 } = options;
  const isOnCanvas = ({ x, y }: Point) =>
    x >= -bleed * width &&
    x <= width * (1 + bleed) &&
    y >= -bleed * height &&
    y <= height * (1 + bleed);
  const isClear = (atom: FieldAtom) =>
    keepClear.every((rect) => distanceToRect(atom, rect) >= atom.size / 2);
  if (!chain.atoms.every((atom) => isOnCanvas(atom) && isClear(atom))) {
    return false;
  }

  const atoms = [...placed.atoms, ...chain.atoms];
  const isSpaced = chain.atoms.every((atom) =>
    atoms.every(
      (other) =>
        other === atom ||
        Math.hypot(other.x - atom.x, other.y - atom.y) >=
          (SPACING * (atom.size + other.size)) / 2,
    ),
  );
  if (!isSpaced) {
    return false;
  }

  const fresh = segmentsOf(chain);
  const segments = [...placed.segments, ...fresh];
  const passesClear = (segment: Segment, atom: FieldAtom) =>
    atom === segment.a ||
    atom === segment.b ||
    distanceToSegment(atom, segment.a, segment.b) >= BOND_CLEARANCE * atom.size;
  return (
    fresh.every(
      (segment) =>
        keepClear.every(
          (rect) => !segmentTouchesRect(segment.a, segment.b, rect),
        ) &&
        segments.every(
          (other) =>
            other === segment ||
            !segmentsCross(segment.a, segment.b, other.a, other.b),
        ) &&
        atoms.every((atom) => passesClear(segment, atom)),
    ) &&
    placed.segments.every((segment) =>
      chain.atoms.every((atom) => passesClear(segment, atom)),
    )
  );
}

/**
 * A field of `claims` claims over a canvas, `bridges` of them through a
 * bridge object. Each is a triple, level on one line, left to right; one
 * through a bridge object goes on in a second triple that rises from it,
 * straight up. One that would crowd another atom, touch a keep-clear area,
 * leave the canvas or cross a bond is tried again elsewhere, and after 50
 * tries left out.
 */
export function atomField(options: AtomFieldOptions): AtomField {
  const { width, height, seed, claims, bridges, size, bleed = 0.05 } = options;
  const random = seededRandom(seed);
  const between = (min: number, max: number) => min + random() * (max - min);
  const atoms: FieldAtom[] = [];
  const bonds: FieldBond[] = [];
  const segments: Segment[] = [];

  for (let claim = 0; claim < claims; claim += 1) {
    // Bridged claims spread evenly through the field, as their share says.
    const isBridged =
      Math.floor((claim + 1) * bridges) > Math.floor(claim * bridges);
    const roles = isBridged ? BRIDGED_CLAIM : CLAIM;
    for (let attempt = 0; attempt < TRIES; attempt += 1) {
      const atomSize = between(size.min, size.max);
      const x = between(-bleed * width, width * (1 + bleed));
      const y = between(-bleed * height, height * (1 + bleed));
      const step = STEP * atomSize;
      const rise = RISE * atomSize;
      // Subject, predicate and object on the line; through a bridge object,
      // its predicate and object above it.
      const points: Point[] = [
        { x, y },
        { x: x + step, y },
        { x: x + 2 * step, y },
        { x: x + 2 * step, y: y - rise },
        { x: x + 2 * step, y: y - 2 * rise },
      ].slice(0, roles.length);
      const chain = chainAtoms(points, roles, atomSize);
      if (fits(chain, { atoms, segments }, options)) {
        const offset = atoms.length;
        atoms.push(...chain.atoms);
        bonds.push(
          ...chain.bonds.map(({ from, to }) => ({
            from: from + offset,
            to: to + offset,
          })),
        );
        segments.push(...segmentsOf(chain));
        break;
      }
    }
  }
  return { atoms, bonds };
}

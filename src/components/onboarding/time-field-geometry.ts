/**
 * The shape of the field the onboarding flies through: atoms, and the claims
 * that can be drawn between them, laid out along one axis.
 *
 * Each atom has a role. An identity, a predicate or an object, drawn as a
 * circle, a triangle and a square. A claim is a triple, as on Intuition: an
 * identity, a predicate and an object near one another, drawn as two links,
 * identity to predicate and predicate to object. So a link always has a
 * triangle at one end, and most atoms are in no claim at all.
 *
 * An atom is in one claim at most, so every claim reads as one plain
 * triple. A few claims go on from their object: it is also the subject of a
 * second claim, and drawn as both at once, a hexagon, as in the
 * playground's story.
 *
 * The axis is time. The camera moves along +z, one station per page of the
 * onboarding, and looks ahead. Each station's atoms are spread over the
 * screen as a starfield is (see `LAYERS`). The atoms are always there. The claims are
 * not: each one has a `reveal` value, and it is drawn only once the field's
 * link level has passed it. The video page shows none, and each step of the
 * playground raises the level, so the same atoms make claims a few at a
 * time.
 *
 * Everything here is pure and seeded, so the field is the same on every
 * visit and can be tested without a GPU.
 */

/** World units of z between one station and the next. */
export const STATION_GAP = 40;
/** The last station: 0 is the video, 1 the playground, 2 the docs. */
export const LAST_STATION = 2;
/** The playground's station: its first claims, and the chains it shows, are there. */
const PLAYGROUND_STATION = 1;
/**
 * How far ahead of the camera an atom is drawn. From `FADE_FROM` on it
 * shrinks away, so the next station's atoms are small until the camera
 * flies toward them. A station's own atoms, no further ahead than its
 * farthest layer, are always drawn at their size.
 */
export const FAR = 44;
export const FADE_FROM = 40;
/** The field ends where the last station can see no further. */
export const FIELD_LENGTH = LAST_STATION * STATION_GAP + FAR;
/** Screen half-heights per world unit, for a point one unit ahead. */
export const FOCAL = 1.4;

/**
 * Each station's atoms, laid out as a starfield is: a few layers of depth,
 * each a grid over the screen with an atom somewhere in most of its cells.
 * So the atoms are spread evenly at every depth, with no clump in the
 * middle and no gaps: a few near and large, many far and small. `cell` is
 * a cell's side in screen half-heights, as seen from the station.
 */
export const LAYERS = [
  { depth: { from: 4.5, to: 9 }, cell: 0.7 },
  { depth: { from: 9, to: 16 }, cell: 0.3 },
  { depth: { from: 16, to: 26 }, cell: 0.2 },
  { depth: { from: 26, to: 40 }, cell: 0.14 },
] as const;
/** The share of a layer's cells that hold an atom, so the grid never shows. */
const FILL = 0.85;
/**
 * How much of the screen the grids cover, in half-heights from its centre:
 * enough for a 21:9 screen across.
 */
export const SPREAD = { across: 2.4, up: 1.05 } as const;

/**
 * What an atom is in a claim. The value is what the shaders read. An atom
 * that is the object of one claim and the subject of the next is
 * `subjectAndObject`; the rest are scattered as one of the first three.
 */
export const ROLES = {
  identity: 0,
  predicate: 1,
  object: 2,
  subjectAndObject: 3,
} as const;
const ROLE_LIST = [ROLES.identity, ROLES.predicate, ROLES.object] as const;

/**
 * How far a claim's atoms are from its predicate on screen, seen from their
 * station, in half-heights: far enough for the line between to show, near
 * enough to read as one claim.
 */
export const LINK_SPAN = { min: 0.09, max: 0.4 } as const;
/**
 * And how much nearer or farther they may be, in world units: about the
 * same depth, so a claim is seen whole, not as lines into the distance.
 */
export const DEPTH_TOLERANCE = 3;
/**
 * The least angle on screen between a claim's two halves, so they open out
 * from the predicate rather than fold back over each other.
 */
export const MIN_CLAIM_ANGLE = Math.PI / 4;
/**
 * The share of predicates that make a claim, when an identity and an object
 * are near enough. Kept low, so the claims read as a few clear triples, not
 * a web.
 */
const CLAIM_SHARE = 0.3;
/**
 * The share of claims that go on from their object to a second claim, when
 * a predicate and an object are near enough: a few, not a web.
 */
const CHAIN_SHARE = 0.18;

/**
 * How far the link level must rise past a claim's `reveal` value for the
 * claim to be fully drawn. A claim is drawn as one stroke, from the
 * identity, through the predicate, to the object, never left half drawn at
 * rest. At the speed the level moves that takes most of a second.
 */
export const CLAIM_DRAW_WINDOW = 0.09;

/**
 * The `reveal` values of the three sets of claims. The first set is chosen,
 * not drawn: the claims the playground's first step shows (see
 * `FIRST_CLAIMS`). Every other claim draws a number in [0, 1) and joins the
 * first later set whose `upTo` is above it, a third of them the second set
 * and the rest the third. Within its set, a claim's `reveal` value is spread
 * evenly between `from` and `to`.
 *
 * The gaps between the sets are what `LINK_LEVELS` rests in. A level sits
 * above a whole set plus the draw window, and below
 * the next set, so at rest every link is either fully drawn or not drawn at
 * all.
 */
const FIRST_SET = { from: 0, to: 0.005 } as const;
const LATER_SETS = [
  { upTo: 0.33, from: 0.12, to: 0.3 },
  { upTo: 1, from: 0.45, to: 0.95 },
] as const;

/**
 * A part of the playground's view: how far ahead, how far to either side
 * of the middle, and how far up or down, in screen half-heights.
 */
interface ViewWindow {
  depth: { from: number; to: number };
  across: { from: number; to: number };
  up: number;
}

/**
 * Where the first claims sit, seen from the playground: a middle distance,
 * and beside its panel rather than behind it. One claim is chosen on each
 * side, from the first of these windows that has one: the field is laid
 * out afresh on each visit, so the second, looser one is there for the
 * layouts the first misses.
 */
const FIRST_CLAIM_WINDOWS: readonly ViewWindow[] = [
  { depth: { from: 8, to: 32 }, across: { from: 0.6, to: 1.5 }, up: 0.85 },
  { depth: { from: 5, to: 40 }, across: { from: 0.5, to: 1.6 }, up: 0.95 },
];

/** The link level for each moment of the onboarding. */
export const LINK_LEVELS = {
  /** The video: atoms only. */
  none: 0,
  /** The playground's first step: a couple of claims. */
  few: 0.1,
  /** Its second step. */
  some: 0.4,
  /** Its last step, and the documentation: every claim. */
  all: 1.05,
} as const;

/**
 * Floats per atom: x, y, z, a seed in [0, 1) for per-atom variation, its
 * role (see `ROLES`), and its claim's `reveal` value: from that link level
 * on it is connected. `NO_CLAIM` when it is in no claim; the earlier of the
 * two for a hexagon.
 */
export const POINT_STRIDE = 6;
export const NO_CLAIM = -1;
/**
 * Floats per link: the atom it starts from and the atom it ends at (each
 * `POINT_STRIDE` floats), its claim's `reveal` value, and which half of the
 * claim it is: 0 from identity to predicate, 1 from predicate to object.
 */
export const LINK_STRIDE = POINT_STRIDE * 2 + 2;

export interface FieldGeometry {
  /**
   * `POINT_STRIDE` floats per atom, farthest first: the camera looks along
   * +z, so drawn in this order the nearer atoms cover the farther.
   */
  points: Float32Array;
  /** `LINK_STRIDE` floats per link, a claim's two halves one after the other. */
  links: Float32Array;
}

/**
 * mulberry32: a small seeded generator, so the field does not depend on
 * `Math.random` and is identical on every load.
 */
function createRandom(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Atom {
  x: number;
  y: number;
  z: number;
  seed: number;
  role: number;
  /** The station it is laid out for, and where on screen it is from there. */
  station: number;
  sx: number;
  sy: number;
  /** Its claim's `reveal` value, once its claims are drawn up. */
  claim: number;
}

/**
 * A claim: an identity, a predicate and an object, near one another. A claim
 * that goes on from another's object keeps that claim as `after`, to be
 * drawn just after it.
 */
interface Claim {
  identity: Atom;
  predicate: Atom;
  object: Atom;
  after?: Claim;
}

/** How far apart two atoms are on screen, seen from their station. */
function spanBetween(a: Atom, b: Atom): number {
  return Math.hypot(b.sx - a.sx, b.sy - a.sy);
}

/** The angle on screen at `centre` between `a` and `b`. */
function angleAt(centre: Atom, a: Atom, b: Atom): number {
  const turn =
    Math.atan2(b.sy - centre.sy, b.sx - centre.sx) -
    Math.atan2(a.sy - centre.sy, a.sx - centre.sx);

  return Math.abs(Math.atan2(Math.sin(turn), Math.cos(turn)));
}

/**
 * The atom of `role` nearest `atoms[at]` on screen that could be in a claim
 * with it (the same station, about the same depth, within `LINK_SPAN`) and
 * that `canTake` allows, or `null`. The atoms are ordered by z, so the
 * search looks only as far either way as the depth allows.
 */
function nearestOfRole(
  atoms: readonly Atom[],
  at: number,
  role: number,
  canTake: (index: number) => boolean,
): number | null {
  const centre = atoms[at];
  if (centre === undefined) {
    return null;
  }
  let nearest: number | null = null;
  let nearestSpan: number = LINK_SPAN.max;
  for (const step of [-1, 1]) {
    for (let index = at + step; ; index += step) {
      const atom = atoms[index];
      if (atom === undefined || Math.abs(atom.z - centre.z) > DEPTH_TOLERANCE) {
        break;
      }
      const span = spanBetween(centre, atom);
      if (
        atom.role === role &&
        atom.station === centre.station &&
        span >= LINK_SPAN.min &&
        span < nearestSpan &&
        canTake(index)
      ) {
        nearest = index;
        nearestSpan = span;
      }
    }
  }

  return nearest;
}

/** A later set for a claim that is not one of the first. */
function pickLaterSet(random: () => number): { from: number; to: number } {
  const pick = random();

  return LATER_SETS.find(({ upTo }) => pick < upTo) ?? LATER_SETS[1];
}

/**
 * The claim the playground's first step shows on one side (`side` -1 for
 * the left, 1 for the right): of the claims within the first window that
 * has any, the one nearest the middle of its distance.
 */
function pickFirstClaim(
  claims: readonly Claim[],
  side: -1 | 1,
): Claim | undefined {
  for (const window of FIRST_CLAIM_WINDOWS) {
    const best = claims
      .filter((claim) => isInWindow(claim.predicate, window, side))
      .toSorted(
        (a, b) =>
          windowScore(a.predicate, window) - windowScore(b.predicate, window),
      )[0];
    if (best !== undefined) {
      return best;
    }
  }

  return undefined;
}

/**
 * Where the chains the playground shows sit, seen from it: beside its card
 * rather than behind it. Their hexagon is placed there. Taken from the
 * first window first, and from the looser second for the layouts that
 * need it.
 */
const SHOWN_CHAINS = 2;
const SHOWN_CHAIN_WINDOWS: readonly ViewWindow[] = [
  { depth: { from: 6, to: 36 }, across: { from: 1, to: 1.6 }, up: 0.95 },
  { depth: { from: 4.5, to: 40 }, across: { from: 0.92, to: 1.75 }, up: 1 },
];

/** Where an atom is on screen from the playground, in half-heights. */
function seenFromPlayground(atom: Atom): {
  ahead: number;
  x: number;
  y: number;
} {
  const ahead = atom.z - STATION_GAP;

  return { ahead, x: (atom.x * FOCAL) / ahead, y: (atom.y * FOCAL) / ahead };
}

/**
 * Whether `atom` is in a window of the playground's view: on one side,
 * `side` -1 for the left and 1 for the right, or on either when left out.
 */
function isInWindow(atom: Atom, window: ViewWindow, side?: -1 | 1): boolean {
  const { ahead, x, y } = seenFromPlayground(atom);
  const across = side === undefined ? Math.abs(x) : x * side;

  return (
    ahead > window.depth.from &&
    ahead < window.depth.to &&
    across > window.across.from &&
    across < window.across.to &&
    Math.abs(y) < window.up
  );
}

/** Nearer the middle of a window's distance is better: lower is better. */
function windowScore(atom: Atom, window: ViewWindow): number {
  return Math.abs(
    seenFromPlayground(atom).ahead - (window.depth.from + window.depth.to) / 2,
  );
}

/** A station's atoms and claims, and when each claim is drawn. */
interface Station {
  atoms: Atom[];
  claims: Claim[];
  reveals: Map<Claim, number>;
}

/**
 * Lays out one station, from its own seed: its atoms, its claims, the few
 * that go on through a hexagon, and when each is drawn. Each station draws
 * on a generator of its own, so one can be laid out afresh and leave the
 * others as they were.
 */
function buildStation(station: number, seed: number): Station {
  const random = createRandom(seed);
  const isPlayground = station === PLAYGROUND_STATION;

  const scattered: Atom[] = [];
  for (const { depth, cell } of LAYERS) {
    const columns = Math.ceil((SPREAD.across * 2) / cell);
    const rows = Math.ceil((SPREAD.up * 2) / cell);
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        if (random() >= FILL) {
          continue;
        }
        // Anywhere in its cell, and anywhere in its layer's depth. The
        // last cells run past the edge, and what falls past it is left out.
        const sx = -SPREAD.across + (column + random()) * cell;
        const sy = -SPREAD.up + (row + random()) * cell;
        const ahead = depth.from + random() * (depth.to - depth.from);
        if (Math.abs(sx) > SPREAD.across || Math.abs(sy) > SPREAD.up) {
          continue;
        }
        scattered.push({
          x: (sx * ahead) / FOCAL,
          y: (sy * ahead) / FOCAL,
          z: station * STATION_GAP + ahead,
          seed: random(),
          role:
            ROLE_LIST[Math.floor(random() * ROLE_LIST.length)] ??
            ROLES.identity,
          station,
          sx,
          sy,
          claim: NO_CLAIM,
        });
      }
    }
  }
  // Ordered by z so the search for a claim's atoms only looks a short way.
  scattered.sort((a, b) => a.z - b.z);

  // Whether each atom is in a claim already.
  const isTaken = new Uint8Array(scattered.length);
  const claims: Claim[] = [];

  scattered.forEach((predicate, at) => {
    if (predicate.role !== ROLES.predicate || random() >= CLAIM_SHARE) {
      return;
    }
    const identityAt = nearestOfRole(
      scattered,
      at,
      ROLES.identity,
      (index) => isTaken[index] === 0,
    );
    const identity = identityAt === null ? undefined : scattered[identityAt];
    if (identity === undefined) {
      return;
    }
    const objectAt = nearestOfRole(scattered, at, ROLES.object, (index) => {
      const object = scattered[index];

      return (
        object !== undefined &&
        isTaken[index] === 0 &&
        angleAt(predicate, identity, object) >= MIN_CLAIM_ANGLE
      );
    });
    const object = objectAt === null ? undefined : scattered[objectAt];
    if (
      identityAt === null ||
      objectAt === null ||
      identity === undefined ||
      object === undefined
    ) {
      return;
    }
    isTaken[identityAt] = 1;
    isTaken[objectAt] = 1;
    isTaken[at] = 1;
    claims.push({ identity, predicate, object });
  });

  // The playground's first claims, beside its card. No other station has
  // any.
  const firstClaims = new Set(
    isPlayground ? [pickFirstClaim(claims, -1), pickFirstClaim(claims, 1)] : [],
  );

  // A few claims go on from their object, which becomes the subject of a
  // second claim too: a predicate and an object near it that are in no
  // claim yet. The first claims stay plain.
  const indexOf = new Map(scattered.map((atom, index) => [atom, index]));
  /** Makes `claim` go on from its object, when atoms near it allow. */
  function goOn(claim: Claim): boolean {
    const objectAt = indexOf.get(claim.object);
    if (objectAt === undefined) {
      return false;
    }
    const subject = claim.object;
    const predicateAt = nearestOfRole(
      scattered,
      objectAt,
      ROLES.predicate,
      (index) => {
        const predicate = scattered[index];

        return (
          predicate !== undefined &&
          isTaken[index] === 0 &&
          // It opens out from the claim it goes on from.
          angleAt(subject, claim.predicate, predicate) >= MIN_CLAIM_ANGLE
        );
      },
    );
    const predicate = predicateAt === null ? undefined : scattered[predicateAt];
    if (predicateAt === null || predicate === undefined) {
      return false;
    }
    const nextAt = nearestOfRole(
      scattered,
      predicateAt,
      ROLES.object,
      (index) => {
        const object = scattered[index];

        return (
          object !== undefined &&
          isTaken[index] === 0 &&
          angleAt(predicate, subject, object) >= MIN_CLAIM_ANGLE
        );
      },
    );
    const object = nextAt === null ? undefined : scattered[nextAt];
    if (nextAt === null || object === undefined) {
      return false;
    }
    isTaken[predicateAt] = 1;
    isTaken[nextAt] = 1;
    subject.role = ROLES.subjectAndObject;
    claims.push({ identity: subject, predicate, object, after: claim });

    return true;
  }

  // The claims made so far only: one that goes on is not gone on from.
  const plainClaims = claims.filter((claim) => !firstClaims.has(claim));
  // First, a couple in view beside the playground's card, so the playground
  // shows what a hexagon is; they are drawn with the first later set.
  const shownClaims = new Set<Claim>();
  for (const window of isPlayground ? SHOWN_CHAIN_WINDOWS : []) {
    for (const claim of plainClaims
      .filter(
        (candidate) =>
          !shownClaims.has(candidate) && isInWindow(candidate.object, window),
      )
      .toSorted(
        (a, b) => windowScore(a.object, window) - windowScore(b.object, window),
      )) {
      if (shownClaims.size < SHOWN_CHAINS && goOn(claim)) {
        shownClaims.add(claim);
      }
    }
  }
  // Then a few anywhere.
  for (const claim of plainClaims) {
    if (!shownClaims.has(claim) && random() < CHAIN_SHARE) {
      goOn(claim);
    }
  }

  const sets = new Map<Claim, { reveal: number; to: number }>();
  for (const claim of claims) {
    const before =
      claim.after === undefined ? undefined : sets.get(claim.after);
    // A claim that goes on from another is drawn just after it, in the same
    // set, so the two still rest fully drawn together.
    let reveal: number;
    let setEnd: number;
    if (before === undefined) {
      const set = firstClaims.has(claim)
        ? FIRST_SET
        : shownClaims.has(claim)
          ? LATER_SETS[0]
          : pickLaterSet(random);
      reveal = set.from + random() * (set.to - set.from);
      setEnd = set.to;
    } else {
      reveal = Math.min(before.reveal + CLAIM_DRAW_WINDOW, before.to);
      setEnd = before.to;
    }
    sets.set(claim, { reveal, to: setEnd });
    for (const atom of [claim.identity, claim.predicate, claim.object]) {
      atom.claim =
        atom.claim === NO_CLAIM ? reveal : Math.min(atom.claim, reveal);
    }
  }

  return {
    atoms: scattered,
    claims,
    reveals: new Map([...sets].map(([claim, { reveal }]) => [claim, reveal])),
  };
}

/**
 * The seeds a field is laid out from when none are given: one per station,
 * the same on every run, for tests.
 */
export const DEFAULT_SEEDS: readonly number[] = Array.from(
  { length: LAST_STATION + 1 },
  (_, station) => station + 1,
);

/**
 * The whole field: each station laid out from its own seed (`seeds[0]` the
 * video's, and so on). Change one station's seed and only that station
 * changes.
 */
export function buildFieldGeometry(
  seeds: readonly number[] = DEFAULT_SEEDS,
): FieldGeometry {
  const stations = Array.from({ length: LAST_STATION + 1 }, (_, station) =>
    buildStation(station, seeds[station] ?? station + 1),
  );
  const atoms = stations.flatMap((station) => station.atoms);

  const valuesOf = (atom: Atom): number[] => [
    atom.x,
    atom.y,
    atom.z,
    atom.seed,
    atom.role,
    atom.claim,
  ];
  // Farthest first: see `FieldGeometry`.
  const points = new Float32Array(atoms.length * POINT_STRIDE);
  atoms
    .toSorted((a, b) => b.z - a.z)
    .forEach((atom, index) => {
      points.set(valuesOf(atom), index * POINT_STRIDE);
    });

  const links: number[] = [];
  for (const { claims, reveals } of stations) {
    for (const claim of claims) {
      const reveal = reveals.get(claim) ?? 0;
      for (const [from, to, half] of [
        [claim.identity, claim.predicate, 0],
        [claim.predicate, claim.object, 1],
      ] as const) {
        links.push(...valuesOf(from), ...valuesOf(to), reveal, half);
      }
    }
  }

  return { points, links: new Float32Array(links) };
}

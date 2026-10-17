import { describe, expect, it } from 'vitest';

import {
  buildFieldGeometry,
  CLAIM_DRAW_WINDOW,
  DEPTH_TOLERANCE,
  FAR,
  FOCAL,
  LAST_STATION,
  LAYERS,
  LINK_LEVELS,
  LINK_SPAN,
  LINK_STRIDE,
  MIN_CLAIM_ANGLE,
  NO_CLAIM,
  POINT_STRIDE,
  ROLES,
  SPREAD,
  STATION_GAP,
} from './time-field-geometry';

interface Point {
  x: number;
  y: number;
  z: number;
  role: number;
  claim: number;
}

interface Link {
  from: Point;
  to: Point;
  reveal: number;
  half: number;
}

function readPoint(data: Float32Array, offset: number): Point {
  return {
    x: data[offset] ?? Number.NaN,
    y: data[offset + 1] ?? Number.NaN,
    z: data[offset + 2] ?? Number.NaN,
    role: data[offset + 4] ?? Number.NaN,
    claim: data[offset + 5] ?? Number.NaN,
  };
}

function readPoints(data: Float32Array): Point[] {
  const points: Point[] = [];
  for (let offset = 0; offset < data.length; offset += POINT_STRIDE) {
    points.push(readPoint(data, offset));
  }

  return points;
}

function readLinks(data: Float32Array): Link[] {
  const links: Link[] = [];
  for (let offset = 0; offset < data.length; offset += LINK_STRIDE) {
    links.push({
      from: readPoint(data, offset),
      to: readPoint(data, offset + POINT_STRIDE),
      reveal: data[offset + POINT_STRIDE * 2] ?? Number.NaN,
      half: data[offset + POINT_STRIDE * 2 + 1] ?? Number.NaN,
    });
  }

  return links;
}

/** A claim's two links, in the order they are stored. */
function readClaims(links: readonly Link[]): [Link, Link][] {
  const claims: [Link, Link][] = [];
  for (let index = 0; index + 1 < links.length; index += 2) {
    const first = links[index];
    const second = links[index + 1];
    if (first !== undefined && second !== undefined) {
      claims.push([first, second]);
    }
  }

  return claims;
}

const NEAREST = LAYERS[0].depth.from;

/**
 * The station an atom is laid out for, and where it is from there: how far
 * ahead, and where on screen in half-heights.
 */
function seenFromItsStation(point: Point): {
  station: number;
  ahead: number;
  x: number;
  y: number;
} {
  const station = Math.floor((point.z - NEAREST) / STATION_GAP);
  const ahead = point.z - station * STATION_GAP;

  return {
    station,
    ahead,
    x: (point.x * FOCAL) / ahead,
    y: (point.y * FOCAL) / ahead,
  };
}

/** The atoms a camera at `station` sees on a 16:10 screen, at full size. */
function inView(points: readonly Point[], station: number): Point[] {
  return points.filter((point) => {
    const ahead = point.z - station * STATION_GAP;

    return (
      ahead > 0 &&
      ahead < FAR &&
      Math.abs((point.x * FOCAL) / ahead) < 1.6 &&
      Math.abs((point.y * FOCAL) / ahead) < 1
    );
  });
}

/** How far a link has grown at a link level: 0 not drawn, 1 fully drawn. */
function grownAt(link: Link, level: number): number {
  return Math.min(Math.max((level - link.reveal) / CLAIM_DRAW_WINDOW, 0), 1);
}

const geometry = buildFieldGeometry();
const points = readPoints(geometry.points);
const links = readLinks(geometry.links);
const claims = readClaims(links);

describe('buildFieldGeometry', () => {
  it('is the same field every time', () => {
    expect(buildFieldGeometry().points).toEqual(geometry.points);
    expect(buildFieldGeometry().links).toEqual(geometry.links);
  });

  it('is a different field for different seeds', () => {
    expect(buildFieldGeometry([7, 8, 9]).points).not.toEqual(geometry.points);
  });

  it('lays one station out afresh with a new seed, and leaves the others as they were', () => {
    const byStation = (field: ReturnType<typeof buildFieldGeometry>) => {
      const stations = new Map<number, Point[]>();
      for (const point of readPoints(field.points)) {
        const { station } = seenFromItsStation(point);
        stations.set(station, [...(stations.get(station) ?? []), point]);
      }

      return stations;
    };
    const before = byStation(buildFieldGeometry([1, 2, 3]));
    const after = byStation(buildFieldGeometry([1, 99, 3]));

    expect(after.get(0)).toEqual(before.get(0));
    expect(after.get(2)).toEqual(before.get(2));
    expect(after.get(1)).not.toEqual(before.get(1));
  });

  it('lays every atom out for a station: ahead of it, on its screen', () => {
    // Float32 storage rounds, so the bounds get a hair of slack.
    const slack = 1e-3;
    for (const point of points) {
      const { station, ahead, x, y } = seenFromItsStation(point);
      expect(station).toBeGreaterThanOrEqual(0);
      expect(station).toBeLessThanOrEqual(LAST_STATION);
      expect(ahead).toBeLessThanOrEqual(LAYERS.at(-1)!.depth.to + slack);
      expect(Math.abs(x)).toBeLessThanOrEqual(SPREAD.across + slack);
      expect(Math.abs(y)).toBeLessThanOrEqual(SPREAD.up + slack);
    }
  });

  it('spreads them evenly over the screen, as a starfield: no clump, no gap', () => {
    const seen = inView(points, 1).filter(
      (point) => point.z - STATION_GAP < LAYERS.at(-1)!.depth.to,
    );
    // Eight regions of the screen, four across and two down.
    const counts = Array.from({ length: 8 }, () => 0);
    for (const point of seen) {
      const { x, y } = seenFromItsStation(point);
      const column = Math.min(Math.floor(((x + 1.6) / 3.2) * 4), 3);
      const row = y < 0 ? 0 : 1;
      counts[row * 4 + column] = (counts[row * 4 + column] ?? 0) + 1;
    }
    const mean = seen.length / counts.length;
    for (const count of counts) {
      expect(Math.abs(count - mean) / mean).toBeLessThan(0.25);
    }
  });

  it('puts a few atoms near, and many more far', () => {
    const near = inView(points, 1).filter(
      (point) => point.z - STATION_GAP < LAYERS[0].depth.to,
    );
    const far = inView(points, 1).filter(
      (point) => point.z - STATION_GAP > LAYERS.at(-1)!.depth.from,
    );

    expect(near.length).toBeGreaterThan(4);
    expect(near.length).toBeLessThan(30);
    expect(far.length).toBeGreaterThan(near.length * 10);
  });

  it('orders the atoms farthest first, so the nearer are drawn over the farther', () => {
    const depths = points.map((point) => point.z);

    expect(depths).toEqual([...depths].sort((a, b) => b - a));
  });

  it('has a few hundred atoms in view at every station', () => {
    for (let station = 0; station <= LAST_STATION; station += 1) {
      const count = inView(points, station).length;
      expect(count).toBeGreaterThan(350);
      expect(count).toBeLessThan(750);
    }
  });

  it('gives every atom a role, about a third each, and a few both a subject and an object', () => {
    const share = (role: number): number =>
      points.filter((point) => point.role === role).length / points.length;

    for (const role of [ROLES.identity, ROLES.predicate, ROLES.object]) {
      expect(share(role)).toBeGreaterThan(0.29);
      expect(share(role)).toBeLessThan(0.37);
    }
    expect(share(ROLES.subjectAndObject)).toBeGreaterThan(0);
    expect(share(ROLES.subjectAndObject)).toBeLessThan(0.01);
  });
});

describe('the claims', () => {
  it('are a few clear triples, not a web', () => {
    expect(claims.length).toBeGreaterThan(50);
    // Most atoms are in no claim: no more than a quarter are in one.
    expect(claims.length * 3).toBeLessThan(points.length / 4);
    expect(links.length).toBe(claims.length * 2);
  });

  it('each run subject to predicate, then predicate to object', () => {
    for (const [first, second] of claims) {
      expect([ROLES.identity, ROLES.subjectAndObject]).toContain(
        first.from.role,
      );
      expect(first.to.role).toBe(ROLES.predicate);
      expect(second.from).toEqual(first.to);
      expect([ROLES.object, ROLES.subjectAndObject]).toContain(second.to.role);
    }
  });

  it('put each atom in one claim, but a hexagon in two: the object of one and the subject of the next', () => {
    const key = ({ x, y, z }: { x: number; y: number; z: number }): string =>
      `${x},${y},${z}`;
    const asSubject = new Map<string, number>();
    const asObject = new Map<string, number>();
    const asPredicate = new Map<string, number>();
    for (const [first, second] of claims) {
      for (const [map, atom] of [
        [asSubject, first.from],
        [asPredicate, first.to],
        [asObject, second.to],
      ] as const) {
        map.set(key(atom), (map.get(key(atom)) ?? 0) + 1);
      }
    }
    const roleOf = new Map(points.map((point) => [key(point), point.role]));
    for (const [atom, count] of [...asSubject, ...asObject, ...asPredicate]) {
      expect(count).toBe(1);
      const isBoth = asSubject.has(atom) && asObject.has(atom);
      expect(isBoth).toBe(roleOf.get(atom) === ROLES.subjectAndObject);
    }
  });

  it('go on from a few objects, each drawn just after the claim it goes on from', () => {
    const chained = claims.filter(
      ([first]) => first.from.role === ROLES.subjectAndObject,
    );

    expect(chained.length).toBeGreaterThan(3);
    expect(chained.length).toBeLessThan(claims.length / 4);
    for (const [first] of chained) {
      const before = claims.find(
        ([, second]) =>
          second.to.x === first.from.x &&
          second.to.y === first.from.y &&
          second.to.z === first.from.z,
      );
      expect(first.reveal).toBeGreaterThanOrEqual(
        before?.[0].reveal ?? Infinity,
      );
    }
  });

  it('never link an identity straight to an object', () => {
    for (const link of links) {
      expect([link.from.role, link.to.role]).toContain(ROLES.predicate);
    }
  });

  it('keep their atoms at about their predicate’s depth, near it on screen', () => {
    // Float32 storage rounds, so the bounds get a hair of slack.
    const slack = 1e-3;
    for (const [first, second] of claims) {
      const predicate = seenFromItsStation(first.to);
      for (const end of [first.from, second.to]) {
        const seen = seenFromItsStation(end);
        const span = Math.hypot(seen.x - predicate.x, seen.y - predicate.y);
        expect(seen.station).toBe(predicate.station);
        expect(Math.abs(end.z - first.to.z)).toBeLessThanOrEqual(
          DEPTH_TOLERANCE + slack,
        );
        expect(span).toBeGreaterThanOrEqual(LINK_SPAN.min - slack);
        expect(span).toBeLessThanOrEqual(LINK_SPAN.max + slack);
      }
    }
  });

  it('open out clearly from their predicate, so every half can be seen', () => {
    // Float32 storage rounds, so the bounds get a hair of slack.
    const slack = 1e-3;
    for (const [first, second] of claims) {
      const predicate = seenFromItsStation(first.to);
      const subject = seenFromItsStation(first.from);
      const object = seenFromItsStation(second.to);
      const turn =
        Math.atan2(object.y - predicate.y, object.x - predicate.x) -
        Math.atan2(subject.y - predicate.y, subject.x - predicate.x);
      const angle = Math.abs(Math.atan2(Math.sin(turn), Math.cos(turn)));
      expect(angle).toBeGreaterThanOrEqual(MIN_CLAIM_ANGLE - slack);
    }
  });

  it('mark their atoms with when they are drawn, so the atoms know when they are connected', () => {
    const key = ({ x, y, z }: Point): string => `${x},${y},${z}`;
    // The earliest claim each atom is in.
    const earliest = new Map<string, number>();
    for (const [first, second] of claims) {
      for (const atom of [first.from, first.to, second.to]) {
        earliest.set(
          key(atom),
          Math.min(earliest.get(key(atom)) ?? Infinity, first.reveal),
        );
      }
    }
    for (const point of points) {
      expect(point.claim).toBe(earliest.get(key(point)) ?? NO_CLAIM);
    }
  });

  it('are drawn whole: both halves at once, never one link alone', () => {
    for (const [first, second] of claims) {
      expect(second.reveal).toBe(first.reveal);
      expect([first.half, second.half]).toEqual([0, 1]);
    }
  });
});

describe('the link levels', () => {
  /** Claims fully drawn at a level, and whether each is in view from the playground. */
  function drawnAt(level: number): { inView: boolean }[] {
    return claims
      .filter(([, second]) => grownAt(second, level) === 1)
      .map(([, second]) => {
        const { x, y, z } = second.from;
        const ahead = z - STATION_GAP;
        const inView =
          ahead > 0 &&
          ahead < FAR &&
          Math.abs((x * FOCAL) / ahead) < 1.6 &&
          Math.abs((y * FOCAL) / ahead) < 1;

        return { inView };
      });
  }

  it('draw no link at all on the video', () => {
    expect(links.every((link) => grownAt(link, LINK_LEVELS.none) === 0)).toBe(
      true,
    );
  });

  it('leave every link either fully drawn or not drawn, never part way', () => {
    for (const level of Object.values(LINK_LEVELS)) {
      for (const link of links) {
        expect([0, 1]).toContain(grownAt(link, level));
      }
    }
  });

  it('draw two claims first, both in view from the playground', () => {
    const first = drawnAt(LINK_LEVELS.few);

    expect(first).toHaveLength(2);
    expect(first.every(({ inView }) => inView)).toBe(true);
  });

  it('show the playground two claims that go on through a hexagon, beside its card', () => {
    const shown = claims.filter(([first]) => {
      if (
        first.from.role !== ROLES.subjectAndObject ||
        grownAt(first, LINK_LEVELS.some) !== 1
      ) {
        return false;
      }
      const { x, y, z } = first.from;
      const ahead = z - STATION_GAP;
      const across = Math.abs((x * FOCAL) / ahead);

      return (
        ahead > 0 &&
        across > 1 &&
        across < 1.6 &&
        Math.abs((y * FOCAL) / ahead) < 1
      );
    });

    expect(shown.length).toBeGreaterThanOrEqual(2);
  });

  it('show those chains in almost every layout, as each visit lays the field out afresh', () => {
    let shown = 0;
    for (let layout = 0; layout < 60; layout += 1) {
      const field = readClaims(
        readLinks(
          buildFieldGeometry([101 + layout, 202 + layout * 3, 303]).links,
        ),
      );
      const beside = field.filter(([first]) => {
        const { x, y, z } = first.from;
        const ahead = z - STATION_GAP;

        return (
          first.from.role === ROLES.subjectAndObject &&
          grownAt(first, LINK_LEVELS.some) === 1 &&
          ahead > 0 &&
          Math.abs((x * FOCAL) / ahead) > 0.9 &&
          Math.abs((y * FOCAL) / ahead) < 1.05
        );
      });
      shown += beside.length >= 2 ? 1 : 0;
    }

    expect(shown).toBeGreaterThanOrEqual(58);
  });

  it('then more claims, then all of them', () => {
    const some = drawnAt(LINK_LEVELS.some);

    expect(some.length).toBeGreaterThan(claims.length / 5);
    expect(some.length).toBeLessThan(claims.length / 2);
    expect(drawnAt(LINK_LEVELS.all)).toHaveLength(claims.length);
  });
});

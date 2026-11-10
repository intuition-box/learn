/**
 * The atoms exactly as the film builds them (Learn's `story-shapes.ts`),
 * in plain JavaScript, for any agent to run: the same numbers, the same
 * 120 samples, the same rounding, the same SVG path to three decimals.
 * A test in Learn holds this file to the film's code, output for output.
 *
 *   import { outlinePath } from './atom.mjs';
 *   outlinePath('predicate', 100, 50); // the triangle, 100 across, centred on 50, 50
 *
 * Roles: 'subject' (or 'identity', the film's name), 'predicate', 'object',
 * 'bridge' (the bridge object).
 */

/** How far the rounding reaches out from the core, as a share of the atom's size. */
export const ROUNDING = 0.05;
/** Points round each outline: one every 3°. A multiple of 4, so the square's corners are sampled. */
export const SAMPLES = 120;

/**
 * The cores, in units of the atom's size, each centred on the middle of its
 * height. The triangle's point is up and never turns; the hexagon's points
 * are left and right.
 */
export const CIRCLE_RADIUS = 0.4;
export const TRIANGLE = [
  [0, -0.36],
  [0.4, 0.36],
  [-0.4, 0.36],
];
export const SQUARE = [
  [-0.34, -0.34],
  [0.34, -0.34],
  [0.34, 0.34],
  [-0.34, 0.34],
];
export const HEXAGON_RADIUS = 0.44;
export const HEXAGON = Array.from({ length: 6 }, (_, index) => {
  const angle = (index * Math.PI) / 3;
  return [Math.cos(angle) * HEXAGON_RADIUS, Math.sin(angle) * HEXAGON_RADIUS];
});

const ROLES = { subject: 'identity', identity: 'identity', predicate: 'predicate', object: 'object', bridge: 'bridge' };

function roleOf(name) {
  const role = ROLES[name];
  if (role === undefined) {
    throw new Error(`Unknown role "${name}": subject, predicate, object or bridge`);
  }
  return role;
}

/** The angle of each sample, from straight up, clockwise on screen. */
const ANGLES = Array.from(
  { length: SAMPLES },
  (_, index) => -Math.PI / 2 + (index / SAMPLES) * 2 * Math.PI,
);

/** How far from the centre a ray at `angle` meets a convex polygon's edge. */
function polygonRadius(vertices, angle) {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  let nearest = Infinity;
  vertices.forEach(([ax, ay], index) => {
    const [bx, by] = vertices[(index + 1) % vertices.length] ?? [ax, ay];
    const ex = bx - ax;
    const ey = by - ay;
    const denominator = dx * ey - dy * ex;
    if (Math.abs(denominator) < 1e-9) {
      return;
    }
    const s = (ax * ey - ay * ex) / denominator;
    const u = (ax * dy - ay * dx) / denominator;
    if (s > 0 && u >= -1e-9 && u <= 1 + 1e-9) {
      nearest = Math.min(nearest, s);
    }
  });
  return nearest;
}

/** Each role's outline, as the distance from the centre at each sample. */
const RADII = {
  identity: ANGLES.map(() => CIRCLE_RADIUS),
  predicate: ANGLES.map((angle) => polygonRadius(TRIANGLE, angle)),
  object: ANGLES.map((angle) => polygonRadius(SQUARE, angle)),
  bridge: ANGLES.map((angle) => polygonRadius(HEXAGON, angle)),
};

/** How wide and how tall a role's atom is, its rounding included, in units of its size. */
export function shapeSize(name) {
  const role = roleOf(name);
  const corners = { predicate: TRIANGLE, object: SQUARE, bridge: HEXAGON };
  const reach = (axis) =>
    role === 'identity'
      ? CIRCLE_RADIUS
      : Math.max(...corners[role].map((vertex) => Math.abs(vertex[axis])));
  return {
    width: 2 * (reach(0) + ROUNDING),
    height: 2 * (reach(1) + ROUNDING),
  };
}

/**
 * The outline `t` of the way from one role's shape to another's, as the
 * 120 points round the centre, in units of the atom's size: each sample's
 * distance slides from the one shape's to the other's.
 */
export function morphOutline(fromName, toName, t) {
  const start = RADII[roleOf(fromName)];
  const end = RADII[roleOf(toName)];
  return ANGLES.map((angle, index) => {
    const a = start[index] ?? 0;
    const radius = a + ((end[index] ?? a) - a) * t;
    return [Math.cos(angle) * radius, Math.sin(angle) * radius];
  });
}

/** A turn smaller than this, either way, is a straight line. */
const STRAIGHT = 1e-9;

/** The angle of the way out of an outline along its edge from `a` to `b`: the outline runs clockwise, so out is to its left. */
function outwardAngle(a, b) {
  return Math.atan2(-(b[0] - a[0]), b[1] - a[1]);
}

/**
 * The outline rounded: each point with the arc round it, `ROUNDING` out,
 * from its incoming edge's way out to its outgoing edge's. A point on a
 * straight run gets no arc; where the outline bends inward, two ends and
 * no arc.
 */
export function roundedOutline(fromName, toName, t) {
  const points = morphOutline(fromName, toName, t);
  const count = points.length;
  return points.flatMap((point, index) => {
    const before = points[(index - 1 + count) % count] ?? point;
    const after = points[(index + 1) % count] ?? point;
    const start = outwardAngle(before, point);
    const end = outwardAngle(point, after);
    const turn = Math.atan2(Math.sin(end - start), Math.cos(end - start));
    const [x, y] = point;
    if (Math.abs(turn) < STRAIGHT) {
      return [{ x, y, from: start, to: start }];
    }
    if (turn > 0) {
      return [{ x, y, from: start, to: start + turn }];
    }
    return [
      { x, y, from: start, to: start },
      { x, y, from: end, to: end },
    ];
  });
}

/** A role's atom as an SVG path, `size` across, centred on `centre`, `centre`. Fill it once. */
export function outlinePath(name, size, centre) {
  const radius = ROUNDING * size;
  const at = (corner, angle) =>
    `${(centre + corner.x * size + radius * Math.cos(angle)).toFixed(3)} ${(centre + corner.y * size + radius * Math.sin(angle)).toFixed(3)}`;
  return `${roundedOutline(name, name, 1)
    .map(
      (corner, index) =>
        `${index === 0 ? 'M' : 'L'}${at(corner, corner.from)}${
          corner.to === corner.from
            ? ''
            : `A${radius.toFixed(3)} ${radius.toFixed(3)} 0 0 1 ${at(corner, corner.to)}`
        }`,
    )
    .join('')}Z`;
}

/** A role's atom as a whole SVG element, `size` across, its centre at `x`, `y`, in `fill`. */
export function atomSvg({ role, size, x, y, fill }) {
  return `<path d="${outlinePath(role, size, 0)}" fill="${fill}" transform="translate(${x} ${y})"/>`;
}

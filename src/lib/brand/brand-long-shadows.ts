/**
 * Long shadows: Saulo's reference of frosted cubes on a floor seen from
 * above (2026-11-13). A low light below the picture throws each cube's long
 * shadow up it; a light far off at the lower right throws a short one up
 * and to the left; where the low light reaches a cube's foot, the floor
 * before it glows pink. The cubes are the atom shapes, each in its cube's
 * place and size, its top flat in its cube's color, with a thin rim where
 * each light catches its edge. Where the reference's cubes crowd into one
 * another, the shapes stand edge to edge instead, as solids do. Every color
 * is the reference's, measured (`long-shadows-floor.ts`), none of them the
 * roles'. Drawn in the reference's own frame, 2000 × 1125.
 */

import type { Hex } from '@/components/brand/color';
import type { Role } from '@/components/playground/story-model';
import { ROUNDING, roundedOutline } from '@/components/playground/story-shapes';

import { seededRandom } from './atom-field';
import type { AtomsFrame } from './brand-atoms-frame';
import { convexHull } from './brand-observed';
import {
  LONG_SHADOWS_FAR_LIGHT,
  LONG_SHADOWS_LIT,
  LONG_SHADOWS_SHADED,
} from './long-shadows-floor';
import { encodePng } from './png';

type Point = [number, number];
type Rgb = readonly [number, number, number];

/** The reference's frame, in its pixels: every place below is in it. */
export const LONG_SHADOWS_DESIGN = { width: 2000, height: 1125 } as const;

/** The ground under the floor's image: the lit floor's violet, on its left. */
export const LONG_SHADOWS_GROUND: Hex = '#6e64a2';

/** One shape, standing where one of the reference's cubes stands. */
export interface LongShadowsPart {
  role: Role;
  /** Its center, in the design. */
  x: number;
  y: number;
  /** Its top's color: its cube's, measured away from the glow inside it, sRGB. */
  color: Rgb;
}

/** The shapes, four of each kind but one more square, in the cubes' places. */
export const LONG_SHADOWS_PARTS: readonly LongShadowsPart[] = [
  // The five crowded at the top right, moved apart until they stand edge to edge.
  { role: 'identity', x: 1526.1, y: 93.5, color: [156, 151, 186] },
  { role: 'object', x: 1326.6, y: 156.1, color: [151, 149, 185] },
  { role: 'bridge', x: 1128.1, y: 275.5, color: [148, 144, 183] },
  { role: 'predicate', x: 1497.8, y: 356.6, color: [155, 152, 187] },
  { role: 'identity', x: 1289.9, y: 410.8, color: [151, 148, 185] },
  // The rest where their cubes stand.
  { role: 'predicate', x: 664.5, y: 379, color: [139, 134, 180] },
  { role: 'object', x: 1990.5, y: 141.5, color: [172, 168, 194] },
  { role: 'bridge', x: 1872, y: 522, color: [181, 177, 199] },
  { role: 'object', x: 106, y: 688, color: [131, 127, 178] },
  { role: 'identity', x: 440.5, y: 755, color: [135, 131, 179] },
  { role: 'bridge', x: 774.5, y: 824, color: [140, 135, 180] },
  { role: 'object', x: 1095.5, y: 792, color: [147, 143, 182] },
  { role: 'predicate', x: 1255, y: 919.5, color: [150, 146, 184] },
  { role: 'identity', x: 694.5, y: 1133.5, color: [140, 136, 180] },
  { role: 'bridge', x: 1336, y: 1164.5, color: [154, 150, 186] },
  // Two below the reference's frame: only their shadows reach into it.
  { role: 'predicate', x: 22.5, y: 1437.5, color: [131, 127, 178] },
  { role: 'object', x: 1599.5, y: 1477.5, color: [165, 161, 191] },
];

/** The atoms' size: a square's top is 0.78 of it, and the cubes' tops are 183 pixels across. */
const ATOM_SIZE = 183 / 0.78;

/** The low light's shadow: each shape's foot swept along this, up the picture and a little right. */
export const LONG_SHADOW: Point = [52, -306];

/** The far light's shadow, where a shape at (x, y) throws it: up and to the left, shorter toward the light. */
function shortShadow(x: number, y: number): Point {
  return [-83 + 0.029 * (x - 665), -19 + 0.0167 * (y - 141)];
}

/** Where the far light stands, off the frame at the lower right: the rims it lights face it. */
const FAR_LIGHT: Point = [3527, 1279];

/** How far left of its top a shape's foot is: toward the right, the camera sees the shapes' left sides. */
function footOffset(x: number): Point {
  return [-Math.max(0, 0.03 * (x - 1480)), 0];
}

/** That side, as the reference's two rightmost cubes show it: violet, pink at its foot, where the low light reaches. */
const SIDE = '#9271b2';
const SIDE_FOOT = '#b279bd';

/** How soft the long shadow's edges are, in design pixels: across it, and along it, where its far end fades. */
const LONG_SOFT = { across: 1.5, along: 6 } as const;
/** How soft the short shadow's edges are. */
const SHORT_SOFT = 2;
/**
 * The low light's glow on the floor before each shape: its color in linear
 * light at the shape's foot, how far each channel reaches (it falls off as
 * e^(-d/reach)), and how soft its ends are, in design pixels.
 */
const GLOW = {
  color: [0.4, 0.17, 0.19],
  reach: [28, 22, 23],
  soft: 5,
} as const;
/**
 * The rims: the low light's pink along the edges that face it, where it
 * reaches them, and the far light's pale one along those that face it.
 * Each adds this share of the top's color at the edge, fading inward over
 * `width` design pixels.
 */
const RIM_LOW = { color: [1, 0.4, 0.28], width: 2 } as const;
const RIM_FAR = { color: [0.23, 0.42, 0.1], width: 2 } as const;

/** A tall frame shows this much of the design across: the middle of the shapes, a clear band above them for the clock. */
const TALL_ACROSS = 1400;

const toLinear = (value: number): number => {
  const c = value / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const toSrgb = (value: number): number => {
  const c = Math.min(1, Math.max(0, value));
  return 255 * (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055);
};
const n = (value: number): number => Number(value.toFixed(2));

/** A shape's top: the film's rounded outline, `ATOM_SIZE` across, its arcs sampled every 5°, as a convex polygon in the design. */
export function longShadowsTop(part: LongShadowsPart): Point[] {
  const radius = ROUNDING * ATOM_SIZE;
  const points: Point[] = [];
  for (const corner of roundedOutline(part.role, part.role, 1)) {
    const sweep = corner.to - corner.from;
    const steps =
      sweep === 0
        ? 0
        : Math.max(1, Math.ceil(Math.abs(sweep) / (Math.PI / 36)));
    for (let step = 0; step <= steps; step += 1) {
      const angle = corner.from + (steps === 0 ? 0 : (sweep * step) / steps);
      points.push([
        part.x + corner.x * ATOM_SIZE + radius * Math.cos(angle),
        part.y + corner.y * ATOM_SIZE + radius * Math.sin(angle),
      ]);
    }
  }
  return convexHull(points);
}

const moved = (points: readonly Point[], [dx, dy]: Point): Point[] =>
  points.map(([x, y]): Point => [x + dx, y + dy]);

/**
 * How far inside a shape's top a point is, and the way out of the top
 * nearest it. The top is the atom's core (its corners, or the circle's
 * radius) grown by the rounding all round, so this is the rounding less the
 * distance to the core: a few corners to measure, not the outline's every
 * point. Negative outside.
 */
function insideTop(
  part: LongShadowsPart,
  core: Edges | undefined,
  x: number,
  y: number,
): { depth: number; nx: number; ny: number } {
  const rounding = ROUNDING * ATOM_SIZE;
  if (core === undefined) {
    // The circle: its radius, 0.4 of the size.
    const distance = Math.hypot(x - part.x, y - part.y) || 1;
    return {
      depth: (0.4 + ROUNDING) * ATOM_SIZE - distance,
      nx: (x - part.x) / distance,
      ny: (y - part.y) / distance,
    };
  }
  const count = core.ax.length;
  let most = -Infinity;
  let nearest = 0;
  for (let index = 0; index < count; index += 1) {
    const out =
      (core.nx[index] ?? 0) * (x - (core.ax[index] ?? 0)) +
      (core.ny[index] ?? 0) * (y - (core.ay[index] ?? 0));
    if (out > most) {
      most = out;
      nearest = index;
    }
  }
  if (most <= 0) {
    // Inside the core: its nearest side.
    return {
      depth: rounding - most,
      nx: core.nx[nearest] ?? 0,
      ny: core.ny[nearest] ?? 0,
    };
  }
  // Outside the core, in a rounded corner or beyond: its nearest point.
  let least = Infinity;
  let way: Point = [0, 0];
  for (let index = 0; index < count; index += 1) {
    const ax = core.ax[index] ?? 0;
    const ay = core.ay[index] ?? 0;
    const bx = core.ax[(index + 1) % count] ?? 0;
    const by = core.ay[(index + 1) % count] ?? 0;
    const ex = bx - ax;
    const ey = by - ay;
    const t = Math.min(
      1,
      Math.max(0, ((x - ax) * ex + (y - ay) * ey) / (ex * ex + ey * ey || 1)),
    );
    const dx = x - (ax + t * ex);
    const dy = y - (ay + t * ey);
    const distance = Math.hypot(dx, dy);
    if (distance < least) {
      least = distance;
      way = [dx / (distance || 1), dy / (distance || 1)];
    }
  }
  return { depth: rounding - least, nx: way[0], ny: way[1] };
}

/** A shape's core, the corners its outline turns at, as edges in the design; none for the circle. */
function coreOf(part: LongShadowsPart): Edges | undefined {
  if (part.role === 'identity') {
    return undefined;
  }
  const corners = roundedOutline(part.role, part.role, 1)
    .filter((corner) => corner.to !== corner.from)
    .map((corner): Point => [
      part.x + corner.x * ATOM_SIZE,
      part.y + corner.y * ATOM_SIZE,
    ]);
  return edgesOf(convexHull(corners));
}

/** A shape as we see it: its top and, toward the right, its side down to its foot. */
export function longShadowsSolid(part: LongShadowsPart): Point[] {
  const top = longShadowsTop(part);
  return convexHull([...top, ...moved(top, footOffset(part.x))]);
}

/** Each edge of a convex polygon: a point on it and its outward normal. */
interface Edges {
  ax: Float64Array;
  ay: Float64Array;
  nx: Float64Array;
  ny: Float64Array;
}

function edgesOf(polygon: readonly Point[]): Edges {
  const count = polygon.length;
  const cx = polygon.reduce((sum, [x]) => sum + x, 0) / count;
  const cy = polygon.reduce((sum, [, y]) => sum + y, 0) / count;
  const edges: Edges = {
    ax: new Float64Array(count),
    ay: new Float64Array(count),
    nx: new Float64Array(count),
    ny: new Float64Array(count),
  };
  for (let index = 0; index < count; index += 1) {
    const [ax, ay] = polygon[index] ?? [0, 0];
    const [bx, by] = polygon[(index + 1) % count] ?? [0, 0];
    const length = Math.hypot(bx - ax, by - ay) || 1;
    let nx = (by - ay) / length;
    let ny = -(bx - ax) / length;
    if (nx * (cx - ax) + ny * (cy - ay) > 0) {
      nx = -nx;
      ny = -ny;
    }
    edges.ax[index] = ax;
    edges.ay[index] = ay;
    edges.nx[index] = nx;
    edges.ny[index] = ny;
  }
  return edges;
}

/** How far inside a convex polygon a point is (negative outside), and its nearest edge. */
function depthIn(
  edges: Edges,
  x: number,
  y: number,
): { depth: number; edge: number } {
  let most = -Infinity;
  let edge = 0;
  for (let index = 0; index < edges.ax.length; index += 1) {
    const out =
      (edges.nx[index] ?? 0) * (x - (edges.ax[index] ?? 0)) +
      (edges.ny[index] ?? 0) * (y - (edges.ay[index] ?? 0));
    if (out > most) {
      most = out;
      edge = index;
    }
  }
  return { depth: -most, edge };
}

/** Where a ray from (x, y) along (dx, dy) enters a convex polygon, and through which edge; none when it misses or starts inside. */
function entry(
  edges: Edges,
  x: number,
  y: number,
  dx: number,
  dy: number,
): { distance: number; edge: number } | undefined {
  let enter = -Infinity;
  let leave = Infinity;
  let edge = -1;
  for (let index = 0; index < edges.ax.length; index += 1) {
    const nx = edges.nx[index] ?? 0;
    const ny = edges.ny[index] ?? 0;
    const outside =
      nx * (x - (edges.ax[index] ?? 0)) + ny * (y - (edges.ay[index] ?? 0));
    const toward = nx * dx + ny * dy;
    if (Math.abs(toward) < 1e-12) {
      if (outside > 0) {
        return undefined;
      }
      continue;
    }
    const t = -outside / toward;
    if (toward < 0) {
      if (t > enter) {
        enter = t;
        edge = index;
      }
    } else {
      leave = Math.min(leave, t);
    }
  }
  return enter > leave || enter <= 0 || edge < 0
    ? undefined
    : { distance: enter, edge };
}

/** A raster over part of the design: `scale` pixels a design pixel, its top left corner at (`left`, `top`) in the design. */
interface Grid {
  width: number;
  height: number;
  scale: number;
  left: number;
  top: number;
}

/** Adds a convex polygon's coverage to `into`, by the larger: exact across, four rows a pixel down. */
function cover(
  polygon: readonly Point[],
  grid: Grid,
  into: Float32Array,
): void {
  const SUB = 4;
  const points = polygon.map(([x, y]): Point => [
    (x - grid.left) * grid.scale,
    (y - grid.top) * grid.scale,
  ]);
  const ys = points.map(([, y]) => y);
  const top = Math.max(0, Math.floor(Math.min(...ys)));
  const bottom = Math.min(grid.height - 1, Math.ceil(Math.max(...ys)));
  const row = new Float32Array(grid.width);
  for (let r = top; r <= bottom; r += 1) {
    row.fill(0);
    let first = grid.width;
    let last = -1;
    for (let sub = 0; sub < SUB; sub += 1) {
      const y = r + (sub + 0.5) / SUB;
      let left = Infinity;
      let right = -Infinity;
      for (let index = 0; index < points.length; index += 1) {
        const [ax, ay] = points[index] ?? [0, 0];
        const [bx, by] = points[(index + 1) % points.length] ?? [0, 0];
        if ((ay <= y && by > y) || (by <= y && ay > y)) {
          const x = ax + ((y - ay) / (by - ay)) * (bx - ax);
          left = Math.min(left, x);
          right = Math.max(right, x);
        }
      }
      if (!(left < right)) {
        continue;
      }
      const from = Math.max(0, Math.floor(left));
      const to = Math.min(grid.width - 1, Math.floor(right));
      for (let column = from; column <= to; column += 1) {
        const overlap = Math.min(right, column + 1) - Math.max(left, column);
        if (overlap > 0) {
          row[column] = (row[column] ?? 0) + overlap / SUB;
        }
      }
      first = Math.min(first, from);
      last = Math.max(last, to);
    }
    for (let column = first; column <= last; column += 1) {
      const at = r * grid.width + column;
      into[at] = Math.max(into[at] ?? 0, row[column] ?? 0);
    }
  }
}

/** Three box blurs as wide as make one Gaussian of `sigma` pixels: each box's width. */
function boxesFor(sigma: number): number[] {
  const ideal = Math.sqrt((12 * sigma * sigma) / 3 + 1);
  let lower = Math.floor(ideal);
  if (lower % 2 === 0) {
    lower -= 1;
  }
  const upper = lower + 2;
  const many = Math.round(
    (12 * sigma * sigma - 3 * lower * lower - 12 * lower - 9) /
      (-4 * lower - 4),
  );
  return [0, 1, 2].map((index) => (index < many ? lower : upper));
}

/** A box blur of `width` pixels along rows (or columns), in place, each end held beyond it. */
function boxBlur(
  values: Float32Array,
  grid: Grid,
  width: number,
  isAlongRows: boolean,
): void {
  const radius = (width - 1) / 2;
  const [lines, length] = isAlongRows
    ? [grid.height, grid.width]
    : [grid.width, grid.height];
  const at = (line: number, index: number) =>
    isAlongRows ? line * grid.width + index : index * grid.width + line;
  const line = new Float32Array(length);
  const value = (index: number) =>
    line[Math.min(length - 1, Math.max(0, index))] ?? 0;
  for (let each = 0; each < lines; each += 1) {
    for (let index = 0; index < length; index += 1) {
      line[index] = values[at(each, index)] ?? 0;
    }
    let sum = 0;
    for (let index = -radius; index <= radius; index += 1) {
      sum += value(index);
    }
    for (let index = 0; index < length; index += 1) {
      values[at(each, index)] = sum / width;
      sum += value(index + radius + 1) - value(index - radius);
    }
  }
}

/** A Gaussian blur of `sigma` pixels, in place. */
function gaussianBlur(
  values: Float32Array,
  grid: Grid,
  sigma: number,
): Float32Array {
  if (sigma >= 0.3) {
    for (const width of boxesFor(sigma)) {
      boxBlur(values, grid, width, true);
      boxBlur(values, grid, width, false);
    }
  }
  return values;
}

/**
 * A Gaussian blur of `sigma` pixels down the columns (or along the rows)
 * only, in place. The long shadow runs within 10° of straight up and the
 * glow's ends within 10° of across: blurring them straight softens a side
 * by less than a pixel more, for a fraction of the cost.
 */
function oneWayBlur(
  values: Float32Array,
  grid: Grid,
  sigma: number,
  isAlongRows: boolean,
): Float32Array {
  if (sigma >= 0.3) {
    for (const width of boxesFor(sigma)) {
      boxBlur(values, grid, width, isAlongRows);
    }
  }
  return values;
}

/** The cells of the measured floor: 50 design pixels. */
const FLOOR_CELL = 50;

/** Catmull-Rom's four weights `t` of the way from the second value to the third. */
function catmullRomWeights(t: number, into: Float64Array): void {
  const t2 = t * t;
  const t3 = t2 * t;
  into[0] = 0.5 * (-t3 + 2 * t2 - t);
  into[1] = 0.5 * (3 * t3 - 5 * t2 + 2);
  into[2] = 0.5 * (-3 * t3 + 4 * t2 + t);
  into[3] = 0.5 * (t3 - t2);
}

const ACROSS_WEIGHTS = new Float64Array(4);
const DOWN_WEIGHTS = new Float64Array(4);

/**
 * The measured floors at a point of the design, smoothly between their
 * cells (Catmull-Rom) and held beyond them, in linear light: the lit floor
 * into `lit`, the long shadows' into `shaded`.
 */
function floorsAt(
  x: number,
  y: number,
  lit: Float64Array,
  shaded: Float64Array,
): void {
  const rows = LONG_SHADOWS_LIT.length;
  const columns = LONG_SHADOWS_LIT[0]?.length ?? 1;
  const u = Math.min(columns - 1, Math.max(0, x / FLOOR_CELL - 0.5));
  const v = Math.min(rows - 1, Math.max(0, y / FLOOR_CELL - 0.5));
  const column = Math.floor(u);
  const row = Math.floor(v);
  catmullRomWeights(u - column, ACROSS_WEIGHTS);
  catmullRomWeights(v - row, DOWN_WEIGHTS);
  lit.fill(0);
  shaded.fill(0);
  for (let j = 0; j < 4; j += 1) {
    const r = Math.min(rows - 1, Math.max(0, row - 1 + j));
    const litRow = LONG_SHADOWS_LIT[r];
    const shadedRow = LONG_SHADOWS_SHADED[r];
    for (let i = 0; i < 4; i += 1) {
      const c = Math.min(columns - 1, Math.max(0, column - 1 + i));
      const weight = (DOWN_WEIGHTS[j] ?? 0) * (ACROSS_WEIGHTS[i] ?? 0);
      const litCell = litRow?.[c];
      const shadedCell = shadedRow?.[c];
      for (let channel = 0; channel < 3; channel += 1) {
        lit[channel] = (lit[channel] ?? 0) + weight * (litCell?.[channel] ?? 0);
        shaded[channel] =
          (shaded[channel] ?? 0) + weight * (shadedCell?.[channel] ?? 0);
      }
    }
  }
  for (let channel = 0; channel < 3; channel += 1) {
    lit[channel] = toLinear(lit[channel] ?? 0);
    shaded[channel] = toLinear(shaded[channel] ?? 0);
  }
}

/** The far light's part of the lit floor at a point of the design, in linear light: never below nothing. */
function farLightAt(x: number, y: number, channel: number): number {
  const X = x / 1000;
  const Y = y / 1000;
  const terms = [1, X, Y, X * X, X * Y, Y * Y];
  let sum = 0;
  for (const [index, term] of terms.entries()) {
    sum += term * (LONG_SHADOWS_FAR_LIGHT[index]?.[channel] ?? 0);
  }
  return Math.max(0, sum);
}

/**
 * Linear light as a PNG. Dithered, a little noise is added before each
 * channel is rounded, so a long soft gradient shows no steps; the flat tops
 * need none, and without it they deflate to almost nothing.
 */
function png(
  width: number,
  height: number,
  linear: Float32Array,
  dither?: { seed: number },
): string {
  const random = dither === undefined ? () => 0.5 : seededRandom(dither.seed);
  const rgba = new Uint8Array(width * height * 4);
  for (let index = 0; index < width * height; index += 1) {
    for (let channel = 0; channel < 3; channel += 1) {
      const value =
        toSrgb(linear[index * 3 + channel] ?? 0) + random() + random() - 1;
      rgba[index * 4 + channel] = Math.min(255, Math.max(0, Math.round(value)));
    }
    rgba[index * 4 + 3] = 255;
  }
  return encodePng(width, height, rgba).toString('base64');
}

/** The design as `frame` shows it: its scale, and where its top left corner lands. */
export interface LongShadowsPlacement {
  scale: number;
  x: number;
  y: number;
}

/** A shape's bounds in the design, its side included. */
interface Bounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/** Each part's bounds, worked out once: placing a banner tries hundreds of heights. */
const BOUNDS = new Map<LongShadowsPart, Bounds>();

function boundsOf(part: LongShadowsPart): Bounds {
  const known = BOUNDS.get(part);
  if (known !== undefined) {
    return known;
  }
  const solid = longShadowsSolid(part);
  const bounds = {
    left: Math.min(...solid.map(([x]) => x)),
    right: Math.max(...solid.map(([x]) => x)),
    top: Math.min(...solid.map(([, y]) => y)),
    bottom: Math.max(...solid.map(([, y]) => y)),
  };
  BOUNDS.set(part, bounds);
  return bounds;
}

/** Whether a shape stands, even in part, in the corner of `frame` a platform lays its picture over. */
function isInCorner(
  part: LongShadowsPart,
  frame: AtomsFrame,
  placement: LongShadowsPlacement,
): boolean {
  const clear = frame.clear;
  if (clear === undefined) {
    return false;
  }
  const box = boundsOf(part);
  return !(
    placement.x + box.right * placement.scale <= clear.x ||
    placement.x + box.left * placement.scale >= clear.x + clear.width ||
    placement.y + box.bottom * placement.scale <= clear.y ||
    placement.y + box.top * placement.scale >= clear.y + clear.height
  );
}

/**
 * Where the design sits in `frame`. A wide frame is covered, the design
 * centered; where a platform lays its picture over a corner, the design
 * slides up or down, as little as it can, to where the fewest shapes stand
 * in it. A tall frame shows the middle `TALL_ACROSS` of the design across,
 * centered, the floor running on above and below: a clear band at the top
 * for the clock.
 */
export function longShadowsPlacement(frame: AtomsFrame): LongShadowsPlacement {
  const { width, height } = LONG_SHADOWS_DESIGN;
  const isTall = frame.height > frame.width;
  const scale = isTall
    ? frame.width / TALL_ACROSS
    : Math.max(frame.width / width, frame.height / height);
  const x = frame.width / 2 - (width / 2) * scale;
  const centered = { scale, x, y: frame.height / 2 - (height / 2) * scale };
  if (frame.clear === undefined || isTall) {
    return centered;
  }
  const inCorner = (placement: LongShadowsPlacement) =>
    LONG_SHADOWS_PARTS.filter((part) => isInCorner(part, frame, placement))
      .length;
  const lowest = frame.height - height * scale;
  let best = centered;
  let fewest = inCorner(centered);
  for (let step = 1; step <= Math.ceil(-lowest) && fewest > 0; step += 1) {
    for (const y of [centered.y - step, centered.y + step]) {
      const placement = { scale, x, y };
      const count = y <= 0 && y >= lowest ? inCorner(placement) : Infinity;
      if (count < fewest) {
        best = placement;
        fewest = count;
      }
    }
  }
  return best;
}

/** The shapes `frame` shows: all but those standing in the corner a platform lays its picture over, their shadows and glows going with them. */
export function longShadowsShown(frame: AtomsFrame): LongShadowsPart[] {
  const placement = longShadowsPlacement(frame);
  return LONG_SHADOWS_PARTS.filter(
    (part) => !isInCorner(part, frame, placement),
  );
}

/**
 * Long shadows in `frame`, as SVG elements: the floor, its shadows and its
 * glows as one dithered image at half the frame's pixels; over it each
 * shape's side, where it shows, and its top, an image at the frame's pixels
 * clipped to the atom's outline. A shape standing in the corner a platform
 * covers is left out, with its shadows and its glow.
 */
export function longShadowsSvg(frame: AtomsFrame): string {
  const placement = longShadowsPlacement(frame);
  const parts = longShadowsShown(frame);
  const tops = parts.map(longShadowsTop);
  const feet = tops.map((top, index) =>
    moved(top, footOffset(parts[index]?.x ?? 0)),
  );
  const footEdges = feet.map(edgesOf);
  const solids = parts.map(longShadowsSolid);
  const longs = feet.map((foot) =>
    convexHull([...foot, ...moved(foot, LONG_SHADOW)]),
  );
  const longEdges = longs.map(edgesOf);
  const longBoxes = longs.map((polygon) => ({
    left: Math.min(...polygon.map(([x]) => x)),
    right: Math.max(...polygon.map(([x]) => x)),
    top: Math.min(...polygon.map(([, y]) => y)),
    bottom: Math.max(...polygon.map(([, y]) => y)),
  }));
  // The short shadow's far edge where the reference's is, from the top; its near edge the foot.
  const shorts = feet.map((foot, index) => {
    const part = parts[index];
    return convexHull([
      ...foot,
      ...moved(tops[index] ?? [], shortShadow(part?.x ?? 0, part?.y ?? 0)),
    ]);
  });
  const length = Math.hypot(...LONG_SHADOW);
  const along: Point = [LONG_SHADOW[0] / length, LONG_SHADOW[1] / length];

  // Where the low light reaches a shape's side: not in another shape's long shadow.
  const isLit = (index: number, x: number, y: number): boolean =>
    longEdges.every((edges, other) => {
      const box = longBoxes[other];
      return (
        other === index ||
        box === undefined ||
        x < box.left ||
        x > box.right ||
        y < box.top ||
        y > box.bottom ||
        depthIn(edges, x, y).depth <= 0
      );
    });

  // The floor, at half the frame's pixels.
  const grid: Grid = {
    width: Math.max(2, Math.round(frame.width / 2)),
    height: Math.max(2, Math.round(frame.height / 2)),
    scale: placement.scale / 2,
    left: -placement.x / placement.scale,
    top: -placement.y / placement.scale,
  };
  const pixels = grid.width * grid.height;
  // The floor the shapes leave seen: 1 where none stands. Each soft edge is
  // worked out from that floor alone (a normalized blur), so neither a
  // shadow nor the glow spills over the edges that face the light, and
  // under each shape's edge the floor is what lies just outside it.
  const open = new Float32Array(pixels);
  for (const solid of solids) {
    cover(solid, grid, open);
  }
  for (let index = 0; index < pixels; index += 1) {
    open[index] = 1 - (open[index] ?? 0);
  }
  const softOver = (
    values: Float32Array,
    blur: (plane: Float32Array) => Float32Array,
  ) => {
    const top = blur(values.map((value, index) => value * (open[index] ?? 0)));
    const bottom = blur(Float32Array.from(open));
    return top.map((value, index) => {
      const weight = bottom[index] ?? 0;
      return weight > 1e-3 ? value / weight : (values[index] ?? 0);
    });
  };
  const coverage = (polygons: readonly Point[][]) => {
    const mask = new Float32Array(pixels);
    for (const polygon of polygons) {
      cover(polygon, grid, mask);
    }
    return mask;
  };
  const long = softOver(coverage(longs), (plane) =>
    oneWayBlur(
      gaussianBlur(plane, grid, LONG_SOFT.across * grid.scale),
      grid,
      LONG_SOFT.along * grid.scale,
      false,
    ),
  );
  const short = softOver(coverage(shorts), (plane) =>
    gaussianBlur(plane, grid, SHORT_SOFT * grid.scale),
  );

  // The glow: on the floor before each shape's foot, toward the low light,
  // by how far the floor is from the foot along it and how squarely that
  // edge faces the light, where the light reaches it.
  const glow = [0, 1, 2].map(() => new Float32Array(pixels));
  const reach = Math.max(...GLOW.reach) * 5;
  for (const [index, foot] of feet.entries()) {
    const edges = footEdges[index];
    if (edges === undefined) {
      continue;
    }
    const facing = Array.from(edges.nx, (nx, edge) =>
      Math.max(0, -(nx * along[0] + (edges.ny[edge] ?? 0) * along[1])),
    );
    const xs = foot.map(([x]) => x);
    const ys = foot.map(([, y]) => y);
    const columnOf = (x: number) => (x - grid.left) * grid.scale;
    const rowOf = (y: number) => (y - grid.top) * grid.scale;
    const left = Math.max(
      0,
      Math.floor(columnOf(Math.min(...xs) - 0.3 * reach)),
    );
    const right = Math.min(
      grid.width - 1,
      Math.ceil(columnOf(Math.max(...xs) + 10)),
    );
    const top = Math.max(
      0,
      Math.floor(rowOf((Math.min(...ys) + Math.max(...ys)) / 2)),
    );
    const bottom = Math.min(
      grid.height - 1,
      Math.ceil(rowOf(Math.max(...ys) + reach)),
    );
    for (let row = top; row <= bottom; row += 1) {
      for (let column = left; column <= right; column += 1) {
        const x = grid.left + (column + 0.5) / grid.scale;
        const y = grid.top + (row + 0.5) / grid.scale;
        const hit = entry(edges, x, y, along[0], along[1]);
        if (hit === undefined || hit.distance > reach) {
          continue;
        }
        const nx = edges.nx[hit.edge] ?? 0;
        const ny = edges.ny[hit.edge] ?? 0;
        const strength = facing[hit.edge] ?? 0;
        if (
          strength === 0 ||
          !isLit(
            index,
            x + hit.distance * along[0] + nx * 3,
            y + hit.distance * along[1] + ny * 3,
          )
        ) {
          continue;
        }
        for (const [channel, plane] of glow.entries()) {
          plane[row * grid.width + column] =
            (plane[row * grid.width + column] ?? 0) +
            strength *
              (GLOW.color[channel] ?? 0) *
              Math.exp(-hit.distance / (GLOW.reach[channel] ?? 1));
        }
      }
    }
  }
  const softGlow = glow.map((plane) =>
    softOver(plane, (values) =>
      oneWayBlur(values, grid, GLOW.soft * grid.scale, true),
    ),
  );

  // The floor: lit, less the low light where its long shadows fall, less the
  // far light where its short ones do, and the glow.
  const floor = new Float32Array(pixels * 3);
  const lit = new Float64Array(3);
  const shaded = new Float64Array(3);
  for (let row = 0; row < grid.height; row += 1) {
    for (let column = 0; column < grid.width; column += 1) {
      const x = grid.left + (column + 0.5) / grid.scale;
      const y = grid.top + (row + 0.5) / grid.scale;
      floorsAt(x, y, lit, shaded);
      const index = row * grid.width + column;
      for (let channel = 0; channel < 3; channel += 1) {
        const all = lit[channel] ?? 0;
        const low = Math.max(0, all - (shaded[channel] ?? 0));
        const far = Math.min(farLightAt(x, y, channel), 0.92 * (all - low));
        floor[index * 3 + channel] =
          all -
          (long[index] ?? 0) * low -
          (short[index] ?? 0) * far +
          (softGlow[channel]?.[index] ?? 0);
      }
    }
  }
  const floorPng = png(grid.width, grid.height, floor, { seed: 11 });

  // Each shape: its side where it shows, then its top.
  const toFrame = ([x, y]: Point): Point => [
    placement.x + x * placement.scale,
    placement.y + y * placement.scale,
  ];
  const pathOf = (points: readonly Point[]) =>
    `M${points
      .map(toFrame)
      .map(([x, y]) => `${n(x)} ${n(y)}`)
      .join('L')}Z`;
  const defs: string[] = [];
  const shapes: string[] = [];
  for (const [index, part] of parts.entries()) {
    const top = tops[index];
    const solid = solids[index];
    if (top === undefined || solid === undefined) {
      continue;
    }
    const corners = solid.map(toFrame);
    const left = Math.max(
      0,
      Math.floor(Math.min(...corners.map(([x]) => x))) - 1,
    );
    const right = Math.min(
      frame.width,
      Math.ceil(Math.max(...corners.map(([x]) => x))) + 1,
    );
    const upper = Math.max(
      0,
      Math.floor(Math.min(...corners.map(([, y]) => y))) - 1,
    );
    const lower = Math.min(
      frame.height,
      Math.ceil(Math.max(...corners.map(([, y]) => y))) + 1,
    );
    if (right <= left || lower <= upper) {
      continue;
    }
    if (footOffset(part.x)[0] < 0) {
      const ys = corners.map(([, y]) => y);
      defs.push(
        `<linearGradient id="long-shadows-side-${index}" gradientUnits="userSpaceOnUse" x1="0" y1="${n(Math.min(...ys))}" x2="0" y2="${n(Math.max(...ys))}"><stop offset="0" stop-color="${SIDE}"/><stop offset="0.92" stop-color="${SIDE}"/><stop offset="1" stop-color="${SIDE_FOOT}"/></linearGradient>`,
      );
      shapes.push(
        `<path d="${pathOf(solid)}" fill="url(#long-shadows-side-${index})"/>`,
      );
    }
    const image = topImage(
      part,
      index,
      { left, right, upper, lower },
      placement,
      isLit,
    );
    defs.push(
      `<clipPath id="long-shadows-top-${index}"><path d="${pathOf(top)}"/></clipPath>`,
    );
    shapes.push(
      `<image href="data:image/png;base64,${image}" x="${left}" y="${upper}" width="${right - left}" height="${lower - upper}" clip-path="url(#long-shadows-top-${index})"/>`,
    );
  }
  return `<defs>${defs.join('')}</defs><image href="data:image/png;base64,${floorPng}" x="0" y="0" width="${frame.width}" height="${frame.height}" preserveAspectRatio="none"/>${shapes.join('')}`;
}

/** How far in from its edge a top shows its rims, in design pixels: beyond, it is its flat color. */
const RIM_REACH = 6 * Math.max(RIM_LOW.width, RIM_FAR.width);

/**
 * A shape's top as a PNG at the frame's pixels over `box`, to clip to its
 * outline: flat in its color, with the low light's pink rim along the edges
 * that face it, where it reaches them, and the far light's pale rim along
 * those that face that light.
 */
function topImage(
  part: LongShadowsPart,
  index: number,
  box: { left: number; right: number; upper: number; lower: number },
  placement: LongShadowsPlacement,
  isLit: (index: number, x: number, y: number) => boolean,
): string {
  const core = coreOf(part);
  const color = part.color.map(toLinear);
  const length = Math.hypot(...LONG_SHADOW);
  const towardLow: Point = [-LONG_SHADOW[0] / length, -LONG_SHADOW[1] / length];
  const far = Math.hypot(FAR_LIGHT[0] - part.x, FAR_LIGHT[1] - part.y);
  const towardFar: Point = [
    (FAR_LIGHT[0] - part.x) / far,
    (FAR_LIGHT[1] - part.y) / far,
  ];
  const width = box.right - box.left;
  const height = box.lower - box.upper;
  const linear = new Float32Array(width * height * 3);
  for (let row = 0; row < height; row += 1) {
    for (let column = 0; column < width; column += 1) {
      const x = (box.left + column + 0.5 - placement.x) / placement.scale;
      const y = (box.upper + row + 0.5 - placement.y) / placement.scale;
      let rimLow = 0;
      let rimFar = 0;
      const { depth, nx, ny } = insideTop(part, core, x, y);
      // Outside, at the edge's own pixels, the rims are as at the edge.
      const inside = Math.max(0, depth);
      if (inside < RIM_REACH) {
        const facesLow = Math.max(0, nx * towardLow[0] + ny * towardLow[1]);
        if (
          facesLow > 0 &&
          isLit(index, x + nx * (inside + 3), y + ny * (inside + 3))
        ) {
          rimLow = facesLow * Math.exp(-inside / RIM_LOW.width);
        }
        rimFar =
          Math.max(0, nx * towardFar[0] + ny * towardFar[1]) ** 2 *
          Math.exp(-inside / RIM_FAR.width);
      }
      for (let channel = 0; channel < 3; channel += 1) {
        const own = color[channel] ?? 0;
        linear[(row * width + column) * 3 + channel] =
          own *
          (1 +
            (RIM_LOW.color[channel] ?? 0) * rimLow +
            (RIM_FAR.color[channel] ?? 0) * rimFar);
      }
    }
  }
  return png(width, height, linear);
}

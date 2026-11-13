/**
 * A bond for the brand's pictures, drawn from the film's own dots
 * (`story-dots.ts`) by the brand skill's rules (`reference/bonds*.md`): a
 * faint hairline carrying fine dots of ink, in Midnight on light and Graphite
 * 0 on dark; a plain line under 12px atoms; the film's own bond from 12px to
 * 34px; growing to 68px; held at double the film's above. A test holds it
 * to the skill's `scripts/bond.mjs`, output for output.
 */

import { dotsAlong, PIXELS_PER_DOT } from '@/components/playground/story-dots';
import { PLANE } from '@/components/playground/story-plane';

export type BondGround = 'light' | 'dark';

/** The film's atom size: every measure of a bond is at it. */
const FILM_ATOM_SIZE = PLANE.atomSize;
/** The film's hairline: 1px. */
const HAIRLINE = 1;
/** Under this atom size a bond is a plain line; from it to the film's size, the film's bond. */
const PLAIN_UNDER = 12;
/** Over this atom size a bond holds at double the film's. */
const HELD_OVER = 68;

/** The ink, the hairline's opacity, the dots' share of theirs and the plain line's opacity, by ground. */
export const BOND_GROUNDS: Readonly<
  Record<BondGround, { ink: string; line: number; dots: number; plain: number }>
> = {
  light: { ink: '#16161e', line: 0.16, dots: 1, plain: 0.4 },
  dark: { ink: '#ffffff', line: 0.12, dots: 0.8, plain: 0.3 },
};

const round = (value: number): number => Number(value.toFixed(3));

interface Point {
  x: number;
  y: number;
}

export interface BondOptions {
  /** Seeds its dots: stable for each bond, as `<triple>:0`. */
  id: string;
  /** The subject's end. */
  from: Point;
  to: Point;
  /** The atoms' size, in the picture's pixels. */
  atomSize: number;
  ground?: BondGround;
  /** One device pixel in the picture's units: 1, or 0.5 on high-density screens. */
  devicePixel?: number;
  /** The moment of the film, in milliseconds: 0 for a still. */
  timeMs?: number;
}

/** A bond as SVG, the same, character for character, as the skill's `bondSvg`. */
export function bondSvg({
  id,
  from,
  to,
  atomSize,
  ground = 'light',
  devicePixel = 1,
  timeMs = 0,
}: BondOptions): string {
  const look = BOND_GROUNDS[ground];
  const scale =
    Math.min(Math.max(atomSize, FILM_ATOM_SIZE), HELD_OVER) / FILM_ATOM_SIZE;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);
  if (length === 0) {
    return '';
  }
  const ends = `x1="${round(from.x)}" y1="${round(from.y)}" x2="${round(to.x)}" y2="${round(to.y)}"`;
  if (atomSize < PLAIN_UNDER) {
    return `<line ${ends} stroke="${look.ink}" stroke-opacity="${look.plain}" stroke-width="${round(devicePixel)}" stroke-linecap="round"/>`;
  }
  const normal = { x: -dy / length, y: dx / length };
  const line = `<line ${ends} stroke="${look.ink}" stroke-opacity="${look.line}" stroke-width="${round(HAIRLINE * scale)}" stroke-linecap="round"/>`;
  const filmLength = length / scale;
  const dots = dotsAlong(
    id,
    filmLength,
    Math.round(filmLength / PIXELS_PER_DOT),
    timeMs,
    1,
  )
    .map((dot) => {
      const x = from.x + dx * dot.along + normal.x * dot.offset * scale;
      const y = from.y + dy * dot.along + normal.y * dot.offset * scale;
      return `<circle cx="${round(x)}" cy="${round(y)}" r="${round(dot.radius * scale)}" fill="${look.ink}" fill-opacity="${round(dot.alpha * look.dots)}"/>`;
    })
    .join('');
  return `<g>${line}${dots}</g>`;
}

export interface CurvedBondOptions extends BondOptions {
  /**
   * How far its middle bends off the straight line, as a share of its
   * length: 0 is the straight bond. It bends up on the picture, or left
   * when it runs straight up and down.
   */
  bend: number;
  /**
   * Over 68px atoms, the bond is held at this many times the film's: 2, as
   * the skill says, unless a picture's approved exception holds it larger.
   */
  heldAt?: number;
}

/**
 * The same bond along a gentle curve: its hairline a quadratic curve, its
 * dots the film's, each as far along the curve and as far off it as
 * `bondSvg` puts it along and off the line. With no bend, the dots stand
 * where `bondSvg` draws them.
 */
export function curvedBondSvg({
  id,
  from,
  to,
  atomSize,
  bend,
  heldAt = HELD_OVER / FILM_ATOM_SIZE,
  ground = 'light',
  devicePixel = 1,
  timeMs = 0,
}: CurvedBondOptions): string {
  const look = BOND_GROUNDS[ground];
  const scale =
    Math.min(Math.max(atomSize, FILM_ATOM_SIZE), FILM_ATOM_SIZE * heldAt) /
    FILM_ATOM_SIZE;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);
  if (length === 0) {
    return '';
  }
  // The control point: off the middle, up the picture (left when upright),
  // twice the bend away, as a quadratic curve reaches half way to it.
  let side = { x: -dy / length, y: dx / length };
  if (side.y > 0 || (side.y === 0 && side.x > 0)) {
    side = { x: -side.x, y: -side.y };
  }
  const control = {
    x: (from.x + to.x) / 2 + side.x * 2 * bend * length,
    y: (from.y + to.y) / 2 + side.y * 2 * bend * length,
  };
  const at = (t: number) => {
    const u = 1 - t;
    return {
      x: u * u * from.x + 2 * u * t * control.x + t * t * to.x,
      y: u * u * from.y + 2 * u * t * control.y + t * t * to.y,
      tx: 2 * u * (control.x - from.x) + 2 * t * (to.x - control.x),
      ty: 2 * u * (control.y - from.y) + 2 * t * (to.y - control.y),
    };
  };
  const path = `M${round(from.x)} ${round(from.y)}Q${round(control.x)} ${round(control.y)} ${round(to.x)} ${round(to.y)}`;
  if (atomSize < PLAIN_UNDER) {
    return `<path d="${path}" fill="none" stroke="${look.ink}" stroke-opacity="${look.plain}" stroke-width="${round(devicePixel)}" stroke-linecap="round"/>`;
  }
  // Even steps along the curve, so a dot's share of the way is a share of its length.
  const SAMPLES = 1000;
  const lengths = [0];
  for (let index = 1; index <= SAMPLES; index += 1) {
    const p = at((index - 1) / SAMPLES);
    const q = at(index / SAMPLES);
    lengths.push((lengths[index - 1] ?? 0) + Math.hypot(q.x - p.x, q.y - p.y));
  }
  const total = lengths[SAMPLES] ?? length;
  const tAt = (share: number) => {
    const target = share * total;
    let low = 0;
    let high = SAMPLES;
    while (low < high) {
      const middle = (low + high) >> 1;
      if ((lengths[middle] ?? 0) < target) {
        low = middle + 1;
      } else {
        high = middle;
      }
    }
    const before = lengths[Math.max(0, low - 1)] ?? 0;
    const after = lengths[low] ?? before;
    const within = after > before ? (target - before) / (after - before) : 0;
    return (Math.max(0, low - 1) + within) / SAMPLES;
  };
  const line = `<path d="${path}" fill="none" stroke="${look.ink}" stroke-opacity="${look.line}" stroke-width="${round(HAIRLINE * scale)}" stroke-linecap="round"/>`;
  const filmLength = total / scale;
  const dots = dotsAlong(
    id,
    filmLength,
    Math.round(filmLength / PIXELS_PER_DOT),
    timeMs,
    1,
  )
    .map((dot) => {
      const p = at(tAt(Math.min(1, dot.along)));
      const tangent = Math.hypot(p.tx, p.ty) || 1;
      const x = p.x + (-p.ty / tangent) * dot.offset * scale;
      const y = p.y + (p.tx / tangent) * dot.offset * scale;
      return `<circle cx="${round(x)}" cy="${round(y)}" r="${round(dot.radius * scale)}" fill="${look.ink}" fill-opacity="${round(dot.alpha * look.dots)}"/>`;
    })
    .join('');
  return `<g>${line}${dots}</g>`;
}

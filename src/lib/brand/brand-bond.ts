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

/**
 * Intuition's bond, as the onboarding film draws it, for any picture.
 *
 * The constants and the generator below are the film's own (`story-dots.ts`
 * and `story-scene.tsx` in Learn), so a bond drawn here has the film's dots,
 * dot for dot, for the same id, length and moment. Lengths are in the film's
 * CSS pixels, at its atom size, 34px; `bondSvg` scales them to any atom size.
 *
 * No dependencies: run it with Node 18 or later, or import it in a browser.
 *
 *   import { bondSvg, tripleCenters } from './bond.mjs';
 *   const [a, b] = tripleCenters([96, 74], { atomSize: 34 });
 *   const svg = bondSvg({ id: 'belief:0', from: { x: a, y: 0 }, to: { x: b, y: 0 } });
 *   // On Midnight, Graphite 950 or black:
 *   const night = bondSvg({ id: 'belief:0', from: { x: a, y: 0 }, to: { x: b, y: 0 }, ground: 'dark' });
 */

/** The film's atom size, in CSS pixels: the size every measure here is at. */
export const FILM_ATOM_SIZE = 34;

/** The ink: Midnight, the brand's primary. */
export const INK = '#16161e';

/** The hairline under the dots: its width, and how dark, as a share of the ink. */
export const LINE = { width: 1, alpha: 0.16 };

/**
 * A bond by its ground. Light is the film's own. Dark (Midnight, Graphite 950
 * or black) is the ink in Graphite 0, the hairline at 12% and every dot at
 * 0.8 of its opacity: white on dark reads stronger, so it is drawn lighter.
 */
export const GROUNDS = {
  light: { ink: INK, line: LINE.alpha, dots: 1, plain: 0.4 },
  dark: { ink: '#ffffff', line: 0.12, dots: 0.8, plain: 0.3 },
};

/**
 * A bond's texture by its atoms' size. Under `PLAIN_UNDER` pixels the dots
 * would be too small to see, as when the film is zoomed far out: the bond is
 * a plain line, one device pixel wide, at the ground's `plain` opacity. From
 * there to the film's 34px it is the film's bond as it is, as the film keeps
 * it round its smallest atoms on the globe; from 34px to `HELD_OVER` it grows
 * with its atoms; over it, it holds at its `HELD_OVER` values, double the
 * film's, so a big atom's bond stays a hairline.
 */
export const PLAIN_UNDER = 12;
export const HELD_OVER = 68;

/** The dots: how many, how large, how far off the line, how dark. */
export const DOT_TEXTURE = {
  /** CSS pixels of line for each dot. */
  pixelsPerDot: 5,
  /** A dot's radius: the smallest, plus up to `range` more. */
  radius: { min: 0.45, range: 0.6 },
  /** How far a dot may sit off the line, either side. */
  maxOffset: 0.8,
  /** How dark a dot is: `min` plus up to `range`, along `curve`. */
  alpha: { min: 0.2, range: 0.75, curve: 2.2 },
};

/** Dots kept for each line. */
const POOL_SIZE = 800;
/** Film units a second: the slowest dot, and how much faster the fastest is. */
const SPEED = { min: 18, range: 26 };
/** How far a dot travels before it comes round to the subject again. */
const CYCLE_UNITS = 2400;

/** mulberry32: the film's seeded generator. */
function createRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** FNV-1a: a bond's id as its seed. */
function hash(text) {
  let value = 0x811c9dc5;
  for (const character of text) {
    value ^= character.codePointAt(0) ?? 0;
    value = Math.imul(value, 0x01000193);
  }
  return value >>> 0;
}

/** A bond's dots, made once from its id, in the film's order. */
function poolFor(id) {
  const random = createRandom(hash(id));
  return Array.from({ length: POOL_SIZE }, () => {
    const { radius, maxOffset, alpha } = DOT_TEXTURE;
    const darkness = random();
    return {
      start: random(),
      speed: SPEED.min + random() * SPEED.range,
      offset: (random() - 0.5) * 2 * maxOffset * random(),
      radius: radius.min + random() * radius.range,
      alpha: alpha.min + alpha.range * darkness ** alpha.curve,
    };
  });
}

/**
 * The dots of the bond `id`, `length` film pixels long, at `timeMs` of the
 * film, drawn as far as `progress`: each `along` the line from the subject
 * (0 to 1), `offset` across it and `radius` in film pixels, and `alpha`.
 */
export function bondDots(id, length, timeMs = 0, progress = 1) {
  if (length <= 0 || progress <= 0) {
    return [];
  }
  const count = Math.round(length / DOT_TEXTURE.pixelsPerDot);
  const used = Math.min(
    Math.max(Math.round((count * CYCLE_UNITS) / length), 0),
    POOL_SIZE,
  );
  const drawn = length * Math.min(progress, 1);
  const dots = [];
  for (const particle of poolFor(id).slice(0, used)) {
    const travelled =
      (particle.start * CYCLE_UNITS + (particle.speed * timeMs) / 1000) %
      CYCLE_UNITS;
    if (travelled < drawn) {
      dots.push({
        along: travelled / length,
        offset: particle.offset,
        radius: particle.radius,
        alpha: particle.alpha,
      });
    }
  }
  return dots;
}

const round = (value) => Number(value.toFixed(3));

/**
 * A bond as SVG, from `from` to `to` (subject's end first), with atoms
 * `atomSize` pixels: the hairline, then its dots. Under 12px, a plain line
 * of `devicePixel` (1 on standard screens, 0.5 on high-density ones); from
 * 12px to 34px, the film's own; from 34px to 68px, every measure × `atomSize
 * ÷ 34`; over 68px, held at double the film's. `id` seeds its dots: give each bond its own, stable one, such as
 * `'<triple>:0'` from the subject and `'<triple>:1'` to the object. Draw it
 * before the atoms: they stand over it.
 */
export function bondSvg({
  id,
  from,
  to,
  atomSize = FILM_ATOM_SIZE,
  timeMs = 0,
  progress = 1,
  ground = 'light',
  devicePixel = 1,
}) {
  const look = GROUNDS[ground];
  if (look === undefined) {
    throw new Error(`Unknown ground "${ground}": light or dark`);
  }
  const ink = look.ink;
  const scale =
    Math.min(Math.max(atomSize, FILM_ATOM_SIZE), HELD_OVER) / FILM_ATOM_SIZE;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);
  if (length === 0) {
    return '';
  }
  const normal = { x: -dy / length, y: dx / length };
  const drawnTo = {
    x: from.x + dx * Math.min(progress, 1),
    y: from.y + dy * Math.min(progress, 1),
  };
  if (atomSize < PLAIN_UNDER) {
    return `<line x1="${round(from.x)}" y1="${round(from.y)}" x2="${round(drawnTo.x)}" y2="${round(drawnTo.y)}" stroke="${ink}" stroke-opacity="${look.plain}" stroke-width="${round(devicePixel)}" stroke-linecap="round"/>`;
  }
  const line = `<line x1="${round(from.x)}" y1="${round(from.y)}" x2="${round(drawnTo.x)}" y2="${round(drawnTo.y)}" stroke="${ink}" stroke-opacity="${look.line}" stroke-width="${round(LINE.width * scale)}" stroke-linecap="round"/>`;
  const dots = bondDots(id, length / scale, timeMs, progress)
    .map((dot) => {
      const x = from.x + dx * dot.along + normal.x * dot.offset * scale;
      const y = from.y + dy * dot.along + normal.y * dot.offset * scale;
      return `<circle cx="${round(x)}" cy="${round(y)}" r="${round(dot.radius * scale)}" fill="${ink}" fill-opacity="${round(dot.alpha * look.dots)}"/>`;
    })
    .join('');
  return `<g>${line}${dots}</g>`;
}

/**
 * Where a triple's atoms stand on its line, left to right, from their names'
 * widths in pixels (Inter 500 at 13px × atomSize ÷ 34): each in the middle of
 * its slot, the name's width plus 16px and never under the atom size, the
 * slots 34px apart, all × atomSize ÷ 34. The first slot starts at `x`.
 */
export function tripleCenters(nameWidths, { atomSize = FILM_ATOM_SIZE, x = 0 } = {}) {
  const scale = atomSize / FILM_ATOM_SIZE;
  const centers = [];
  let cursor = x;
  for (const width of nameWidths) {
    const slot = Math.max(width + 16 * scale, atomSize);
    centers.push(round(cursor + slot / 2));
    cursor += slot + 34 * scale;
  }
  return centers;
}

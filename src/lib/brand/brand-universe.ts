/**
 * The universe as a picture: the stars of the homepage's universe
 * (`onboarding/universe.ts`), formed into the Intuition logo, held still,
 * without the welcome or "Play". The stars come from the universe's own
 * `createStars` and its timeline's still frame; where each stands and how
 * big is its vertex shader's, worked out here on the CPU for a still: the
 * intro done, nothing parted, no drag, time 0. Every star is solid: the
 * homepage fades them for its depth in 3D, which a flat picture has no
 * need of.
 */

import {
  createStars,
  createTimeline,
  STAR_STRIDE,
} from '@/components/onboarding/universe';
import type { Role } from '@/components/playground/story-model';
import {
  outlinePath,
  ROLE_COLORS,
  ROLES,
} from '@/components/playground/story-shapes';
import { INTUITION_LOGO, INTUITION_LOGO_REACH } from '@/lib/intuition-logo';

import { seededRandom } from './atom-field';
import { UNIVERSE_DRAWING, UNIVERSE_STARS } from './universe-figma';

/** The shader's layers: how far each bows in depth round the mark, and where its bow peaks. */
const DEPTHS = [0.9, -0.9, 0.18] as const;
const PHASES = [0, 1.9, 0.6] as const;
const TAU = 2 * Math.PI;
/** A star's shape is never drawn under this many CSS pixels: the shader's floor. */
const SMALLEST = 3;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const fract = (value: number) => value - Math.floor(value);
const n = (value: number) => Number(value.toFixed(3));

/** The logo's bands as the shader holds them: radius, half width, start and span, in shares and radians. */
const BANDS = INTUITION_LOGO.bands.map((band) => ({
  radius: band.radius / INTUITION_LOGO.size,
  halfWidth: band.halfWidth / INTUITION_LOGO.size,
  start: (band.start * Math.PI) / 180,
  span: (band.span * Math.PI) / 180,
}));
const CENTRE = {
  x: INTUITION_LOGO.center[0] / INTUITION_LOGO.size - 0.5,
  y: 0.5 - INTUITION_LOGO.center[1] / INTUITION_LOGO.size,
};

export interface SkyStar {
  role: Role;
  /** Its centre, in CSS pixels from the screen's top left. */
  x: number;
  y: number;
  /** Its shape's size, in CSS pixels. */
  size: number;
  /** A star of the sky, which never joins the Intuition logo. */
  isSky: boolean;
}

/**
 * The universe's stars, formed and still, on a screen `width` by `height`
 * CSS pixels, its mark box as the entrance sizes it: `min(80vmin, 38rem)`,
 * in the middle.
 */
export function universeStars(width: number, height: number): SkyStar[] {
  const markSize = Math.min(0.8 * Math.min(width, height), 608);
  const frame = createTimeline(false).update(0, {
    still: true,
    rotation: { x: 0, y: 0 },
    width,
    height,
    mark: { x: width / 2, y: height / 2, size: markSize },
    column: { left: 0, right: width },
  });
  const stars = createStars();
  const result: SkyStar[] = [];
  for (let index = 0; index < stars.length / STAR_STRIDE; index += 1) {
    const at = (offset: number) => stars[index * STAR_STRIDE + offset] ?? 0;
    const place = { x: at(0), y: at(1), z: at(2), layer: at(3) };
    const seed = { x: at(4), y: at(5), z: at(6) };
    const look = { size: at(8), role: at(9), band: at(10) };
    const isSky = look.band < -0.5;
    const layer = Math.round(place.layer) as 0 | 1 | 2;
    const field = [1.1 * frame.view[0], 1.1 * frame.view[1]];

    let x: number;
    let y: number;
    let near = 1;
    if (isSky) {
      x = (seed.x - 0.5) * (field[0] ?? 0);
      y = (seed.y - 0.5) * (field[1] ?? 0);
    } else {
      const band = BANDS[Math.round(Math.max(look.band, 0))] ?? BANDS[0];
      if (band === undefined) {
        continue;
      }
      const lap = fract(
        place.x + ((frame.travel[layer] ?? 0) * TAU) / band.span,
      );
      const angle = band.start + band.span * lap;
      const reach = band.radius + band.halfWidth * place.y;
      const depth =
        (DEPTHS[layer] ?? 0) * Math.sin(TAU * lap + (PHASES[layer] ?? 0)) +
        place.z;
      const front = clamp01(0.5 + 0.42 * depth);
      x =
        frame.markCenter[0] +
        (CENTRE.x + Math.cos(angle) * reach) * frame.markSize;
      y =
        frame.markCenter[1] +
        (CENTRE.y + Math.sin(angle) * reach) * frame.markSize;
      near = 0.8 + 0.4 * front;
    }
    const clip = { x: x / (0.5 * frame.view[0]), y: y / (0.5 * frame.view[1]) };
    const grown = isSky ? 0.45 : 1;
    const size = Math.max(SMALLEST, (0.4 + 3.9 * look.size) * near * grown);
    result.push({
      role: ROLES[Math.round(look.role)] ?? 'identity',
      x: ((clip.x + 1) / 2) * width,
      y: ((1 - clip.y) / 2) * height,
      size,
      isSky,
    });
  }
  return result;
}

/**
 * The Intuition Universe zoomed on its logo, as a square avatar: the
 * homepage's own stars, each in its place, on the desktop's screen (1440 ×
 * 810), the logo filling 82% of the square so a round crop keeps it whole.
 * Only the logo's stars, none of the sky's; the smallest removed and the
 * next ones grown about their centres, so the logo reads at a glance:
 * stars of 3.5px or less go, those to 4px grow threefold, those to 6px
 * twofold, the rest stay as they are. As Saulo set them, step by step.
 */
export function universeAvatarStars(side: number): SkyStar[] {
  const width = 1440;
  const height = 810;
  const markSize = Math.min(0.8 * Math.min(width, height), 608);
  const centre = {
    x:
      width / 2 +
      (INTUITION_LOGO.center[0] / INTUITION_LOGO.size - 0.5) * markSize,
    y:
      height / 2 +
      (INTUITION_LOGO.center[1] / INTUITION_LOGO.size - 0.5) * markSize,
  };
  const reach = (INTUITION_LOGO_REACH / INTUITION_LOGO.size) * markSize;
  const half = reach / 0.82;
  const scale = side / (2 * half);
  const grown = (size: number): number =>
    size <= 4 ? size * 3 : size <= 6 ? size * 2 : size;
  return universeStars(width, height)
    .filter(
      (star) =>
        !star.isSky &&
        star.size > 3.5 &&
        Math.abs(star.x - centre.x) <= half &&
        Math.abs(star.y - centre.y) <= half,
    )
    .map((star) => ({
      ...star,
      x: side / 2 + (star.x - centre.x) * scale,
      y: side / 2 + (star.y - centre.y) * scale,
      size: grown(star.size) * scale,
    }));
}

/** The avatar's stars as SVG elements, on a square `side` pixels across. */
export function universeAvatarSvg(side: number): string {
  const unit = 100;
  const defs = `<defs>${ROLES.map((role) => `<path id="s-${role}" d="${outlinePath(role, unit, 0)}"/>`).join('')}</defs>`;
  const body = universeAvatarStars(side)
    .map(
      ({ role, x, y, size }) =>
        `<use href="#s-${role}" fill="${hexOf(role)}" transform="translate(${n(x)} ${n(y)}) scale(${Number((size / unit).toFixed(4))})"/>`,
    )
    .join('');
  return `${defs}${body}`;
}

/** A role's color as hex. */
const hexOf = (role: Role) =>
  `#${ROLE_COLORS[role].map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;

/**
 * The universe as SVG elements, drawn on a screen `design` CSS pixels
 * and scaled by `scale` to the picture: each star its role's shape in its
 * color, in the order the GPU draws them. No star in `clear`, a corner of
 * the screen a platform lays its own picture over.
 */
export function universeSvg(
  design: { width: number; height: number },
  scale: number,
  clear?: { x: number; y: number; width: number; height: number },
): string {
  const stars = universeStars(design.width, design.height).filter(
    ({ x, y, size }) =>
      clear === undefined ||
      x + size / 2 < clear.x ||
      x - size / 2 > clear.x + clear.width ||
      y + size / 2 < clear.y ||
      y - size / 2 > clear.y + clear.height,
  );
  const unit = 100;
  const defs = `<defs>${ROLES.map((role) => `<path id="s-${role}" d="${outlinePath(role, unit, 0)}"/>`).join('')}</defs>`;
  const body = stars
    .map(
      ({ role, x, y, size }) =>
        `<use href="#s-${role}" fill="${hexOf(role)}" transform="translate(${n(x)} ${n(y)}) scale(${Number((size / unit).toFixed(4))})"/>`,
    )
    .join('');
  return `${defs}<g transform="scale(${Number(scale.toFixed(5))})">${body}</g>`;
}

/** The homepage universe's share of each role, in `ROLES` order. */
const ROLE_SHARES = [36, 24, 28, 12] as const;
/** A star of Saulo's drawing becomes an atom this many times its side: its 1px stars, the universe's 3px floor. */
const ATOM_PER_SIDE = 3;
/** The same roles for the drawing's stars every time. */
const FIGMA_SEED = 0x2b7e1516;

/** A role drawn by its shares, from `value` in [0, 1). */
function roleBy(value: number): Role {
  const total = ROLE_SHARES.reduce((sum, share) => sum + share, 0);
  let left = value * total;
  for (const [index, share] of ROLE_SHARES.entries()) {
    left -= share;
    if (left < 0) {
      return ROLES[index] ?? 'identity';
    }
  }
  return 'object';
}

/**
 * A frame the drawing is spread across, as a size of its own, and the
 * corner a platform lays its own picture over: no star there.
 */
export interface UniverseFrame {
  width: number;
  height: number;
  clear?: { x: number; y: number; width: number; height: number };
}
/** A phone's drawing: as big as the Intuition Universe's, so its stars stand as far apart. */
export const UNIVERSE_PHONE = { width: 760, height: 1648 } as const;

/**
 * Saulo's Universe as SVG elements, scaled by `scale`: each of his stars an
 * atom, its role drawn by the homepage universe's shares, solid, in its
 * role's color. Landscape, as he drew it at 1440 × 810; portrait, for a
 * phone, his drawing turned a quarter, its stars moving with it while every
 * atom stays upright. The same on either ground: the document sets it.
 */
export function figmaUniverseSvg(
  scale: number,
  layout: 'landscape' | 'portrait' | UniverseFrame = 'landscape',
): string {
  const { width, height } = UNIVERSE_DRAWING;
  const place = (x: number, y: number) => {
    if (layout === 'landscape') {
      return { x, y };
    }
    if (layout === 'portrait') {
      return {
        x: ((height - y) * UNIVERSE_PHONE.width) / height,
        y: (x * UNIVERSE_PHONE.height) / width,
      };
    }
    return {
      x: (x * layout.width) / width,
      y: (y * layout.height) / height,
    };
  };
  const clear = typeof layout === 'string' ? undefined : layout.clear;
  const isUnderAvatar = (at: { x: number; y: number }) =>
    clear !== undefined &&
    at.x >= clear.x &&
    at.x <= clear.x + clear.width &&
    at.y >= clear.y &&
    at.y <= clear.y + clear.height;
  const random = seededRandom(FIGMA_SEED);
  const unit = 100;
  const atoms = UNIVERSE_STARS.map(([x, y, side]) => {
    const role = roleBy(random());
    const size = ATOM_PER_SIDE * side;
    const at = place(x + side / 2, y + side / 2);
    if (isUnderAvatar(at)) {
      return '';
    }
    return `<use href="#u-${role}" fill="${hexOf(role)}" transform="translate(${n(at.x)} ${n(at.y)}) scale(${Number((size / unit).toFixed(4))})"/>`;
  }).join('');
  const defs = `<defs>${ROLES.map((role) => `<path id="u-${role}" d="${outlinePath(role, unit, 0)}"/>`).join('')}</defs>`;
  return `${defs}<g transform="scale(${Number(scale.toFixed(5))})">${atoms}</g>`;
}

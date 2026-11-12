/**
 * Multiplayer: the protocol's four atom shapes in a 2 × 2 grid, centered in
 * the frame, as solids turned their own ways, lit as Observed and Orbit are
 * (`sceneSvg`): the circle, triangle and square the triple, the hexagon a
 * fourth light, glowing in their colors, among small gray solids, with no
 * bonds and no words.
 */

import { ROLES } from '@/components/playground/story-shapes';

import { seededRandom } from './atom-field';
import type { AtomsFrame } from './brand-atoms';
import { outsideOutline, sceneSvg, turnedLights } from './brand-observed';
import type { Scene, Solid } from './brand-observed';
import { MULTIPLAYER_BUBBLES } from './multiplayer-bubbles';

/** The scene's center, where every frame's center lands (`centered` below). */
const CENTER = [970, 560] as const;
/**
 * The four shapes' bounds as turned, at the reference's cells, measured on
 * their silhouettes. The group moves as one, by `SHIFT`, so they center on
 * `CENTER`.
 */
export const REFERENCE_BOUNDS = {
  left: 684,
  top: 149.4,
  right: 1279.8,
  bottom: 785.6,
} as const;
const SHIFT = [
  CENTER[0] - (REFERENCE_BOUNDS.left + REFERENCE_BOUNDS.right) / 2,
  CENTER[1] - (REFERENCE_BOUNDS.top + REFERENCE_BOUNDS.bottom) / 2,
] as const;
/** The grid's columns and rows, at the reference's four symbols' cells, moved with the group. */
const COLUMNS = [828 + SHIFT[0], 1112 + SHIFT[0]] as const;
const ROWS = [308 + SHIFT[1], 634 + SHIFT[1]] as const;

/** A bubble's solid is this many times as wide as the bubble, so it reads as a solid. */
const BUBBLE_SCALE = 4;
const SEED = 0x6d1d;
/**
 * The dark kept round each of the four shapes: no small solid's edge
 * (half its size from its center) nearer than this to a shape's outline.
 */
const CLEARANCE = 80;
/**
 * More bubbles where the reference has none: above and below the four
 * shapes, never beside them, and past its top and bottom, which a tall
 * frame shows. As many to an area as where the reference is full
 * (`perArea`), fewer by how many of its own already stand within `near`;
 * none within `apart` of another; their sizes drawn from its own.
 */
const FILL = {
  seed: 0x6d1e,
  // All of the scene a frame can show, the tall phone's included.
  area: { x: 0, y: -440, width: 1920, height: 2000 },
  perArea: 2.6e-4,
  near: 80,
  apart: 14,
} as const;

/** A bubble: where it stands, and how wide it is in the reference. */
type Bubble = readonly [x: number, y: number, across: number];

/** Multiplayer's four shapes, turned as the reference's: its scene, but for the small solids. */
const SHAPES: Omit<Scene, 'solids'> = {
  triple: {
    identity: [COLUMNS[0], ROWS[0]],
    // Higher and further right, where the reference's triangle stands.
    predicate: [1140 + SHIFT[0], 268 + SHIFT[1]],
    object: [COLUMNS[0], ROWS[1]],
  },
  bridge: [COLUMNS[1], ROWS[1]],
  // All four at one protocol unit, the reference's symbols' size.
  size: 290,
  unit: 320,
  // Each turned the same amount, about 30°, in its own direction, so each shows the same depth.
  turns: {
    identity: { yaw: -30, pitch: 20 },
    predicate: { yaw: -30, pitch: 0, roll: 27 },
    object: { yaw: -24, pitch: -19 },
    bridge: { yaw: 30, pitch: -5 },
  },
  bonds: false,
  pool: [970 + SHIFT[0], 471 + SHIFT[1]],
  // No pool of light: the light is the four shapes' own.
  hasPool: false,
  // Centered in every frame, as large as when the words stood under them:
  // the box still holds their room.
  centered: { x: CENTER[0], y: CENTER[1], width: 760, height: 1000 },
};
/** The four shapes as the solids the scene draws them as. */
const LIGHTS = turnedLights({ ...SHAPES, solids: [] });

/** Whether a small solid `size` across at (x, y) keeps clear of the four shapes (`CLEARANCE`). */
export function isClearOfShapes(x: number, y: number, size: number): boolean {
  return LIGHTS.every(
    (light) => outsideOutline(light, [x, y]) - size / 2 >= CLEARANCE,
  );
}

/** The bubbles added where the reference has none (`FILL`). */
export function fillBubbles(): Bubble[] {
  const random = seededRandom(FILL.seed);
  const { x, y, width, height } = FILL.area;
  // The shapes' row: beside them stays as the reference has it.
  const top = REFERENCE_BOUNDS.top + SHIFT[1];
  const bottom = REFERENCE_BOUNDS.bottom + SHIFT[1];
  // The reference's own that stay, clear of the shapes.
  const own = MULTIPLAYER_BUBBLES.filter(([bx, by, across]) =>
    isClearOfShapes(bx, by, across * BUBBLE_SCALE),
  );
  // How many of the reference's own stand within `near` where it is full.
  const full = FILL.perArea * Math.PI * FILL.near ** 2;
  const isNear = (px: number, py: number, reach: number) => (bubble: Bubble) =>
    Math.hypot(bubble[0] - px, bubble[1] - py) < reach;
  const placed: Bubble[] = [];
  const candidates = Math.round(FILL.perArea * width * height);
  for (let index = 0; index < candidates; index += 1) {
    // Four draws for every candidate, kept or not, so each keeps its place.
    const px = x + random() * width;
    const py = y + random() * height;
    const across =
      MULTIPLAYER_BUBBLES[
        Math.floor(random() * MULTIPLAYER_BUBBLES.length)
      ]?.[2] ?? 4;
    const chance = random();
    const isInRow = py > top && py < bottom;
    const nearby = own.filter(isNear(px, py, FILL.near)).length;
    const isCrowded =
      own.some(isNear(px, py, FILL.apart)) ||
      placed.some(isNear(px, py, FILL.apart));
    if (
      !isInRow &&
      chance < 1 - nearby / full &&
      !isCrowded &&
      isClearOfShapes(px, py, across * BUBBLE_SCALE)
    ) {
      placed.push([px, py, across]);
    }
  }
  return placed;
}

/** A solid of a random shape for each bubble, at its place, turned its own way. */
function solidsOf(list: readonly Bubble[], seed: number): Solid[] {
  const random = seededRandom(seed);
  return list.map(([x, y, across]) => ({
    role: ROLES[Math.floor(random() * ROLES.length)] ?? 'identity',
    x,
    y,
    z: -60,
    size: across * BUBBLE_SCALE,
    yaw: -45 + 90 * random(),
    pitch: -35 + 70 * random(),
  }));
}

/**
 * Multiplayer's scene: its four shapes, and a small solid for each of the
 * reference's bubbles, then for each added one, all clear of the shapes.
 */
export const MULTIPLAYER_SCENE: Scene = {
  ...SHAPES,
  solids: [
    ...solidsOf(MULTIPLAYER_BUBBLES, SEED),
    ...solidsOf(fillBubbles(), FILL.seed + 1),
  ].filter((solid) => isClearOfShapes(solid.x, solid.y, solid.size)),
};

/** Multiplayer in `frame`, as SVG elements on Observed's ground: the ground is the document's. */
export function multiplayerSvg(frame: AtomsFrame): string {
  return sceneSvg(frame, MULTIPLAYER_SCENE);
}

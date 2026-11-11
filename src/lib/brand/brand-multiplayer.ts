/**
 * Multiplayer: the protocol's four atom shapes in a 2 × 2 grid at the reference's
 * place, as solids turned their own ways, lit as Observed and Orbit are
 * (`sceneSvg`): the circle, triangle and square the triple, the hexagon a
 * fourth light, glowing in their colors, with no bonds.
 */

import { ROLES } from '@/components/playground/story-shapes';

import { seededRandom } from './atom-field';
import type { AtomsFrame } from './brand-atoms';
import { sceneSvg } from './brand-observed';
import type { Scene, Solid } from './brand-observed';
import { textOutlines } from './brand-text';
import { MULTIPLAYER_BUBBLES } from './multiplayer-bubbles';

/** The grid's columns and rows, at the reference's four symbols' cells. */
const COLUMNS = [828, 1112] as const;
const ROWS = [308, 634] as const;

/** A bubble's solid is this many times as wide as the bubble, so it reads as a solid. */
const BUBBLE_SCALE = 4;
const SEED = 0x6d1d;

/** A solid of a random shape for each bubble, at its place, turned its own way. */
function bubbles(): Solid[] {
  const random = seededRandom(SEED);
  return MULTIPLAYER_BUBBLES.map(([x, y, across]) => ({
    role: ROLES[Math.floor(random() * ROLES.length)] ?? 'identity',
    x,
    y,
    z: -60,
    size: across * BUBBLE_SCALE,
    yaw: -45 + 90 * random(),
    pitch: -35 + 70 * random(),
  }));
}

/** Multiplayer's scene: a solid for each bubble; its four shapes, turned as the reference's. */
export const MULTIPLAYER_SCENE: Scene = {
  solids: bubbles(),
  triple: {
    identity: [COLUMNS[0], ROWS[0]],
    // Higher and further right, where the reference's triangle stands.
    predicate: [1140, 268],
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
  pool: [970, 471],
  // No pool of light: the light is the four shapes' own.
  hasPool: false,
  // Centered in every frame: the shapes and the words always fit.
  centered: { x: 970, y: 560, width: 760, height: 1000 },
  // The words under the shapes, where the reference has its own.
  overlay: textOutlines(
    [
      {
        text: 'Intuition',
        family: 'Instrument Sans',
        size: 72,
        x: 970,
        y: 930,
        fill: '#ffffff',
        isMedium: true,
      },
      {
        text: 'Your data,',
        family: 'Inter',
        size: 30,
        x: 970,
        y: 978,
        fill: '#c6cbd9',
      },
      {
        text: 'made multiplayer.',
        family: 'Inter',
        size: 30,
        x: 970,
        y: 1016,
        fill: '#c6cbd9',
      },
    ],
    { width: 1920, height: 1080 },
  ),
};

/** Multiplayer in `frame`, as SVG elements on Observed's ground: the ground is the document's. */
export function multiplayerSvg(frame: AtomsFrame): string {
  return sceneSvg(frame, MULTIPLAYER_SCENE);
}

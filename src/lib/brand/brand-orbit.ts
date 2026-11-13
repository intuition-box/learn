/**
 * Orbit: Saulo's original still life in his own composition, lit as
 * Observed is (`sceneSvg`). The subject stands where his white sphere is,
 * in front of the big sphere, a solid triangle at its left; the predicate
 * below, where his big pyramid is, a little left of it; the object above
 * it, a small cube over it where his cube is; and a small sphere at the
 * right, a little further right, so it and the predicate stand apart
 * (Saulo's sketch, 2026-11-13). His cluster is moved to Observed's focus, on
 * the right of the wallpaper, at his scale. As Observed's, its triple's
 * atoms are solids by the 3D recipe facing straight on, its atoms in the
 * dark are lit in the triple's own colors, and its bonds do not glow.
 */

import type { AtomsFrame } from './brand-atoms-frame';
import { FACING_TRIPLE, sceneSvg } from './brand-observed';
import type { Scene } from './brand-observed';

/** Orbit's atoms in the dark, back to front, and its triple, each by its true center. */
export const ORBIT_SCENE: Scene = {
  solids: [
    { role: 'identity', x: 1085, y: 480, z: -160, size: 360, yaw: 0, pitch: 0 },
    { role: 'identity', x: 1428, y: 645, z: -60, size: 160, yaw: 0, pitch: 0 },
    {
      role: 'predicate',
      x: 950,
      y: 510,
      z: -40,
      size: 130,
      yaw: 38,
      pitch: -22,
    },
    { role: 'object', x: 1310, y: 250, z: -80, size: 58, yaw: 40, pitch: 30 },
  ],
  triple: {
    identity: [1140, 570],
    predicate: [1297, 760],
    object: [1360, 420],
  },
  turns: FACING_TRIPLE,
  lightWhite: 0,
};

/** Orbit in `frame`, as SVG elements on Observed's ground: the ground is the document's. */
export function orbitSvg(frame: AtomsFrame): string {
  return sceneSvg(frame, ORBIT_SCENE);
}

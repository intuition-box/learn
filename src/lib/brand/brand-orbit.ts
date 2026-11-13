/**
 * Orbit: Saulo's original still life in his own composition, lit as
 * Observed is (`sceneSvg`). The subject stands where his white sphere is,
 * in front of the big sphere, a solid triangle at its left; the predicate
 * below, where his big pyramid is; the object above it, a small cube over
 * it where his cube is; and a small sphere at the right, which the second
 * bond passes in front of. His cluster is moved to Observed's focus, on
 * the right of the wallpaper, at his scale.
 */

import type { AtomsFrame } from './brand-atoms-frame';
import { sceneSvg } from './brand-observed';
import type { Scene } from './brand-observed';

/** Orbit's atoms in the dark, back to front, and its triple, each by its true center. */
export const ORBIT_SCENE: Scene = {
  solids: [
    { role: 'identity', x: 1085, y: 480, z: -160, size: 360, yaw: 0, pitch: 0 },
    { role: 'identity', x: 1395, y: 645, z: -60, size: 160, yaw: 0, pitch: 0 },
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
    predicate: [1335, 760],
    object: [1360, 420],
  },
};

/** Orbit in `frame`, as SVG elements on Observed's ground: the ground is the document's. */
export function orbitSvg(frame: AtomsFrame): string {
  return sceneSvg(frame, ORBIT_SCENE);
}

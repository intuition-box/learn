/**
 * Atoms' frame: the design Atoms is drawn in, its focus, and how it is
 * fitted to any frame. Atoms, Observed and Orbit are placed this way.
 */

/** The design every number in Atoms is in. */
export const ATOMS_DESIGN = { width: 1920, height: 1080 } as const;

/** A frame to fit the design into, and the corner a platform covers, kept clear of atoms. */
export interface AtomsFrame {
  width: number;
  height: number;
  clear?: { x: number; y: number; width: number; height: number };
}

/** The picture's centre in the design: a frame wider than tall keeps it at the same share of its width. */
export const ATOMS_FOCUS = { x: 1210, y: 540 } as const;
/** How wide the cluster is with its small atoms, in the design: a tall frame fits it across. */
const CLUSTER_WIDTH = 1180;

/** How the design sits in `frame`: its scale, and where the design's focus lands. */
export function atomsPlacement(frame: AtomsFrame): {
  scale: number;
  x: number;
  y: number;
} {
  const scale = Math.min(
    frame.height / ATOMS_DESIGN.height,
    frame.width / CLUSTER_WIDTH,
  );
  const isWide = frame.width >= frame.height;
  return {
    scale,
    x: isWide
      ? frame.width * (ATOMS_FOCUS.x / ATOMS_DESIGN.width)
      : frame.width / 2,
    y: frame.height / 2,
  };
}

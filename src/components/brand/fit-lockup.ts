import type { Rect } from './brand-config';

interface Size {
  width: number;
  height: number;
}

export interface FittedLockup {
  /** Canvas pixels per unit of the content. */
  scale: number;
  /** Where the content lands on the canvas, centred. */
  frame: Rect;
  /** The margin in canvas pixels: as big as `margin` was in the content's units. */
  clearSpace: number;
}

/**
 * Lays a lockup out on a canvas: as big as it can be with `margin` (in the
 * content's own units, so a rule like "one shape's height" is said in the
 * mark's terms) clear on every side, and centred. The margin is tight on
 * one axis and at least as wide on the other.
 */
export function fitLockup(
  content: Size,
  canvas: Size,
  margin: number,
): FittedLockup {
  const scale = Math.min(
    canvas.width / (content.width + 2 * margin),
    canvas.height / (content.height + 2 * margin),
  );
  const width = content.width * scale;
  const height = content.height * scale;
  return {
    scale,
    frame: {
      x: (canvas.width - width) / 2,
      y: (canvas.height - height) / 2,
      width,
      height,
    },
    clearSpace: margin * scale,
  };
}

/**
 * The texture of a connection between atoms, wherever one is drawn: in the
 * playground's scenes (`story-dots.ts`, on a 2D canvas) and in the field
 * behind the pages (`field-scene.ts`, in WebGL). A faint hairline carries
 * fine dots of ink, each a little different in size, darkness and how far
 * off the line it sits, as in a particle vortex. One set of numbers, so the
 * two read as the same texture.
 */
export const DOT_TEXTURE = {
  /** CSS pixels of line for each dot: the texture's density. */
  pixelsPerDot: 5,
  /** A dot's radius in CSS pixels: the smallest, plus up to `range` more. */
  radius: { min: 0.45, range: 0.6 },
  /** How far a dot may sit off the line, either side, in CSS pixels. */
  maxOffset: 0.8,
  /**
   * How dark a dot is, as a share of the ink: `min` plus up to `range`,
   * along a curve that keeps most faint and makes a few dark.
   */
  alpha: { min: 0.2, range: 0.75, curve: 2.2 },
} as const;

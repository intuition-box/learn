/**
 * The Intuition logo as the bands it is drawn with, measured from its SVG
 * (48 units across): a ring, and five arcs round it. Each band is a stretch
 * of a circle round the Intuition logo's centre: its radius and half its width, in
 * the Intuition logo's units, and where it starts and how far it goes, in degrees
 * counterclockwise from the right. The front page's stars form it, and the
 * film draws it for the protocol.
 */
export const INTUITION_LOGO = {
  size: 48,
  /** The centre, from the view box's top left, y down. */
  center: [23.75, 24],
  bands: [
    { radius: 18.97, halfWidth: 1.89, start: 0, span: 360 },
    { radius: 23.15, halfWidth: 0.72, start: -52.5, span: 107 },
    { radius: 23.15, halfWidth: 0.72, start: 59.5, span: 99 },
    { radius: 23.15, halfWidth: 0.72, start: 164.5, span: 17 },
    { radius: 23.15, halfWidth: 0.72, start: 187.5, span: 93 },
    { radius: 23.15, halfWidth: 0.72, start: 285.5, span: 17 },
  ],
} as const;

/** How far the Intuition logo reaches from its centre, in its units: its outer bands' outer edge. */
export const INTUITION_LOGO_REACH = Math.max(
  ...INTUITION_LOGO.bands.map((band) => band.radius + band.halfWidth),
);

/** The Intuition logo's color in the film: pure black, as a vault's lid and a fee. */
export const INTUITION_LOGO_COLOR = [0, 0, 0] as const;

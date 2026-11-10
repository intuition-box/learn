/**
 * Colors as numbers, and how well two of them read against each other, by
 * WCAG 2's contrast ratio. Pure.
 */

/** sRGB channels, each an integer from 0 to 255. */
export type Rgb = readonly [red: number, green: number, blue: number];

/** A color as written on the brand page: lowercase `#rrggbb`. */
export type Hex = `#${string}`;

const HEX = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i;

/** A `#rrggbb` color's channels. Throws on anything else, `#rgb` included. */
export function parseHex(hex: string): Rgb {
  const match = HEX.exec(hex);
  if (match === null) {
    throw new Error(`"${hex}" is not a color written as #rrggbb`);
  }
  const [, red = '', green = '', blue = ''] = match;
  return [
    Number.parseInt(red, 16),
    Number.parseInt(green, 16),
    Number.parseInt(blue, 16),
  ];
}

/** Channels as lowercase `#rrggbb`. Throws unless each is an integer from 0 to 255. */
export function rgbToHex(rgb: Rgb): Hex {
  return `#${rgb
    .map((channel) => {
      if (!Number.isInteger(channel) || channel < 0 || channel > 255) {
        throw new Error(`${channel} is not a channel from 0 to 255`);
      }
      return channel.toString(16).padStart(2, '0');
    })
    .join('')}`;
}

/** How light a color is to the eye, from 0 (black) to 1 (white), as WCAG 2 defines it. */
export function relativeLuminance(rgb: Rgb): number {
  const [red, green, blue] = rgb.map((channel) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * (red ?? 0) + 0.7152 * (green ?? 0) + 0.0722 * (blue ?? 0);
}

/** Whether a color is light: dark text reads on it, white text on a dark one. */
export function isLight(hex: string): boolean {
  return relativeLuminance(parseHex(hex)) > 0.4;
}

/** WCAG 2's contrast ratio between two colors, from 1 to 21, either way round. */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const [lighter, darker] = [relativeLuminance(a), relativeLuminance(b)].sort(
    (x, y) => y - x,
  );
  return ((lighter ?? 0) + 0.05) / ((darker ?? 0) + 0.05);
}

/**
 * What a pair is for: text, held to WCAG 1.4.3 and 1.4.6, or shapes (icons,
 * atoms, the parts of a graphic), held to 1.4.11's 3:1.
 */
export type ContrastUse = 'text' | 'shapes';

/**
 * A ratio as printed: `17.9:1`. Rounded down, so a printed ratio never
 * claims more than the pair has, and always agrees with its level.
 */
export function formatRatio(ratio: number): string {
  return `${(Math.floor(ratio * 10) / 10).toFixed(1)}:1`;
}

/** A color in OKLCH: lightness from 0 to 1, chroma from 0, hue in degrees. */
export type Oklch = readonly [lightness: number, chroma: number, hue: number];

/** An sRGB channel, 0 to 255, as linear light, 0 to 1. */
function linear(channel: number): number {
  const value = channel / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

/**
 * An sRGB color in OKLCH, by Björn Ottosson's OKLab matrices. A grey has
 * no hue: it is given as 0, as CSS reads a missing hue.
 */
export function rgbToOklch(rgb: Rgb): Oklch {
  const [red, green, blue] = rgb.map(linear);
  const r = red ?? 0;
  const g = green ?? 0;
  const b = blue ?? 0;
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const lightness = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const chroma = Math.hypot(a, bb);
  const hue =
    chroma < 0.0005 ? 0 : ((Math.atan2(bb, a) * 180) / Math.PI + 360) % 360;
  return [lightness, chroma, hue];
}

/**
 * OKLCH as CSS, to three places of lightness and chroma and a whole
 * degree of hue, finer than the eye can tell apart: 'oklch(0.966 0.005 286)'.
 */
export function formatOklch([lightness, chroma, hue]: Oklch): string {
  const places = (value: number, digits: number) =>
    String(Number(value.toFixed(digits)));
  return `oklch(${places(lightness, 3)} ${places(chroma, 3)} ${Math.round(hue) % 360})`;
}

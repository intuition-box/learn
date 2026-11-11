/**
 * Words set in the brand's fonts as outlines, so a picture shows them
 * wherever it is opened, with no font installed. resvg sets the text and
 * hands it back as paths. It always takes a variable font's default
 * instance, 400, whatever weight is asked: a Medium line is set at 400 and
 * thickened by a stroke in its own ink, as the Universe's letters once were.
 */

import path from 'node:path';

import { Resvg } from '@resvg/resvg-js';

import type { Hex } from '@/components/brand/color';

const FONTS = [
  path.join(
    process.cwd(),
    'src',
    'fonts',
    'instrument-sans',
    'InstrumentSans[wdth,wght].ttf',
  ),
  path.join(process.cwd(), 'src', 'fonts', 'inter', 'Inter[opsz,wght].ttf'),
];
/** The stroke, as a share of the font size, that thickens a 400 stem to a 500's. */
const MEDIUM_STROKE = 0.015;

/** One line of words, centered on `x`, its baseline at `y`. */
export interface TextLine {
  text: string;
  family: 'Instrument Sans' | 'Inter';
  size: number;
  x: number;
  y: number;
  fill: Hex;
  isMedium?: boolean;
}

const escape = (text: string): string =>
  text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

/** The lines as outlined SVG elements, in the same units as their places. */
export function textOutlines(
  lines: readonly TextLine[],
  frame: { width: number; height: number },
): string {
  return lines
    .map((line) => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${frame.width}" height="${frame.height}" viewBox="0 0 ${frame.width} ${frame.height}"><text x="${line.x}" y="${line.y}" font-family="${line.family}" font-size="${line.size}" fill="${line.fill}" text-anchor="middle">${escape(line.text)}</text></svg>`;
      const outlined = new Resvg(svg, {
        font: {
          fontFiles: FONTS,
          loadSystemFonts: false,
          defaultFontFamily: line.family,
        },
      }).toString();
      const inner = outlined.slice(
        outlined.indexOf('>') + 1,
        outlined.lastIndexOf('</svg>'),
      );
      // resvg gives each outline `stroke="none"`: a Medium line's takes its ink instead.
      return line.isMedium
        ? inner.replaceAll(
            'stroke="none"',
            `stroke="${line.fill}" stroke-width="${Number((MEDIUM_STROKE * line.size).toFixed(3))}" stroke-linejoin="round"`,
          )
        : inner;
    })
    .join('');
}

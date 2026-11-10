import { Resvg } from '@resvg/resvg-js';

import type { Preset } from './asset-presets';

/**
 * An SVG as a PNG exactly as big as `preset`. resvg is pure Rust, so the
 * same file renders the same pixels on any machine, and it loads no system
 * fonts: an asset draws no text (`brandIssues` refuses `<text>`), and fonts
 * would make a PNG depend on the machine that built it. Transparent where
 * the SVG paints nothing.
 *
 * Throws unless the result is the preset's size: an SVG of the wrong shape
 * would come out a pixel short, or squashed, and that is a broken file.
 */
export function rasterize(
  svg: string,
  preset: Pick<Preset, 'id' | 'width' | 'height'>,
): Uint8Array<ArrayBuffer> {
  const image = new Resvg(svg, {
    fitTo: { mode: 'width', value: preset.width },
    font: { loadSystemFonts: false },
  }).render();
  if (image.width !== preset.width || image.height !== preset.height) {
    throw new Error(
      `Rendered ${image.width}×${image.height}, but preset ${preset.id} is ${preset.width}×${preset.height}`,
    );
  }
  // A copy, not Node's Buffer: a Buffer may sit on a shared or pooled
  // buffer, which is not the `ArrayBuffer`-backed view a Response body takes.
  return new Uint8Array(image.asPng());
}

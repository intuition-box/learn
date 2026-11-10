import { describe, expect, it } from 'vitest';

import { PRESETS } from './asset-presets';
import { rasterize } from './rasterize';
import { svgDocument } from './svg-document';

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

/** A PNG's width and height, from its IHDR chunk. */
function pngSize(png: Uint8Array): { width: number; height: number } {
  const view = new DataView(png.buffer, png.byteOffset, png.byteLength);
  return { width: view.getUint32(16), height: view.getUint32(20) };
}

describe('rasterize', () => {
  it.each(Object.values(PRESETS))('renders $id at $width×$height', (preset) => {
    const png = rasterize(
      svgDocument(
        preset,
        '<rect x="10" y="10" width="20" height="20" fill="#ff4f5e"/>',
      ),
      preset,
    );
    expect([...png.subarray(0, 8)]).toEqual(PNG_SIGNATURE);
    expect(pngSize(png)).toEqual({
      width: preset.width,
      height: preset.height,
    });
  });

  it('refuses an SVG of another shape than its preset', () => {
    expect(() =>
      rasterize(
        svgDocument({ width: 1600, height: 900 }, ''),
        PRESETS['x-banner'],
      ),
    ).toThrow(/^Rendered 1500×\d+, but preset x-banner is 1500×500$/);
  });
});

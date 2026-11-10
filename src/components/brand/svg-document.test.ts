import { describe, expect, it } from 'vitest';

import { PRESETS } from './asset-presets';
import { readSvgRoot, svgDocument, SVG_NAMESPACE } from './svg-document';

describe('svgDocument', () => {
  it("sizes the document and its viewBox as the preset's pixels", () => {
    const svg = svgDocument(PRESETS['og-image'], '<circle r="1"/>');
    expect(readSvgRoot(svg)).toEqual({
      xmlns: SVG_NAMESPACE,
      width: 1200,
      height: 630,
      viewBox: [0, 0, 1200, 630],
    });
    expect(svg).not.toContain('<rect');
  });

  it('fills the background edge to edge when asked', () => {
    expect(svgDocument({ width: 4, height: 2 }, '', '#07070c')).toContain(
      '<rect width="4" height="2" fill="#07070c"/>',
    );
  });
});

describe('readSvgRoot', () => {
  it('reads attributes in any order, with either quote, and a viewBox split by commas', () => {
    expect(
      readSvgRoot(
        `<?xml version="1.0"?><svg viewBox='0,0, 30 10' height="10px" xmlns="${SVG_NAMESPACE}" width="30"><svg width="1"/></svg>`,
      ),
    ).toEqual({
      xmlns: SVG_NAMESPACE,
      width: 30,
      height: 10,
      viewBox: [0, 0, 30, 10],
    });
  });

  it('leaves out what is missing, or not in pixels', () => {
    expect(readSvgRoot('<svg width="100%">')).toEqual({});
    expect(readSvgRoot('<div>')).toEqual({});
  });
});

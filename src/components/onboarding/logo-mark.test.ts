import { createHash } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import {
  logoMarkFile,
  logoMarkLayout,
  REVERSED_INSET,
  reversedMarkShapes,
} from './logo-mark';

describe('logoMarkFile', () => {
  const file = logoMarkFile();

  it('draws the four shapes on a square', () => {
    const [, , width, height] = (/viewBox="([^"]+)"/.exec(file)?.[1] ?? '')
      .split(' ')
      .map(Number);
    expect(width).toBeGreaterThan(0);
    expect(width).toBe(height);
    // The mark, then the reversed mark: four shapes each.
    expect(file.match(/<path /g)).toHaveLength(8);
  });

  it('shows the reversed mark in white in dark mode, where Graphite 900 would disappear', () => {
    expect(file).toContain(
      '.reversed{display:none}@media (prefers-color-scheme:dark){.mark{display:none}.reversed{display:inline}}',
    );
    const reversed = /<g class="reversed" fill="#fff">(.*?)<\/g>/.exec(
      file,
    )?.[1];
    expect(reversed?.match(/ d="[^"]+"/g)).toEqual(
      reversedMarkShapes().map(({ d }) => ` d="${d}"`),
    );
  });
});

describe('reversedMarkShapes', () => {
  it('draws the reversed mark lighter: every corner rounded by its radius less the inset', () => {
    // Each outline's first arc: the circle's radius, a polygon's corner radius.
    const radius = (d: string) => Number(/A([\d.]+) /.exec(d)?.[1]);
    const own = logoMarkLayout().shapes;
    const reversed = reversedMarkShapes();
    expect(reversed.map(({ role }) => role)).toEqual(
      own.map(({ role }) => role),
    );
    for (const [index, shape] of reversed.entries()) {
      expect(radius(own[index]?.d ?? '') - radius(shape.d)).toBeCloseTo(
        REVERSED_INSET,
        6,
      );
    }
  });
});

describe('logoMarkLayout', () => {
  it('keeps the favicon exactly as it is', () => {
    // The SHA-256 of the file since the mark was set on its cells, the
    // columns 3x apart, in Graphite 900, with the reversed mark for dark
    // mode: any change to the mark changes it.
    expect(createHash('sha256').update(logoMarkFile()).digest('hex')).toBe(
      'c4de1ec82aaa10c97bd68e5a324884bfc51057591fcdbc51329c2a953337cfd7',
    );
  });

  it('lays the four shapes out two by two, its frame their ink', () => {
    const { width, height, shapes } = logoMarkLayout();
    // The triangle's point 4 above the first line, nothing below the
    // second; the circle 103 wide, the triangle 94 × 0.8 / 0.72 + 10.
    expect(height).toBeCloseTo(4 + 100 + 10 + 100, 6);
    // Two cells of 100, 30 apart, the circle 1.5 over the left one's edge and
    // the triangle, (94 × 0.8 / 0.72 + 10) wide, over the right one's.
    expect(width).toBeCloseTo(
      1.5 + 100 + 30 + 100 + ((94 * 0.8) / 0.72 + 10 - 100) / 2,
      6,
    );
    expect(shapes.map(({ role }) => role)).toEqual([
      'identity',
      'predicate',
      'object',
      'bridge',
    ]);
  });
});

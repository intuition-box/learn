import { describe, expect, it } from 'vitest';

import {
  contrastRatio,
  formatOklch,
  formatRatio,
  oklchToRgb,
  parseHex,
  relativeLuminance,
  rgbToHex,
  rgbToOklch,
} from './color';

const WHITE = parseHex('#ffffff');
const BLACK = parseHex('#000000');

describe('contrastRatio', () => {
  it('is 21 for white on black, 1 for a color on itself, either way round', () => {
    expect(contrastRatio(WHITE, BLACK)).toBeCloseTo(21, 10);
    expect(contrastRatio(BLACK, WHITE)).toBeCloseTo(21, 10);
    expect(contrastRatio(parseHex('#7a86ff'), parseHex('#7a86ff'))).toBe(1);
    const a = parseHex('#656575');
    const b = parseHex('#f2f3f7');
    expect(contrastRatio(a, b)).toBe(contrastRatio(b, a));
  });

  it('grades Graphite as the brand page prints it', () => {
    const paper = parseHex('#ffffff');
    const ratio = (hex: string) =>
      formatRatio(contrastRatio(parseHex(hex), paper));
    expect(ratio('#16161e')).toBe('17.9:1');
    expect(ratio('#535362')).toBe('7.5:1');
    expect(ratio('#656575')).toBe('5.7:1');
    expect(ratio('#7e7e8f')).toBe('3.9:1');
    expect(ratio('#9a9aaf')).toBe('2.7:1');
  });

  it('weighs green heaviest, as the eye does', () => {
    expect(relativeLuminance([0, 255, 0])).toBeGreaterThan(
      relativeLuminance([255, 0, 0]),
    );
  });
});

describe('formatRatio', () => {
  it('rounds down, so it never claims more than the pair has', () => {
    expect(formatRatio(17.985)).toBe('17.9:1');
    expect(formatRatio(4.4999)).toBe('4.4:1');
    expect(formatRatio(21)).toBe('21.0:1');
  });
});

describe('parseHex and rgbToHex', () => {
  it('round-trip', () => {
    for (const hex of ['#000000', '#ffffff', '#7a86ff', '#2fe08b', '#07070c']) {
      expect(rgbToHex(parseHex(hex))).toBe(hex);
    }
    expect(parseHex('#FF4F5E')).toEqual([255, 79, 94]);
  });

  it('reject what is not a color', () => {
    for (const hex of ['#fff', 'ffffff', '#gggggg', '#ffffff00', '']) {
      expect(() => parseHex(hex)).toThrow(/#rrggbb/);
    }
    expect(() => rgbToHex([256, 0, 0])).toThrow(/not a channel/);
    expect(() => rgbToHex([1.5, 0, 0])).toThrow(/not a channel/);
  });
});

describe('rgbToOklch and formatOklch', () => {
  it('matches the CSS spec for the primaries and the greys', () => {
    expect(formatOklch(rgbToOklch(parseHex('#ff0000')))).toBe(
      'oklch(0.628 0.258 29)',
    );
    expect(formatOklch(rgbToOklch(parseHex('#0000ff')))).toBe(
      'oklch(0.452 0.313 264)',
    );
    expect(formatOklch(rgbToOklch(WHITE))).toBe('oklch(1 0 0)');
    expect(formatOklch(rgbToOklch(BLACK))).toBe('oklch(0 0 0)');
  });

  it('gives a grey no hue, however its channels round', () => {
    const [, chroma, hue] = rgbToOklch(parseHex('#767676'));
    expect(chroma).toBeLessThan(0.0005);
    expect(hue).toBe(0);
  });
});

describe('oklchToRgb', () => {
  it('turns OKLCH back into the color it came from', () => {
    for (const hex of ['#7a86ff', '#2fe08b', '#ff4f5e', '#ff5fd2', '#07070c']) {
      const rgb = parseHex(hex);
      const back = oklchToRgb(rgbToOklch(rgb)) ?? [];
      rgb.forEach((channel, index) => {
        expect(back[index]).toBeCloseTo(channel, 3);
      });
    }
  });

  it('gives none for a color no screen shows', () => {
    expect(oklchToRgb([0.5, 0.4, 150])).toBeUndefined();
  });
});

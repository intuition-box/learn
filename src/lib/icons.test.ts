import { describe, expect, it } from 'vitest';

import {
  APP_COLOR,
  APP_ICON,
  depositorColor,
  FEE_COLOR,
  FEE_ICON,
  SWIPE_COLOR,
  SWIPE_ICON,
  USER_ICON,
  USER_ICON_FOOT,
  VAULT_COLORS,
  VAULT_ICON,
  vaultFace,
} from './icons';

describe('a vault’s faces', () => {
  it('draws an atom’s with its lid solid black, and its sides as if disabled: black at 40%', () => {
    expect(vaultFace('atom', 'subject')).toEqual({
      color: [0, 0, 0],
      opacity: 1,
    });
    for (const face of ['against', 'for'] as const) {
      expect(vaultFace('atom', face)).toEqual({
        color: [0, 0, 0],
        opacity: 0.4,
      });
    }
  });

  it('draws a triple’s with its sides solid, against orange and for blue, and its lid as if disabled: black at 40%', () => {
    for (const face of ['against', 'for'] as const) {
      expect(vaultFace('triple', face)).toEqual({
        color: VAULT_COLORS[face],
        opacity: 1,
      });
    }
    expect(vaultFace('triple', 'subject')).toEqual({
      color: [0, 0, 0],
      opacity: 0.4,
    });
    expect(VAULT_COLORS.subject).toEqual([0, 0, 0]);
  });

  it('has the icon’s own opacities an atom’s', () => {
    for (const path of VAULT_ICON.paths) {
      expect(path.opacity).toBe(vaultFace('atom', path.face).opacity);
    }
  });
});

describe('a person who deposits', () => {
  it('takes the color of what they stake on: an atom black, against orange, for blue', () => {
    expect(depositorColor('subject')).toEqual([0, 0, 0]);
    expect(depositorColor('against')).toEqual(VAULT_COLORS.against);
    expect(depositorColor('for')).toEqual(VAULT_COLORS.for);
  });

  it('keeps the head at 30%, the shoulders solid', () => {
    expect(USER_ICON.paths.map((path) => path.opacity)).toEqual([1, 0.3]);
  });

  it('knows where the shoulders end, the bottom of what shows', () => {
    const bottoms = (USER_ICON.paths[0]?.d.match(/[\d.]+ [\d.]+/g) ?? []).map(
      (pair) => Number(pair.split(' ')[1]),
    );

    expect(Math.max(...bottoms)).toBe(USER_ICON_FOOT);
  });
});

describe('a fee', () => {
  it('is a pie, light, with a slice of it pulled out, solid, in black', () => {
    expect(FEE_ICON.paths.map((path) => path.opacity)).toEqual([0.3, 1]);
    expect(FEE_COLOR).toEqual([0, 0, 0]);
  });
});

describe('an app', () => {
  it('is a window, its body light under its bar, solid, in black', () => {
    expect(APP_ICON.paths.map((path) => path.opacity)).toEqual([0.3, 1]);
    expect(APP_COLOR).toEqual([0, 0, 0]);
  });

  it('meets a line from above at the top of its bar', () => {
    expect(APP_ICON.ports.above).toEqual({ x: 12, y: 4 });
  });
});

describe('a swipe', () => {
  it('is a hand, light, under an arrow, solid, in black', () => {
    expect(SWIPE_ICON.paths.map((path) => path.opacity)).toEqual([0.3, 1]);
    expect(SWIPE_COLOR).toEqual([0, 0, 0]);
  });
});

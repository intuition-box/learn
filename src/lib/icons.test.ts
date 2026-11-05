import { describe, expect, it } from 'vitest';

import {
  depositorColour,
  USER_ICON,
  VAULT_COLOURS,
  VAULT_ICON,
  vaultFace,
} from './icons';

describe('a vault’s faces', () => {
  it('draws an atom’s with its lid solid black, and its sides as if disabled: black at 40%', () => {
    expect(vaultFace('atom', 'subject')).toEqual({
      colour: [0, 0, 0],
      opacity: 1,
    });
    for (const face of ['against', 'for'] as const) {
      expect(vaultFace('atom', face)).toEqual({
        colour: [0, 0, 0],
        opacity: 0.4,
      });
    }
  });

  it('draws a triple’s with every face solid: the lid black, against orange, for blue', () => {
    for (const face of ['subject', 'against', 'for'] as const) {
      expect(vaultFace('triple', face)).toEqual({
        colour: VAULT_COLOURS[face],
        opacity: 1,
      });
    }
    expect(VAULT_COLOURS.subject).toEqual([0, 0, 0]);
  });

  it('has the icon’s own opacities an atom’s', () => {
    for (const path of VAULT_ICON.paths) {
      expect(path.opacity).toBe(vaultFace('atom', path.face).opacity);
    }
  });
});

describe('a person who deposits', () => {
  it('takes the colour of what they stake on: an atom black, against orange, for blue', () => {
    expect(depositorColour('subject')).toEqual([0, 0, 0]);
    expect(depositorColour('against')).toEqual(VAULT_COLOURS.against);
    expect(depositorColour('for')).toEqual(VAULT_COLOURS.for);
  });

  it('keeps the head at 30%, the shoulders solid', () => {
    expect(USER_ICON.paths.map((path) => path.opacity)).toEqual([1, 0.3]);
  });
});

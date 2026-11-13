import { describe, expect, it } from 'vitest';

import { universeAvatarStars } from './brand-universe';

describe('universeAvatarStars', () => {
  const side = 400;
  const stars = universeAvatarStars(side);

  it('keeps only the logo’s stars, none of the sky’s', () => {
    expect(stars.length).toBe(712);
    expect(stars.every((star) => !star.isSky)).toBe(true);
  });

  it('removes the smallest and grows the next ones, so none is a speck', () => {
    // Stars over 3.5px kept, those to 6px grown at least twofold: none left at 6px or under.
    const scale = side / ((2 * ((23.87 / 48) * 608)) / 0.82);
    expect(Math.min(...stars.map((star) => star.size / scale))).toBeGreaterThan(
      6,
    );
  });

  it('frames the logo in the square, every star in it', () => {
    expect(
      stars.every(
        (star) =>
          star.x >= 0 && star.x <= side && star.y >= 0 && star.y <= side,
      ),
    ).toBe(true);
  });
});

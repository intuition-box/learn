# Anatomy of a bond

## Contents

- The two layers
- The hairline
- The dots
- Reproducing the film's dots
- Scaling to another atom size
- What a bond is not

## The two layers

A bond is two layers, in the ink: Midnight `#16161e` on light, Graphite 0 `#ffffff` on dark.

1. **A hairline**, so faint it is barely there: the path the dots follow.
2. **Fine dots of ink** along it, each a little different in size, darkness and how far off the line it sits, so the line reads as grain, as a particle vortex does, never as a dash pattern.

The dots carry the line. Drawn without them, a bond is not a bond.

## The hairline

| Property | On light | On dark: Midnight, Graphite 950 or black |
|---|---|---|
| Ink | Midnight `#16161e` | Graphite 0 `#ffffff` |
| Width | 1px | 1px |
| Opacity | 16% | 12% |
| Caps and joins | Round | Round |
| Ends | The two atoms' centers; always under the shapes | The two atoms' centers; always under the shapes |

On dark the ink is white, and white on dark reads stronger, so the hairline drops to 12% and every dot to 0.8 of its opacity.

## The dots

| Property | Value at atom size 34px | How it is chosen |
|---|---|---|
| Density | One dot per 5px of line | `count = round(length ÷ 5)` |
| Radius | 0.45 to 1.05px | `0.45 + 0.6 × u`, `u` uniform in [0, 1) |
| Offset across the line | −0.8 to +0.8px | `(u − 0.5) × 2 × 0.8 × v`: two uniforms multiplied, so most dots sit on the line and a few just off it |
| Opacity | 20% to 95% on light; 16% to 76% on dark | `0.2 + 0.75 × w^2.2`: mostly faint, now and then a dark one; × 0.8 on dark |
| Color | The ink: Midnight on light, Graphite 0 on dark | The dot's opacity is its only variation |
| Position along the line | Spread evenly at random | Each dot has its own start and speed; see below |

The offset is measured along the line's normal, perpendicular to it, so a level bond's dots scatter up and down, never along.

## Reproducing the film's dots

Every bond's dots come from a seeded generator, so the same bond always has the same dots. `scripts/bond.mjs` holds the film's generator unchanged:

- The seed is the bond's id hashed with FNV-1a; the generator is mulberry32.
- Each bond keeps a pool of 800 dots. Each dot draws, in this order: its darkness `w`, its start (0 to 1), its speed (18 + 26 × u film pixels a second), its offset (two draws) and its radius.
- A dot travels from the subject toward the object and comes round again after 2400 film pixels: `travelled = (start × 2400 + speed × t ÷ 1000) mod 2400`, with `t` the moment in milliseconds.
- Of the pool, the first `round(count × 2400 ÷ length)` are in use, so that on average `count` of them are on the line at any moment. A dot shows where `travelled` is less than the length drawn, at `travelled ÷ length` of the way along.

For a still picture, use moment 0, or any moment you choose: every moment is a true frame of the film. `bondSvg` and `bondDots` do all of this.

## Scaling to another atom size

All measures are at the film's atom size, 34px. A bond's texture follows its atoms' size `s` in four ranges:

| Atom size | The bond |
|---|---|
| Under 12px | A plain line, no dots, as the film zoomed far out: one device pixel wide (1px on standard screens, 0.5px on high-density), 40% on light, 30% on dark |
| 12 to 34px | The film's bond as it is: the 1px hairline and its dots, never smaller, as the film keeps it round its smallest atoms on the globe |
| 34 to 68px | Every length × `k = s ÷ 34`: the hairline's width, each dot's radius and offset. The dots' count follows the line's length in film pixels, `length ÷ k`, so the bond keeps the same grain. The opacities do not scale |
| Over 68px | Held at double the film's (`k = 2`), so a big atom's bond stays a hairline |

The gaps between atoms always scale with them; only the bond's texture stops at 12px, 34px and 68px.

| Atom size | Hairline | Dot radius | Dots per 100px of line |
|---|---|---|---|
| Under 12px | One device pixel, 40% (30% on dark) | No dots | None |
| 12 to 34px | 1px | 0.45 to 1.05px | 20 |
| 51px | 1.5px | 0.675 to 1.575px | 13 |
| 68px and over | 2px | 0.9 to 2.1px | 10 |

## What a bond is not

Never: Solid; dashed; an arrow; colored; a shadow, glow or gradient; a thicker stroke.

Lines in color in the film, to a triple's vaults, its fees, its data, are not bonds.

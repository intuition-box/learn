# Bonds

The connections between a triple's atoms are bonds, as in chemistry. Subject to predicate, predicate to object. Intuition's signature shape, as recognizable as the atoms they join. Every bond is a faint hairline carrying fine dots of ink.

Every value here is the onboarding film's own, from its code. Draw bonds exactly so, at exactly these proportions to the atoms; when in doubt, generate them with [scripts/bond.mjs](../scripts/bond.mjs), which reproduces the film's dots dot for dot. Where a triple's atoms stand is in [triples.md](triples.md).

## Quick reference

All measures are at the film's atom size, **34px**. At another size `s` ([bonds-anatomy.md](bonds-anatomy.md), Scaling): under 12px, a plain line one device pixel wide; from 12px to 34px, the film's bond as it is; from 34px to 68px, every length × `s ÷ 34`; over 68px, held at double the film's.

| Part | On light | On dark: Midnight, Graphite 950 or black | As a share of the atom (÷ 34) |
|---|---|---|---|
| Ink | Midnight `#16161e` | Graphite 0 `#ffffff` |  |
| Hairline | 1px at 16%, caps and joins round | 1px at 12%, caps and joins round | 0.0294 |
| Dots | One per 5px of line | One per 5px of line | 0.147 apart on average |
| Dot radius | 0.45 to 1.05px | 0.45 to 1.05px | 0.0132 to 0.0309 |
| Dot offset across the line | Up to 0.8px either side, most on the line | The same | Up to 0.0235 |
| Dot opacity | `0.2 + 0.75 × w^2.2` | `0.8 × (0.2 + 0.75 × w^2.2)` |  |

## The rules that are never broken

1. **Subject to predicate and predicate to object only; never across triples; never a web.**
2. **The two atoms' centers; always under the shapes.**
3. **The predicate's triangle always points up.** It never turns toward its object, never left, never right.
4. **Never:** Solid; dashed; an arrow; colored; a shadow, glow or gradient; a thicker stroke.
5. **Grows once both atoms are in place; draws back; dots only on the drawn part.**
6. **Center to center.** A bond goes from one shape to the other, always from and to each shape's center, its true center, where it balances: a triangle's sits below the middle of its box. A triple's two bonds meet exactly at the predicate's center: the first ends there and the second starts there, never one line from the subject to the object with the predicate somewhere along it.

**The exception, for art only.** In an illustration made as art, such as the Observed and Orbit backgrounds, a bond may be drawn over the atom it leaves from, so it shows leaving from its center: the first over the subject's circle, the second over the predicate's triangle. Never in an interface, a diagram or the film, where bonds always run under the shapes. Molecule, a picture with its own exception (Saulo, 2026-11-13): each bond runs from the middle of the face that looks toward its other atom, over the farther of its two atoms, into the middle of its face, and under the nearer, bent gently, and held at three times the film's instead of two ([3d.md](3d.md), Bonds between glowing shapes).

## How to draw bonds

1. Lay the triple out as [triples.md](triples.md) does.
2. Draw its bonds, center to center, with [scripts/bond.mjs](../scripts/bond.mjs) or by [bonds-anatomy.md](bonds-anatomy.md): `ground: 'dark'` on Midnight, Graphite 950 or black.
3. Draw the shapes over the bonds' ends.

## Checklist

```
Intuition bonds checklist
- [ ] Only subject–predicate and predicate–object bonds; none across triples
- [ ] Center to center, drawn under the shapes
- [ ] Every predicate's triangle points up
- [ ] At atom size 34px: hairline 1px, dots one per 5px
- [ ] On light: Midnight, hairline 16%; on dark: Graphite 0, hairline 12%, dots at 0.8
- [ ] Under 12px atoms, a plain line, one device pixel, 40% (30% on dark); 12 to 34px, the film's bond; 34 to 68px, scaled by size ÷ 34; over 68px, held at double
- [ ] Never solid, dashed, an arrow, colored, a shadow, glow or gradient, or a thicker stroke
```

## Reference files

- [bonds-anatomy.md](bonds-anatomy.md): the hairline and the dots, exactly, on light and on dark: how many, where, how large, how dark, and how to reproduce the film's own.
- [bonds-layout.md](bonds-layout.md): where bonds go: their ids, their length, their ends at frames, and the draw order.
- [bonds-motion.md](bonds-motion.md): bonds in motion: growing and drawing back.
- [triples.md](triples.md): where a triple's atoms stand, their names and frames.
- [scripts/bond.mjs](../scripts/bond.mjs): the film's bond as code. `bondSvg` draws a bond between two points at any atom size, on a light or a dark ground; `bondDots` returns the film's dots; `tripleCenters` places a triple's atoms.

The atoms themselves (shapes, colors) are in [shapes.md](shapes.md) and [color.md](color.md).

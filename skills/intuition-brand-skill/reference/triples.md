# Triples

A triple is a subject, a predicate and an object, joined by two bonds. This is where a triple's atoms stand, as the film lays them out: on one line, with their names, and in frames when a triple is part of another. The bonds between them are in [bonds.md](bonds.md).

All measures are at the film's atom size, 34px. At another size `s`, multiply each by `s ÷ 34`.

## Contents

- A triple on one line
- The atoms on it
- Names
- Nested triples: frames
- Draw order
- Measures at a glance
- How to draw a triple
- Checklist

## A triple on one line

A triple lays its parts side by side on one level line, left to right: subject, predicate, object. Each part is an atom, or a whole triple in its frame.

- Each atom's **slot** is its name's width plus 16px (its badge's padding), never less than 34px, the atom's size.
- Slots stand **34px apart**, the atom's own size: room for the bond between two shapes.
- Each atom stands in the **middle of its slot**, on the line.

So two neighbors' centers are `slotA ÷ 2 + 34 + slotB ÷ 2` apart. `tripleCenters` in [scripts/bond.mjs](../scripts/bond.mjs) places a triple's atoms from their names' widths.

## The atoms on it

The atoms are drawn exactly as [shapes.md](shapes.md) draws them, in Drawing the atoms, at the atom size `s`, each in its protocol color; see [color.md](color.md).

## Names

Each atom's name sits in a badge **under** its shape, centered on it:

| Part | Value |
|---|---|
| Badge | 22px tall, a pill (corner radius 11px), Midnight |
| Text | Inter 500, 13px, white, centered |
| Padding | 8px either side of the text |
| Gap | 8px from the bottom of the shape's box (`s ÷ 2` below its center) to the badge's top |

## Nested triples: frames

A triple that is the subject or object of another stands in a **frame**, as one part of the outer triple's line:

| Part | Value |
|---|---|
| Padding | 16px inside, left and right of what it holds |
| Height | From 14px above the shapes' tops to 14px below the names' bottoms; each frame round another reaches 12px further, above and below |
| Corners | Radius 14px: rounded, never a pill |
| Fill | The color of the role the triple fills, at 7% |
| Outline | That color at 45%, 1px |

## Draw order

1. Frames, outermost first.
2. Bonds.
3. Shapes, over the bonds' ends.
4. Names.

## Measures at a glance

| Measure | 34px atoms | Share of the atom |
|---|---|---|
| Slot | name + 16, at least 34 |  |
| Between slots | 34 | 1 |
| Name badge height | 22 | 0.647 |
| Badge padding | 8 | 0.235 |
| Shape to badge | 8 | 0.235 |
| Name text | 13 | 0.382 |
| Frame padding | 16 | 0.471 |
| Frame reach | 14, then +12 a level | 0.412, +0.353 |
| Frame corner radius | 14 | 0.412 |

## How to draw a triple

1. Measure each atom's name in Inter 500 at 13px (× `s ÷ 34`), and give each atom its slot: the name's width plus 16px, never less than 34px.
2. Lay the slots side by side on one line, 34px apart. Each atom stands in the middle of its slot.
3. Draw the frames of any nested triples first.
4. Draw the bonds, center to center, as [bonds.md](bonds.md) draws them.
5. Draw the shapes over the bonds, each at the atom size, the triangle pointing up.
6. Set each name in its badge, 8px under its shape.

## Checklist

```
Intuition triples checklist
- [ ] Slots: name + 16px, at least 34px; 34px between slots
- [ ] Each atom in the middle of its slot, on one level line
- [ ] Names in their badges, 8px under the shapes
- [ ] Nested triples in frames: padding 16, reach 14 (+12 a level), radius 14, fill 7%, outline 45%
- [ ] Draw order: frames, bonds, shapes, names
```

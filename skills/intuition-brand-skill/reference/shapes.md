# Shapes and imagery

## Contents

- The grammar
- Drawing the atoms
- Bonds
- Color
- Backgrounds
- Social images
- Rules

## The grammar

The shapes are the grammar: each one is a role.

| Role | Shape | Why |
|---|---|---|
| Subject | Circle | The organic shape: a person, a thing, an identity |
| Predicate | Triangle | Pointed: the relationship a triple states. Always up, never changes direction, it always points up |
| Object | Square | Objects have hard edges |
| Bridge object | Hexagon | An object that is also a subject: two directions merging. Joins two claims, as the object of one and the subject of the next. |

A triple, a claim, is a subject, a predicate and an object, bonded in that order. Linked claims form a graph: a bridge object joins two claims, as the object of one and the subject of the next. Any object that becomes the subject of another claim turns into a bridge.

Words, by where: Code can shorten and use `bridge`; glossary and user-facing content use "bridge object".

## Drawing the atoms

Draw every atom exactly as the film builds it. [scripts/atom.mjs](../scripts/atom.mjs) does it: `outlinePath(role, size, centre)` returns the film's own SVG path, and Learn's tests hold it to the film's code, output for output. Use the script; to draw by hand, follow these exactly.

Drawn in a 1×1 square, centered, then scaled.

| Shape | Core | With rounding | Area |
|---|---|---|---|
| Circle | radius 0.40 | 0.90 × 0.90 | 0.636 |
| Triangle | 0.80 wide, 0.72 tall | 0.90 × 0.82 | 0.418 |
| Square | side 0.68 | 0.78 × 0.78 | 0.606 |
| Hexagon | radius 0.44, points left and right | 0.98 × 0.86 | 0.643 |

- **Centering.** Middle of its height, not the centroid, so a row stands level.
- **Hexagon.** Points left and right: where a bond comes in and another goes out.
- **Sizes.** Optical sizes, not equal cells: square smaller because it fills its cell (areas within 5%); hexagon has the circle's area (within 1%); triangle as wide as the circle, a little taller than equilateral.
- **Samples.** 120 rays, every 3°, from straight up, clockwise; square and hexagon corners on rays; triangle base corners at 41.99°, between rays.
- **Rounding.** One, `ROUNDING = 0.05` for every atom.
- **Corners.** An arc between the edges' ways out at outward turns; none on straight runs (turn under 1e-9); two ends at inward bends.
- **Morphing.** a + (b − a) × t per sample, then rounded the same way; `roundedOutline(from, to, t)`.
- **Precision.** The SVG writes three decimals.
- **Logo.** Never use logo shapes as atoms, or atoms as a logo.

## Bonds

The connections between a triple's atoms are bonds, as in chemistry. Subject to predicate, predicate to object. Intuition's signature shape, as recognizable as the atoms they join. [bonds.md](bonds.md) holds the film's exact texture and proportions. Draw every bond by it.

- Subject to predicate and predicate to object only; never across triples; never a web.

## Color

- On dark (Midnight or Graphite 950), fill each atom in its protocol color. See [color.md](color.md).
- On light, fill background atoms in pale Graphite: circles and squares in Graphite 200, triangles and hexagons in Graphite 300. They are decorative, so contrast does not apply to them. Where an atom carries meaning on light, use its protocol color and its shape together, never color alone, since the predicate's green reads at 1.7:1 on white.
- Stakes are drawn in their colors: against `#ff912e`, for `#28aaf5`.

## Backgrounds

Fields of claims: atoms in their shapes, joined by faint bonds, few and clear. Each claim is a triple laid out as [triples.md](triples.md) lays one out, without names. Its bonds are drawn as [bonds.md](bonds.md) draws them, on the field's ground.

| Field | Look | For |
|---|---|---|
| Intuition Universe | The homepage's universe: atoms in their protocol colors forming the Intuition logo's ring on white, still and solid, without the welcome or Play | Light surfaces, wallpapers |
| Universe | Atoms in their protocol colors scattered on Midnight | Dark surfaces, wallpapers |
| Universe, light | The same on white | Light surfaces, wallpapers |
| Atoms | The four atom shapes as solids in their protocol colors, drawn as [3d.md](3d.md) says (a sphere and three prisms 0.4 of a unit deep, each lit from its core, no more saturated than the role colors; glowing on Midnight, and not on white), each turned its own way, among small filled atoms in their colors, a few far ones out of focus, on Midnight or on white. Its triangle is turned 10° in its own plane: an exception for this picture only, never a rule to follow | Dark and light surfaces, wallpapers, social images |
| Observed | The triple is the light: its atoms are solids that glow in their protocol colors, drawn as [3d.md](3d.md) says, facing straight on as its flat atoms did (a sphere, and a triangle and a square showing only their fronts), and the atoms in the dark around it are solids in Graphite, each face lit by how far it turns to the triple and how near it stands, bright in the triple's own colors, no white, where it turns to it, near black where it turns away; its bonds run center to center, with no glow. The big sphere stands behind the triple; each solid casts a soft shadow away from the light. Its ground is Graphite 950, not Midnight: an exception for this picture only, never a rule to follow | Dark surfaces, wallpapers, social images |
| Orbit | Observed's light and solids in another composition: the subject, a sphere, in front of a big sphere, the predicate below it and the object above, all three facing straight on as Observed's, among a small sphere, a solid triangle and a small cube lit in the triple's own colors, its bonds center to center with no glow. Graphite 950, as Observed | Dark surfaces, wallpapers, social images |
| Multiplayer | Your data, made multiplayer: the four atom shapes as solids in their protocol colors, glowing, each turned its own way in a 2 × 2 grid, among small gray solid atoms lit by them, centered in the frame, with no words. Its triangle points left, turned 27° in the picture's plane: an exception for this picture only, never a rule to follow. Graphite 950, as Observed | Dark surfaces, wallpapers, social images |
| Molecule | A predicate and the atoms it bonds, after a reference Saulo chose: a triangle at the center bonded to two circles and three squares, all solids glowing in their protocol colors, drawn as [3d.md](3d.md) says, at the reference's places. Every atom is one unit in space and as big as its depth makes it, the nearest circle the biggest. Its prisms are turned about 45°, each its own way, and rolled, the triangle too: an exception for this picture only, never a rule to follow. Its bonds are the skill's bond held at three times the film's (the rule holds it at two), bent gently as the reference's strands bend, each running from the middle of the face that looks toward its other atom (a sphere's from its center), over the farther of its two atoms, into the middle of its face, and under the nearer. The six shapes are centered on the frame as one group. It has no far glow, and each shape casts a soft shadow, Wave UI's three-layer stack, dithered, just under its hot edge: exceptions for this picture only, as the skill's glowing shapes cast none. Its backdrop is the reference's own, measured, dithered: another exception for this picture only. Graphite 950, as Observed | Dark surfaces, wallpapers, social images |

Phone versions leave a clear band near the top for the clock.

## Social images

Made to the size each place asks for, with room left where the place lays its own picture over them, such as the profile picture over a banner.

| Image | Size | What it shows |
|---|---|---|
| X avatar | 400 × 400 | The mark in Midnight, centered on white |
| X avatar, Intuition Universe | 400 × 400 | The homepage's universe zoomed on the Intuition logo: only the logo's atoms, each in its place, the smallest removed and the next ones grown, on white or on Midnight |

## Rules

Do:

- Draw a subject as a circle, the organic shape.
- Draw a predicate as a triangle, always pointing up.
- Draw an object as a square, all hard edges.
- Draw a bridge object, an object that is also a subject, as a hexagon: two directions merging.
- Join a triple's atoms with bonds: subject to predicate, predicate to object.

Don't:

- Give a shape another role, or a role another shape.
- Turn a predicate's triangle: it points up, always.
- Bond atoms that share no triple: bonds are claims, few and clear, never a web.
- Shorten a hexagon's name in captions: in words it is a bridge object, whatever the code calls it.
- Set text in a protocol color: they are for shapes, and the predicate's green reads at 1.7:1 on white.

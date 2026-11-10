# Logo

## Contents

- What the mark is
- What it means
- Construction
- Clear space
- Minimum size
- Color
- Placement
- Misuse
- Diagrams
- Files

## What the mark is

The logo mark (the logo, the mark) is Intuition's four atom shapes, two by two: a circle and a triangle on the first line, a square and a hexagon on the second.

The older ring of five arcs is the **Intuition logo**. It appears on earlier material, such as the Discord banner, and is always named in full, never "the logo".

## What it means

The logo celebrates humans and agents together: Intuition's statement that the two complement each other instead of competing. It is built from Intuition's four atom shapes, a subject, a predicate, an object and a bridge object, the pieces the protocol builds knowledge from.

- **Two i's.** Each column is a letter i, the first letter of Intuition.
- **The left i is the human.** The circle sits on the square. Round and soft.
- **The right i is the agent.** The triangle sits on the hexagon. Pointed and engineered.
- **Heads and bodies.** The subject and predicate are the heads; the objects are the bodies.
- **Made of the protocol.** The logo isn't a symbol added to Intuition; it is Intuition.

It is optically corrected so neither column stands over the other. Each shape is sized and rounded by hand, with its own corner radius, so all four weigh the same to the eye.

## Construction

The construction below defines the mark. Draw it exactly by these rules, or use the official files, which are drawn from them. Never approximate it with plain circles, triangles, squares and hexagons: the overshoots and radii are part of it.

The mark stands on a grid of four square cells. Units are relative: a cell is 100.

| Measure | Value |
|---|---|
| Cell | 100 × 100 |
| Gap between the rows (x) | 10, a tenth of a cell |
| Gap between the columns (y) | 30, 3x, measured cell to cell |
| Frame, the mark's outer rectangle | 238.72 wide × 214 tall |

Each shape is drawn sharp-cornered first, as its core, then grown outward by its own corner radius: every side moves out by the radius and every corner becomes an arc of that radius, centered on the core's corner. So a shape's outer size is its core's size plus twice its radius.

| Shape | Outer size | Corner radius | Core, drawn first | In its cell |
|---|---|---|---|---|
| Circle (subject) | Ø 103 | none | none | Centered, 1.5 past the cell on every side |
| Triangle (predicate) | 104 tall, 114.44 wide | 5 | 94 tall, 104.44 wide | Centered across, base on the cell's bottom, point 4 above it |
| Square (object) | 100 × 100 | 6 | 88 × 88 | Is the cell |
| Hexagon (bridge object) | 100 tall, 113 wide | 8 | 84 flat to flat, its points left and right | Centered, flat top and bottom on the cell, 6.5 past it left and right |

The triangle is 0.8 wide for 0.72 tall, measured sharp corner to sharp corner. The hexagon is regular.

Why the sizes differ: the eye reads a circle, and a shape ending in a point, as smaller than a square of the same height. So the circle is 3% larger and the triangle 4% taller, the overshoot type designers give an "o" over an "x". The hexagon's flat top and bottom read like the square's, so it fills its cell exactly in height; a regular hexagon 100 tall cannot be 100 wide, so its width is geometry, not correction.

Why the radii differ: one radius looks softer on sharp corners and harder on wide ones. So the triangle's sharp corners (about 58° at the point, 61° at the base) take 5, the square's 90° corners 6 and the hexagon's 120° corners 8, and every corner looks equally soft.

## Clear space

Keep the square's height, 100 units, clear on every side of the frame. Nothing else may enter it: no text, no edge of the canvas, no other mark.

| Mark height | Clear space on every side |
|---|---|
| 16px (the minimum) | 7.5px |
| 32px | 15px |
| 64px | 30px |
| Any height h | h × 100 ÷ 214, about 0.47 h |

With its clear space, the mark occupies 438.72 × 414 units.

## Minimum size

The mark is never under 16px tall on screen. Below that the column gap closes and it stops reading as two letters.

The minimum is the mark's own height, not its file's. The official files hold the mark inside its clear space, where it fills about 49% of the canvas height, so set a 1024 × 1024 file at 33px tall or more.

For a favicon or an app icon, use the mark centered on a square, as the official favicon at https://learn.intuition.box/mark.svg does: Midnight, or the reversed mark where the browser is in dark mode.

## Color

The mark is always one color.

| Background | Mark |
|---|---|
| White and light Graphite (0 to 200) | Midnight `#16161e` |
| Very dark or pitch black only: Midnight (Graphite 900), Graphite 950, black, or a picture as dark under the whole mark and its clear space | The reversed mark, white `#ffffff` |

Never draw it in a protocol color, Teal or Gold, never in two colors, never with a gradient. The protocol colors are meanings in the graph, not the logo's.

### Reversed

The reversed mark is the mark in white, for dark grounds, optically corrected for the irradiation illusion. It is drawn every edge 1 unit in: each core as constructed, grown by its radius less 1, and the circle 1 smaller in radius. Every shape keeps its center, every gap is 2 wider, and the frame and the clear space are the mark's own.

It is drawn lighter because a light shape on a dark ground looks larger than the same shape dark on light, the [irradiation illusion](https://en.wikipedia.org/wiki/Irradiation_illusion). Drawn this way, the reversed mark reads at the same weight as the mark in Midnight.

| Shape | Outer size | Corner radius |
|---|---|---|
| Circle (subject) | Ø 101 | none |
| Triangle (predicate) | 102 tall, 112.44 wide | 4 |
| Square (object) | 98 × 98 | 5 |
| Hexagon (bridge object) | 98 tall, 111 wide | 7 |

- White on dark is always the reversed mark, drawn this way: the official reversed file, the favicon in dark mode, and anything else.
- **Never broken: the reversed mark goes only on a very dark or pitch-black ground:** Midnight (Graphite 900) `#16161e`, Graphite 950 `#07070c` or black `#000000`, or a picture as dark under the whole mark and its clear space. Never on anything lighter: not Graphite 800 or lighter, not a protocol color, Teal or Gold, not a mid-tone picture.

## Placement

- Prefer plain backgrounds from the palette.
- On a picture, place the mark only over a calm area where its color keeps 3:1, and keep the clear space free of busy detail.
- Align it by its frame, which includes the circle's and the triangle's overshoots, not by the shapes inside it.

## Misuse

Never:

- Stretch, squash, skew or rotate the mark.
- Move, resize, recolor or rotate one shape on its own.
- Swap the columns, or put the shapes in one row.
- Change the gaps between the shapes.
- Redraw it with plain shapes, without its overshoots and radii.
- Outline it, or add a shadow, glow, bevel or texture.
- Color it in anything but Midnight or white.
- Put the reversed mark on any ground lighter than Midnight.
- Place it on a background where it falls below 3:1.
- Crop it, or let anything enter its clear space.

## Diagrams

The drawings that explain the mark, its construction, its clear space and its reversed mark, follow the drafting convention: every rule drawn over the mark is red. They explain the logo; they are never the logo.

| Part | Rule |
|---|---|
| Color | Drafting red `#fb2c36`, for every line, circle and label drawn over the mark. Filled areas (the cells, the clear space's corner squares) in the same red at 8%, but the logo versions overlaid drawing's mark, solid. Nowhere else in the brand. |
| The mark | In Midnight, over the rules, exactly as constructed. |
| Lines | Hairlines: 1px, 0.5px on high-density screens, the same at any size of the drawing. |
| Dimension lines | 10px clear of the grid's outer line they stand off, stroke to stroke, at any size of the drawing. A tick across each end, 4px each way, each on a grid line. Drawn as strokes, as the grid is. |
| Labels | Inter 400, 12px, line height 1, in the red, at any size of the drawing. Written as a name and a value: `x = 10`, `y = 30`, `cell = 100`, `r = 5`, one space each side of the `=`. |
| Label gap | 10px clear of its line to the figures, on every side: to the baseline above a line, to the figures' tops below it (Inter's figures stand 0.737em tall), to the last figure's ink beside it (0.06em inside its advance). |
| Label position | Above or below a line, centered across it; beside a line, centered on it; a corner radius, centered in its shape. |

The construction drawing shows the four cells, faint; the grid's lines run the grid's full length and height; the mark over them; a circle of each corner's radius at every rounded corner, with `r = 5`, `r = 6` and `r = 8` in their shapes; and three measures: `y = 30` above, between the columns; `x = 10` on the left, between the rows, beside the human's column; `cell = 100` below the bottom-left cell. Around it, 80 units of room on every side.

The clear space drawing frames the mark with its clear space: the frame is the clear space's edge, a red hairline; the mark's outermost edges run out to it; a faint square of the square's size sits in each corner.

The logo versions overlaid drawing sets, on Midnight, the mark in solid drafting red under the reversed mark in white, with 60 units of room round them, so the reversed mark's 1-unit inset shows as a red rim round every edge of every shape. Beside it, as wide again, a loupe magnifies the square's top right corner 8 times: a red hairline ring round the corner on the marks, a red hairline from it to the loupe, the loupe framed in a red hairline, and in it the rim labelled `inset = 1`. On screen, when the drawing comes into view, the reversed mark drifts off the red one, as if dragged, and settles back on it, again and again; the loupe stays still; all of it stays still for a reader who asks for less motion.

## Files

| File | Use |
|---|---|
| https://learn.intuition.box/brand/files/intuition-mark-1024x1024.svg | The mark in Midnight, for light backgrounds |
| https://learn.intuition.box/brand/files/intuition-mark-reversed-1024x1024.svg | The reversed mark: white, for dark backgrounds, optically corrected for the irradiation illusion |

Both are 1024 × 1024 with a transparent background and the clear space built in. Each also comes as a PNG at the same address, ending in `.png`. Prefer the SVG; use the PNG only where SVG is not accepted.

# Color

## Contents

- The idea
- Brand colors
- Interface colors: Graphite
- Protocol colors
- Drafting red
- Usage balance
- Contrast
- Rules

## The idea

Intuition is about clarity, trust and openness, and shows it with a light theme: white pages and near-black text, instead of the dark interfaces common in crypto infrastructure, which can suggest mystery and secrecy.

Three groups, each with one job:

- **Brand**: Midnight, Teal and Gold. Who Intuition is.
- **Interface**: Graphite. The pages, the text and the lines between them.
- **Protocol**: the four atom roles and the two stakes. Meanings in the graph.

OKLCH values are rounded to three decimals for lightness and chroma and to whole degrees for hue. The brand defines no print values (CMYK, Pantone): do not derive them.

## Brand colors

| Role | Name | HEX | RGB | OKLCH | Use |
|---|---|---|---|---|---|
| Primary | Midnight | `#16161e` | 22 22 30 | oklch(0.204 0.016 285) | Text, the logo, primary buttons, dark surfaces |
| Secondary | Teal | `#00c9d1` | 0 201 209 | oklch(0.76 0.129 200) | Download and brand actions |
| Accent | Gold | `#eabf13` | 234 191 19 | oklch(0.819 0.165 92) | The rare highlight |

Midnight is Graphite 900 under its brand name: a very dark, deep blue, like a moonlit night sky, nearly black in dim light and a cool, slightly violet blue in bright light. Teal brings the calm and stability of blue together with the renewal and growth of green: balance, clarity and quiet confidence. Gold is the sun's energy: warmth, optimism and understanding.

Teal and Gold were made to sit beside the protocol colors without meaning anything in the graph: about as light and as strong, at hues no role or stake takes.

## Interface colors: Graphite

White to near black with a cool, slightly violet cast.

| Step | HEX | RGB | OKLCH | Use |
|---|---|---|---|---|
| 0 | `#ffffff` | 255 255 255 | oklch(1 0 0) | The page |
| 50 | `#f2f3f7` | 242 243 247 | oklch(0.965 0.005 275) | Subtle backgrounds, input fields, hover |
| 100 | `#e2e2ea` | 226 226 234 | oklch(0.915 0.011 286) | Hairlines and borders |
| 200 | `#c6cbd9` | 198 203 217 | oklch(0.842 0.02 270) | Strong borders: inputs, outlined buttons |
| 300 | `#9a9aaf` | 154 154 175 | oklch(0.693 0.031 286) | Muted text on dark |
| 400 | `#7e7e8f` | 126 126 143 | oklch(0.599 0.026 286) | No fixed role |
| 500 | `#656575` | 101 101 117 | oklch(0.512 0.025 285) | Muted text on light |
| 600 | `#535362` | 83 83 98 | oklch(0.448 0.024 285) | No fixed role |
| 700 | `#2e2e3a` | 46 46 58 | oklch(0.306 0.021 285) | Hover on dark buttons |
| 800 | `#262631` | 38 38 49 | oklch(0.273 0.02 285) | No fixed role |
| 900 | `#16161e` | 22 22 30 | oklch(0.204 0.016 285) | Text; Midnight |
| 950 | `#07070c` | 7 7 12 | oklch(0.131 0.012 285) | The darkest surfaces: night fields, dark panels |

In an interface:

| Part | Color |
|---|---|
| Page | Graphite 0 |
| Text | Graphite 900 |
| Muted text, placeholders | Graphite 500 |
| Hairlines, dividers | Graphite 100 |
| Input and outlined button borders | Graphite 200 |
| Input fields, hover backgrounds | Graphite 50 |
| Focus ring | Graphite 900, 2px, 2px from the element |
| Focus ring on dark | White, 2px, 2px from the element |
| Primary button | Midnight fill, white label; Graphite 700 on hover |
| Secondary button | Graphite 200 outline, Midnight label; Graphite 50 on hover |
| Download and brand actions | Teal fill, Midnight label |

The interface's corners are in [interface.md](interface.md).

## Protocol colors

Meanings in the graph. They fill shapes, and never set text.

| Meaning | Shape | HEX | RGB | OKLCH |
|---|---|---|---|---|
| Subject | Circle | `#7a86ff` | 122 134 255 | oklch(0.668 0.177 276) |
| Predicate | Triangle | `#2fe08b` | 47 224 139 | oklch(0.802 0.183 156) |
| Object | Square | `#ff4f5e` | 255 79 94 | oklch(0.678 0.211 20) |
| Bridge object | Hexagon | `#ff5fd2` | 255 95 210 | oklch(0.729 0.228 341) |
| Against | Stake | `#ff912e` | 255 145 46 | oklch(0.76 0.168 57) |
| For | Stake | `#28aaf5` | 40 170 245 | oklch(0.706 0.152 241) |

They are made for dark surfaces: on Graphite 950 every one clears 6:1, and on Midnight every one clears 5.5:1 (see Contrast). On light, draw atoms in pale Graphite (200 and 300) instead, as the Graphite field does, unless the role itself is the point.

## Drafting red

| Name | HEX | RGB | OKLCH | Use |
|---|---|---|---|---|
| Drafting red | `#fb2c36` | 251 44 54 | oklch(0.637 0.237 25) | Rules and labels drawn over the logo in its construction and clear space drawings, and those drawings' areas at 8%. Nowhere else. |

It reads at 3.8:1 on white: enough for the drawings' lines and their 12px labels as figures, which are measures, not reading text. See [logo.md](logo.md).

## Usage balance

How much of a page or a picture each color covers:

| Color | Share | For |
|---|---|---|
| White (Graphite 0) | 70% | The pages |
| Midnight | 20% | The words and the marks |
| Teal | 7% | Download and brand actions |
| Gold | 3% | The rare highlight |

The other Graphite steps live inside the white and Midnight shares as borders, backgrounds and muted text. Protocol colors appear only where atoms or stakes are drawn. A dark surface (a night field, a banner) inverts the first two shares.

## Contrast

WCAG 2 contrast, rounded down. Text needs 4.5:1 (AA) and 7:1 for AAA; large text, 24px and up or 18.66px bold, needs 3:1. Shapes, icons and the parts of a picture that carry meaning need 3:1. Purely decorative shapes, such as the pale atoms of a background field, are exempt.

**On light**

| Pair | Ratio | For |
|---|---|---|
| Midnight on white | 17.9:1 | Text |
| Graphite 500 on white | 5.7:1 | Muted text |
| Midnight on Teal | 8.8:1 | Labels on Teal |
| Midnight on Gold | 10.2:1 | Labels on Gold |
| Subject on white | 3.1:1 | Shapes |
| Object on white | 3.2:1 | Shapes |
| Bridge object on white | 2.6:1 | Below 3:1: not for meaning on its own |
| For on white | 2.5:1 | Below 3:1: not for meaning on its own |
| Against on white | 2.2:1 | Below 3:1: not for meaning on its own |
| Predicate on white | 1.7:1 | Below 3:1: not for meaning on its own |
| Graphite 300 on white | 2.7:1 | Decorative only: background atoms |
| Graphite 200 on white | 1.6:1 | Decorative only: background atoms |
| White on Teal | 2.0:1 | Fails: never |
| Teal on white | 2.0:1 | Fails: never as text |
| Gold on white | 1.7:1 | Fails: never as text |

**On dark**

| Pair | Ratio | For |
|---|---|---|
| White on Midnight | 17.9:1 | Text |
| Graphite 300 on Midnight | 6.5:1 | Muted text |
| Teal on Midnight | 8.8:1 | Text and marks |
| Gold on Midnight | 10.2:1 | Text and marks |
| Subject on Graphite 950 | 6.3:1 | Shapes |
| Predicate on Graphite 950 | 11.6:1 | Shapes |
| Object on Graphite 950 | 6.2:1 | Shapes |
| Bridge object on Graphite 950 | 7.4:1 | Shapes |
| Against on Graphite 950 | 8.9:1 | Shapes |
| For on Graphite 950 | 7.8:1 | Shapes |
| Subject on Midnight | 5.7:1 | Shapes |
| Predicate on Midnight | 10.4:1 | Shapes |
| Object on Midnight | 5.5:1 | Shapes |
| Bridge object on Midnight | 6.6:1 | Shapes |
| Against on Midnight | 8.0:1 | Shapes |
| For on Midnight | 6.9:1 | Shapes |

For any pair not listed, compute the WCAG 2 ratio before using it, and round it down when you report it.

## Rules

- Use only the colors in this file. Tints by opacity are fine inside one color (Midnight at 20% for a track, for example); new hues are not.
- Never set text in a protocol color.
- Never set white text on Teal or Gold; set Midnight.
- Muted text is never lighter than Graphite 500 on white, or darker than Graphite 300 on Midnight.
- Primary buttons are Midnight with a white label; Teal is for download and brand actions.
- Never use a protocol color as decoration: each one means something in the graph.
- Keep the balance: if a design reads as mostly Teal, Gold or dark, it has drifted.

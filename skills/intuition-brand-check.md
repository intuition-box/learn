# Brand skill check

Every value in `skills/intuition-brand-skill/` against the brand page (`learn-brand.ts` and the code it reads) and the brain (`pattern_logo_mark.md`). ✓: the skill states it and it matches. ✗: it differs, see the note.

| Value | Skill | Brand page / brain |
|---|---|---|
| **Logo: construction (brain: pattern_logo_mark, code: logo-mark.tsx)** | | |
| ✓ Cell | 100 × 100 | square 100 (code); "a cell, the square's side, is 100" (brain) |
| ✓ Row gap (x) | 10 | 10, "the lines of cells x apart (10)" (brain) |
| ✓ Column gap (y) | 30, 3x, cell to cell | 30, "the columns 3x apart (30)" (brain) |
| ✓ Frame | 238.72 × 214 | 238.72 × 214 (code); 238.7 × 214 (brain) |
| ✓ Circle | Ø 103, no radius | Ø 103 (brain) |
| ✓ Triangle | 104 tall, 114.44 wide, radius 5, core 94 × 104.44 | 104 tall, 114.4 wide, radius 5, core 94 × 104.4 (brain) |
| ✓ Square | 100 × 100, radius 6, core 88 | 100 × 100, radius 6, core 88 (brain) |
| ✓ Hexagon | 100 tall, 113 wide, radius 8, core 84 | 100 tall, 113 wide, radius 8, core 84 (brain) |
| ✓ Radii | 5 / 6 / 8 | 5, 6, 8 (code); 5/6/8 (brain) |
| ✓ Method | Sharp core, grown by its radius | "drawn sharp-cornered first, as its core polygon, then grown outward by its own radius" (brain) |
| ✓ Overshoots | Circle 1.5 every side; triangle 4 above; hexagon 6.5 left and right | Same (brain) |
| **Logo: use** | | |
| ✓ Clear space | Square's height, 100 units, every side | "Square's height on every side" (page); 100 units (brain) |
| ✓ Minimum size | Mark 16px tall | min 16px tall (page); "Minimum 16px tall" (brain) |
| ✓ Color on light | Midnight #16161e | LOGO_MARK_COLOR #16161e (code); Graphite 900 (brain) |
| ✓ Color on dark | White | Reversed file on Midnight (page); "white on dark" (brain) |
| ✓ Reversed | Optically corrected for the irradiation illusion: every edge 1 unit in, centers and frame kept; circle Ø 101, radii 4, 5, 7 | `REVERSED_INSET = 1`, `reversedMarkShapes` (`logo-mark.tsx`); the reversed file (`markAsset(…, 'dark')`); "Optically corrected for the irradiation illusion" (page); brain `pattern_logo_mark` |
| ✓ Reversed ground | Very dark or pitch black only: Midnight, Graphite 950, black, or a picture that dark | The page shows it on Midnight (`backdrop: 'primary'`, `learn-brand.ts`); brain `pattern_logo_mark` |
| ✓ Favicon in dark mode | The reversed mark | `logoMarkFile` (`logo-mark.tsx`): the reversed shapes in dark mode |
| ✓ Columns | Human left, agent right; never swapped | "never swap the order (human left, agent right)" (brain) |
| ✓ Never role colors | Never a protocol color, Teal or Gold | "Never the role colors" (brain) · Teal and Gold added by the skill |
| ✓ Meaning: Two i's. | Each column is a letter i, the first letter of Intuition. | "Each column is a letter i, the first letter of Intuition." (page) |
| ✓ Meaning: The left i is the human. | The circle sits on the square. Round and soft. | "The circle sits on the square. Round and soft." (page) |
| ✓ Meaning: The right i is the agent. | The triangle sits on the hexagon. Pointed and engineered. | "The triangle sits on the hexagon. Pointed and engineered." (page) |
| ✓ Meaning: Heads and bodies. | The subject and predicate are the heads; the objects are the bodies. | "The subject and predicate are the heads; the objects are the bodies." (page) |
| ✓ Meaning: Made of the protocol. | The logo isn't a symbol added to Intuition; it is Intuition. | "The logo isn't a symbol added to Intuition; it is Intuition." (page) |
| **Colors: brand (page: Colors › Brand)** | | |
| ✓ Primary: Midnight | #16161e · 22 22 30 · oklch(0.204 0.016 285) | #16161e · oklch(0.204 0.016 285) (page) |
| ✓ Secondary: Teal | #00c9d1 · 0 201 209 · oklch(0.76 0.129 200) | #00c9d1 · oklch(0.76 0.129 200) (page) |
| ✓ Accent: Gold | #eabf13 · 234 191 19 · oklch(0.819 0.165 92) | #eabf13 · oklch(0.819 0.165 92) (page) |
| ✓ Midnight alias | Graphite 900 | badge "Graphite 900" (page) |
| **Colors: Graphite (page: Colors › Interface; code: globals.css)** | | |
| ✓ Graphite 0 | #ffffff · 255 255 255 · oklch(1 0 0) | #ffffff · oklch(1 0 0) (page) |
| ✓ Graphite 50 | #f2f3f7 · 242 243 247 · oklch(0.965 0.005 275) | #f2f3f7 · oklch(0.965 0.005 275) (page) |
| ✓ Graphite 100 | #e2e2ea · 226 226 234 · oklch(0.915 0.011 286) | #e2e2ea · oklch(0.915 0.011 286) (page) |
| ✓ Graphite 200 | #c6cbd9 · 198 203 217 · oklch(0.842 0.02 270) | #c6cbd9 · oklch(0.842 0.02 270) (page) |
| ✓ Graphite 300 | #9a9aaf · 154 154 175 · oklch(0.693 0.031 286) | #9a9aaf · oklch(0.693 0.031 286) (page) |
| ✓ Graphite 400 | #7e7e8f · 126 126 143 · oklch(0.599 0.026 286) | #7e7e8f · oklch(0.599 0.026 286) (page) |
| ✓ Graphite 500 | #656575 · 101 101 117 · oklch(0.512 0.025 285) | #656575 · oklch(0.512 0.025 285) (page) |
| ✓ Graphite 600 | #535362 · 83 83 98 · oklch(0.448 0.024 285) | #535362 · oklch(0.448 0.024 285) (page) |
| ✓ Graphite 700 | #2e2e3a · 46 46 58 · oklch(0.306 0.021 285) | #2e2e3a · oklch(0.306 0.021 285) (page) |
| ✓ Graphite 800 | #262631 · 38 38 49 · oklch(0.273 0.02 285) | #262631 · oklch(0.273 0.02 285) (page) |
| ✓ Graphite 900 | #16161e · 22 22 30 · oklch(0.204 0.016 285) | #16161e · oklch(0.204 0.016 285) (page) |
| ✓ Graphite 950 | #07070c · 7 7 12 · oklch(0.131 0.012 285) | #07070c · oklch(0.131 0.012 285) (page) |
| **Colors: protocol (page: Colors › Protocol; code: the film)** | | |
| ✓ Subject (circle) | #7a86ff · 122 134 255 · oklch(0.668 0.177 276) | #7a86ff · oklch(0.668 0.177 276) (page) |
| ✓ Predicate (triangle) | #2fe08b · 47 224 139 · oklch(0.802 0.183 156) | #2fe08b · oklch(0.802 0.183 156) (page) |
| ✓ Object (square) | #ff4f5e · 255 79 94 · oklch(0.678 0.211 20) | #ff4f5e · oklch(0.678 0.211 20) (page) |
| ✓ Bridge object (hexagon) | #ff5fd2 · 255 95 210 · oklch(0.729 0.228 341) | #ff5fd2 · oklch(0.729 0.228 341) (page) |
| ✓ Against | #ff912e · 255 145 46 · oklch(0.76 0.168 57) | #ff912e · oklch(0.76 0.168 57) (page) |
| ✓ For | #28aaf5 · 40 170 245 · oklch(0.706 0.152 241) | #28aaf5 · oklch(0.706 0.152 241) (page) |
| **Colors: usage (page: Colors › Usage)** | | |
| ✓ Share: White (Graphite 0) | 70% | 70% (page) |
| ✓ Share: Midnight | 20% | 20% (page) |
| ✓ Share: Teal | 7% | 7% (page) |
| ✓ Share: Gold | 3% | 3% (page) |
| ✗ Teal's job in the usage line | Download and brand actions | "Teal for the actions" (page) · the skill narrows it; the page still says "the actions" |
| **Colors: contrast (page: Colors › Contrast)** | | |
| ✓ Primary text (Graphite 900 on Graphite 0) | 17.9:1 | 17.9:1 (page) |
| ✓ Muted text (Graphite 500 on Graphite 0) | 5.7:1 | 5.7:1 (page) |
| ✓ Primary on secondary (Midnight on Teal) | 8.8:1 | 8.8:1 (page) |
| ✓ Primary on accent (Midnight on Gold) | 10.2:1 | 10.2:1 (page) |
| ✓ Subject (Subject (circle) on Graphite 0) | 3.1:1 | 3.1:1 (page) |
| ✓ Predicate (Predicate (triangle) on Graphite 0) | 1.7:1 | 1.7:1 (page) |
| ✓ Object (Object (square) on Graphite 0) | 3.2:1 | 3.2:1 (page) |
| ✓ Bridge object (Bridge object (hexagon) on Graphite 0) | 2.6:1 | 2.6:1 (page) |
| ✓ Primary text (Graphite 0 on Graphite 900) | 17.9:1 | 17.9:1 (page) |
| ✓ Muted text (Graphite 300 on Graphite 900) | 6.5:1 | 6.5:1 (page) |
| ✓ Secondary on primary (Teal on Midnight) | 8.8:1 | 8.8:1 (page) |
| ✓ Accent on primary (Gold on Midnight) | 10.2:1 | 10.2:1 (page) |
| ✓ Subject (Subject (circle) on Graphite 950) | 6.3:1 | 6.3:1 (page) |
| ✓ Predicate (Predicate (triangle) on Graphite 950) | 11.6:1 | 11.6:1 (page) |
| ✓ Object (Object (square) on Graphite 950) | 6.2:1 | 6.2:1 (page) |
| ✓ Bridge object (Bridge object (hexagon) on Graphite 950) | 7.4:1 | 7.4:1 (page) |
| **Typography (page: Typography)** | | |
| ✓ Instrument Sans | Titles, 500 | Titles, [500] (page) |
| ✓ Inter | Text, 400 / 500 / 600 | Text, [400, 500, 600] (page) |
| ✗ Ioskeley Mono | Code, values and labels, 400 | Code, [400] (page) · the page card says "Code", but its Label style is mono too |
| ✓ Title xl | 36/40px, Instrument Sans 500, −0.025em | `text-4xl font-medium tracking-tight` (page) |
| ✓ Title lg | 30/36px, Instrument Sans 500, −0.025em | `text-3xl font-medium tracking-tight` (page) |
| ✓ Title md | 24/32px, Instrument Sans 500, −0.025em | `text-2xl font-medium tracking-tight` (page) |
| ✓ Title sm | 20/28px, Instrument Sans 500, 0 | `text-xl font-medium` (page) |
| ✓ Text lg | 18/28px, Inter 400 | `text-lg` (page) |
| ✓ Text md | 16/24px, Inter 400 | `text-base` (page) |
| ✓ Text sm | 14/20px, Inter 400 | `text-sm` (page) |
| ✓ Text xs | 12/16px, Inter 400 | `text-xs` (page) |
| ✓ Label | 12/16px, Ioskeley Mono, capitals, +0.18em | `font-mono text-xs tracking-[0.18em] indent-[0.18em] uppercase` (page) |
| ✓ Kicker | 12/16px, Inter 500, sentence case | `text-xs font-medium` (page) |
| ✓ Code | 14/20px, Ioskeley Mono | `font-mono text-sm` (page) |
| **Files (page: downloads)** | | |
| ✓ Logo mark (logo) | intuition-mark-1024x1024.svg, 1024 × 1024 | https://learn.intuition.box/brand/files/intuition-mark-1024x1024.svg (page) |
| ✓ Logo mark, reversed (logo) | intuition-mark-reversed-1024x1024.svg, 1024 × 1024 | https://learn.intuition.box/brand/files/intuition-mark-reversed-1024x1024.svg (page) |
| ✓ Universe Midnight (backgrounds) | intuition-universe-midnight-desktop-2560x1440.svg, 2560 × 1440 | https://learn.intuition.box/brand/files/intuition-universe-midnight-desktop-2560x1440.svg (page) |
| ✓ Universe Midnight (backgrounds) | intuition-universe-midnight-phone-1179x2556.svg, 1179 × 2556 | https://learn.intuition.box/brand/files/intuition-universe-midnight-phone-1179x2556.svg (page) |
| ✓ Universe Midnight (backgrounds) | intuition-universe-midnight-link-preview-1200x630.svg, 1200 × 630 | https://learn.intuition.box/brand/files/intuition-universe-midnight-link-preview-1200x630.svg (page) |
| ✓ Universe Midnight (backgrounds) | intuition-universe-midnight-x-banner-1500x500.svg, 1500 × 500 | https://learn.intuition.box/brand/files/intuition-universe-midnight-x-banner-1500x500.svg (page) |
| ✓ Universe Midnight (backgrounds) | intuition-universe-midnight-linkedin-banner-1584x396.svg, 1584 × 396 | https://learn.intuition.box/brand/files/intuition-universe-midnight-linkedin-banner-1584x396.svg (page) |
| ✓ Universe Midnight (backgrounds) | intuition-universe-midnight-discord-banner-960x540.svg, 960 × 540 | https://learn.intuition.box/brand/files/intuition-universe-midnight-discord-banner-960x540.svg (page) |
| ✓ Universe, light (backgrounds) | intuition-universe-light-desktop-2560x1440.svg, 2560 × 1440 | https://learn.intuition.box/brand/files/intuition-universe-light-desktop-2560x1440.svg (page) |
| ✓ Universe, light (backgrounds) | intuition-universe-light-phone-1179x2556.svg, 1179 × 2556 | https://learn.intuition.box/brand/files/intuition-universe-light-phone-1179x2556.svg (page) |
| ✓ Universe, light (backgrounds) | intuition-universe-light-link-preview-1200x630.svg, 1200 × 630 | https://learn.intuition.box/brand/files/intuition-universe-light-link-preview-1200x630.svg (page) |
| ✓ Universe, light (backgrounds) | intuition-universe-light-x-banner-1500x500.svg, 1500 × 500 | https://learn.intuition.box/brand/files/intuition-universe-light-x-banner-1500x500.svg (page) |
| ✓ Universe, light (backgrounds) | intuition-universe-light-linkedin-banner-1584x396.svg, 1584 × 396 | https://learn.intuition.box/brand/files/intuition-universe-light-linkedin-banner-1584x396.svg (page) |
| ✓ Universe, light (backgrounds) | intuition-universe-light-discord-banner-960x540.svg, 960 × 540 | https://learn.intuition.box/brand/files/intuition-universe-light-discord-banner-960x540.svg (page) |
| ✓ Intuition Universe (backgrounds) | intuition-logo-universe-desktop-2560x1440.svg, 2560 × 1440 | https://learn.intuition.box/brand/files/intuition-logo-universe-desktop-2560x1440.svg (page) |
| ✓ Intuition Universe (backgrounds) | intuition-logo-universe-phone-1179x2556.svg, 1179 × 2556 | https://learn.intuition.box/brand/files/intuition-logo-universe-phone-1179x2556.svg (page) |
| ✓ Intuition Universe (backgrounds) | intuition-logo-universe-link-preview-1200x630.svg, 1200 × 630 | https://learn.intuition.box/brand/files/intuition-logo-universe-link-preview-1200x630.svg (page) |
| ✓ Intuition Universe (backgrounds) | intuition-logo-universe-x-banner-1500x500.svg, 1500 × 500 | https://learn.intuition.box/brand/files/intuition-logo-universe-x-banner-1500x500.svg (page) |
| ✓ Intuition Universe (backgrounds) | intuition-logo-universe-linkedin-banner-1584x396.svg, 1584 × 396 | https://learn.intuition.box/brand/files/intuition-logo-universe-linkedin-banner-1584x396.svg (page) |
| ✓ Intuition Universe (backgrounds) | intuition-logo-universe-discord-banner-960x540.svg, 960 × 540 | https://learn.intuition.box/brand/files/intuition-logo-universe-discord-banner-960x540.svg (page) |
| ✓ Atoms Midnight (backgrounds) | intuition-atoms-midnight-desktop-2560x1440.svg, 2560 × 1440 | https://learn.intuition.box/brand/files/intuition-atoms-midnight-desktop-2560x1440.svg (page) |
| ✓ Atoms Midnight (backgrounds) | intuition-atoms-midnight-phone-1179x2556.svg, 1179 × 2556 | https://learn.intuition.box/brand/files/intuition-atoms-midnight-phone-1179x2556.svg (page) |
| ✓ Atoms Midnight (backgrounds) | intuition-atoms-midnight-link-preview-1200x630.svg, 1200 × 630 | https://learn.intuition.box/brand/files/intuition-atoms-midnight-link-preview-1200x630.svg (page) |
| ✓ Atoms Midnight (backgrounds) | intuition-atoms-midnight-x-banner-1500x500.svg, 1500 × 500 | https://learn.intuition.box/brand/files/intuition-atoms-midnight-x-banner-1500x500.svg (page) |
| ✓ Atoms Midnight (backgrounds) | intuition-atoms-midnight-linkedin-banner-1584x396.svg, 1584 × 396 | https://learn.intuition.box/brand/files/intuition-atoms-midnight-linkedin-banner-1584x396.svg (page) |
| ✓ Atoms Midnight (backgrounds) | intuition-atoms-midnight-discord-banner-960x540.svg, 960 × 540 | https://learn.intuition.box/brand/files/intuition-atoms-midnight-discord-banner-960x540.svg (page) |
| ✓ Atoms, light (backgrounds) | intuition-atoms-light-desktop-2560x1440.svg, 2560 × 1440 | https://learn.intuition.box/brand/files/intuition-atoms-light-desktop-2560x1440.svg (page) |
| ✓ Atoms, light (backgrounds) | intuition-atoms-light-phone-1179x2556.svg, 1179 × 2556 | https://learn.intuition.box/brand/files/intuition-atoms-light-phone-1179x2556.svg (page) |
| ✓ Atoms, light (backgrounds) | intuition-atoms-light-link-preview-1200x630.svg, 1200 × 630 | https://learn.intuition.box/brand/files/intuition-atoms-light-link-preview-1200x630.svg (page) |
| ✓ Atoms, light (backgrounds) | intuition-atoms-light-x-banner-1500x500.svg, 1500 × 500 | https://learn.intuition.box/brand/files/intuition-atoms-light-x-banner-1500x500.svg (page) |
| ✓ Atoms, light (backgrounds) | intuition-atoms-light-linkedin-banner-1584x396.svg, 1584 × 396 | https://learn.intuition.box/brand/files/intuition-atoms-light-linkedin-banner-1584x396.svg (page) |
| ✓ Atoms, light (backgrounds) | intuition-atoms-light-discord-banner-960x540.svg, 960 × 540 | https://learn.intuition.box/brand/files/intuition-atoms-light-discord-banner-960x540.svg (page) |
| ✓ Observed (backgrounds) | intuition-observed-desktop-2560x1440.svg, 2560 × 1440 | https://learn.intuition.box/brand/files/intuition-observed-desktop-2560x1440.svg (page) |
| ✓ Observed (backgrounds) | intuition-observed-phone-1179x2556.svg, 1179 × 2556 | https://learn.intuition.box/brand/files/intuition-observed-phone-1179x2556.svg (page) |
| ✓ Observed (backgrounds) | intuition-observed-link-preview-1200x630.svg, 1200 × 630 | https://learn.intuition.box/brand/files/intuition-observed-link-preview-1200x630.svg (page) |
| ✓ Observed (backgrounds) | intuition-observed-x-banner-1500x500.svg, 1500 × 500 | https://learn.intuition.box/brand/files/intuition-observed-x-banner-1500x500.svg (page) |
| ✓ Observed (backgrounds) | intuition-observed-linkedin-banner-1584x396.svg, 1584 × 396 | https://learn.intuition.box/brand/files/intuition-observed-linkedin-banner-1584x396.svg (page) |
| ✓ Observed (backgrounds) | intuition-observed-discord-banner-960x540.svg, 960 × 540 | https://learn.intuition.box/brand/files/intuition-observed-discord-banner-960x540.svg (page) |
| ✓ X avatar (social) | intuition-x-avatar-400x400.svg, 400 × 400 | https://learn.intuition.box/brand/files/intuition-x-avatar-400x400.svg (page) |
| **Rules (page: Rules)** | | |
| ✓ Do | Draw a subject as a circle, the organic shape. | "Draw a subject as a circle, the organic shape." (page) |
| ✓ Do | Draw a predicate as a triangle, always pointing up. | "Draw a predicate as a triangle, always pointing up." (page) |
| ✓ Do | Draw an object as a square, all hard edges. | "Draw an object as a square, all hard edges." (page) |
| ✓ Do | Draw a bridge object, an object that is also a subject, as a hexagon: two directions merging. | "Draw a bridge object, an object that is also a subject, as a hexagon: two directions merging." (page) |
| ✓ Do | Join a triple's atoms with bonds: subject to predicate, predicate to object. | "Join a triple's atoms with bonds: subject to predicate, predicate to object." (page) |
| ✓ Do | Set titles and headings in sentence case. | "Set titles and headings in sentence case." (page) |
| ✓ Don't | Give a shape another role, or a role another shape. | "Give a shape another role, or a role another shape." (page) |
| ✓ Don't | Turn a predicate's triangle: it points up, always. | "Turn a predicate's triangle: it points up, always." (page) |
| ✓ Don't | Bond atoms that share no triple: bonds are claims, few and clear, never a web. | "Bond atoms that share no triple: bonds are claims, few and clear, never a web." (page) |
| ✓ Don't | Shorten a hexagon's name in captions: in words it is a bridge object, whatever the code calls it. | "Shorten a hexagon's name in captions: in words it is a bridge object, whatever the code calls it." (page) |
| ✓ Don't | Set a title or a heading in capitals. | "Set a title or a heading in capitals." (page) |
| ✓ Don't | Set text in a protocol color: they are for shapes, and the predicate's green reads at 1.7:1 on white. | "Set text in a role color: they are for shapes, and the predicate's green reads at 1.7:1 on white." (page) · "role" → "protocol" |
| **In the skill, not on the page: from the code or the brain** | | |
| ✓ Protocol colors on Midnight | Subject 5.7, predicate 10.4, object 5.5, bridge object 6.6, against 8.0, for 6.9 | Computed with the page's own contrast code (`color.ts`) |
| ✓ Stakes on Graphite 950 | Against 8.9:1, for 7.8:1 | Computed with `color.ts` |
| ✓ Pale atoms on white | Graphite 300 2.7:1, Graphite 200 1.6:1, decorative | Computed with `color.ts`; the Graphite field's atoms (`learn-artwork.ts`) |
| ✓ Interface colors | Page 0, text 900, muted 500, hairline 100, border 200, field 50 | `globals.css` (`.field`, `.btn-*`, the docs tokens) |
| ✓ Buttons | Primary Midnight, hover 700; secondary outlined 200, hover 50; download Teal | `globals.css` (`.btn-primary`, `.btn-secondary`); `downloads` in `learn-brand.ts` |
| ✓ Focus ring | Graphite 900, 2px, 2px offset | `globals.css` (`outline-2`, `outline-offset-2`) |
| ✗ Focus ring on dark | White, 2px, 2px offset | Skill only: the site has no dark interface yet · added for accessibility |
| ✓ Corner tiers | Small 6px, base 10px, large 14px; 12, 16 and 20px as squircles | `--wave-docs-radius-sm`, `--wave-docs-radius`, `--wave-docs-radius-lg` (`@waveso/docs`) through `--radius-sm/md/lg` (`globals.css`); 12, 16 and 20px measured in Chrome |
| ✓ Tier by kind | Small: chips, badges, inline focus rings, menu items; base: controls and overlays; large: blocks | `.btn`, `.field`, `.panel` (`globals.css`); the contents card and menu (`toc.tsx`); the contrast chips and the badge (`color-section.tsx`) |
| ✓ Squircles | Every corner where drawn; pills and dots round | `corner-shape: squircle` on `*`, `rounded-full` set round (`globals.css`) |
| ✓ Nesting | Inner radius = outer less the padding | The contents menu: base, 4px padding (`p-1`), its items small (`toc.tsx`) |
| ✓ A measure's frame | Square corners | The clear space card, no radius (`logo-section.tsx`) |
| ✓ Logo versions overlaid | On Midnight, the mark in solid red under the reversed mark in white: a 1-unit red rim round every edge; a still loupe at 8× on the square's top right corner, the rim labelled `inset = 1`; the drift looping once in view,  still for less motion | `markReversedOverlayDiagram` (`learn-artwork.ts`), `ReversedOverlay` and `PlayWhenSeen` (`logo-section.tsx`, `play-when-seen.tsx`), `--animate-reversed-drag` (`globals.css`); measured: the rim 7.82px in the loupe |
| ✓ Atom construction | The film's exactly: cores (circle 0.40, triangle (0, −0.36) (0.4, 0.36) (−0.4, 0.36), square ±0.34, hexagon 0.44), 120 samples every 3° from the top clockwise, rounding 0.05 arcs at outward turns, morph by sample; `scripts/atom.mjs` | `story-shapes.ts` (`CIRCLE_RADIUS`, the corners, `HEXAGON_RADIUS`, `ROUNDING`, `SAMPLES`, `roundedOutline`, `outlinePath`); `atoms-skill.test.ts` holds the script to it, path for path |
| ✓ Font stacks | Instrument Sans, then Inter, then the system sans | `globals.css` (`h1, h2, h3` and `--wave-docs-font-sans`) |
| ✓ Slashed zero | Ioskeley Mono, always | `globals.css` (`font-variant-numeric: slashed-zero`) |
| ✓ Measure | 45 to 75 characters, 66 best; 8 of 12 columns | Brain `feedback_line_length`; `DESCRIPTION` spans 8 (`brand-section.tsx`) |
| ✓ Mark in its file | Fills about 49% of the canvas; file 33px for a 16px mark | Computed from `fitLockup` and the 1024 canvas |
| **Logo diagrams (code: `logo-section.tsx`, `learn-artwork.ts`)** | | |
| ✓ Drafting red | `#fb2c36`, oklch(0.637 0.237 25) | `text-red-500` (`DIAGRAM`, `logo-section.tsx`); Tailwind 4 red-500 = oklch(63.7% 0.237 25.331) |
| ✓ Areas | Red at 8% | `fill-current/8` (`AREA`) |
| ✓ Hairlines | 1px, 0.5px on high-density screens | `[--hairline:1px]`, `0.5px` at 2dppx (`DIAGRAM`) |
| ✓ Dimension line offset | 10px clear of the grid's outer line, stroke to stroke | `calc(10px + var(--hairline))` center to center (`LINE_OFFSET`, `logo-section.tsx`); `edge: gridTop`, `gridLeft`, `gridBottom` (`learn-artwork.ts`) |
| ✓ Tick | 4px each way, on the grid's lines | `TICK = 4` (`logo-section.tsx`) |
| ✓ Room round the drawing | 80 units | `CONSTRUCTION_MARGIN = 80` |
| ✓ Label face | Inter 400, 12px, line height 1 | `font-sans text-xs leading-none` |
| ✓ Label gap | 10px to the figures, every side | `calc(…10px…)` in `LABEL_OFFSET` |
| ✓ Label trims | Figures 0.737em tall on the baseline, 0.06em after | `0.737em`, `0.3685em`, `0.06em` in `LABEL_OFFSET` |
| ✓ Label text | `x = 10`, `y = 30`, `cell = 100`, `r = 5` | `` `x = ${…}` `` and the others (`learn-artwork.ts`) |
| ✓ x = 10 side | Left, beside the human's column | `side: 'left'`, `edge: gridLeft` (`learn-artwork.ts`) |

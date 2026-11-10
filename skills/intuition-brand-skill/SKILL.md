---
name: intuition-brand-skill
description: "Applies Intuition's brand to anything an agent makes or reviews: the logo mark, the color palette, the typefaces and type scale, the interface's corners, the four atom shapes and the bonds that join them, imagery and the words the brand uses. Use when designing, building or checking a web page, interface, slide, document, diagram, social image or copy that carries the Intuition brand or shows its protocol (atoms, triples, claims, stakes)."
---

# Intuition brand

Intuition is a protocol for knowledge that people and agents build together: anything can be an atom, three atoms make a claim, and linked claims form a graph. The brand starts from one idea, that what is recorded becomes observable, and what is observed becomes real. The protocol is the universe, its atoms are the photons, and the graphs people and agents build on it are the realities.

It is a light brand on purpose. Intuition stands for clarity, trust and openness, so its pages are white with near-black text, unlike the dark interfaces common in crypto infrastructure, which can suggest mystery and secrecy.

This skill is the source of truth for the brand. The brand page, https://learn.intuition.box/brand, shows it and serves its files.

## Quick reference

| | |
|---|---|
| Logo | The logo mark: a circle and a triangle over a square and a hexagon, defined by its construction. One color: Midnight on light; on very dark or pitch black only, the reversed mark, white, optically corrected for the irradiation illusion (every edge 1 unit in). The mark never under 16px tall. |
| Clear space | The square's height on every side of the mark: 100 units of the mark's 214, about 47% of its height. |
| Primary | Midnight `#16161e`, the same color as Graphite 900. Text, the logo, primary buttons, dark surfaces. |
| Secondary | Teal `#00c9d1`. Download and brand actions. Set Midnight on it, never white. |
| Accent | Gold `#eabf13`. The rare highlight. Set Midnight on it, never white. |
| Interface | Graphite, 12 steps from white `#ffffff` to near black `#07070c`. |
| Protocol | Subject `#7a86ff`, predicate `#2fe08b`, object `#ff4f5e`, bridge object `#ff5fd2`; against `#ff912e`, for `#28aaf5`. Shapes only, never text. |
| Usage | 70% white, 20% Midnight, 7% Teal, 3% Gold. |
| Type | Instrument Sans 500 for titles, Inter for text, Ioskeley Mono for code and labels. |
| Corners | Three tiers by the kind of box: 6px for chips and badges, 10px for controls and overlays, 14px for blocks; 12, 16 and 20px as squircles where the browser draws them. Pills stay round. |
| Case | Sentence case for every title and heading. Capitals only for short tags. |

## How to apply the brand

1. **Start from white.** Use Graphite 0 for the page and Midnight for the words and primary buttons. Add Teal for download and brand actions and Gold, rarely, for one highlight. Use a dark surface (Midnight or Graphite 950) only on purpose, such as a night field or a banner.
2. **Place the logo** from [reference/logo.md](reference/logo.md): draw it by its construction rules, or use the official files, which are drawn from them. Keep its clear space and its one color.
3. **Set the type** on the scale in [reference/typography.md](reference/typography.md). Do not invent sizes between its steps.
4. **Round the corners** by the kind of box, on the three tiers in [reference/interface.md](reference/interface.md).
5. **Check every color pair** against [reference/color.md](reference/color.md). If a pair is not in its contrast tables, compute it before using it.
6. **Draw the protocol** with the shape grammar in [reference/shapes.md](reference/shapes.md), the triples in [reference/triples.md](reference/triples.md) and the bonds in [reference/bonds.md](reference/bonds.md) whenever atoms, triples, claims or stakes appear.
7. **Write in the brand's words**, from the glossary below.
8. **Review the work** against the checklist below before handing it over.

For code, [tokens/tokens.json](tokens/tokens.json) holds every color, typeface and size in the W3C Design Tokens format, and [tokens/tokens.css](tokens/tokens.css) holds the same values as CSS custom properties. Every file the brand page serves is listed in [reference/assets.md](reference/assets.md).

## Checklist

Copy it into your work and tick it off:

```
Intuition brand checklist
- [ ] Light by default: white page, Midnight text
- [ ] Logo drawn by its construction, or an official file unaltered
- [ ] Logo in one color: Midnight on light, the reversed mark only on very dark or pitch black
- [ ] Logo clear space kept; the mark itself 16px tall or more
- [ ] Colors only from reference/color.md, in the 70 / 20 / 7 / 3 balance
- [ ] Text pairs at 4.5:1 or more; shapes that carry meaning at 3:1 or more
- [ ] No protocol color sets text; no white text on Teal or Gold
- [ ] Instrument Sans titles, Inter text, Ioskeley Mono code, on the type scale
- [ ] Titles larger than any text, in sentence case, never in capitals
- [ ] Corners on the three tiers of reference/interface.md, by the kind of box; pills round
- [ ] Atoms in their shapes; every predicate's triangle points up
- [ ] Bonds as reference/bonds.md draws them, only between atoms of one claim
- [ ] "Bridge object" written in full; US spelling ("color", "centered")
```

## Rules that are never broken

- The logo is one color: Midnight on light, white on dark. Never a protocol color, Teal or Gold, never a gradient, never two colors at once.
- The reversed mark goes only on a very dark or pitch-black ground: Midnight (Graphite 900) `#16161e`, Graphite 950 `#07070c` or black `#000000`, or a picture as dark under the whole mark and its clear space. Never on anything lighter.
- Never move, scale, recolor or rotate one shape of the logo on its own, and never swap its columns: the human (circle over square) stands left, the agent (triangle over hexagon) right.
- Never set text in a protocol color. They are meanings in the graph, and the predicate's green reads at 1.7:1 on white.
- Never set white text on Teal (2.0:1) or Gold (1.7:1). Set Midnight on them (8.8:1 and 10.2:1).
- Never give a shape another role, or a role another shape.
- Never turn the predicate's triangle: it always points up.
- Never set a title or a heading in capitals.

## Glossary

| Term | Meaning, and how to write it |
|---|---|
| Atom | Anything with an identity: a person, an organization, a relationship. |
| Subject | The atom a claim is about. Drawn as a circle. |
| Predicate | The relationship a claim states. Drawn as a triangle, its point up: it never turns. |
| Object | What the subject is related to. Drawn as a square. |
| Bridge object | An object that is also a subject, joining two claims. Drawn as a hexagon. Always "bridge object" in words, never "bridge", whatever the code calls it. |
| Triple, claim | Three atoms joined: subject, predicate, object. "Claim" in copy for readers, "triple" in technical writing. |
| Stake | A position on a claim, for or against. |
| Protocol colors | The four atom colors and the two stake colors. They mean something in the graph. |
| Logo mark, mark | The four atom shapes two by two: the brand's logo. |
| Intuition logo | The older ring of five arcs. Always named in full, never just "logo". |

When copy names who Intuition is for, name both, as in "people and agents": the brand is for both.

## Reference files

- [reference/logo.md](reference/logo.md): the mark's meaning, its construction, clear space, minimum size, color, placement, misuse, and how to draw its diagrams.
- [reference/color.md](reference/color.md): every color with HEX, RGB and OKLCH, its job, the interface's colors, the usage balance and the contrast tables.
- [reference/typography.md](reference/typography.md): the three typefaces, the type scale, and how to set text.
- [reference/interface.md](reference/interface.md): the interface's corners: three tiers by the kind of box, squircles, and nesting.
- [reference/shapes.md](reference/shapes.md): the atom shapes exactly as the film builds them, with [scripts/atom.mjs](scripts/atom.mjs), and the imagery built from them.
- [reference/bonds.md](reference/bonds.md): the bonds that join atoms, the brand's signature, exactly as the film draws them, on light and on dark; with [bonds-anatomy.md](reference/bonds-anatomy.md), [bonds-layout.md](reference/bonds-layout.md), [bonds-motion.md](reference/bonds-motion.md) and [scripts/bond.mjs](scripts/bond.mjs).
- [reference/triples.md](reference/triples.md): where a triple's atoms stand: on one line, their names, frames for nested triples.
- [reference/assets.md](reference/assets.md): every downloadable file, with its address, size and use.
- [tokens/tokens.json](tokens/tokens.json), [tokens/tokens.css](tokens/tokens.css): the design tokens.

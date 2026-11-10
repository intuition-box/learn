# Interface

The interface's colors, its buttons and its focus ring are in [color.md](color.md). This file holds its corners, the same as the documentation site's (`@waveso/docs`) and Wave UI's.

## Contents

- Corners
- Squircles
- Nesting
- In CSS

## Corners

Three sizes, chosen by the kind of box, never by how big it is.

| Tier | Radius | Where squircles draw | For |
|---|---|---|---|
| Small | 6px | 12px | Chips, badges and tags; the focus ring of an inline link; the items inside a menu |
| Base | 10px | 16px | Controls and overlays: buttons, inputs, selects, menus, popovers, a card that floats over the page |
| Large | 14px | 20px | Blocks in the page: panels, cards, images, video, code blocks, tables, the film's canvas |
| Full | 9999px | Round | Pills and dots: a progress track, a usage bar, a round button, a status dot |

The three are one base and a 4px step: small is the base less 4px, large the base plus 4px.

- Never a radius between the tiers or past them: no 4px, 8px or 24px.
- A large button is still a control, at the base tier; a small card is still a block, at the large tier.
- A frame that is itself a measure, such as the logo's clear space, keeps square corners: its edge is the measure.

## Squircles

Every corner is a squircle, a continuous superellipse rather than a circular arc, where the browser draws one (CSS `corner-shape: squircle`, Chrome today), and an ordinary rounded corner everywhere else. It is an enhancement, never a dependency.

A squircle reads tighter than an arc at the same radius, so where one draws, the base grows from 10px to 16px and the tiers follow it, 4px apart: 12, 16 and 20px.

Pills and dots stay round (`corner-shape: round`): a squircled pill has flattened ends, and a squircled dot is a rounded square.

## Nesting

A box inside another, with padding between them, takes the outer radius less that padding, so the two corners share one center and curve alike. A menu at the base tier with 4px of padding holds its items at the small tier: 10 less 4 is 6px, and 16 less 4 is 12px where squircles draw.

## In CSS

The same rules as [tokens.css](../tokens/tokens.css):

```css
:root {
  --intuition-radius-base: 0.625rem; /* 10px */
  --intuition-radius-step: 0.25rem; /* 4px */
  --intuition-radius-sm: calc(var(--intuition-radius-base) - var(--intuition-radius-step));
  --intuition-radius-md: var(--intuition-radius-base);
  --intuition-radius-lg: calc(var(--intuition-radius-base) + var(--intuition-radius-step));
}

/* A squircle reads tighter than an arc: where one draws, the base grows. */
@supports (corner-shape: squircle) {
  :root {
    --intuition-radius-base: 1rem; /* 16px */
  }
}

/* `*` reaches no pseudo-element, so they are named. */
*,
::before,
::after,
::file-selector-button {
  corner-shape: squircle;
}

.intuition-pill {
  border-radius: 9999px;
  corner-shape: round;
}
```

Only the base changes where squircles draw; the tiers are calculated from it, so they follow. In Tailwind, point `--radius-sm`, `--radius-md` and `--radius-lg` at the three tiers and clear the rest (`--radius-*: initial`), so no fourth radius creeps in; `rounded-full` is not a token and stays, set round.

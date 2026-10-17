# Intuition Learn

The entry point to Intuition for builders: a welcome, a hands-on
introduction, and the technical documentation.

## Why

Most people meet a protocol through its reference documentation, before
they know why it exists or what it makes possible. Intuition Learn answers
three questions, in order, and lets each reader stop at the one that
answers theirs:

| Step                    | Question                    | Path    |
| ----------------------- | --------------------------- | ------- |
| Welcome (the wow)       | Why does this matter?       | `/`     |
| Playground (the aha)    | What can I build with it?   | `/play` |
| Documentation (the how) | How do I integrate with it? | `/docs` |

It is written for three audiences: investors, builders, and teams
integrating Intuition into their products. An investor may need only the
first step; an engineer integrating the protocol needs all three, and
returns straight to the documentation after the first visit.

## The three steps

### 1. Welcome

A video of a minute or less on where data technology is heading: beyond
attention markets, toward data that is portable, verifiable, and
composable. It gives investors, builders, and the community a reason to
care, then one way forward, to the playground.

### 2. Playground

A short film, played on a 3D graph the reader can turn, pause, and scrub,
that explains Intuition's data model before anyone opens a terminal. Its
six chapters build on one another, following one story about Elon Musk,
SpaceX, and a claim he made:

| Chapter        | What it shows                                                                 |
| -------------- | ----------------------------------------------------------------------------- |
| Atoms          | Anything can be an atom: a person, an organization, a relationship.           |
| Triples        | Three atoms connected form a claim; linked claims form a graph.               |
| Nested triples | A whole triple can be the subject or the object of another.                   |
| Vaults         | Every triple has a vault for it and one against it; positions give it weight. |
| Lists          | Triples that share a predicate and an object form a list, ranked by weight.   |
| Perspectives   | The same atoms, seen differently depending on whose triples you trust.        |

Three ideas from the original brief are not covered yet, and are candidates
for the next chapters:

- **Permissionless infrastructure.** Anyone can run a backend on the
  network, with no gatekeeper.
- **Data ownership.** Data stays local until its owner chooses to publish
  it.
- **Composable value.** Others build on published data, adding utility and
  value that flows back to its contributors.

### 3. Documentation

The technical documentation for Intuition Core and the v2 protocol
packages. The way software is built is changing, and agents are now part of
how developers work, so every page is written for people and for AI agents
alike: readable on its own, shareable in a message, and available as
Markdown through `llms.txt`, `llms-full.txt`, and each page's "Copy page"
button. Agent skills give an assistant accurate protocol knowledge.

## Returning visitors

The introduction never stands in the way. The site remembers the last
choice a visitor made, in their browser's `localStorage`, and opens there
next time:

| Choice                        | The next visit opens on |
| ----------------------------- | ----------------------- |
| "Try it", on the welcome page | The playground          |
| "Skip to docs", from any step | The documentation       |
| Playing the film to its end   | The documentation       |

A small script runs before the welcome page paints, so a returning visitor
never sees it flash by. With storage off, in a private window for example,
the site opens on the welcome page, as for a first visit.

## Visual direction

Intuition is about clarity, trust, and openness, and the site reflects
that: a light theme, white pages with a near-black graphite accent, rather
than the dark interfaces common to crypto infrastructure. A field of atoms,
drawn in their roles' shapes and colors, runs behind every page and carries
across each change of route, and the documentation's header shows the same
universe. The palette and tokens live in `src/app/globals.css`.

## Development

Requires Node 26 (see `.nvmrc`) and pnpm 11.

```bash
pnpm install
```

```bash
pnpm dev
```

| Script           | What it does                                       |
| ---------------- | -------------------------------------------------- |
| `pnpm dev`       | Runs the site locally.                             |
| `pnpm build`     | Exports the site as static files to `out/`.        |
| `pnpm test`      | Runs the unit tests (Vitest).                      |
| `pnpm typecheck` | Checks types (TypeScript, strict).                 |
| `pnpm lint`      | Lints, type-aware (oxlint).                        |
| `pnpm format`    | Formats the code (oxfmt); `format:check` verifies. |

## Project structure

```text
content/docs/                 The documentation, in Markdown; meta.json sets the order.
src/app/                      Routes: the welcome page, /play, /docs, llms.txt, the sitemap.
src/components/onboarding/    The field of atoms, the journey between pages, returning visitors.
src/components/playground/    The film: its story, the 2D plane, the 3D scene, the timeline.
src/lib/                      The site's URL, the documentation route, sphere math, icons.
```

The documentation is rendered by
[`@waveso/docs`](https://www.npmjs.com/package/@waveso/docs), which also
provides the site's base styles and typefaces.

## Deployment

`pnpm build` writes a static site to `out/`, deployable to any static host.
No page needs a server: the playground runs entirely in the browser.

## Related

- **Explorer** (`../explorer`): a separate Vite app for experiments kept out
  of this one, such as the graph cloud and the liquid glass card.

/**
 * Intuition's brand, as the brand page at `/brand` shows it and its files
 * route serves it. The colors are the code's own: Graphite as
 * `globals.css` declares it, the atoms and vaults from the film's
 * constants. A test holds each one to its source.
 */

import { defineBrand } from '@/components/brand/brand-config';
import { rgbToHex } from '@/components/brand/color';
import { FILE_DOWNLOAD_ICON, VAULT_COLORS } from '@/lib/icons';

import {
  atomIcon,
  GRAPHITE,
  intuitionUniverseDesktop,
  intuitionUniversePhone,
  intuitionUniverseSocial,
  universeDesktop,
  universeSocial,
  universeLightDesktop,
  universeLightPhone,
  universePhone,
  markAsset,
  markClearSpaceDiagram,
  markConstructionDiagram,
  markReversedOverlayDiagram,
  ROLE_HEX,
  xAvatar,
} from './learn-artwork';

/** A Graphite step's swatch. */
const graphite = <const Step extends keyof typeof GRAPHITE>(step: Step) => ({
  id: `graphite-${step}` as const,
  name: `Graphite ${step}`,
  value: GRAPHITE[step],
});

/** The four atoms on a background, each shown as its own shape and held to 3:1. */
const atomPairs = <const Background extends string>(background: Background) =>
  (
    [
      ['Subject', 'subject', 'identity'],
      ['Predicate', 'predicate', 'predicate'],
      ['Object', 'object', 'object'],
      ['Bridge object', 'bridge-object', 'bridge'],
    ] as const
  ).map(([name, foreground, role]) => ({
    name,
    foreground,
    background,
    use: 'shapes' as const,
    shape: atomIcon(role),
  }));

export const LEARN_BRAND = defineBrand({
  slug: 'intuition',
  name: 'Intuition',
  title: 'Brand',
  lead: [
    [
      {
        text: 'The Nobel Prize in Physics',
        href: 'https://www.nobelprize.org/prizes/physics/2022/popular-information/',
      },
      ' recognized experiments showing that the universe is not locally real: a particle holds no definite state until it is measured, and entangled particles stay linked across any distance, even from opposite ends of the universe.',
    ],
    'Our brand starts from that idea. What is recorded becomes observable, and what is observed becomes real. The protocol is the universe, its atoms are the photons, and the graphs that people and agents build on it are the realities.',
    'Agents work with the brand too. Download our brand skill, and an agent uses the logo, the colors, the shapes and more, the way this page does.',
  ],

  // The download buttons in the secondary, Teal, the file with the arrow before each.
  downloads: { color: 'teal', icon: FILE_DOWNLOAD_ICON },

  // The hand-written skill in `skills/intuition-brand-skill/`, zipped by its own route.
  skill: { fileName: 'intuition-brand-skill.zip' },

  logo: {
    lead: [
      "The logo celebrates humans and agents together: Intuition's statement that the two complement each other instead of competing. It's built from Intuition's four atom shapes: a subject, a predicate, an object and a bridge object, the pieces the protocol builds knowledge from.",
    ],
    points: [
      {
        term: "Two i's.",
        text: 'Each column is a letter i, the first letter of Intuition.',
      },
      {
        term: 'The left i is the human.',
        text: 'The circle sits on the square. Round and soft.',
      },
      {
        term: 'The right i is the agent.',
        text: 'The triangle sits on the hexagon. Pointed and engineered.',
      },
      {
        term: 'Heads and bodies.',
        text: 'The subject and predicate are the heads; the objects are the bodies.',
      },
      {
        term: 'Made of the protocol.',
        text: "The logo isn't a symbol added to Intuition; it is Intuition.",
      },
    ],
    drawing:
      'Optically corrected so neither stands over the other. Each shape is sized and rounded by hand, with its own corner radius, so all four weigh the same to the eye. The columns sit three times as far apart as the rows, cell to cell: close enough to stand together like two friends, far enough apart to read as two letters, two beings. Intuition is for both, made of the same atoms.',
    assets: [
      {
        slug: 'mark',
        name: 'Logo mark',
        alt: 'The logo mark in Graphite 900: a circle and a triangle over a square and a hexagon.',
        preset: 'logo-square',
        backdrop: 'graphite-0',
        minHeight: 16,
        ...markAsset('logo-square', 'light'),
      },
      {
        slug: 'mark-reversed',
        name: 'Logo mark, reversed',
        alt: 'The logo mark in white: a circle and a triangle over a square and a hexagon.',
        note: [
          'Optically corrected for the ',
          {
            text: 'irradiation illusion',
            href: 'https://en.wikipedia.org/wiki/Irradiation_illusion',
          },
        ],
        preset: 'logo-square',
        backdrop: 'primary',
        minHeight: 16,
        ...markAsset('logo-square', 'dark'),
      },
    ],
    construction: {
      name: 'Construction',
      rule: ['Four cells of 100 · the shapes overshoot them'],
      alt: 'The logo mark over its grid: four cells of 100, the rows 10 apart (x), the columns 30 apart (y). The circle and hexagon are centred in their cells, the triangle stands on its cell, and the circle, triangle and hexagon reach past their cells. The corners are rounded 5 on the triangle, 6 on the square and 8 on the hexagon.',
      diagram: markConstructionDiagram(),
    },
    clearSpace: {
      name: 'Clear space',
      rule: ["Square's height on every side"],
      alt: "The logo mark in its clear space: the square's height on every side of its outermost edges, a faint square in each corner.",
      diagram: markClearSpaceDiagram(),
    },
    reversedOverlay: {
      name: 'Logo versions overlaid',
      rule: [
        'The reversed mark over the default in red. Use the reversed mark on very dark or pitch black backgrounds only.',
      ],
      alt: "On Midnight, the reversed mark in white laid over the logo mark in red: a red rim 1 unit wide shows round every edge of every shape. Beside them a loupe magnifies the square's top right corner 8 times, the rim labelled inset = 1. When the drawing comes into view, the reversed mark drifts off the red one and settles back on it, again and again.",
      diagram: markReversedOverlayDiagram(),
    },
  },

  colors: {
    lead: [
      'Intuition is about clarity, trust and openness, and we show it with a light theme: white pages and near-black text, instead of the dark interfaces common in crypto infrastructure, which can suggest mystery and secrecy.',
    ],
    groups: [
      {
        name: 'Primary',
        heading: 'Brand',
        lead: "Midnight is a very dark, deep blue, like a moonlit night sky: nearly black in dim light, a cool, slightly violet blue in bright light. Teal brings the calm and stability of blue together with the renewal and growth of green: balance, clarity and quiet confidence. Gold is the sun's energy: warmth, optimism and understanding.",
        colors: [
          {
            id: 'primary',
            name: 'Midnight',
            value: GRAPHITE[900],
            alias: 'Graphite 900',
          },
        ],
      },
      // Teal and gold are new to the brand, each made the film's
      // way: as light and as strong as its role and stake colors, at a hue
      // none of them takes, so none reads as a meaning. Gold sits in the
      // widest gap, between the against orange and the predicate green.
      {
        name: 'Secondary',
        colors: [{ id: 'teal', name: 'Teal', value: '#00c9d1' }],
      },
      {
        name: 'Accent',
        colors: [{ id: 'gold', name: 'Gold', value: '#eabf13' }],
      },
      {
        name: 'Atoms',
        heading: 'Protocol',
        lead: "The protocol's colors are meanings in the graph, an atom's role or a stake's side: they fill shapes, and never set text.",
        colors: [
          {
            id: 'subject',
            name: 'Subject (circle)',
            value: ROLE_HEX.identity,
          },
          {
            id: 'predicate',
            name: 'Predicate (triangle)',
            value: ROLE_HEX.predicate,
          },
          {
            id: 'object',
            name: 'Object (square)',
            value: ROLE_HEX.object,
          },
          {
            id: 'bridge-object',
            name: 'Bridge object (hexagon)',
            value: ROLE_HEX.bridge,
          },
        ],
      },
      {
        name: 'Stakes',
        colors: [
          {
            id: 'against',
            name: 'Against',
            value: rgbToHex(VAULT_COLORS.against),
          },
          {
            id: 'for',
            name: 'For',
            value: rgbToHex(VAULT_COLORS.for),
          },
        ],
      },
      {
        name: 'Graphite',
        heading: 'Interface',
        lead: 'Graphite, white to near black with a cool cast: the pages, the text and the lines between them.',
        colors: [
          graphite(0),
          graphite(50),
          graphite(100),
          graphite(200),
          graphite(300),
          graphite(400),
          graphite(500),
          graphite(600),
          graphite(700),
          graphite(800),
          graphite(900),
          graphite(950),
        ],
      },
    ],
    usage: {
      lead: 'How much of the page each color covers: white pages, Midnight for the words and the marks, Teal for the actions, Gold for the rare highlight.',
      shares: [
        { color: 'graphite-0', share: 70 },
        { color: 'primary', share: 20 },
        { color: 'teal', share: 7 },
        { color: 'gold', share: 3 },
      ],
    },
    contrast: [
      {
        name: 'Primary text',
        foreground: 'graphite-900',
        background: 'graphite-0',
      },
      {
        name: 'Muted text',
        foreground: 'graphite-500',
        background: 'graphite-0',
      },
      // The brand's fills, with the primary on them, as the download buttons set it.
      {
        name: 'Primary on secondary',
        foreground: 'primary',
        background: 'teal',
      },
      {
        name: 'Primary on accent',
        foreground: 'primary',
        background: 'gold',
      },
      ...atomPairs('graphite-0'),
      {
        name: 'Primary text',
        foreground: 'graphite-0',
        background: 'graphite-900',
      },
      {
        name: 'Muted text',
        foreground: 'graphite-300',
        background: 'graphite-900',
      },
      // The brand's colors on its dark primary, as text or a mark on it.
      {
        name: 'Secondary on primary',
        foreground: 'teal',
        background: 'primary',
      },
      {
        name: 'Accent on primary',
        foreground: 'gold',
        background: 'primary',
      },
      ...atomPairs('graphite-950'),
    ],
  },

  typography: {
    lead: [
      'Three typefaces, all open source: Instrument Sans for titles, Inter for every other word, and Ioskeley Mono for code.',
    ],
    faces: [
      {
        name: 'Instrument Sans',
        role: 'Titles',
        className: 'font-(family-name:--font-instrument-sans)',
        stack: 'Instrument Sans, then the system face',
        weights: [500],
      },
      {
        name: 'Inter',
        role: 'Text',
        className: 'font-sans',
        stack: 'Inter, then the system face',
        weights: [400, 500, 600],
      },
      {
        name: 'Ioskeley Mono',
        role: 'Code',
        className: 'font-mono',
        stack: 'Ioskeley Mono, then the system monospace',
        weights: [400],
      },
    ],
    // Eight sizes: titles sm to xl, all above the text, xs to lg. Label,
    // Kicker and Code are styles on those sizes, not sizes of their own. A
    // kicker is an eyebrow over a title, so it is a title: no capitals. Only
    // Label, a tag, is set in capitals.
    scale: [
      {
        name: 'Title xl',
        className:
          'font-(family-name:--font-instrument-sans) text-4xl font-medium tracking-tight',
        sample: 'Your data, made multiplayer.',
      },
      {
        name: 'Title lg',
        className:
          'font-(family-name:--font-instrument-sans) text-3xl font-medium tracking-tight',
        sample: 'Every claim has two sides.',
      },
      {
        name: 'Title md',
        className:
          'font-(family-name:--font-instrument-sans) text-2xl font-medium tracking-tight',
        sample: 'Three atoms make a claim.',
      },
      {
        name: 'Title sm',
        className:
          'font-(family-name:--font-instrument-sans) text-xl font-medium',
        sample: 'Linked claims form a graph.',
      },
      {
        name: 'Text lg',
        className: 'text-lg',
        sample:
          'Three atoms connected form a claim; linked claims form a graph.',
      },
      {
        name: 'Text md',
        className: 'text-base',
        sample:
          'Anything can be an atom: a person, an organization, a relationship.',
      },
      {
        name: 'Text sm',
        className: 'text-sm',
        sample: 'Build a knowledge graph and others build on it with you.',
      },
      {
        name: 'Text xs',
        className: 'text-xs',
        sample: 'Staked 2 hours ago · 12 positions',
      },
      {
        name: 'Label',
        className:
          'font-mono text-xs tracking-[0.18em] indent-[0.18em] uppercase',
        sample: 'Subject · Predicate · Object',
      },
      {
        name: 'Kicker',
        className: 'text-xs font-medium',
        sample: 'The protocol',
      },
      {
        name: 'Code',
        className: 'font-mono text-sm',
        sample: "import { calculateAtomId } from '@0xintuition/ids';",
      },
    ],
  },

  backgrounds: {
    lead: [
      'Pictures of Intuition, each a kit: one picture in every size a place asks for. For socials, desktops and phones.',
    ],
    kits: [
      {
        name: 'Universe',
        lead: [
          "Intuition's atoms scattered across Midnight, the letters of Intuition among them, each turned its own way.",
        ],
        assets: [
          {
            slug: 'universe-midnight-desktop',
            name: 'Universe Midnight, desktop',
            alt: 'Small atoms in their role colors scattered on Midnight, thickest down the left and the right, and here and there a letter of Intuition in white, each turned its own way.',
            preset: 'desktop',
            svg: universeDesktop(),
          },
          {
            slug: 'universe-midnight-phone',
            name: 'Universe Midnight, phone',
            alt: 'Small atoms in their role colors scattered on Midnight, thickest at the top and the bottom, and here and there a letter of Intuition in white, each turned its own way.',
            preset: 'phone',
            svg: universePhone(),
          },
          {
            slug: 'universe-midnight-link-preview',
            name: 'Universe Midnight, link preview',
            alt: 'Small atoms in their role colors scattered on Midnight, and here and there a letter of Intuition in white, each turned its own way.',
            preset: 'og-image',
            svg: universeSocial('og-image', 'dark'),
          },
          {
            slug: 'universe-midnight-x-banner',
            name: 'Universe Midnight, X banner',
            alt: 'Small atoms in their role colors scattered on Midnight, clear at the bottom left for the avatar, and here and there a letter of Intuition in white, each turned its own way.',
            preset: 'x-banner',
            svg: universeSocial('x-banner', 'dark'),
          },
          {
            slug: 'universe-midnight-linkedin-banner',
            name: 'Universe Midnight, LinkedIn banner',
            alt: 'Small atoms in their role colors scattered on Midnight, clear at the bottom left for the photo, and here and there a letter of Intuition in white, each turned its own way.',
            preset: 'linkedin-banner',
            svg: universeSocial('linkedin-banner', 'dark'),
          },
          {
            slug: 'universe-midnight-discord-banner',
            name: 'Universe Midnight, Discord banner',
            alt: 'Small atoms in their role colors scattered on Midnight, and here and there a letter of Intuition in white, each turned its own way.',
            preset: 'discord-banner',
            svg: universeSocial('discord-banner', 'dark'),
          },
          {
            slug: 'universe-light-desktop',
            name: 'Universe light, desktop',
            alt: 'Small atoms in their role colors scattered on white, thickest down the left and the right, and here and there a letter of Intuition in Midnight, each turned its own way.',
            preset: 'desktop',
            svg: universeLightDesktop(),
          },
          {
            slug: 'universe-light-phone',
            name: 'Universe light, phone',
            alt: 'Small atoms in their role colors scattered on white, thickest at the top and the bottom, and here and there a letter of Intuition in Midnight, each turned its own way.',
            preset: 'phone',
            svg: universeLightPhone(),
          },
          {
            slug: 'universe-light-link-preview',
            name: 'Universe light, link preview',
            alt: 'Small atoms in their role colors scattered on white, and here and there a letter of Intuition in Midnight, each turned its own way.',
            preset: 'og-image',
            svg: universeSocial('og-image', 'light'),
          },
          {
            slug: 'universe-light-x-banner',
            name: 'Universe light, X banner',
            alt: 'Small atoms in their role colors scattered on white, clear at the bottom left for the avatar, and here and there a letter of Intuition in Midnight, each turned its own way.',
            preset: 'x-banner',
            svg: universeSocial('x-banner', 'light'),
          },
          {
            slug: 'universe-light-linkedin-banner',
            name: 'Universe light, LinkedIn banner',
            alt: 'Small atoms in their role colors scattered on white, clear at the bottom left for the photo, and here and there a letter of Intuition in Midnight, each turned its own way.',
            preset: 'linkedin-banner',
            svg: universeSocial('linkedin-banner', 'light'),
          },
          {
            slug: 'universe-light-discord-banner',
            name: 'Universe light, Discord banner',
            alt: 'Small atoms in their role colors scattered on white, and here and there a letter of Intuition in Midnight, each turned its own way.',
            preset: 'discord-banner',
            svg: universeSocial('discord-banner', 'light'),
          },
        ],
      },
      {
        name: 'Intuition Universe',
        lead: [
          "Intuition's atoms as a universe, as the homepage opens: they form the Intuition logo.",
        ],
        assets: [
          {
            slug: 'logo-universe-desktop',
            name: 'Intuition Universe, desktop',
            alt: "The Intuition Universe: small atoms in their role colors, circles, triangles, squares and hexagons, forming the Intuition logo's ring on white, a few more scattered round it.",
            preset: 'desktop',
            svg: intuitionUniverseDesktop(),
          },
          {
            slug: 'logo-universe-phone',
            name: 'Intuition Universe, phone',
            alt: "The Intuition Universe on a phone: small atoms in their role colors, circles, triangles, squares and hexagons, forming the Intuition logo's ring on white, a few more scattered round it.",
            preset: 'phone',
            svg: intuitionUniversePhone(),
          },
          {
            slug: 'logo-universe-link-preview',
            name: 'Intuition Universe, link preview',
            alt: "The Intuition Universe: small atoms in their role colors, circles, triangles, squares and hexagons, forming the Intuition logo's ring on white, a few more scattered round it.",
            preset: 'og-image',
            svg: intuitionUniverseSocial('og-image'),
          },
          {
            slug: 'logo-universe-x-banner',
            name: 'Intuition Universe, X banner',
            alt: "The Intuition Universe: small atoms in their role colors, circles, triangles, squares and hexagons, forming the Intuition logo's ring on white, a few more scattered round it, clear at the bottom left for the avatar.",
            preset: 'x-banner',
            svg: intuitionUniverseSocial('x-banner'),
          },
          {
            slug: 'logo-universe-linkedin-banner',
            name: 'Intuition Universe, LinkedIn banner',
            alt: "The Intuition Universe: small atoms in their role colors, circles, triangles, squares and hexagons, forming the Intuition logo's ring on white, a few more scattered round it, clear at the bottom left for the photo.",
            preset: 'linkedin-banner',
            svg: intuitionUniverseSocial('linkedin-banner'),
          },
          {
            slug: 'logo-universe-discord-banner',
            name: 'Intuition Universe, Discord banner',
            alt: "The Intuition Universe: small atoms in their role colors, circles, triangles, squares and hexagons, forming the Intuition logo's ring on white, a few more scattered round it.",
            preset: 'discord-banner',
            svg: intuitionUniverseSocial('discord-banner'),
          },
        ],
      },
    ],
  },

  social: {
    lead: [
      'Made to the size each place asks for, with room left where it lays its own picture over them.',
    ],
    assets: [
      {
        slug: 'x-avatar',
        name: 'X avatar',
        alt: 'The logo mark in Graphite 900, two by two, centred on white.',
        preset: 'x-avatar',
        svg: xAvatar(),
      },
    ],
  },

  rules: {
    lead: [
      'The shapes are the grammar: each one is a role, and its bonds are its claims.',
    ],
    dos: [
      'Draw a subject as a circle, the organic shape.',
      'Draw a predicate as a triangle, always pointing up.',
      'Draw an object as a square, all hard edges.',
      'Draw a bridge object, an object that is also a subject, as a hexagon: two directions merging.',
      "Join a triple's atoms with bonds: subject to predicate, predicate to object.",
      'Set titles and headings in sentence case.',
    ],
    donts: [
      'Give a shape another role, or a role another shape.',
      "Turn a predicate's triangle: it points up, always.",
      'Bond atoms that share no triple: bonds are claims, few and clear, never a web.',
      "Shorten a hexagon's name in captions: in words it is a bridge object, whatever the code calls it.",
      'Set a title or a heading in capitals.',
      "Set text in a role color: they are for shapes, and the predicate's green reads at 1.7:1 on white.",
    ],
  },
});

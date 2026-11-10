/**
 * A brand, as data: everything its brand page shows, in one typed object.
 * `BrandPage` renders it, `brandIssues` checks it, and the files route
 * serves its pictures. A section is on the page only when its key is here.
 *
 * Color ids are a type parameter, inferred from the colors themselves, so
 * a contrast pair or a backdrop naming a color that does not exist fails to
 * compile rather than rendering nothing.
 */

import type { PresetId } from './asset-presets';

/** A rectangle, in a canvas's pixels from its top left. */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** A link inside a paragraph: its words, and where they go. */
export interface InlineLink {
  text: string;
  /** An absolute https address. */
  href: string;
}

/** A paragraph: plain words, or words and links, in order. */
export type Paragraph = string | readonly (string | InlineLink)[];

/** A paragraph's words, its links' words included: what a reader reads. */
export function paragraphText(paragraph: Paragraph): string {
  return typeof paragraph === 'string'
    ? paragraph
    : paragraph
        .map((part) => (typeof part === 'string' ? part : part.text))
        .join('');
}

interface SectionCopy {
  /** The paragraphs under the section's heading, in order. */
  lead?: readonly Paragraph[];
}

export interface BrandConfig<Id extends string = string> {
  /** Kebab-case; the first word of every file name: 'intuition'. */
  slug: string;
  /** 'Intuition'. */
  name: string;
  /** The page's h1, in sentence case: 'Brand'. */
  title: string;
  /** The paragraphs under the h1, in order. */
  lead: readonly Paragraph[];
  logo?: LogoSection<Id>;
  colors?: ColorSection<Id>;
  typography?: TypographySection;
  backgrounds?: KitSection<Id>;
  social?: AssetSection<Id>;
  rules?: RulesSection;
  /** The download buttons' fill and icon; outlined, with no icon, when unset. */
  downloads?: DownloadButtons<Id>;
  /**
   * The brand's agent skill, an archive served with the brand's files: the
   * button under the page's description downloads it. No button when unset.
   */
  skill?: { fileName: string };
}

/** An icon on a square of `size` units: its shapes, in order, each filled at its opacity. */
export interface BrandIcon {
  size: number;
  paths: readonly { d: string; opacity: number }[];
}

/** How the download buttons look: filled in a brand color, an icon before each format. */
export interface DownloadButtons<Id extends string = string> {
  /** The fill, by id. The label is dark or white on it, whichever reads. */
  color: NoInfer<Id>;
  icon: BrandIcon;
}

/** A picture to download, as SVG and as a PNG at its preset's size. */
export interface BrandAsset<Id extends string = string> {
  /** Kebab-case, and unique across the whole brand: it names the files. */
  slug: string;
  /** The caption, in sentence case. */
  name: string;
  /** What the picture shows, for someone who cannot see it. */
  alt: string;
  /**
   * The caption's second line, in place of the file's kind and size: for a
   * file that needs a word on how it is drawn.
   */
  note?: Paragraph;
  preset: PresetId;
  /** A whole SVG document, as big as its preset, with no `<text>`. */
  svg: string;
  /** The color behind the preview when the file is transparent. */
  backdrop?: NoInfer<Id>;
}

export interface LogoAsset<Id extends string = string> extends BrandAsset<Id> {
  /** The lockup's frame on the canvas, in the preset's pixels. */
  lockup: Rect;
  /** The room its rule asks for on every side, in the preset's pixels: it fits on the canvas. */
  clearSpace: number;
  /** The smallest it may be set, in CSS pixels tall, printed in its caption. */
  minHeight?: number;
}

/** One way the logo reads: a short term, then what it means. */
export interface LogoPoint {
  /** A few words, set forward: 'Two i's'. */
  term: string;
  text: string;
}

/** A straight line, from one point to another. */
export interface Line {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/** An outline, moved so its own coordinates land at `x`, `y` more. */
export interface PlacedPath {
  d: string;
  x: number;
  y: number;
}

/**
 * A logo's clear space, drawn as a measured diagram rather than taken from
 * a file to download: information, in the logo's own units.
 */
export interface ClearSpaceDiagram {
  /** The logo itself, in its color. */
  logo: readonly PlacedPath[];
  color: `#${string}`;
  /** The clear space: the diagram is exactly this, its edge the frame. */
  boundary: Rect;
  /** The logo's outermost edges, carried out to the clear space's edge, drawn faint. */
  guides: readonly Line[];
  /** The shape that sets the clear space: a faint copy in each corner. */
  unit: readonly PlacedPath[];
}

/**
 * How a logo is built, drawn as a measured diagram: its grid's cells, the
 * logo over them, and the grid's measures, each a dimension line and its
 * label.
 */
export interface ConstructionDiagram {
  /** What the diagram shows: the logo, and room round it for the labels. */
  view: Rect;
  logo: readonly PlacedPath[];
  color: `#${string}`;
  /** The cells, filled faint. */
  cells: readonly Rect[];
  /** The grid's lines: each cell's edges, run from the grid's start to its end. */
  grid: readonly Line[];
  /** Each rounded shape's corner radius, set inside it. */
  radii: readonly { text: string; x: number; y: number }[];
  /** The circles that round the corners, one at each, tangent to both its sides. */
  corners: readonly { cx: number; cy: number; r: number }[];
  /**
   * The grid's measures, each a dimension line and its label: the span it
   * measures, `from` and `to` along its line, and the grid's outer line it
   * stands off, on its side. The page sets the line 10px clear of that frame
   * line and the label 10px clear of the line, at any width.
   */
  measures: readonly {
    text: string;
    from: number;
    to: number;
    edge: number;
    side: 'above' | 'below' | 'left';
  }[];
}

/**
 * The logo's two versions laid one over the other, on dark: the mark in
 * drafting red under the reversed mark in white, so what the reversed mark
 * leaves out shows as a red rim round every edge; beside them, a loupe on
 * one corner, magnified.
 */
export interface ReversedOverlayDiagram {
  /** What the diagram shows: the marks, the loupe, and room round them. */
  view: Rect;
  groundColor: `#${string}`;
  /** The mark, drawn in drafting red. */
  under: readonly PlacedPath[];
  /** The reversed mark's color, over it. */
  color: `#${string}`;
  over: readonly PlacedPath[];
  /** The corner the loupe magnifies, ringed on the marks, and the loupe joined to it. */
  loupe: {
    /** The point magnified, in the marks' units, and the ring round it there. */
    spot: { x: number; y: number; radius: number };
    /** The loupe: its centre and radius, in the view's units. */
    center: { x: number; y: number };
    radius: number;
    zoom: number;
    /** From the ring to the loupe. */
    leader: Line;
    /** The rim's width, labelled in the loupe where the construction labels a measure, without its line. */
    label: {
      text: string;
      from: number;
      to: number;
      edge: number;
      side: 'above' | 'below' | 'left';
    };
  };
}

export interface LogoSection<Id extends string = string> extends SectionCopy {
  /** The primary lockup first. */
  assets: readonly LogoAsset<Id>[];
  /** The description goes on after the lead: how the logo reads, point by point. */
  points?: readonly LogoPoint[];
  /** The description's last paragraph: how the logo is drawn. */
  drawing?: string;
  /** How the logo is built: what the diagram shows, its rule in words, and the diagram. */
  construction?: {
    name: string;
    /** The rule in words, a line each. */
    rule: readonly string[];
    /** What the diagram shows, for someone who cannot see it. */
    alt: string;
    diagram: ConstructionDiagram;
  };
  /** The clear space: what the diagram shows, its rule in words, and the diagram. */
  clearSpace?: {
    name: string;
    /** The rule in words, a line each. */
    rule: readonly string[];
    /** What the diagram shows, for someone who cannot see it. */
    alt: string;
    diagram: ClearSpaceDiagram;
  };
  /** The logo's two versions laid one over the other: what the diagram shows, its rule in words, and the diagram. */
  reversedOverlay?: {
    name: string;
    /** The rule in words, a line each. */
    rule: readonly string[];
    /** What the diagram shows, for someone who cannot see it. */
    alt: string;
    diagram: ReversedOverlayDiagram;
  };
}

export interface BrandColor<Id extends string = string> {
  /** Kebab-case, unique. */
  id: Id;
  /** 'Midnight', 'Bridge object'. */
  name: string;
  /** Lowercase `#rrggbb`. The page prints it as OKLCH too. */
  value: `#${string}`;
  /**
   * The palette step it is, when it is one, set as a badge on its swatch:
   * Midnight is 'Graphite 900'.
   */
  alias?: string;
}

export interface ColorGroup<Id extends string = string> {
  /** The palette's name, set small over its swatches: 'Graphite'. */
  name: string;
  colors: readonly BrandColor<Id>[];
  /**
   * A subsection's heading set before this palette, opening a run of
   * palettes that lasts until the next heading: 'Interface'.
   */
  heading?: string;
  /** With a heading, a paragraph under it, for the run it opens. */
  lead?: string;
}

export interface ContrastPair<Id extends string = string> {
  /** What the pair is for, as a title: 'Text', 'Muted text', 'Subject'. */
  name: string;
  foreground: NoInfer<Id>;
  background: NoInfer<Id>;
  /** Text by default; 'shapes' is held to WCAG 1.4.11's 3:1. */
  use?: 'text' | 'shapes';
  /** The shape a pair for shapes is shown as: its outline, and the view round it. */
  shape?: { d: string; view: Rect };
}

export interface ColorSection<Id extends string = string> extends SectionCopy {
  groups: readonly ColorGroup<Id>[];
  /** How much of each color the brand shows, as one bar. */
  usage?: ColorUsage<Id>;
  contrast?: readonly ContrastPair<Id>[];
}

/** The brand's colors by how much of it each covers: shares of 100, the largest first. */
export interface ColorUsage<Id extends string = string> {
  /** The paragraph under the subsection's heading. */
  lead?: string;
  shares: readonly { color: NoInfer<Id>; share: number }[];
}

export interface Typeface {
  name: string;
  role: string;
  /** A complete Tailwind class, written out in source so Tailwind finds it: 'font-sans'. */
  className: string;
  /** The family list, shown in mono. */
  stack: string;
  weights: readonly number[];
}

export interface TypeStep {
  /** Its name: Title xl to sm, Text lg to xs, Label, Kicker, Code. */
  name: string;
  /**
   * The type classes the app sets this text with, written out in source:
   * size, leading, weight, tracking, never a color.
   */
  className: string;
  sample: string;
}

export interface TypographySection extends SectionCopy {
  faces: readonly Typeface[];
  scale: readonly TypeStep[];
}

export interface AssetSection<Id extends string = string> extends SectionCopy {
  assets: readonly BrandAsset<Id>[];
}

/** One picture as a kit: its name, what it is, and every size of it. */
export interface Kit<Id extends string = string> {
  name: string;
  lead: readonly Paragraph[];
  assets: readonly BrandAsset<Id>[];
}

/** Pictures as kits: each one in every size a place asks for. */
export interface KitSection<Id extends string = string> extends SectionCopy {
  kits: readonly Kit<Id>[];
}

export interface RulesSection extends SectionCopy {
  dos: readonly string[];
  donts: readonly string[];
}

/** Types a brand's config, inferring its color ids from its colors. */
export function defineBrand<const Id extends string>(
  config: BrandConfig<Id>,
): BrandConfig<Id> {
  return config;
}

/** The sections a brand page can have, as their keys in the config. */
export type SectionKey = Exclude<
  keyof BrandConfig,
  'slug' | 'name' | 'title' | 'lead' | 'downloads' | 'skill'
>;

export interface SectionMeta {
  key: SectionKey;
  /** The section's anchor: what the contents link to. */
  id: string;
  title: string;
}

/**
 * The page's sections, in the order they always come in: the one source for
 * the contents and every section's heading, so a link can never point at a
 * heading that says something else.
 */
export const SECTIONS = [
  { key: 'logo', id: 'logo', title: 'Logo' },
  { key: 'colors', id: 'colors', title: 'Colors' },
  { key: 'typography', id: 'typography', title: 'Typography' },
  { key: 'backgrounds', id: 'backgrounds', title: 'Backgrounds' },
  { key: 'social', id: 'social', title: 'Social images' },
  { key: 'rules', id: 'dos-and-donts', title: "Do's and don'ts" },
] as const satisfies readonly SectionMeta[];

/** The sections `config` has, in page order. */
export function presentSections(config: BrandConfig): readonly SectionMeta[] {
  return SECTIONS.filter((section) => config[section.key] !== undefined);
}

/** The sections that hold pictures to download. */
export type AssetSectionKey = 'logo' | 'backgrounds' | 'social';

export interface PlacedAsset<Id extends string = string> {
  section: AssetSectionKey;
  asset: BrandAsset<Id>;
}

/** Every picture of the brand, with its section, in page order. */
export function brandAssets<Id extends string>(
  config: BrandConfig<Id>,
): readonly PlacedAsset<Id>[] {
  const keys: readonly AssetSectionKey[] = ['logo', 'backgrounds', 'social'];
  return keys.flatMap((section) =>
    (section === 'backgrounds'
      ? (config.backgrounds?.kits ?? []).flatMap(({ assets }) => assets)
      : (config[section]?.assets ?? [])
    ).map((asset) => ({ section, asset })),
  );
}

/** The color with `id`, if the brand has one. */
export function findColor<Id extends string>(
  config: BrandConfig<Id>,
  id: string,
): BrandColor<Id> | undefined {
  return config.colors?.groups
    .flatMap((group) => group.colors)
    .find((color) => color.id === id);
}

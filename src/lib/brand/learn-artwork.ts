/**
 * Intuition's brand pictures, drawn as SVG from the film's own parts: the
 * logo's bands, the mark's shapes, the atoms' outlines and colors, and
 * bonds drawn as the docs' header draws them. Every picture is a whole
 * document at its preset's size, with no text (there is no brand font to
 * outline), and only presentation attributes, no `<style>`: resvg, which
 * renders the PNGs, reads CSS only in part.
 */

import { PRESETS } from '@/components/brand/asset-presets';
import type { Preset, PresetId } from '@/components/brand/asset-presets';
import type {
  Rect,
  ClearSpaceDiagram,
  ConstructionDiagram,
  Line,
  ReversedOverlayDiagram,
} from '@/components/brand/brand-config';
import { rgbToHex } from '@/components/brand/color';
import type { Hex } from '@/components/brand/color';
import { fitLockup } from '@/components/brand/fit-lockup';
import { svgDocument } from '@/components/brand/svg-document';
import {
  LOGO_MARK_COLOR,
  logoMarkLayout,
  REVERSED_INSET,
  reversedMarkShapes,
} from '@/components/onboarding/logo-mark';
import type { PlacedShape } from '@/components/onboarding/logo-mark';
import type { Role } from '@/components/playground/story-model';
import {
  outlinePath,
  ROLE_COLORS,
  ROLES,
} from '@/components/playground/story-shapes';
import { intuitionLogoSvg } from '@/lib/intuition-logo';

import { atomField, chainAtoms } from './atom-field';
import { atomsSvg } from './brand-atoms';
import { OBSERVED_GROUND, observedSvg } from './brand-observed';
import { multiplayerSvg } from './brand-multiplayer';
import { orbitSvg } from './brand-orbit';
import { bondSvg } from './brand-bond';
import {
  figmaUniverseSvg,
  UNIVERSE_PHONE,
  universeSvg,
} from './brand-universe';
import type { UniverseFrame } from './brand-universe';
import type { BondGround } from './brand-bond';
import type { AtomField } from './atom-field';

/**
 * Graphite, as `globals.css` declares it (`--color-graphite-N`); a test
 * holds the two to each other.
 */
export const GRAPHITE = {
  0: '#ffffff',
  50: '#f2f3f7',
  100: '#e2e2ea',
  200: '#c6cbd9',
  300: '#9a9aaf',
  400: '#7e7e8f',
  500: '#656575',
  600: '#535362',
  700: '#2e2e3a',
  800: '#262631',
  900: '#16161e',
  950: '#07070c',
} as const satisfies Record<number, Hex>;

/** The logo mark's color, Graphite 900: the brand's primary. */
export const LOGO_HEX: Hex = LOGO_MARK_COLOR;

/** Each role's color, as the film fills its atoms. */
export const ROLE_HEX: Readonly<Record<Role, Hex>> = {
  identity: rgbToHex(ROLE_COLORS.identity),
  predicate: rgbToHex(ROLE_COLORS.predicate),
  object: rgbToHex(ROLE_COLORS.object),
  bridge: rgbToHex(ROLE_COLORS.bridge),
};

/** A number for an attribute: two decimals at most, which is a hundredth of a pixel. */
const n = (value: number): string => String(Number(value.toFixed(2)));

/*
 * The outlines are defined at 100 across and scaled down to each atom: at
 * 1 across, `outlinePath`'s three decimals would round a large atom's edge
 * to a visible wobble.
 */
const OUTLINE_SIZE = 100;

/** A field drawn in one set of colors, as one layer of a picture. */
export interface FieldLayer {
  field: AtomField;
  /** Each role's fill. */
  colors: Readonly<Record<Role, Hex>>;
  /** The ground the bonds stand on: Midnight ink on light, Graphite 0 on dark. */
  ground: BondGround;
  /** The whole layer's opacity, from 0 to 1. */
  opacity?: number;
}

/**
 * One layer: its bonds first, each the brand's bond (`brand-bond.ts`, the
 * skill's own) at its atoms' size, under the atoms they join; then the
 * atoms, upright, as the film draws them.
 */
function layerSvg(layer: FieldLayer, index: number): string {
  const { field, colors, ground, opacity = 1 } = layer;
  const bonds = field.bonds
    .map(({ from, to }, bond) => {
      const a = field.atoms[from];
      const b = field.atoms[to];
      return a === undefined || b === undefined
        ? ''
        : bondSvg({
            id: `field-${index}:${bond}`,
            from: a,
            to: b,
            atomSize: a.size,
            ground,
          });
    })
    .join('');
  const atoms = field.atoms
    .map(
      ({ role, x, y, size }) =>
        `<use href="#a-${role}" fill="${colors[role]}" transform="translate(${n(x)} ${n(y)}) scale(${Number((size / OUTLINE_SIZE).toFixed(4))})"/>`,
    )
    .join('');
  return opacity === 1
    ? `<g>${bonds}${atoms}</g>`
    : `<g opacity="${opacity}">${bonds}${atoms}</g>`;
}

/**
 * Layers of atoms as SVG elements: one outline per role in `<defs>`, then
 * each layer in turn, the first at the back.
 */
export function fieldSvg(layers: readonly FieldLayer[]): string {
  const roles = ROLES.filter((role) =>
    layers.some(({ field }) => field.atoms.some((atom) => atom.role === role)),
  );
  const defs =
    roles.length === 0
      ? ''
      : `<defs>${roles.map((role) => `<path id="a-${role}" d="${outlinePath(role, OUTLINE_SIZE, 0)}"/>`).join('')}</defs>`;
  return `${defs}${layers.map((layer, index) => layerSvg(layer, index)).join('')}`;
}

/** A bond's hairline on a canvas: its short side over 900. */
const unitOf = (canvas: Preset): number =>
  Math.min(canvas.width, canvas.height) / 900;

/** A rectangle grown by `margin` on every side. */
const grow = (rect: Rect, margin: number): Rect => ({
  x: rect.x - margin,
  y: rect.y - margin,
  width: rect.width + 2 * margin,
  height: rect.height + 2 * margin,
});

/** The rectangle round a field's atoms, each taken at its full size. */
function boundsOf(field: AtomField): Rect {
  const xs = field.atoms.flatMap(({ x, size }) => [x - size / 2, x + size / 2]);
  const ys = field.atoms.flatMap(({ y, size }) => [y - size / 2, y + size / 2]);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y };
}

/** A lockup on its canvas, and the room its rule keeps clear round it. */
export interface LogoArtwork {
  svg: string;
  lockup: Rect;
  clearSpace: number;
}

/** The room round the marks in the overlaid diagram, on every side. */
const REVERSED_MARGIN = 60;
/** The loupe's magnification, and its radius in the diagram's units. */
const LOUPE_ZOOM = 8;
const LOUPE_RADIUS = 130;

/**
 * The logo's two versions laid one over the other, in the mark's units, on
 * Midnight: the mark (drawn in drafting red by the page) under the
 * reversed mark in white, so every edge's `REVERSED_INSET` shows as a rim.
 * Beside them, as wide again, a loupe on the square's top right corner at
 * `LOUPE_ZOOM` times, and a ring round the corner on the marks joined to it.
 */
export function markReversedOverlayDiagram(): ReversedOverlayDiagram {
  const { width, height, shapes, guides } = logoMarkLayout();
  const margin = REVERSED_MARGIN;
  const square = guides.cells[2];
  if (square === undefined) {
    throw new Error('The mark has four cells');
  }
  const size = guides.square.size;
  const place = (outlines: readonly PlacedShape[]) =>
    outlines.map(({ d, x, y }) => ({ d, x, y }));
  const half = width + 2 * margin;
  const center = { x: -margin + 1.5 * half, y: height / 2 };
  // The square's top right corner, at the centre of its rounding.
  const radius =
    guides.radii.find(({ role }) => role === 'object')?.radius ?? 0;
  const spot = {
    x: square.x + size - radius,
    y: square.y + radius,
    radius: LOUPE_RADIUS / LOUPE_ZOOM,
  };
  const length = Math.hypot(center.x - spot.x, center.y - spot.y);
  const toward = {
    x: (center.x - spot.x) / length,
    y: (center.y - spot.y) / length,
  };
  // Where a point on the marks falls in the loupe.
  const inLoupe = (x: number, y: number) => ({
    x: center.x + LOUPE_ZOOM * (x - spot.x),
    y: center.y + LOUPE_ZOOM * (y - spot.y),
  });
  const right = square.x + size;
  const rimOuter = inLoupe(right, square.y);
  const rimInner = inLoupe(right - REVERSED_INSET, square.y);
  return {
    view: {
      x: -margin,
      y: -margin,
      width: 2 * half,
      height: height + 2 * margin,
    },
    groundColor: LOGO_HEX,
    under: place(shapes),
    color: GRAPHITE[0],
    over: place(reversedMarkShapes()),
    loupe: {
      spot,
      center,
      radius: LOUPE_RADIUS,
      zoom: LOUPE_ZOOM,
      leader: {
        x1: spot.x + spot.radius * toward.x,
        y1: spot.y + spot.radius * toward.y,
        x2: center.x - LOUPE_RADIUS * toward.x,
        y2: center.y - LOUPE_RADIUS * toward.y,
      },
      label: {
        text: `inset = ${REVERSED_INSET}`,
        from: rimInner.x,
        to: rimOuter.x,
        edge: rimOuter.y,
        side: 'above',
      },
    },
  };
}

/** The mark's clear space: the square's height, one shape's, on every side. */
const MARK_CLEAR_SPACE = logoMarkLayout().guides.square.size;

/**
 * The mark's clear space as a diagram, in the mark's units: the mark, the
 * square's height clear on every side of its outermost edges, those edges
 * carried out to the clear space's edge, and the square that sets it, a
 * copy in each corner they leave.
 */
export function markClearSpaceDiagram(): ClearSpaceDiagram {
  const { width, height, shapes, guides } = logoMarkLayout();
  const space = MARK_CLEAR_SPACE;
  const boundary: Rect = {
    x: -space,
    y: -space,
    width: width + 2 * space,
    height: height + 2 * space,
  };
  const left = boundary.x;
  const right = boundary.x + boundary.width;
  const top = boundary.y;
  const bottom = boundary.y + boundary.height;
  const across = (y: number): Line => ({ x1: left, y1: y, x2: right, y2: y });
  const down = (x: number): Line => ({ x1: x, y1: top, x2: x, y2: bottom });
  const { square } = guides;
  return {
    logo: shapes.map(({ d, x, y }) => ({ d, x, y })),
    color: LOGO_HEX,
    boundary,
    guides: [down(0), down(width), across(0), across(height)],
    unit: [
      [left, top],
      [width, top],
      [left, height],
      [width, height],
    ].map(([x = 0, y = 0]) => ({
      d: square.d,
      x: x - square.x,
      y: y - square.y,
    })),
  };
}

/** How far an atom's icon reaches past its cell: past the triangle's widest overshoot, 7.2. */
const ICON_MARGIN = 8;

/**
 * An atom's shape as an icon, the logo mark's own: its outline, and its
 * cell grown on every side, so every icon is the same size, each shape
 * centred and overshooting as in the logo.
 */
export function atomIcon(role: Role): { d: string; view: Rect } {
  const { shapes, guides } = logoMarkLayout();
  const index = shapes.findIndex((shape) => shape.role === role);
  const shape = shapes[index];
  const cell = guides.cells[index];
  if (shape === undefined || cell === undefined) {
    throw new Error(`The logo mark has no ${role}`);
  }
  const size = guides.square.size;
  return {
    d: shape.d,
    view: {
      x: cell.x - ICON_MARGIN,
      y: cell.y - ICON_MARGIN,
      width: size + 2 * ICON_MARGIN,
      height: size + 2 * ICON_MARGIN,
    },
  };
}

/**
 * The room round the construction diagram, the same on every side so the
 * mark stands in its middle: enough for the widest label beside its line.
 */
const CONSTRUCTION_MARGIN = 80;

/**
 * How the mark is built, in its units: its four cells, their edges run
 * from the grid's start to its end, the mark over them, its shapes
 * overshooting them as drawn, each rounded shape's corner radius inside
 * it and the circle that rounds each of its corners, and the grid's three
 * measures: the gap between the lines, x;
 * between the columns, y; and a cell.
 */
export function markConstructionDiagram(): ConstructionDiagram {
  const { width, height, shapes, guides } = logoMarkLayout();
  const size = guides.square.size;
  const cells: Rect[] = guides.cells.map(({ x, y }) => ({
    x,
    y,
    width: size,
    height: size,
  }));
  const [topLeft, topRight, bottomLeft] = cells;
  if (
    topLeft === undefined ||
    topRight === undefined ||
    bottomLeft === undefined
  ) {
    throw new Error('The mark has four cells');
  }
  // The grid's lines: every cell edge, across the whole grid and down it.
  const xs = [topLeft.x, topLeft.x + size, topRight.x, topRight.x + size];
  const ys = [topLeft.y, topLeft.y + size, bottomLeft.y, bottomLeft.y + size];
  const gridLeft = topLeft.x;
  const gridRight = topRight.x + size;
  const gridTop = topLeft.y;
  const gridBottom = bottomLeft.y + size;
  const columnGap = { from: topLeft.x + size, to: topRight.x };
  const lineGap = { from: topLeft.y + size, to: bottomLeft.y };
  const margin = CONSTRUCTION_MARGIN;
  return {
    view: {
      x: -margin,
      y: -margin,
      width: width + 2 * margin,
      height: height + 2 * margin,
    },
    logo: shapes.map(({ d, x, y }) => ({ d, x, y })),
    color: LOGO_HEX,
    cells,
    radii: guides.radii.map(({ radius, x, y }) => ({
      text: `r = ${radius}`,
      x,
      y,
    })),
    corners: guides.radii.flatMap(({ radius, corners }) =>
      corners.map(([cx, cy]) => ({ cx, cy, r: radius })),
    ),
    grid: [
      ...ys.map((y) => ({ x1: gridLeft, y1: y, x2: gridRight, y2: y })),
      ...xs.map((x) => ({ x1: x, y1: gridTop, x2: x, y2: gridBottom })),
    ],
    measures: [
      {
        text: `y = ${columnGap.to - columnGap.from}`,
        ...columnGap,
        edge: gridTop,
        side: 'above',
      },
      // The gap between the lines is measured on the left, beside the human's column.
      {
        text: `x = ${lineGap.to - lineGap.from}`,
        ...lineGap,
        edge: gridLeft,
        side: 'left',
      },
      {
        text: `cell = ${size}`,
        from: bottomLeft.x,
        to: bottomLeft.x + size,
        edge: gridBottom,
        side: 'below',
      },
    ],
  };
}

/** The ground the mark stands on, which sets its color and its outlines. */
export type MarkGround = 'light' | 'dark';

/**
 * The mark by its ground: Midnight on light; on dark, the reversed mark,
 * white, optically corrected for the irradiation illusion.
 */
const MARK_ON: Readonly<
  Record<MarkGround, { color: Hex; shapes: () => readonly PlacedShape[] }>
> = {
  light: { color: LOGO_HEX, shapes: () => logoMarkLayout().shapes },
  dark: { color: GRAPHITE[0], shapes: reversedMarkShapes },
};

/** The mark on its ground, its frame at `frame`. */
function markSvg(frame: Rect, ground: MarkGround): string {
  const { height } = logoMarkLayout();
  const { color, shapes } = MARK_ON[ground];
  const scale = frame.height / height;
  const paths = shapes()
    .map(
      ({ d, x, y }) =>
        `<path d="${d}" transform="translate(${n(x)} ${n(y)})"/>`,
    )
    .join('');
  return `<g fill="${color}" transform="translate(${n(frame.x)} ${n(frame.y)}) scale(${Number(scale.toFixed(5))})">${paths}</g>`;
}

/** The mark's frame at a height, its top left at `x`, `y`. */
function markFrame(x: number, y: number, height: number): Rect {
  const layout = logoMarkLayout();
  const width = (layout.width / layout.height) * height;
  return { x, y, width, height };
}

/** The mark for its ground, centred on a transparent canvas with its clear space. */
export function markAsset(preset: PresetId, ground: MarkGround): LogoArtwork {
  const canvas = PRESETS[preset];
  const { width, height } = logoMarkLayout();
  const { frame, clearSpace } = fitLockup(
    { width, height },
    canvas,
    MARK_CLEAR_SPACE,
  );
  return {
    svg: svgDocument(canvas, markSvg(frame, ground)),
    lockup: frame,
    clearSpace,
  };
}

/** Graphite's light field: pale atoms, the circles and squares lighter than the rest. */
const GRAPHITE_ATOMS: Readonly<Record<Role, Hex>> = {
  identity: GRAPHITE[200],
  predicate: GRAPHITE[300],
  object: GRAPHITE[200],
  bridge: GRAPHITE[300],
};

interface FieldPalette {
  sky: Hex;
  atoms: Readonly<Record<Role, Hex>>;
  ground: BondGround;
}

const GRAPHITE_PALETTE: FieldPalette = {
  sky: GRAPHITE[50],
  atoms: GRAPHITE_ATOMS,
  ground: 'light',
};

const NIGHT_PALETTE: FieldPalette = {
  sky: LOGO_HEX,
  atoms: ROLE_HEX,
  ground: 'dark',
};

/** A wallpaper: a field of claims over a sky, sized in the canvas's own unit. */
function wallpaper(
  preset: PresetId,
  palette: FieldPalette,
  field: { seed: number; claims: number; keepClear?: readonly Rect[] },
): string {
  const canvas = PRESETS[preset];
  const unit = unitOf(canvas);
  const atoms = atomField({
    width: canvas.width,
    height: canvas.height,
    seed: field.seed,
    claims: field.claims,
    bridges: 1 / 3,
    size: { min: 26 * unit, max: 48 * unit },
    ...(field.keepClear === undefined ? {} : { keepClear: field.keepClear }),
  });
  return svgDocument(
    canvas,
    fieldSvg([{ field: atoms, colors: palette.atoms, ground: palette.ground }]),
    palette.sky,
  );
}

/** A phone's lock-screen clock: a band across the top, kept clear. */
function clockBand(preset: PresetId): Rect {
  const { width, height } = PRESETS[preset];
  return { x: 0, y: 0.08 * height, width, height: 0.22 * height };
}

/**
 * The Intuition Universe, the homepage's, without the welcome or "Play": its stars formed into
 * the Intuition logo, still, on white, drawn on a laptop's screen (1440 ×
 * 810) and scaled to the wallpaper. The phone's is drawn on a screen big
 * enough for the same logo (760 × 1648), so its stars stand as far apart
 * as on the desktop's, not packed round a phone-sized logo.
 */
export const intuitionUniverseDesktop = (): string =>
  svgDocument(
    PRESETS.desktop,
    universeSvg({ width: 1440, height: 810 }, PRESETS.desktop.width / 1440),
    GRAPHITE[0],
  );

export const intuitionUniversePhone = (): string =>
  svgDocument(
    PRESETS.phone,
    universeSvg({ width: 760, height: 1648 }, PRESETS.phone.width / 760),
    GRAPHITE[0],
  );

/**
 * The Universe, as Saulo drew it at 1440 × 810: his stars as atoms, on
 * Midnight, scaled to the wallpaper; the phone's, his drawing turned a
 * quarter for a tall screen.
 */
export const universeDesktop = (): string =>
  svgDocument(
    PRESETS.desktop,
    figmaUniverseSvg(PRESETS.desktop.width / 1440),
    LOGO_HEX,
  );

export const universePhone = (): string =>
  svgDocument(
    PRESETS.phone,
    figmaUniverseSvg(PRESETS.phone.width / UNIVERSE_PHONE.width, 'portrait'),
    LOGO_HEX,
  );

/**
 * The universes' social sizes, each its drawing spread across the frame,
 * the corner each platform lays its own picture over kept clear: X's avatar,
 * LinkedIn's photo.
 */
const UNIVERSE_SOCIAL = {
  'og-image': { width: 1200, height: 630 },
  'x-banner': {
    width: 1500,
    height: 500,
    clear: { x: 0, y: 300, width: 420, height: 200 },
  },
  'linkedin-banner': {
    width: 1584,
    height: 396,
    clear: { x: 0, y: 196, width: 560, height: 200 },
  },
  'discord-banner': { width: 960, height: 540 },
} as const satisfies Partial<Record<PresetId, UniverseFrame>>;

/** The short side of the smallest screen the Intuition Universe's logo stands at full size on: 608 = 0.8 × 760. */
const LOGO_FULL_SIDE = 760;

/**
 * The Intuition Universe in one of its social sizes: drawn on a screen
 * whose short side is 760, so its logo stands as big among its stars as on
 * the desktop's and the phone's, and scaled to the frame; the corner the
 * platform lays its own picture over kept clear.
 */
export function intuitionUniverseSocial(
  preset: keyof typeof UNIVERSE_SOCIAL,
): string {
  const frame: UniverseFrame = UNIVERSE_SOCIAL[preset];
  const scale = Math.min(frame.width, frame.height) / LOGO_FULL_SIDE;
  const clear =
    frame.clear === undefined
      ? undefined
      : {
          x: frame.clear.x / scale,
          y: frame.clear.y / scale,
          width: frame.clear.width / scale,
          height: frame.clear.height / scale,
        };
  return svgDocument(
    PRESETS[preset],
    universeSvg(
      { width: frame.width / scale, height: frame.height / scale },
      scale,
      clear,
    ),
    GRAPHITE[0],
  );
}

/** The Universe in one of its social sizes, dark or light. */
export function universeSocial(
  preset: keyof typeof UNIVERSE_SOCIAL,
  ground: 'dark' | 'light',
): string {
  return svgDocument(
    PRESETS[preset],
    figmaUniverseSvg(1, UNIVERSE_SOCIAL[preset]),
    ground === 'dark' ? LOGO_HEX : GRAPHITE[0],
  );
}

/** Atoms' sizes: the wallpapers, and the universes' social sizes with their clear corners. */
const ATOMS_FRAMES = {
  desktop: PRESETS.desktop,
  phone: PRESETS.phone,
  ...UNIVERSE_SOCIAL,
} as const;

/**
 * Atoms (`brand-atoms.ts`) in one of its sizes, on Midnight or on white:
 * the logo mark's four shapes in 3D among small atoms, fitted to the
 * frame.
 */
export function atoms(
  preset: keyof typeof ATOMS_FRAMES,
  ground: 'dark' | 'light',
): string {
  return svgDocument(
    PRESETS[preset],
    atomsSvg(ATOMS_FRAMES[preset], ground),
    ground === 'dark' ? LOGO_HEX : GRAPHITE[0],
  );
}

/** Observed (`brand-observed.ts`), the triple as the light, in one of Atoms' sizes, on its own ground, Graphite 950. */
export function observed(preset: keyof typeof ATOMS_FRAMES): string {
  return svgDocument(
    PRESETS[preset],
    observedSvg(ATOMS_FRAMES[preset]),
    OBSERVED_GROUND,
  );
}

/** Orbit (`brand-orbit.ts`), Saulo's composition lit as Observed is, in one of Atoms' sizes, on Graphite 950. */
export function orbit(preset: keyof typeof ATOMS_FRAMES): string {
  return svgDocument(
    PRESETS[preset],
    orbitSvg(ATOMS_FRAMES[preset]),
    OBSERVED_GROUND,
  );
}

/** Multiplayer (`brand-multiplayer.ts`), the four shapes and the words, in one of Atoms' sizes, on Graphite 950. */
export function multiplayer(preset: keyof typeof ATOMS_FRAMES): string {
  return svgDocument(
    PRESETS[preset],
    multiplayerSvg(ATOMS_FRAMES[preset]),
    OBSERVED_GROUND,
  );
}

/** The Universe, light: the same, on white. */
export const universeLightDesktop = (): string =>
  svgDocument(
    PRESETS.desktop,
    figmaUniverseSvg(PRESETS.desktop.width / 1440),
    GRAPHITE[0],
  );

export const universeLightPhone = (): string =>
  svgDocument(
    PRESETS.phone,
    figmaUniverseSvg(PRESETS.phone.width / UNIVERSE_PHONE.width, 'portrait'),
    GRAPHITE[0],
  );

export const graphiteFieldDesktop = (): string =>
  wallpaper('desktop', GRAPHITE_PALETTE, { seed: 1, claims: 18 });

export const graphiteFieldPhone = (): string =>
  wallpaper('phone', GRAPHITE_PALETTE, {
    seed: 2,
    claims: 12,
    keepClear: [clockBand('phone')],
  });

export const nightFieldDesktop = (): string =>
  wallpaper('desktop', NIGHT_PALETTE, { seed: 3, claims: 18 });

export const nightFieldPhone = (): string =>
  wallpaper('phone', NIGHT_PALETTE, {
    seed: 4,
    claims: 12,
    keepClear: [clockBand('phone')],
  });

const TRIPLE: readonly Role[] = ['identity', 'predicate', 'object'];

/**
 * The Open Graph image: one triple, large, across the middle, the
 * predicate pointing from its subject to its object; the mark top left;
 * a faint field of claims behind, clear of both.
 */
export function ogImage(): string {
  const canvas = PRESETS['og-image'];
  const size = 150;
  const step = 2.4 * size;
  const cy = canvas.height / 2;
  const triple = chainAtoms(
    [-1, 0, 1].map((place) => ({ x: canvas.width / 2 + place * step, y: cy })),
    TRIPLE,
    size,
  );
  const mark = markFrame(64, 64, 48);
  const faint = atomField({
    width: canvas.width,
    height: canvas.height,
    seed: 6,
    claims: 10,
    bridges: 1 / 3,
    size: { min: 22, max: 34 },
    keepClear: [grow(boundsOf(triple), 40), grow(mark, 32)],
  });
  return svgDocument(
    canvas,
    fieldSvg([
      {
        field: faint,
        colors: {
          identity: GRAPHITE[100],
          predicate: GRAPHITE[100],
          object: GRAPHITE[100],
          bridge: GRAPHITE[100],
        },
        ground: 'light',
      },
      { field: triple, colors: ROLE_HEX, ground: 'light' },
    ]) + markSvg(mark, 'light'),
    GRAPHITE[0],
  );
}

/**
 * The X banner: on night, a claim through a bridge object across the
 * right two thirds, over a faint field in the role colors. The bottom
 * left, where X sets the profile's avatar, is left clear; no logo, as
 * the avatar carries it.
 */
export function xBanner(): string {
  const canvas = PRESETS['x-banner'];
  const size = 84;
  const chain = chainAtoms(
    [
      { x: 600, y: 270 },
      { x: 805, y: 225 },
      { x: 1010, y: 255 },
      { x: 1215, y: 295 },
      { x: 1420, y: 245 },
    ],
    ['identity', 'predicate', 'bridge', 'predicate', 'object'],
    size,
  );
  const avatar: Rect = { x: 0, y: 300, width: 420, height: 200 };
  const faint = atomField({
    width: canvas.width,
    height: canvas.height,
    seed: 7,
    claims: 14,
    bridges: 1 / 3,
    size: { min: 20, max: 34 },
    keepClear: [avatar, grow(boundsOf(chain), 36)],
  });
  return svgDocument(
    canvas,
    fieldSvg([
      { field: faint, colors: ROLE_HEX, ground: 'dark', opacity: 0.35 },
      { field: chain, colors: ROLE_HEX, ground: 'dark' },
    ]),
    LOGO_HEX,
  );
}

/** The X avatar: the mark two by two, Graphite 900 on white, inside the circle X crops it to. */
export function xAvatar(): string {
  const canvas = PRESETS['x-avatar'];
  const height = 0.4 * canvas.height;
  const frame = markFrame(0, 0, height);
  return svgDocument(
    canvas,
    markSvg(
      {
        ...frame,
        x: (canvas.width - frame.width) / 2,
        y: (canvas.height - height) / 2,
      },
      'light',
    ),
    GRAPHITE[0],
  );
}

/**
 * The LinkedIn banner: one long chain in the role colors, through two
 * bridge objects, clear of the bottom left, where LinkedIn sets the
 * profile's photo.
 */
export function linkedinBanner(): string {
  const canvas = PRESETS['linkedin-banner'];
  const ys = [214, 168, 196, 236, 204, 160, 190];
  const chain = chainAtoms(
    ys.map((y, index) => ({ x: 640 + index * 140, y })),
    [
      'identity',
      'predicate',
      'bridge',
      'predicate',
      'bridge',
      'predicate',
      'object',
    ],
    56,
  );
  return svgDocument(
    canvas,
    fieldSvg([{ field: chain, colors: ROLE_HEX, ground: 'light' }]),
    GRAPHITE[50],
  );
}

/** The Discord banner: the Intuition logo in white on night, a few claims round it. */
export function discordBanner(): string {
  const canvas = PRESETS['discord-banner'];
  const diameter = 220;
  const logo: Rect = {
    x: (canvas.width - diameter) / 2,
    y: (canvas.height - diameter) / 2,
    width: diameter,
    height: diameter,
  };
  const claims = atomField({
    width: canvas.width,
    height: canvas.height,
    seed: 5,
    claims: 6,
    bridges: 1 / 3,
    size: { min: 30, max: 46 },
    keepClear: [grow(logo, 48)],
  });
  return svgDocument(
    canvas,
    fieldSvg([{ field: claims, colors: ROLE_HEX, ground: 'dark' }]) +
      intuitionLogoSvg({
        cx: canvas.width / 2,
        cy: canvas.height / 2,
        diameter,
        color: GRAPHITE[0],
      }),
    LOGO_HEX,
  );
}

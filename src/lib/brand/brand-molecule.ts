/**
 * Molecule: Saulo's reference of six bonded shapes, its places and its
 * bonds kept, its shapes the atom shapes: the golden center a triangle, the
 * two blue shapes nearest circles, the three farthest squares (2026-11-13).
 * Every shape a glowing solid by the 3D recipe (`glowingSolidSvg`): one
 * unit in space, shown as big as its depth makes it, the nearest circle
 * the biggest; prisms 0.4 of a unit deep, each turned about 45° its own way
 * and rolled, so none stands straight, the triangle too (this picture's
 * exception). Each bond is the skill's bond, held at three times the
 * film's (its exception: the skill holds it at two), bending as the
 * reference's strands do, from the middle of the face that looks toward its
 * other atom (a sphere's center); over the farther of its two atoms, which
 * it reaches from in front, and under the nearer, which it leaves from
 * behind. Its backdrop is the reference's,
 * measured (`molecule-backdrop.ts`). Drawn in the reference's own frame,
 * 2000 × 1125.
 */

import {
  oklchToRgb,
  parseHex,
  rgbToHex,
  rgbToOklch,
} from '@/components/brand/color';
import type { Role } from '@/components/playground/story-model';
import { ROLE_COLORS, shapeSize } from '@/components/playground/story-shapes';

import { seededRandom } from './atom-field';
import type { AtomsFrame } from './brand-atoms-frame';
import { curvedBondSvg } from './brand-bond';
import {
  convexHull,
  glowingSolidSvg,
  LIGHT,
  seenFaces,
} from './brand-observed';
import type { Light, SeenFace, Solid } from './brand-observed';
import { MOLECULE_BACKDROP } from './molecule-backdrop';
import { encodePng } from './png';

type Vec = readonly [number, number, number];

/** The reference's frame, in its pixels: every place below is in it. */
export const MOLECULE_DESIGN = { width: 2000, height: 1125 } as const;

/** A shape of the molecule. */
export interface MoleculePart {
  role: Role;
  /** Its center in the reference. */
  x: number;
  y: number;
  /** Its unit as it shows at its depth: its circle would be 0.9 of it across. */
  unit: number;
  /** How far back it stands, in design pixels: 0 the nearest. */
  z: number;
  /** Turned, tipped and rolled, in degrees. */
  yaw: number;
  pitch: number;
  roll: number;
}

/**
 * The reference's six shapes at its places, farthest first. All are one
 * unit in space and show as big as their depth makes them: the right
 * circle nearest and biggest, the triangle behind it, the far-left circle
 * further, the three squares furthest. Each prism turned about 45°, its
 * own way, and rolled; each square's front face toward the triangle, so
 * its bond hits it in its middle.
 */
export const MOLECULE_PARTS: readonly MoleculePart[] = [
  {
    role: 'object',
    x: 657,
    y: 656,
    unit: 215,
    z: -637,
    yaw: 45,
    pitch: -25,
    roll: -30,
  },
  {
    role: 'object',
    x: 1088,
    y: 160,
    unit: 230,
    z: -553,
    yaw: -15,
    pitch: -40,
    roll: 25,
  },
  {
    role: 'object',
    x: 1576,
    y: 750,
    unit: 240,
    z: -497,
    yaw: -35,
    pitch: -30,
    roll: 40,
  },
  {
    role: 'identity',
    x: 283,
    y: 292,
    unit: 256,
    z: -420,
    yaw: 0,
    pitch: 0,
    roll: 0,
  },
  {
    role: 'predicate',
    x: 1012,
    y: 650,
    unit: 344,
    z: -133,
    yaw: 35,
    pitch: 25,
    roll: -18,
  },
  {
    role: 'identity',
    x: 1602,
    y: 458,
    unit: 411,
    z: 0,
    yaw: 0,
    pitch: 0,
    roll: 0,
  },
];

/** The hub every bond runs to: the triangle. */
const HUB = 4;

/** How far each bond's middle bends off the straight line, as a share of its length, as the reference's strands bend. */
const BENDS: Readonly<Record<number, number>> = {
  0: 0.12,
  1: 0.04,
  2: 0.06,
  3: 0.05,
  5: 0.08,
};

/** The bond held at this many times the film's: three, where the skill holds it at two. */
const BOND_HELD_AT = 3;

/** A prism's depth, as a share of its unit, as every glowing shape's. */
const SOLID_DEPTH = 0.4;

/** A part as the solid it is drawn as, at its unit; a prism 0.4 of its unit deep. */
export function moleculeSolid(part: MoleculePart): Solid {
  const { width, height } = shapeSize(part.role);
  return {
    role: part.role,
    x: part.x,
    y: part.y,
    z: part.z,
    size: part.unit * Math.max(width, height),
    yaw: part.yaw,
    pitch: part.pitch,
    roll: part.roll,
    depth: part.unit * SOLID_DEPTH,
  };
}

/** The face we see on a solid that most looks toward a point. */
export function faceToward(
  solid: Solid,
  toward: { x: number; y: number },
): SeenFace | undefined {
  const dx = toward.x - solid.x;
  const dy = toward.y - solid.y;
  let best: SeenFace | undefined;
  let score = -Infinity;
  for (const face of seenFaces(solid)) {
    const facing = face.normal[0] * dx + face.normal[1] * dy;
    if (facing > score) {
      score = facing;
      best = face;
    }
  }
  return best;
}

/** A bond of the molecule: the part it runs to from the hub, and the faces it runs between. */
export interface MoleculeBond {
  part: number;
  /** The hub's face that looks toward the part. */
  hub: SeenFace;
  /** The part's face that looks toward the hub. */
  own: SeenFace;
}

/** Every bond: from the middle of the hub's face toward each part to the middle of the part's face toward the hub. */
export function moleculeBonds(): MoleculeBond[] {
  const solids = MOLECULE_PARTS.map(moleculeSolid);
  const hub = solids[HUB];
  if (hub === undefined) {
    return [];
  }
  return solids.flatMap((solid, index) => {
    const hubFace = faceToward(hub, solid);
    const own = faceToward(solid, hub);
    return index === HUB || hubFace === undefined || own === undefined
      ? []
      : [{ part: index, hub: hubFace, own }];
  });
}

/**
 * Molecule's shadow, its exception (Saulo, 2026-11-13; the skill's glowing
 * shapes cast none): under each shape, Wave UI's realistic stack, its
 * shadow-sm: three layers, each offset in proportion to its blur (0.5 : 1.2
 * : 3, for blurs of 0.9 : 1.8 : 4.3), the farthest 0.16 of the shape's size
 * away from its nearest neighbor, blurred a quarter more than Wave's, each
 * at 10%. Offsets and blurs are shares of the shape's size. Its color is a
 * dark version of the backdrop beneath it, as Wave's is of its surface: 16%
 * of its lightness, the same hue and chroma.
 */
const SHADOW = {
  stack: [
    { offset: 0.027, blur: 0.06 },
    { offset: 0.064, blur: 0.12 },
    { offset: 0.16, blur: 0.287 },
  ],
  strength: 0.1,
  darkness: 0.16,
} as const;

/** Three box blurs as wide as make one Gaussian of `sigma` pixels: each box's width. */
function boxesFor(sigma: number): number[] {
  const ideal = Math.sqrt((12 * sigma * sigma) / 3 + 1);
  let lower = Math.floor(ideal);
  if (lower % 2 === 0) {
    lower -= 1;
  }
  const upper = lower + 2;
  const many = Math.round(
    (12 * sigma * sigma - 3 * lower * lower - 12 * lower - 9) /
      (-4 * lower - 4),
  );
  return [0, 1, 2].map((index) => (index < many ? lower : upper));
}

/** A box blur of `width` pixels across `values`, along rows (or columns), in place. */
function boxBlur(
  values: Float32Array,
  columns: number,
  rows: number,
  width: number,
  isAlongRows: boolean,
): void {
  const radius = (width - 1) / 2;
  const [lines, length] = isAlongRows ? [rows, columns] : [columns, rows];
  const at = (line: number, index: number) =>
    isAlongRows ? line * columns + index : index * columns + line;
  const line = new Float32Array(length);
  for (let each = 0; each < lines; each += 1) {
    for (let index = 0; index < length; index += 1) {
      line[index] = values[at(each, index)] ?? 0;
    }
    let sum = 0;
    for (let index = -radius; index <= radius; index += 1) {
      sum += line[index] ?? 0;
    }
    for (let index = 0; index < length; index += 1) {
      values[at(each, index)] = sum / width;
      sum += (line[index + radius + 1] ?? 0) - (line[index - radius] ?? 0);
    }
  }
}

/** A color at `lightness` of its OKLCH lightness, its hue and as much of its chroma as a screen shows. */
function withLightness(
  color: readonly [number, number, number],
  lightness: number,
): [number, number, number] {
  const [own, chroma, hue] = rgbToOklch([color[0], color[1], color[2]]);
  for (let share = 1; share > 0.01; share /= 2) {
    const rgb = oklchToRgb([own * lightness, chroma * share, hue]);
    if (rgb !== undefined) {
      return [rgb[0], rgb[1], rgb[2]];
    }
  }
  return [0, 0, 0];
}

/** A dark version of a backdrop color: its lightness `SHADOW.darkness` of what it was. */
function darkOf(color: readonly [number, number, number]): string {
  const rgb = withLightness(color, SHADOW.darkness);
  return rgbToHex([Math.round(rgb[0]), Math.round(rgb[1]), Math.round(rgb[2])]);
}

/** The backdrop a little darker than the reference's, his call: this share of its measured lightness, its hue and chroma kept. */
const BACKDROP_LIGHTNESS = 0.85;

/** The measured backdrop, each cell darkened by `BACKDROP_LIGHTNESS`. */
const BACKDROP_CELLS = MOLECULE_BACKDROP.map((row) =>
  row.map((cell) => withLightness(cell, BACKDROP_LIGHTNESS)),
);

/**
 * A shape's shadow as one dithered image at half the frame's pixels: each
 * layer its silhouette moved and blurred (three box blurs, a Gaussian), the
 * layers laid over one another, each pixel's darkness worked out exactly, a
 * little noise added before it is rounded, so its long soft falloff on the
 * dark shows no rings.
 */
function shadowSvg(
  solid: Solid,
  away: { x: number; y: number },
  color: string,
  pixelsPerUnit: number,
  seed: number,
): string {
  const isSphere = solid.role === 'identity';
  const hull = isSphere
    ? []
    : convexHull(seenFaces(solid).flatMap((face) => face.outline));
  const radius = solid.size / 2;
  const xs = isSphere
    ? [solid.x - radius, solid.x + radius]
    : hull.map(([x]) => x);
  const ys = isSphere
    ? [solid.y - radius, solid.y + radius]
    : hull.map(([, y]) => y);
  const farthest = SHADOW.stack[SHADOW.stack.length - 1] ?? {
    offset: 0,
    blur: 0,
  };
  const margin = (farthest.offset + 3 * farthest.blur) * solid.size;
  const left = Math.min(...xs) - margin;
  const top = Math.min(...ys) - margin;
  const columns = Math.max(
    2,
    Math.ceil((Math.max(...xs) + margin - left) * pixelsPerUnit),
  );
  const rows = Math.max(
    2,
    Math.ceil((Math.max(...ys) + margin - top) * pixelsPerUnit),
  );
  const isInside = (x: number, y: number): boolean => {
    if (isSphere) {
      return Math.hypot(x - solid.x, y - solid.y) <= radius;
    }
    let sign = 0;
    for (const [index, [ax, ay]] of hull.entries()) {
      const [bx, by] = hull[(index + 1) % hull.length] ?? [ax, ay];
      const turn = Math.sign((bx - ax) * (y - ay) - (by - ay) * (x - ax));
      if (turn !== 0 && sign !== 0 && turn !== sign) {
        return false;
      }
      sign = turn === 0 ? sign : turn;
    }
    return true;
  };
  // Where light still reaches, layer after layer: 1 nowhere shadowed.
  const reached = new Float32Array(columns * rows).fill(1);
  for (const layer of SHADOW.stack) {
    const dx = away.x * layer.offset * solid.size;
    const dy = away.y * layer.offset * solid.size;
    const mask = new Float32Array(columns * rows);
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        // Four samples a pixel, so the edge is soft before it is blurred.
        let covered = 0;
        for (const [sx, sy] of [
          [0.25, 0.25],
          [0.75, 0.25],
          [0.25, 0.75],
          [0.75, 0.75],
        ] as const) {
          const x = left + (column + sx) / pixelsPerUnit - dx;
          const y = top + (row + sy) / pixelsPerUnit - dy;
          covered += isInside(x, y) ? 0.25 : 0;
        }
        mask[row * columns + column] = covered;
      }
    }
    for (const width of boxesFor(layer.blur * solid.size * pixelsPerUnit)) {
      boxBlur(mask, columns, rows, width, true);
      boxBlur(mask, columns, rows, width, false);
    }
    for (let index = 0; index < reached.length; index += 1) {
      reached[index] =
        (reached[index] ?? 1) * (1 - SHADOW.strength * (mask[index] ?? 0));
    }
  }
  const [red, green, blue] = parseHex(color);
  const random = seededRandom(seed);
  const rgba = new Uint8Array(columns * rows * 4);
  for (let index = 0; index < reached.length; index += 1) {
    const alpha = 255 * (1 - (reached[index] ?? 1));
    const at = index * 4;
    rgba[at] = red;
    rgba[at + 1] = green;
    rgba[at + 2] = blue;
    // Triangular noise, -1 to 1 shade, before the rounding: the dither.
    rgba[at + 3] =
      alpha < 0.5
        ? 0
        : Math.min(
            255,
            Math.max(0, Math.round(alpha + random() + random() - 1)),
          );
  }
  const png = encodePng(columns, rows, rgba).toString('base64');
  return `<image href="data:image/png;base64,${png}" x="${n(left)}" y="${n(top)}" width="${n(columns / pixelsPerUnit)}" height="${n(rows / pixelsPerUnit)}" preserveAspectRatio="none"/>`;
}

/** The backdrop's dither seed. */
const BACKDROP_SEED = 77;

/** Catmull-Rom between four values, `t` of the way from the second to the third. */
function catmullRom(
  a: number,
  b: number,
  c: number,
  d: number,
  t: number,
): number {
  return (
    b +
    0.5 *
      t *
      (c - a + t * (2 * a - 5 * b + 4 * c - d + t * (3 * (b - c) + d - a)))
  );
}

/** The backdrop at a point of the design, smoothly between its cells; held at its edges beyond them. */
function backdropAt(x: number, y: number): [number, number, number] {
  const rows = BACKDROP_CELLS.length;
  const columns = BACKDROP_CELLS[0]?.length ?? 1;
  const u = Math.min(
    columns - 1,
    Math.max(0, (x / MOLECULE_DESIGN.width) * columns - 0.5),
  );
  const v = Math.min(
    rows - 1,
    Math.max(0, (y / MOLECULE_DESIGN.height) * rows - 0.5),
  );
  const column = Math.floor(u);
  const row = Math.floor(v);
  const cell = (r: number, c: number, channel: number) =>
    BACKDROP_CELLS[Math.min(rows - 1, Math.max(0, r))]?.[
      Math.min(columns - 1, Math.max(0, c))
    ]?.[channel] ?? 0;
  const color: [number, number, number] = [0, 0, 0];
  for (let channel = 0; channel < 3; channel += 1) {
    const across = [-1, 0, 1, 2].map((dr) =>
      catmullRom(
        cell(row + dr, column - 1, channel),
        cell(row + dr, column, channel),
        cell(row + dr, column + 1, channel),
        cell(row + dr, column + 2, channel),
        u - column,
      ),
    );
    color[channel] = catmullRom(
      across[0] ?? 0,
      across[1] ?? 0,
      across[2] ?? 0,
      across[3] ?? 0,
      v - row,
    );
  }
  return color;
}

/**
 * The backdrop over the whole frame, as a dithered image at half the
 * frame's pixels, as a very soft field takes: each pixel the reference's
 * backdrop where it lands in the design, a little noise added before it is
 * rounded, so it shows no rings.
 */
function backdropSvg(
  frame: { width: number; height: number },
  placement: { x: number; y: number; scale: number },
): string {
  const width = Math.max(2, Math.round(frame.width / 2));
  const height = Math.max(2, Math.round(frame.height / 2));
  const random = seededRandom(BACKDROP_SEED);
  const rgba = new Uint8Array(width * height * 4);
  for (let row = 0; row < height; row += 1) {
    for (let column = 0; column < width; column += 1) {
      const color = backdropAt(
        (((column + 0.5) / width) * frame.width - placement.x) /
          placement.scale,
        (((row + 0.5) / height) * frame.height - placement.y) / placement.scale,
      );
      const at = (row * width + column) * 4;
      for (let channel = 0; channel < 3; channel += 1) {
        // Triangular noise, -1 to 1 shade, before the rounding: the dither.
        rgba[at + channel] = Math.min(
          255,
          Math.max(
            0,
            Math.round((color[channel] ?? 0) + random() + random() - 1),
          ),
        );
      }
      rgba[at + 3] = 255;
    }
  }
  const png = encodePng(width, height, rgba).toString('base64');
  return `<image href="data:image/png;base64,${png}" x="0" y="0" width="${frame.width}" height="${frame.height}" preserveAspectRatio="none"/>`;
}

const n = (value: number): number => Number(value.toFixed(2));

/** The glow's reach round the shapes, in design pixels: room a frame keeps round the group. */
const GLOW_ROOM = 60;

/** The six shapes together, as we see them, in the design: their bounds. */
export function moleculeGroup(): {
  left: number;
  top: number;
  right: number;
  bottom: number;
} {
  const points = MOLECULE_PARTS.map(moleculeSolid).flatMap(
    (solid): (readonly [number, number])[] =>
      solid.role === 'identity'
        ? [
            [solid.x - solid.size / 2, solid.y - solid.size / 2],
            [solid.x + solid.size / 2, solid.y + solid.size / 2],
          ]
        : seenFaces(solid).flatMap((face) => face.outline),
  );
  return {
    left: Math.min(...points.map(([px]) => px)),
    top: Math.min(...points.map(([, py]) => py)),
    right: Math.max(...points.map(([px]) => px)),
    bottom: Math.max(...points.map(([, py]) => py)),
  };
}

/**
 * Where the design sits in `frame`: as large as covers a 16:9 frame and
 * never larger than lets the group and its glow fit; the group, its six
 * shapes together, centered on the frame.
 */
export function moleculePlacement(frame: AtomsFrame): {
  x: number;
  y: number;
  scale: number;
} {
  const group = moleculeGroup();
  const scale = Math.min(
    Math.max(
      frame.width / MOLECULE_DESIGN.width,
      frame.height / MOLECULE_DESIGN.height,
    ),
    (0.92 * frame.width) / (group.right - group.left + 2 * GLOW_ROOM),
    (0.92 * frame.height) / (group.bottom - group.top + 2 * GLOW_ROOM),
  );
  return {
    x: frame.width / 2 - ((group.left + group.right) / 2) * scale,
    y: frame.height / 2 - ((group.top + group.bottom) / 2) * scale,
    scale,
  };
}

/**
 * Molecule in `frame`, as SVG elements on Graphite 950: the reference's
 * backdrop over the whole frame, as the reference lays it; then the six
 * shapes as one group, centered on the frame.
 */
export function moleculeSvg(frame: AtomsFrame): string {
  const { x, y, scale } = moleculePlacement(frame);
  // The backdrop as the reference lays it on the frame: its light stays where the page's is.
  const backdrop = {
    x: frame.width / 2 - (MOLECULE_DESIGN.width / 2) * scale,
    y: frame.height / 2 - (MOLECULE_DESIGN.height / 2) * scale,
    scale,
  };
  const defs: string[] = [];
  const body: string[] = [];
  const lights: Light[] = MOLECULE_PARTS.map((part) => {
    const color = rgbToHex(ROLE_COLORS[part.role]);
    const at: Vec = [part.x, part.y, part.z + LIGHT.forward];
    return { role: part.role, color, rgb: parseHex(color), at };
  });
  const solids = MOLECULE_PARTS.map(moleculeSolid);
  const hubPart = MOLECULE_PARTS[HUB];
  // Each bond drawn just after the farther of its two shapes: it reaches
  // that one from in front, so it shows over it, into the middle of its face
  // (a sphere's center); it leaves the nearer from behind, so it runs under it.
  const bondsAfter = new Map<number, string>();
  for (const bond of moleculeBonds()) {
    const part = MOLECULE_PARTS[bond.part];
    if (part === undefined || hubPart === undefined) {
      continue;
    }
    const hub = { x: bond.hub.x, y: bond.hub.y };
    const own = { x: bond.own.x, y: bond.own.y };
    // Subject to predicate, predicate to object.
    const [from, to] = part.role === 'identity' ? [own, hub] : [hub, own];
    const svg = curvedBondSvg({
      id: `molecule:${bond.part}`,
      from,
      to,
      atomSize: hubPart.unit,
      bend: BENDS[bond.part] ?? 0.05,
      heldAt: BOND_HELD_AT,
      ground: 'dark',
    });
    const farther = part.z < hubPart.z ? bond.part : HUB;
    bondsAfter.set(farther, (bondsAfter.get(farther) ?? '') + svg);
  }
  // Each shape's shadow: away from its nearest neighbor, in a dark version of the backdrop beneath it.
  const shadowOf = (index: number): string => {
    const solid = solids[index];
    if (solid === undefined) {
      return '';
    }
    const nearest = solids
      .filter((_, other) => other !== index)
      .sort(
        (a, b) =>
          Math.hypot(a.x - solid.x, a.y - solid.y) -
          Math.hypot(b.x - solid.x, b.y - solid.y),
      )[0];
    const away = nearest
      ? { x: solid.x - nearest.x, y: solid.y - nearest.y }
      : { x: 0, y: 1 };
    const length = Math.hypot(away.x, away.y) || 1;
    const beneath = backdropAt(
      (x + solid.x * scale - backdrop.x) / backdrop.scale,
      (y + solid.y * scale - backdrop.y) / backdrop.scale,
    );
    return shadowSvg(
      solid,
      { x: away.x / length, y: away.y / length },
      darkOf(beneath),
      scale / 2,
      900 + index,
    );
  };
  // Each shape, farthest first: its glow, its solid and its lines.
  for (const [index, part] of MOLECULE_PARTS.entries()) {
    const solid = solids[index];
    if (solid === undefined) {
      continue;
    }
    body.push(
      glowingSolidSvg({
        id: `molecule-${index}`,
        solid,
        color: lights[index]?.color ?? '#ffffff',
        others: lights.filter((_, other) => other !== index),
        scale,
        // Its light's size, as Multiplayer's 290 is to its 320 unit.
        glowSize: part.unit * (290 / 320),
        sphereSeed: 300 + index,
        defs,
        // This picture's exception: no far glow, and a shadow under the hot edge.
        farGlow: false,
        beforeHotEdge: shadowOf(index),
      }),
      bondsAfter.get(index) ?? '',
    );
  }
  return `<defs>${defs.join('')}</defs>${backdropSvg(frame, backdrop)}<g transform="translate(${n(x)} ${n(y)}) scale(${n(scale)})">${body.join('')}</g>`;
}

/**
 * Observed: what is observed becomes real. After Saulo's original still
 * life, the triple is the light: its three atoms glow from their centers in
 * their colors, and every other atom is a solid in the dark, each face lit
 * by how far it turns to each of them and how near it stands. Faces turned
 * to the triple are bright in its colors, faces turned away near black, and
 * the far atoms dim, unobserved. The big sphere stands behind the triple,
 * the triangle between them; each solid casts a soft shadow away from the
 * light. The spheres and the pool of light are dithered images, so their
 * gradients show no rings. Drawn at 1920 × 1080, as Atoms is, and fitted to
 * any frame the same way (`atomsPlacement`).
 */

import { parseHex, rgbToHex } from '@/components/brand/color';
import type { Hex } from '@/components/brand/color';
import type { Role } from '@/components/playground/story-model';
import {
  outlinePath,
  ROLE_COLORS,
  ROUNDING,
  roundedOutline,
  shapeSize,
} from '@/components/playground/story-shapes';

import { seededRandom } from './atom-field';
import { atomsPlacement } from './brand-atoms';
import type { AtomsFrame } from './brand-atoms';
import { bondSvg } from './brand-bond';
import { encodePng } from './png';

/**
 * Observed's ground, Graphite 950, deeper than Midnight: an exception for
 * this picture only. Its pool of light lifts the middle back to Midnight's
 * range, so only the edges go deeper.
 */
export const OBSERVED_GROUND: Hex = '#07070c';
/** Graphite 800: the dark a face turned from every light settles toward. */
export const OBSERVED_SHADOW: Hex = '#262631';

interface Point {
  x: number;
  y: number;
}

/** A Gaussian falloff, 1 at 0 to exactly 0 at 1, `k` its steepness. */
export const falloff = (t: number, k: number): number =>
  (Math.exp(-k * t * t) - Math.exp(-k)) / (1 - Math.exp(-k));

/**
 * A gradient as a dithered image over the square `box`, `pixels` across:
 * `paint` gives each pixel's color and opacity (0 to 255) at (u, v), its
 * place in the square from 0 to 1, or nothing where the image is clear.
 * Each channel is worked out exactly, then a little noise is added before
 * it is rounded to a whole shade, so the shades between whole ones show as
 * a fine mix of the two: no rings, in any browser. A browser rounds an SVG
 * gradient without that noise, and in the dark each shade becomes a ring.
 */
export function ditheredImage(
  box: Point & { side: number },
  pixels: number,
  paint: (
    u: number,
    v: number,
  ) => readonly [number, number, number, number] | undefined,
  seed: number,
): string {
  const random = seededRandom(seed);
  const rgba = new Uint8Array(pixels * pixels * 4);
  for (let row = 0; row < pixels; row += 1) {
    for (let column = 0; column < pixels; column += 1) {
      const color = paint((column + 0.5) / pixels, (row + 0.5) / pixels);
      if (color === undefined) {
        continue;
      }
      const at = (row * pixels + column) * 4;
      for (let channel = 0; channel < 3; channel += 1) {
        // Triangular noise, -1 to 1 shade: the dither that leaves no pattern.
        const noisy = (color[channel] ?? 0) + random() + random() - 1;
        rgba[at + channel] = Math.min(255, Math.max(0, Math.round(noisy)));
      }
      rgba[at + 3] = Math.min(255, Math.max(0, Math.round(color[3])));
    }
  }
  const png = encodePng(pixels, pixels, rgba).toString('base64');
  return `<image href="data:image/png;base64,${png}" x="${n(box.x)}" y="${n(box.y)}" width="${n(box.side)}" height="${n(box.side)}" preserveAspectRatio="none"/>`;
}

/** A share of the way from one color to another, unrounded, as a dithered image paints it. */
export function blend(
  from: readonly number[],
  to: readonly number[],
  share: number,
): [number, number, number] {
  const channel = (index: number): number =>
    (from[index] ?? 0) + ((to[index] ?? 0) - (from[index] ?? 0)) * share;
  return [channel(0), channel(1), channel(2)];
}

type Vec = readonly [number, number, number];

/** The design's focus, where a frame's focus lands (as Atoms'). */
const FOCUS = { x: 1210, y: 540 } as const;
/** The triple: its atoms' size, its middle, and its line, rising 28°. */
const TRIPLE = { size: 124.8, x: 1210, y: 576.4, degrees: -28 } as const;
/**
 * The triple's light: how strong, how far it reaches (half as bright at
 * `reach`), and how much white is in its colors. `core`: no surface is
 * nearer a light than this, so the light softens close up instead of
 * flaring. `forward`: the lights stand this far in front of the solids'
 * plane, so the faces turned to us catch some of them.
 */
export const LIGHT = {
  gain: 1.05,
  reach: 220,
  white: 0.5,
  core: 130,
  forward: 90,
} as const;
/** What a face turned from every light still shows: a little above Graphite 800's dark. */
const AMBIENT = blend(
  parseHex(OBSERVED_GROUND),
  parseHex(OBSERVED_SHADOW),
  0.85,
);
/**
 * A turned light's glow, as a camera's bloom: four layers, each reaching
 * about 2.5 times further than the last and weaker, so the light is
 * strongest at the shape and falls off fast. Each: its blur, as a share of
 * the shape's size, its strength, and how much white is in it (the
 * tightest is the hot edge).
 */
const BLOOM = [
  { blur: 0.015, strength: 0.6, white: 0.3 },
  { blur: 0.04, strength: 0.35, white: 0 },
  { blur: 0.1, strength: 0.2, white: 0 },
  { blur: 0.25, strength: 0.12, white: 0 },
] as const;
/** A turned light's depth, as a share of the 1×1 square its shape is drawn in. */
const SOLID_DEPTH = 0.4;
/** A solid's depth, as a share of its size. */
const DEPTH = 0.45;

/** An atom in the dark: role, place, depth (toward us +), size across, and how it is turned and tipped, in degrees. */
export interface Solid {
  role: Role;
  x: number;
  y: number;
  z: number;
  size: number;
  yaw: number;
  pitch: number;
  /** A turn in its own plane, in degrees, before it is turned and tipped. */
  roll?: number;
  /** Its depth, front to back; `DEPTH` of its size if not given. */
  depth?: number;
}

/**
 * A scene lit as Observed is: its atoms in the dark, back to front, and
 * where the triple's three atoms stand, each by its true center.
 */
export interface Scene {
  solids: readonly Solid[];
  triple: Readonly<
    Record<'identity' | 'predicate' | 'object', readonly [number, number]>
  >;
  /** A fourth light, the hexagon, by its true center: no bond reaches it. */
  bridge?: readonly [number, number];
  /** The lights' size across; Observed's triple's if not given. */
  size?: number;
  /** The pool of light's center; under Observed's focus if not given. */
  pool?: readonly [number, number];
  /**
   * The lights drawn at one protocol unit, as the film draws its atoms,
   * rather than each as wide as `size`: the shapes then weigh the same.
   */
  unit?: number;
  /** The lights as solids, each turned and tipped in degrees, as Atoms' are: a negative turn faces left, a positive tip faces up. */
  turns?: Partial<
    Record<Role, { yaw: number; pitch: number; roll?: number; scale?: number }>
  >;
  /** Whether the triple's bonds are drawn; they are if not said. */
  bonds?: boolean;
  /** SVG elements drawn over everything, in the design's units: words, say. */
  overlay?: string;
  /**
   * A scene composed round its own center: this point lands at the frame's
   * center, and the box round it, `width` by `height`, always fits. Without
   * it, the scene is fitted as Atoms is, its focus right of center.
   */
  centered?: { x: number; y: number; width: number; height: number };
  /** Whether a pool of light lies under the scene; it does if not said. */
  hasPool?: boolean;
}

/** Observed's atoms in the dark. */
const SOLIDS: readonly Solid[] = [
  { role: 'identity', x: 972, y: 492, z: -160, size: 330, yaw: 0, pitch: 0 },
  { role: 'bridge', x: 1002, y: 847, z: -60, size: 34, yaw: -30, pitch: 25 },
  { role: 'object', x: 1241, y: 207, z: -80, size: 26, yaw: 35, pitch: 30 },
  { role: 'object', x: 1434, y: 290, z: -40, size: 70, yaw: -32, pitch: 26 },
  { role: 'identity', x: 1549, y: 465, z: -30, size: 38, yaw: 0, pitch: 0 },
  { role: 'object', x: 1550, y: 675, z: -20, size: 54, yaw: 28, pitch: -30 },
  { role: 'bridge', x: 1435, y: 851, z: -40, size: 120, yaw: -36, pitch: -20 },
  {
    role: 'predicate',
    x: 905,
    y: 630,
    z: -40,
    size: 100,
    yaw: 38,
    pitch: -22,
  },
];

/** A point on Observed's triple line, `step` atoms from its middle, two atom sizes apart. */
function along(step: number): readonly [number, number] {
  const angle = (TRIPLE.degrees * Math.PI) / 180;
  return [
    TRIPLE.x + step * 2 * TRIPLE.size * Math.cos(angle),
    TRIPLE.y + step * 2 * TRIPLE.size * Math.sin(angle),
  ];
}

/** Observed: its atoms in the dark, and its triple on one straight line. */
export const OBSERVED_SCENE: Scene = {
  solids: SOLIDS,
  triple: { identity: along(-1), predicate: along(0), object: along(1) },
};

const n = (value: number): number => Number(value.toFixed(2));

/** A role's outline, its rounded corners traced, `size` across at its widest, centred on 0. */
function outline(role: Role, size: number): [number, number][] {
  const { width, height } = shapeSize(role);
  const unit = size / Math.max(width, height);
  const radius = ROUNDING * unit;
  return roundedOutline(role, role, 1).flatMap((corner) => {
    const turn = corner.to - corner.from;
    const steps =
      turn === 0
        ? 0
        : Math.max(2, Math.ceil(Math.abs(turn) / (size >= 26 ? 0.07 : 0.3)));
    return Array.from({ length: steps + 1 }, (_, step) => {
      const angle = corner.from + (turn * step) / Math.max(1, steps);
      const point: [number, number] = [
        corner.x * unit + radius * Math.cos(angle),
        corner.y * unit + radius * Math.sin(angle),
      ];
      return point;
    });
  });
}

/**
 * A shape's true center, `size` across: where its outline balances, from
 * the point it is drawn about. A triangle's sits below the middle of its box.
 */
function balance(role: Role, size: number): { x: number; y: number } {
  const points = outline(role, size);
  let area = 0;
  let x = 0;
  let y = 0;
  for (const [index, [x0, y0]] of points.entries()) {
    const [x1, y1] = points[(index + 1) % points.length] ?? [x0, y0];
    const cross = x0 * y1 - x1 * y0;
    area += cross;
    x += (x0 + x1) * cross;
    y += (y0 + y1) * cross;
  }
  return area === 0 ? { x: 0, y: 0 } : { x: x / (3 * area), y: y / (3 * area) };
}

/** A color's hue at full saturation and half lightness: the light it would spill. */
function pureHue(rgb: readonly number[]): [number, number, number] {
  const [r, g, b] = [
    (rgb[0] ?? 0) / 255,
    (rgb[1] ?? 0) / 255,
    (rgb[2] ?? 0) / 255,
  ];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  const h =
    d === 0
      ? 0
      : max === r
        ? ((g - b) / d + 6) % 6
        : max === g
          ? (b - r) / d + 2
          : (r - g) / d + 4;
  // Full saturation, half lightness: one channel full, one empty, one between.
  const between = 1 - Math.abs((h % 2) - 1);
  const sectors: readonly (readonly [number, number, number])[] = [
    [1, between, 0],
    [between, 1, 0],
    [0, 1, between],
    [0, between, 1],
    [between, 0, 1],
    [1, 0, between],
  ];
  const [pr, pg, pb] = sectors[Math.floor(h) % 6] ?? [1, 0, 0];
  return [255 * pr, 255 * pg, 255 * pb];
}

/** A point turned on the vertical axis by `yaw`, then tipped by `pitch`, in radians. */
function turn([x, y, z]: Vec, yaw: number, pitch: number): Vec {
  const x1 = x * Math.cos(yaw) + z * Math.sin(yaw);
  const z1 = -x * Math.sin(yaw) + z * Math.cos(yaw);
  return [
    x1,
    y * Math.cos(pitch) - z1 * Math.sin(pitch),
    y * Math.sin(pitch) + z1 * Math.cos(pitch),
  ];
}

export interface Light {
  role: Role;
  color: Hex;
  rgb: readonly [number, number, number];
  at: Vec;
}

/** A face's color, at `point` facing `normal`: the ambient, and each light by how it turns to it and how near. */
export function lit(
  point: Vec,
  normal: Vec,
  lights: readonly Light[],
): [number, number, number] {
  const color: [number, number, number] = [AMBIENT[0], AMBIENT[1], AMBIENT[2]];
  for (const light of lights) {
    const v: Vec = [
      light.at[0] - point[0],
      light.at[1] - point[1],
      light.at[2] - point[2],
    ];
    const distance = Math.hypot(...v);
    const facing = Math.max(
      0,
      (normal[0] * v[0] + normal[1] * v[1] + normal[2] * v[2]) / distance,
    );
    const softened = Math.hypot(distance, LIGHT.core);
    const strength =
      (LIGHT.gain * facing) / (1 + (softened / LIGHT.reach) ** 2);
    for (let channel = 0; channel < 3; channel += 1) {
      color[channel] =
        (color[channel] ?? 0) + (light.rgb[channel] ?? 0) * strength;
    }
  }
  return color;
}

const channel = (value: number | undefined): number =>
  Math.min(255, Math.max(0, Math.round(value ?? 0)));
export const hexOf = (rgb: readonly number[]): Hex =>
  rgbToHex([channel(rgb[0]), channel(rgb[1]), channel(rgb[2])]);

/** A flat-faced solid: its faces turned to us, each lit, as SVG; and its outline's faces for a shadow. */
export function prism(
  solid: Solid,
  lights: readonly Light[],
  paint?: (point: Vec, normal: Vec) => [number, number, number],
  /** The cap's own fill, over `paint`'s, from its corners: a gradient, say. */
  capFill?: (points: readonly Vec[]) => string,
): { faces: string; silhouette: string } {
  const yaw = (solid.yaw * Math.PI) / 180;
  const pitch = (solid.pitch * Math.PI) / 180;
  const half = (solid.depth ?? solid.size * DEPTH) / 2;
  const roll = ((solid.roll ?? 0) * Math.PI) / 180;
  const traced = outline(solid.role, solid.size).map(
    ([x, y]): [number, number] => [
      x * Math.cos(roll) - y * Math.sin(roll),
      x * Math.sin(roll) + y * Math.cos(roll),
    ],
  );
  // Start at a corner: a flat side split where the outline wraps round
  // would be two faces, each shaded on its own, with a seam between.
  const heading = (index: number) => {
    const [ax, ay] = traced[index % traced.length] ?? [0, 0];
    const [bx, by] = traced[(index + 1) % traced.length] ?? [0, 0];
    return Math.atan2(by - ay, bx - ax);
  };
  const corner = Math.max(
    0,
    traced.findIndex(
      (_, index) =>
        Math.abs(
          Math.sin(heading(index) - heading(index - 1 + traced.length)),
        ) > 0.008,
    ),
  );
  const flat = [...traced.slice(corner), ...traced.slice(0, corner)];
  const world = (local: Vec): Vec => {
    const [x, y, z] = turn(local, yaw, pitch);
    return [solid.x + x, solid.y + y, solid.z + z];
  };
  const front = flat.map(([x, y]) => world([x, y, half]));
  const back = flat.map(([x, y]) => world([x, y, -half]));
  const path = (points: readonly Vec[]) =>
    `M${points.map(([x, y]) => `${n(x)} ${n(y)}`).join('L')}Z`;
  const faces: {
    depth: number;
    d: string;
    fill: Hex;
    points: readonly Vec[];
  }[] = [];
  const caps: typeof faces = [];
  const add = (
    points: readonly Vec[],
    normal: Vec,
    into: typeof faces = faces,
  ) => {
    if (normal[2] <= 0) {
      return;
    }
    const mean = (axis: 0 | 1 | 2): number =>
      points.reduce((sum, point) => sum + point[axis], 0) / points.length;
    const centre: Vec = [mean(0), mean(1), mean(2)];
    into.push({
      depth: centre[2],
      points,
      d: path(points),
      fill: hexOf(paint ? paint(centre, normal) : lit(centre, normal, lights)),
    });
  };
  // The sides: a run of the outline's edges going the same way is one face.
  const count = flat.length;
  const direction = (index: number) => {
    const [ax, ay] = flat[index % count] ?? [0, 0];
    const [bx, by] = flat[(index + 1) % count] ?? [0, 0];
    return Math.atan2(by - ay, bx - ax);
  };
  let start = 0;
  for (let index = 0; index < count; index += 1) {
    const next = index + 1;
    const isLast = next === count;
    const bends =
      !isLast && Math.abs(Math.sin(direction(next) - direction(index))) > 0.008;
    if (!bends && !isLast) {
      continue;
    }
    const a = start;
    const b = next % count;
    const [ax, ay] = flat[a] ?? [0, 0];
    const [bx, by] = flat[b] ?? [0, 0];
    // Out, away from the middle.
    let nx = by - ay;
    let ny = -(bx - ax);
    const length = Math.hypot(nx, ny) || 1;
    nx /= length;
    ny /= length;
    if (nx * (ax + bx) + ny * (ay + by) < 0) {
      nx = -nx;
      ny = -ny;
    }
    add(
      [
        front[a] ?? [0, 0, 0],
        front[b] ?? [0, 0, 0],
        back[b] ?? [0, 0, 0],
        back[a] ?? [0, 0, 0],
      ],
      turn([nx, ny, 0], yaw, pitch),
    );
    start = next;
  }
  add(front, turn([0, 0, 1], yaw, pitch), caps);
  add([...back].reverse(), turn([0, 0, -1], yaw, pitch), caps);
  faces.sort((a, b) => a.depth - b.depth);
  // The sides, each with a thin edge in its own color to close the hairline
  // between neighbors, beveled so no corner bulges; then the cap over them,
  // its outline exact.
  return {
    faces: [
      ...faces.map(
        (face) =>
          `<path d="${face.d}" fill="${face.fill}" stroke="${face.fill}" stroke-width="0.5" stroke-linejoin="bevel"/>`,
      ),
      ...caps.map(
        (face) =>
          `<path d="${face.d}" fill="${capFill ? capFill(face.points) : face.fill}"/>`,
      ),
    ].join(''),
    silhouette: [...faces, ...caps]
      .map(
        (face) => `<path d="${face.d}" stroke="#000000" stroke-width="0.8"/>`,
      )
      .join(''),
  };
}

/** A sphere, each pixel lit as its surface turns to each light, dithered; and its outline for a shadow. */
export function sphere(
  solid: Solid,
  lights: readonly Light[],
  scale: number,
  seed: number,
  paint?: (point: Vec, normal: Vec) => [number, number, number],
): { faces: string; silhouette: string } {
  const radius = solid.size / 2;
  const pixels = Math.max(2, Math.round(solid.size * scale));
  const faces = ditheredImage(
    { x: solid.x - radius, y: solid.y - radius, side: solid.size },
    pixels,
    (u, v) => {
      const dx = 2 * u - 1;
      const dy = 2 * v - 1;
      const across = Math.hypot(dx, dy);
      const cover = Math.min(
        1,
        Math.max(0, (1 - across) * radius * scale + 0.5),
      );
      if (cover === 0) {
        return undefined;
      }
      const dz = Math.sqrt(Math.max(0, 1 - across * across));
      const surface: Vec = [
        solid.x + dx * radius,
        solid.y + dy * radius,
        solid.z + dz * radius,
      ];
      const color = paint
        ? paint(surface, [dx, dy, dz])
        : lit(surface, [dx, dy, dz], lights);
      return [color[0], color[1], color[2], 255 * cover];
    },
    seed,
  );
  return {
    faces,
    silhouette: `<circle cx="${n(solid.x)}" cy="${n(solid.y)}" r="${n(radius)}"/>`,
  };
}

/** Observed in `frame`, as SVG elements on `OBSERVED_GROUND`: the ground is the document's. */
export function observedSvg(frame: AtomsFrame): string {
  return sceneSvg(frame, OBSERVED_SCENE);
}

/** A scene in `frame`, lit as Observed is, as SVG elements on `OBSERVED_GROUND`. */
export function sceneSvg(frame: AtomsFrame, scene: Scene): string {
  const centered = scene.centered;
  const placement = centered
    ? {
        x: frame.width / 2,
        y: frame.height / 2,
        scale: Math.min(
          Math.max(frame.width / 1920, frame.height / 1080),
          (0.92 * frame.width) / centered.width,
          (0.92 * frame.height) / centered.height,
        ),
      }
    : atomsPlacement(frame);
  const focus = centered ?? FOCUS;
  const defs: string[] = [];
  const body: string[] = [];

  // The pool of light, as Observed's, dithered.
  const atom = scene.size ?? TRIPLE.size;
  const pool = {
    x: scene.pool?.[0] ?? FOCUS.x,
    y: scene.pool?.[1] ?? FOCUS.y + 26,
    radius: 624,
  };
  const ground = parseHex(OBSERVED_GROUND);
  const poolLight = parseHex('#9a9ab8');
  if (scene.hasPool !== false) {
    body.push(
      ditheredImage(
        {
          x: pool.x - pool.radius,
          y: pool.y - pool.radius,
          side: 2 * pool.radius,
        },
        Math.max(2, Math.round(pool.radius * placement.scale)),
        (u, v) => {
          const t = 2 * Math.hypot(u - 0.5, v - 0.5);
          return t >= 1
            ? undefined
            : [...blend(ground, poolLight, 0.16 * falloff(t, 3.84)), 255];
        },
        1,
      ),
    );
  }

  // The triple, its atoms the lights.
  const light = (role: Role): Light => {
    // Each atom placed by its true center: the triangle a little higher
    // than its box's middle, so a bond reaches its center.
    const centre =
      scene.unit === undefined ? balance(role, atom) : { x: 0, y: 0 };
    const [x, y] =
      role === 'bridge' ? (scene.bridge ?? [0, 0]) : scene.triple[role];
    const color = rgbToHex(ROLE_COLORS[role]);
    const rgb = blend(parseHex(color), [255, 255, 255], LIGHT.white);
    return {
      role,
      color,
      rgb,
      at: [x - centre.x, y - centre.y, LIGHT.forward],
    };
  };
  const lights = [
    light('identity'),
    light('predicate'),
    light('object'),
  ] as const;
  // Every light the solids are lit by: the triple's, and the hexagon's if the scene has one.
  const shining: readonly Light[] =
    scene.bridge === undefined ? lights : [...lights, light('bridge')];

  // The solids, back to front, each after its shadow, cast away from the nearest light.
  for (const [index, solid] of scene.solids.entries()) {
    const drawn =
      solid.role === 'identity'
        ? sphere(solid, shining, placement.scale, 200 + index)
        : prism(solid, shining);
    const nearest = [...shining].sort(
      (a, b) =>
        Math.hypot(a.at[0] - solid.x, a.at[1] - solid.y) -
        Math.hypot(b.at[0] - solid.x, b.at[1] - solid.y),
    )[0];
    const isInPool =
      Math.hypot(solid.x - pool.x, solid.y - pool.y) < pool.radius;
    if (nearest !== undefined && isInPool) {
      const away = [solid.x - nearest.at[0], solid.y - nearest.at[1]];
      const length = Math.hypot(away[0] ?? 0, away[1] ?? 0) || 1;
      const reach = 0.16 * solid.size;
      const id = `remake-shadow-${index}`;
      defs.push(
        `<filter id="${id}" x="-1" y="-1" width="3" height="3"><feGaussianBlur stdDeviation="${n(0.12 * solid.size)}"/></filter>`,
      );
      body.push(
        `<g opacity="0.55" filter="url(#${id})" transform="translate(${n(((away[0] ?? 0) / length) * reach)} ${n(((away[1] ?? 0) / length) * reach)})">${drawn.silhouette}</g>`,
      );
    }
    body.push(drawn.faces);
  }

  // The bonds over a soft beam, then the lights, glowing from their centres.
  const [subject, predicate, object] = lights;
  // Each bond from and to a shape's true center: the first ends exactly at
  // the triangle's, the second starts there.
  const point = (l: Light) => {
    const offset =
      scene.unit === undefined ? balance(l.role, atom) : { x: 0, y: 0 };
    return { x: l.at[0] + offset.x, y: l.at[1] + offset.y };
  };
  // The beam's blur, its area round both bonds with room for the whole
  // blur on every side: sized from a bond's own box, a bond running nearly
  // straight up would have its glow cut into a strip.
  const ends = [subject, predicate, object].map(point);
  const margin = 3 * 11 + 13;
  const left = Math.min(...ends.map((end) => end.x)) - margin;
  const top = Math.min(...ends.map((end) => end.y)) - margin;
  const right = Math.max(...ends.map((end) => end.x)) + margin;
  const bottom = Math.max(...ends.map((end) => end.y)) + margin;
  defs.push(
    `<filter id="remake-beam" filterUnits="userSpaceOnUse" x="${n(left)}" y="${n(top)}" width="${n(right - left)}" height="${n(bottom - top)}"><feGaussianBlur stdDeviation="11"/></filter>`,
  );
  // A scene without bonds has no beams either.
  const hasBonds = scene.bonds !== false;
  for (const [from, to] of hasBonds
    ? ([
        [subject, predicate],
        [predicate, object],
      ] as const)
    : []) {
    body.push(
      `<line x1="${n(point(from).x)}" y1="${n(point(from).y)}" x2="${n(point(to).x)}" y2="${n(point(to).y)}" stroke="#ffffff" stroke-opacity="0.18" stroke-width="13" stroke-linecap="round" filter="url(#remake-beam)"/>`,
    );
  }
  const drawLight = (source: Light) => {
    const id = `remake-light-${source.role}`;
    // How big the outline is drawn for a light `size` across.
    const box = (size: number) =>
      scene.unit === undefined
        ? size /
          Math.max(shapeSize(source.role).width, shapeSize(source.role).height)
        : (scene.unit * size) / atom;
    const shape = (size: number) =>
      `<path d="${outlinePath(source.role, box(size), 0)}" transform="translate(${n(source.at[0])} ${n(source.at[1])})"`;
    defs.push(
      `<radialGradient id="${id}" cx="0.5" cy="0.5" r="0.6"><stop offset="0" stop-color="${hexOf(blend(parseHex(source.color), [255, 255, 255], 0.6))}"/><stop offset="0.55" stop-color="${source.color}"/><stop offset="1" stop-color="${hexOf(blend(parseHex(source.color), [0, 0, 0], 0.12))}"/></radialGradient>`,
      `<filter id="${id}-glow" x="-1" y="-1" width="3" height="3"><feGaussianBlur stdDeviation="${n(atom * 0.3)}"/></filter>`,
    );
    const turn = scene.turns?.[source.role];
    if (turn !== undefined) {
      // Orbit's own solids, a sphere or a deep prism, each face in the
      // light's color, brightest where it turns to us: it glows.
      const { width, height } = shapeSize(source.role);
      const solid: Solid = {
        role: source.role,
        x: source.at[0],
        y: source.at[1],
        z: 0,
        size:
          (scene.unit ?? atom) * Math.max(width, height) * (turn.scale ?? 1),
        yaw: turn.yaw,
        pitch: turn.pitch,
        roll: turn.roll ?? 0,
        // One depth for all, measured on the shapes' 1×1 square: what differs
        // is only how each is turned.
        depth: (scene.unit ?? atom) * SOLID_DEPTH,
      };
      const base = parseHex(source.color);
      // The other three lights, whose colors fall on this one.
      const others = shining.filter((other) => other.role !== source.role);
      // What the others' light adds at a point, beyond the dark's own.
      const neighborLight = (
        point: Vec,
        normal: Vec,
      ): [number, number, number] => {
        const lit3 = lit(point, normal, others);
        return [
          lit3[0] - AMBIENT[0],
          lit3[1] - AMBIENT[1],
          lit3[2] - AMBIENT[2],
        ];
      };
      const withNeighbors = (
        color: readonly number[],
        point: Vec,
        normal: Vec,
      ): [number, number, number] => {
        const added = neighborLight(point, normal);
        return [
          (color[0] ?? 0) + 0.6 * added[0],
          (color[1] ?? 0) + 0.6 * added[1],
          (color[2] ?? 0) + 0.6 * added[2],
        ];
      };
      // A light glows from every face: its sides bright in its color, a
      // little brighter where they turn to us, never dark; and lit by the others.
      const glowing = (point: Vec, normal: Vec): [number, number, number] => {
        const facing = Math.max(0, normal[2]);
        return withNeighbors(
          blend(base, [255, 255, 255], 0.08 + 0.12 * facing),
          point,
          normal,
        );
      };
      // Its face as Orbit's colored atoms glow: white at the center, its
      // color, a darker edge. The sphere glows the same way, all over.
      const centerTone = blend(base, [255, 255, 255], 0.6);
      const edgeTone = blend(base, [0, 0, 0], 0.12);
      const glowingSphere = (
        point: Vec,
        normal: Vec,
      ): [number, number, number] => {
        const t = Math.min(1, Math.hypot(normal[0], normal[1]));
        return withNeighbors(
          t < 0.55
            ? blend(centerTone, base, t / 0.55)
            : blend(base, edgeTone, (t - 0.55) / 0.45),
          point,
          normal,
        );
      };
      const drawn =
        source.role === 'identity'
          ? sphere(solid, [], placement.scale, 300, glowingSphere)
          : prism(solid, [], glowing, (points) => {
              // Centered where the face balances, not on its box's middle,
              // reaching as far as Orbit's does: 0.6 of the box's side.
              let area = 0;
              let cx = 0;
              let cy = 0;
              for (const [index, [x0, y0]] of points.entries()) {
                const [x1, y1] = points[(index + 1) % points.length] ?? [
                  x0,
                  y0,
                ];
                const cross = x0 * y1 - x1 * y0;
                area += cross;
                cx += (x0 + x1) * cross;
                cy += (y0 + y1) * cross;
              }
              const xs = points.map(([x]) => x);
              const ys = points.map(([, y]) => y);
              const side = Math.max(
                Math.max(...xs) - Math.min(...xs),
                Math.max(...ys) - Math.min(...ys),
              );
              defs.push(
                `<radialGradient id="${id}-cap" gradientUnits="userSpaceOnUse" cx="${n(cx / (3 * area))}" cy="${n(cy / (3 * area))}" r="${n(0.6 * side)}"><stop offset="0" stop-color="${hexOf(centerTone)}"/><stop offset="0.55" stop-color="${source.color}"/><stop offset="1" stop-color="${hexOf(edgeTone)}"/></radialGradient>`,
              );
              return `url(#${id}-cap)`;
            });
      // Its glow as light: the bloom's layers added to the dark beneath them
      // (screen), centered on the shape; then the shape itself, crisp, on top.
      const bloom = BLOOM.map((layer, index) => {
        const color = hexOf(
          layer.white > 0
            ? blend(base, [255, 255, 255], layer.white)
            : pureHue(base),
        );
        defs.push(
          `<filter id="${id}-bloom-${index}" x="-1" y="-1" width="3" height="3"><feGaussianBlur stdDeviation="${n(layer.blur * atom)}"/></filter>`,
        );
        return `<g opacity="${layer.strength}" filter="url(#${id}-bloom-${index})" fill="${color}" style="mix-blend-mode:screen">${drawn.silhouette.replaceAll('#000000', color)}</g>`;
      }).join('');
      body.push(bloom, drawn.faces);
      return;
    }
    body.push(
      `<g opacity="${scene.turns ? 0.35 : 0.7}" filter="url(#${id}-glow)">${shape(atom * 1.12)} fill="${source.color}"/></g>`,
      `${shape(atom)} fill="url(#${id})"/>`,
    );
  };
  // Each bond over the atom it leaves from, reaching its center, and under
  // the one it reaches: the first over the subject, the second over the
  // predicate (an exception for art only: bonds run under their atoms).
  drawLight(subject);
  if (hasBonds) {
    body.push(
      bondSvg({
        id: 'observed:0',
        from: point(subject),
        to: point(predicate),
        atomSize: atom,
        ground: 'dark',
      }),
    );
  }
  drawLight(predicate);
  if (hasBonds) {
    body.push(
      bondSvg({
        id: 'observed:1',
        from: point(predicate),
        to: point(object),
        atomSize: atom,
        ground: 'dark',
      }),
    );
  }
  drawLight(object);
  if (scene.bridge !== undefined) {
    drawLight(light('bridge'));
  }

  if (scene.overlay !== undefined) {
    body.push(scene.overlay);
  }
  return `<defs>${defs.join('')}</defs><g transform="translate(${n(placement.x)} ${n(placement.y)}) scale(${n(placement.scale)}) translate(${-focus.x} ${-focus.y})">${body.join('')}</g>`;
}

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
const falloff = (t: number, k: number): number =>
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
function ditheredImage(
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
function blend(
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
const LIGHT = {
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
/** A solid's depth, as a share of its size. */
const DEPTH = 0.45;

/** The atoms in the dark: role, place, depth (toward us +), size across, and how each is turned and tipped, in degrees. */
const SOLIDS: readonly {
  role: Role;
  x: number;
  y: number;
  z: number;
  size: number;
  yaw: number;
  pitch: number;
}[] = [
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

const n = (value: number): number => Number(value.toFixed(2));

/** A role's outline, its rounded corners traced, `size` across at its widest, centred on 0. */
function outline(role: Role, size: number): [number, number][] {
  const { width, height } = shapeSize(role);
  const unit = size / Math.max(width, height);
  const radius = ROUNDING * unit;
  return roundedOutline(role, role, 1).flatMap((corner) => {
    const turn = corner.to - corner.from;
    const steps =
      turn === 0 ? 0 : Math.max(2, Math.ceil(Math.abs(turn) / 0.07));
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

interface Light {
  role: Role;
  color: Hex;
  rgb: readonly [number, number, number];
  at: Vec;
}

/** A face's color, at `point` facing `normal`: the ambient, and each light by how it turns to it and how near. */
function lit(
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
const hexOf = (rgb: readonly number[]): Hex =>
  rgbToHex([channel(rgb[0]), channel(rgb[1]), channel(rgb[2])]);

/** A flat-faced solid: its faces turned to us, each lit, as SVG; and its outline's faces for a shadow. */
function prism(
  solid: (typeof SOLIDS)[number],
  lights: readonly Light[],
): { faces: string; silhouette: string } {
  const yaw = (solid.yaw * Math.PI) / 180;
  const pitch = (solid.pitch * Math.PI) / 180;
  const half = (solid.size * DEPTH) / 2;
  const traced = outline(solid.role, solid.size);
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
  const faces: { depth: number; d: string; fill: Hex }[] = [];
  const caps: { depth: number; d: string; fill: Hex }[] = [];
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
      d: path(points),
      fill: hexOf(lit(centre, normal, lights)),
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
      ...caps.map((face) => `<path d="${face.d}" fill="${face.fill}"/>`),
    ].join(''),
    silhouette: [...faces, ...caps]
      .map(
        (face) => `<path d="${face.d}" stroke="#000000" stroke-width="0.8"/>`,
      )
      .join(''),
  };
}

/** A sphere, each pixel lit as its surface turns to each light, dithered; and its outline for a shadow. */
function sphere(
  solid: (typeof SOLIDS)[number],
  lights: readonly Light[],
  scale: number,
  seed: number,
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
      const color = lit(
        [solid.x + dx * radius, solid.y + dy * radius, solid.z + dz * radius],
        [dx, dy, dz],
        lights,
      );
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
  const placement = atomsPlacement(frame);
  const defs: string[] = [];
  const body: string[] = [];

  // The pool of light, as Observed's, dithered.
  const pool = { x: FOCUS.x, y: FOCUS.y + 26, radius: 624 };
  const ground = parseHex(OBSERVED_GROUND);
  const poolLight = parseHex('#9a9ab8');
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

  // The triple, its atoms the lights.
  const light = (role: Role, step: number): Light => {
    const angle = (TRIPLE.degrees * Math.PI) / 180;
    // Each atom placed so its true center is on the line: the triangle a
    // little higher than its box's middle, so the bond runs straight.
    const centre = balance(role, TRIPLE.size);
    const color = rgbToHex(ROLE_COLORS[role]);
    const rgb = blend(parseHex(color), [255, 255, 255], LIGHT.white);
    return {
      role,
      color,
      rgb,
      at: [
        TRIPLE.x + step * 2 * TRIPLE.size * Math.cos(angle) - centre.x,
        TRIPLE.y + step * 2 * TRIPLE.size * Math.sin(angle) - centre.y,
        LIGHT.forward,
      ],
    };
  };
  const lights = [
    light('identity', -1),
    light('predicate', 0),
    light('object', 1),
  ] as const;

  // The solids, back to front, each after its shadow, cast away from the nearest light.
  for (const [index, solid] of SOLIDS.entries()) {
    const drawn =
      solid.role === 'identity'
        ? sphere(solid, lights, placement.scale, 200 + index)
        : prism(solid, lights);
    const nearest = [...lights].sort(
      (a, b) =>
        Math.hypot(a.at[0] - solid.x, a.at[1] - solid.y) -
        Math.hypot(b.at[0] - solid.x, b.at[1] - solid.y),
    )[0];
    if (nearest !== undefined) {
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
    const offset = balance(l.role, TRIPLE.size);
    return { x: l.at[0] + offset.x, y: l.at[1] + offset.y };
  };
  defs.push(
    `<filter id="remake-beam" x="-0.2" y="-2" width="1.4" height="5"><feGaussianBlur stdDeviation="11"/></filter>`,
  );
  for (const [from, to] of [
    [subject, predicate],
    [predicate, object],
  ] as const) {
    body.push(
      `<line x1="${n(point(from).x)}" y1="${n(point(from).y)}" x2="${n(point(to).x)}" y2="${n(point(to).y)}" stroke="#ffffff" stroke-opacity="0.18" stroke-width="13" stroke-linecap="round" filter="url(#remake-beam)"/>`,
    );
  }
  body.push(
    bondSvg({
      id: 'observed:0',
      from: point(subject),
      to: point(predicate),
      atomSize: TRIPLE.size,
      ground: 'dark',
    }),
    bondSvg({
      id: 'observed:1',
      from: point(predicate),
      to: point(object),
      atomSize: TRIPLE.size,
      ground: 'dark',
    }),
  );
  for (const source of lights) {
    const id = `remake-light-${source.role}`;
    const shape = (size: number) =>
      `<path d="${outlinePath(source.role, size / Math.max(shapeSize(source.role).width, shapeSize(source.role).height), 0)}" transform="translate(${n(source.at[0])} ${n(source.at[1])})"`;
    defs.push(
      `<radialGradient id="${id}" cx="0.5" cy="0.5" r="0.6"><stop offset="0" stop-color="${hexOf(blend(parseHex(source.color), [255, 255, 255], 0.6))}"/><stop offset="0.55" stop-color="${source.color}"/><stop offset="1" stop-color="${hexOf(blend(parseHex(source.color), [0, 0, 0], 0.12))}"/></radialGradient>`,
      `<filter id="${id}-glow" x="-1" y="-1" width="3" height="3"><feGaussianBlur stdDeviation="${n(TRIPLE.size * 0.3)}"/></filter>`,
    );
    body.push(
      `<g opacity="0.7" filter="url(#${id}-glow)">${shape(TRIPLE.size * 1.12)} fill="${source.color}"/></g>`,
      `${shape(TRIPLE.size)} fill="url(#${id})"/>`,
    );
  }

  return `<defs>${defs.join('')}</defs><g transform="translate(${n(placement.x)} ${n(placement.y)}) scale(${n(placement.scale)}) translate(${-FOCUS.x} ${-FOCUS.y})">${body.join('')}</g>`;
}

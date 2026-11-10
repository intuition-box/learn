/**
 * Atoms: the logo mark's four shapes as solids, each placed, turned and
 * tipped its own way in 3D, among small atoms in their colors, a few near
 * ones out of focus. After Saulo's reference, and placed by hand with him,
 * so the numbers below are the picture: drawn once at 1920 × 1080 (the
 * design) and fitted to any frame.
 *
 * The 3D is a view, not a renderer: each shape's face is its mark outline
 * under a turn (yaw) and a tip back (pitch), seen straight on, which keeps
 * a vertical line vertical, and its sides are copies of the face stacked
 * into the picture, one flat shade of the shape. So every outline stays
 * the mark's own, exactly. The one exception to the brand's rule that no
 * atom turns: the triangle is turned 10° in the picture's plane, Saulo's
 * call for this picture only.
 */

import { parseHex, rgbToHex } from '@/components/brand/color';
import type { Hex } from '@/components/brand/color';
import { logoMarkLayout } from '@/components/onboarding/logo-mark';
import type { Role } from '@/components/playground/story-model';
import { outlinePath, ROLE_COLORS } from '@/components/playground/story-shapes';

import { seededRandom } from './atom-field';

/** The design every number below is in. */
export const ATOMS_DESIGN = { width: 1920, height: 1080 } as const;

/** A frame to fit the design into, and the corner a platform covers, kept clear of atoms. */
export type AtomsGround = 'dark' | 'light';

/**
 * Each ground's color, how much darker than its face a shape's side is, how
 * far its sides fade into the ground by the back, and the face's rim: one
 * flat shade of the shape's color on both grounds.
 */
const GROUNDS: Readonly<
  Record<AtomsGround, { hex: Hex; side: number; fade: number; rim: number }>
> = {
  dark: { hex: '#16161e', side: 0.3, fade: 0, rim: 0.3 },
  light: { hex: '#ffffff', side: 0.2, fade: 0, rim: 0.2 },
};

export interface AtomsFrame {
  width: number;
  height: number;
  clear?: { x: number; y: number; width: number; height: number };
}

/** The picture's centre in the design: a frame wider than tall keeps it at the same share of its width. */
const FOCUS = { x: 1210, y: 540 } as const;
/** How wide the cluster is with its small atoms, in the design: a tall frame fits it across. */
const CLUSTER_WIDTH = 1180;

const n = (value: number): number => Number(value.toFixed(3));

/** `color` mixed `share` of the way to `other`. */
function mix(color: Hex, other: Hex, share: number): Hex {
  const from = parseHex(color);
  const to = parseHex(other);
  return rgbToHex([
    Math.round(from[0] + (to[0] - from[0]) * share),
    Math.round(from[1] + (to[1] - from[1]) * share),
    Math.round(from[2] + (to[2] - from[2]) * share),
  ]);
}

const roleHex = (role: Role): Hex => rgbToHex(ROLE_COLORS[role]);

/** The four shapes, back to front: where each stands, how big, and how it is turned and tipped, in degrees. */
const PIECES: readonly {
  role: Role;
  x: number;
  y: number;
  scale: number;
  yaw: number;
  pitch: number;
  /** A turn in the picture's plane: the triangle's 10°, Saulo's exception. */
  roll?: number;
  /**
   * An optical correction: the back face widened by this share, pinned at
   * its left edge (`left`, in the mark's units) so it grows to the right,
   * the sides widening from the exact front to it.
   */
  widen?: { share: number; left: number };
}[] = [
  { role: 'identity', x: 1070, y: 345, scale: 2.3, yaw: -34, pitch: 24 },
  {
    role: 'object',
    x: 1050,
    y: 620,
    scale: 2.2,
    yaw: -28,
    pitch: -24,
    widen: { share: 0.01, left: 1.5 },
  },
  {
    role: 'predicate',
    x: 1325,
    y: 390,
    scale: 2.35,
    yaw: 44,
    pitch: -8,
    roll: -10,
  },
  { role: 'bridge', x: 1345, y: 680, scale: 2.35, yaw: 40, pitch: -10 },
];

/** Each shape's centre in the mark's units: the point it turns about. */
const CENTRES: Readonly<Record<Role, readonly [number, number]>> = {
  identity: [51.5, 54],
  predicate: [181.5, 52],
  object: [51.5, 164],
  bridge: [181.5, 164],
};

/** How deep each shape is, in the mark's units, and its sides' step. */
const DEPTH = 28;
const DEPTH_STEP = 0.5;

/**
 * A turn on the vertical axis and a tip back, seen straight on: how a face
 * maps to the picture (`a`, `b`, `d`), and where one unit of depth lands.
 */
function view(yawDegrees: number, pitchDegrees: number) {
  const yaw = (yawDegrees * Math.PI) / 180;
  const pitch = (pitchDegrees * Math.PI) / 180;
  return {
    a: Math.cos(yaw),
    b: Math.sin(yaw) * Math.sin(pitch),
    d: Math.cos(pitch),
    depth: [-Math.sin(yaw), Math.cos(yaw) * Math.sin(pitch)] as const,
  };
}

/** The four shapes, solid: sides stacked back to front, deepening, then the face. */
function bigShapes(ground: AtomsGround): { defs: string; body: string } {
  const look = GROUNDS[ground];
  const shapes = new Map(
    logoMarkLayout().shapes.map((shape) => [shape.role, shape]),
  );
  const defs: string[] = [];
  const body: string[] = [];
  for (const piece of PIECES) {
    const shape = shapes.get(piece.role);
    if (shape === undefined) {
      continue;
    }
    const v = view(piece.yaw, piece.pitch);
    const [cx, cy] = CENTRES[piece.role];
    // The outline at `depth`: exact at the face, widened to the right toward the back.
    const widened = (depth: number): string => {
      const offset = `${n(shape.x - cx)} ${n(shape.y - cy)}`;
      if (piece.widen === undefined) {
        return `translate(${offset})`;
      }
      const { share, left } = piece.widen;
      return `translate(${n(left + shape.x - cx)} ${n(shape.y - cy)}) scale(${n(1 + share * (depth / DEPTH))} 1) translate(${n(-left)} 0)`;
    };
    const place = (depth: number) =>
      `translate(${n(piece.x)} ${n(piece.y)}) scale(${n(piece.scale)}) rotate(${piece.roll ?? 0}) translate(${n(v.depth[0] * depth)} ${n(v.depth[1] * depth)}) matrix(${n(v.a)} ${n(v.b)} 0 ${n(v.d)} 0 0) ${widened(depth)}`;
    // The outline once, used by every layer.
    const outline = `atoms-${piece.role}`;
    defs.push(`<path id="${outline}" d="${shape.d}"/>`);
    const draw = (paint: string, depth: number) =>
      `<use href="#${outline}" transform="${place(depth)}" fill="${paint}"/>`;
    const face = roleHex(piece.role);
    const side = mix(face, '#000000', look.side);
    for (let step = DEPTH / DEPTH_STEP; step >= 3; step -= 1) {
      const depth = step * DEPTH_STEP;
      body.push(draw(mix(side, look.hex, look.fade * (depth / DEPTH)), depth));
    }
    // The face's own edge, just behind it.
    for (const depth of [1.2, 0.8]) {
      body.push(draw(mix(face, '#000000', look.rim), depth));
    }
    const gradient = `atoms-face-${piece.role}`;
    defs.push(
      `<linearGradient id="${gradient}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${mix(face, '#ffffff', 0.18)}"/><stop offset="1" stop-color="${mix(face, '#000000', 0.18)}"/></linearGradient>`,
    );
    body.push(draw(`url(#${gradient})`, 0));
  }
  return { defs: defs.join(''), body: body.join('') };
}

/** One small atom, in the design: its centre, size, focus (-1 sharp, 0 to 3 ever softer) and opacity. */
export interface SmallAtom {
  role: Role;
  x: number;
  y: number;
  size: number;
  blur: number;
  opacity: number;
}

const BLURS = [0.8, 2.2, 5, 9] as const;
const DRAWN_ROLES: readonly Role[] = [
  'identity',
  'predicate',
  'object',
  'bridge',
];
const SEED = 0x1a2b3c;

/**
 * The small atoms round the shapes, every one filled: a seeded scatter,
 * then the soft, far ones, then the few placed by hand. Each is drawn
 * centred on its point.
 */
export function smallAtoms(): readonly SmallAtom[] {
  const random = seededRandom(SEED);
  const atoms: SmallAtom[] = [];
  const centre = { x: 1210, y: 490 };
  const reach = 340;
  for (let index = 0; index < 80; index += 1) {
    const angle = random() * Math.PI * 2;
    const r = reach * (0.55 + Math.pow(random(), 0.7) * 0.9);
    let x = centre.x + Math.cos(angle) * r * 1.15;
    let y = centre.y + Math.sin(angle) * r * 0.95;
    // None over the shapes.
    if (Math.abs(x - centre.x) < 300 && Math.abs(y - centre.y) < 330) {
      continue;
    }
    const drawn = DRAWN_ROLES[Math.floor(random() * 4)] ?? 'identity';
    // Two pinks Saulo made green, so predicates.
    const role = index === 9 || index === 4 ? 'predicate' : drawn;
    const focus = random();
    const blur = focus < 0.55 ? -1 : focus < 0.8 ? 0 : focus < 0.93 ? 1 : 2;
    const size =
      blur === 2
        ? 26 + random() * 18
        : blur === 1
          ? 12 + random() * 10
          : 5 + random() * 12;
    // The draw that once outlined some: kept, so every atom keeps its place.
    if (blur < 1) {
      random();
    }
    const opacity = blur === 2 ? 0.28 : blur === 1 ? 0.5 : 1;
    // The group at the top, lifted, so the cluster's top runs round.
    if (((x - 1195) / 173) ** 2 + ((y - 119) / 52) ** 2 < 1) {
      y -= 40;
    }
    // Two small ones at the top, up and to the left.
    if (index === 78 || index === 49) {
      x -= 45;
      y -= 30;
    }
    // Each was drawn from its point less half its size: kept as placed.
    atoms.push({
      role,
      x: x - size / 2,
      y: y - size / 2,
      size,
      blur,
      opacity,
    });
  }
  // The far ones, big and soft.
  for (let index = 0; index < 6; index += 1) {
    let x = ATOMS_DESIGN.width * (0.1 + random() * 0.85);
    const y = ATOMS_DESIGN.height * (0.1 + random() * 0.85);
    const size = 30 + random() * 30;
    const role = DRAWN_ROLES[index % 4] ?? 'identity';
    if (index === 3) {
      continue;
    }
    if (index === 4) {
      x += 600;
    }
    atoms.push({ role, x, y, size, blur: 3, opacity: 0.12 });
  }
  // The ones placed by hand: a few gathered at the bottom, three on the left.
  for (const [role, x, y, size] of [
    ['identity', 812, 990, 20],
    ['bridge', 902, 1036, 40],
    ['object', 768, 1048, 16],
    ['identity', 508, 560, 34],
    ['predicate', 648, 802, 24],
    ['predicate', 559, 942, 40],
  ] as const) {
    atoms.push({ role, x, y, size, blur: 3, opacity: 0.12 });
  }
  // Four more, sharp, on the left, where the cluster thinned.
  for (const [role, x, y, size] of [
    ['predicate', 728, 536, 12],
    ['identity', 783, 608, 10],
    ['predicate', 822, 657, 10],
    ['identity', 777, 701, 12],
  ] as const) {
    atoms.push({ role, x, y, size, blur: -1, opacity: 1 });
  }
  return atoms;
}

/** How the design sits in `frame`: its scale, and where the design's focus lands. */
export function atomsPlacement(frame: AtomsFrame): {
  scale: number;
  x: number;
  y: number;
} {
  const scale = Math.min(
    frame.height / ATOMS_DESIGN.height,
    frame.width / CLUSTER_WIDTH,
  );
  const isWide = frame.width >= frame.height;
  return {
    scale,
    x: isWide ? frame.width * (FOCUS.x / ATOMS_DESIGN.width) : frame.width / 2,
    y: frame.height / 2,
  };
}

/**
 * The small atoms `frame` shows, each with where its centre lands in the
 * frame and how far it reaches: all but those in the corner the frame keeps
 * clear.
 */
export function atomsInFrame(frame: AtomsFrame): readonly {
  atom: SmallAtom;
  x: number;
  y: number;
  reach: number;
}[] {
  const placement = atomsPlacement(frame);
  const { clear } = frame;
  return smallAtoms()
    .map((atom) => ({
      atom,
      x: placement.x + (atom.x - FOCUS.x) * placement.scale,
      y: placement.y + (atom.y - FOCUS.y) * placement.scale,
      reach: (atom.size / 2) * placement.scale,
    }))
    .filter(
      ({ x, y, reach }) =>
        clear === undefined ||
        x + reach < clear.x ||
        x - reach > clear.x + clear.width ||
        y + reach < clear.y ||
        y - reach > clear.y + clear.height,
    );
}

/**
 * The atoms fitted to `frame`, as SVG elements, on `ground`: the ground
 * itself is the document's; the shapes' sides fade into it as they go back.
 */
export function atomsSvg(frame: AtomsFrame, ground: AtomsGround): string {
  const placement = atomsPlacement(frame);
  const small = atomsInFrame(frame).map(({ atom }) => atom);
  const filters = BLURS.map(
    (deviation, index) =>
      `<filter id="atoms-blur-${index}" x="-2" y="-2" width="5" height="5"><feGaussianBlur stdDeviation="${deviation}"/></filter>`,
  ).join('');
  // Each role's outline once, at 100 units, scaled to every atom of it.
  const unit = 100;
  const outlines = (['identity', 'predicate', 'object', 'bridge'] as const)
    .map(
      (role) =>
        `<path id="atoms-dot-${role}" d="${outlinePath(role, unit, 0)}"/>`,
    )
    .join('');
  // The blur on a group of its own, unscaled, so each atom softens as
  // much whatever its size.
  const dots = small
    .map(
      ({ role, x, y, size, blur, opacity }) =>
        `<g transform="translate(${n(x)} ${n(y)})" opacity="${opacity}"${blur >= 0 ? ` filter="url(#atoms-blur-${blur})"` : ''}><use href="#atoms-dot-${role}" transform="scale(${n(size / unit)})" fill="${roleHex(role)}"/></g>`,
    )
    .join('');
  const shapes = bigShapes(ground);
  return `<defs>${filters}${outlines}${shapes.defs}</defs><g transform="translate(${n(placement.x)} ${n(placement.y)}) scale(${n(placement.scale)}) translate(${-FOCUS.x} ${-FOCUS.y})">${dots}${shapes.body}</g>`;
}

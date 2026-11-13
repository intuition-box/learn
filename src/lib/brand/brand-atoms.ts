/**
 * Atoms: the four atom shapes as solids that glow, each placed, turned and
 * tipped its own way in 3D, among small atoms in their colors, a few near
 * ones out of focus. After Saulo's reference, and placed by hand with him,
 * so the numbers below are the picture: drawn once at 1920 × 1080 (the
 * design) and fitted to any frame (`brand-atoms-frame.ts`).
 *
 * The four shapes are drawn by the 3D recipe, as Multiplayer's (the brand
 * skill's reference/3d.md, `sceneSvg`): the atom shapes at one unit, prisms
 * 0.4 of it deep, the circle a sphere; each lit from its core in its own
 * color, every side the same light, a thin line where faces meet and round
 * each; glowing on Midnight. Not on white, where light added shows
 * nothing, and there its fronts are no more saturated than the role colors. The one exception to the brand's rule that no atom turns: the
 * triangle is turned 10° in its own plane, Saulo's call for this picture
 * only.
 */

import { rgbToHex } from '@/components/brand/color';
import type { Hex } from '@/components/brand/color';
import type { Role } from '@/components/playground/story-model';
import { outlinePath, ROLE_COLORS } from '@/components/playground/story-shapes';

import { seededRandom } from './atom-field';
import { ATOMS_DESIGN, ATOMS_FOCUS, atomsPlacement } from './brand-atoms-frame';
import type { AtomsFrame } from './brand-atoms-frame';
import { sceneSvg } from './brand-observed';
import type { Scene } from './brand-observed';

/** Atoms' two grounds: Midnight, or white. */
export type AtomsGround = 'dark' | 'light';

const n = (value: number): number => Number(value.toFixed(3));

const roleHex = (role: Role): Hex => rgbToHex(ROLE_COLORS[role]);

/** The four shapes' one unit, in the design: the circle, 0.9 of it across, as wide as the mark's circle it replaces. */
const UNIT = 263;

/**
 * The four shapes as Atoms' scene: each by its centre where Saulo placed
 * it, turned and tipped its own way in degrees (a negative turn faces left,
 * a positive tip faces up), all at one unit; on its ground, so it glows on
 * Midnight only. No gray solids, no pool of light, no bonds: the small
 * atoms are Atoms' own.
 */
function atomsScene(ground: AtomsGround): Scene {
  return {
    solids: [],
    triple: {
      identity: [1070, 345],
      predicate: [1325, 390],
      object: [1050, 620],
    },
    bridge: [1345, 680],
    size: 0.9 * UNIT,
    unit: UNIT,
    turns: {
      identity: { yaw: -34, pitch: 24 },
      // Turned 10° in its own plane: Saulo's exception for this picture.
      predicate: { yaw: 44, pitch: -8, roll: -10 },
      object: { yaw: -28, pitch: -24 },
      bridge: { yaw: 40, pitch: -10 },
    },
    bonds: false,
    hasPool: false,
    ground,
  };
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
      x: placement.x + (atom.x - ATOMS_FOCUS.x) * placement.scale,
      y: placement.y + (atom.y - ATOMS_FOCUS.y) * placement.scale,
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
 * The atoms fitted to `frame`, as SVG elements, on `ground`: the small
 * atoms, then the four shapes over them. The ground itself is the
 * document's.
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
  return `<defs>${filters}${outlines}</defs><g transform="translate(${n(placement.x)} ${n(placement.y)}) scale(${n(placement.scale)}) translate(${-ATOMS_FOCUS.x} ${-ATOMS_FOCUS.y})">${dots}</g>${sceneSvg(frame, atomsScene(ground))}`;
}

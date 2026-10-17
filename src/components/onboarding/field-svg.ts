/**
 * The field as a still picture, in SVG: the atoms and the claims between
 * them as the camera sees them from one station, drawn as the field draws
 * them at rest. Each atom is its role's shape in its role's colour, turned
 * as it is turned there, larger when near and fading into the distance;
 * each link is a faint line carrying fine dots of ink.
 *
 * For a page that shows the field without running it: the docs home's
 * header, which wears the universe the trip into the docs flies through.
 * Pure: the same picture on every build.
 */

import type { Role } from '@/components/playground/story-model';
import { outlinePath } from '@/components/playground/story-shapes';

import { smoothstep } from './field-gl';
import {
  ATOM_SIZE,
  CONNECTED_SIZE,
  LINK_OPACITY,
  MAX_ATOM_SIZE,
  MIN_ATOM_SIZE,
  NEAR,
  ROLE_COLOURS,
} from './field-scene';
import {
  buildFieldGeometry,
  CLAIM_DRAW_WINDOW,
  DEFAULT_SEEDS,
  FADE_FROM,
  FAR,
  FOCAL,
  LINK_STRIDE,
  POINT_STRIDE,
  ROLES,
  STATION_GAP,
} from './time-field-geometry';

/** The ink of the docs' text, `--wave-docs-fg`: a picture cannot read it. */
const INK = 'rgb(28 34 43)';
/** How dark the dots along a line are, against its faint hairline. */
const DOT_OPACITY = 0.5;
/** CSS pixels of line for each dot, and a dot's width. */
const DOT_SPACING_PX = 5;
const DOT_WIDTH_PX = 1.5;

const ALL_ROLES: readonly Role[] = [
  'identity',
  'predicate',
  'object',
  'subjectAndObject',
];
/** A role from the number the field's geometry gives it. */
const ROLE_BY_VALUE = new Map<number, Role>(
  ALL_ROLES.map((role) => [ROLES[role], role]),
);

/** How much of an atom shows at a depth: as the shaders' `fade`. */
function fade(depth: number): number {
  return (
    (1 - smoothstep(FADE_FROM, FAR, depth)) * smoothstep(NEAR, NEAR * 4, depth)
  );
}

/**
 * An atom's width in CSS pixels at a depth, held to the connected size
 * while its claim is drawn and shrinking into the distance: as the shaders'
 * `atomSizeAt` and `farShrink`.
 */
function sizeAt(depth: number, claim: number, links: number): number {
  const size = Math.min(
    Math.max(ATOM_SIZE / depth, MIN_ATOM_SIZE),
    MAX_ATOM_SIZE,
  );
  const connected =
    claim < 0
      ? 0
      : Math.min(Math.max((links - claim) / CLAIM_DRAW_WINDOW, 0), 1);
  const held = Math.min(Math.max(size, CONNECTED_SIZE.min), CONNECTED_SIZE.max);

  return (
    (size + (held - size) * connected) * (1 - smoothstep(FADE_FROM, FAR, depth))
  );
}

const rounded = (value: number): string => value.toFixed(1);

/**
 * The field seen from `station`, `width` by `height` CSS pixels, with its
 * links drawn up to `links` (one of `LINK_LEVELS`), as an SVG document.
 */
export function fieldSvg({
  station,
  links,
  width,
  height,
}: {
  station: number;
  links: number;
  width: number;
  height: number;
}): string {
  const cameraZ = station * STATION_GAP;
  const { points, links: lines } = buildFieldGeometry(DEFAULT_SEEDS);

  /** Where a point is on the picture, and how far ahead, or `null` if unseen. */
  const project = (
    x: number,
    y: number,
    z: number,
  ): { x: number; y: number; depth: number } | null => {
    const depth = z - cameraZ;
    if (depth < NEAR || depth >= FAR) {
      return null;
    }
    const scale = (FOCAL / depth) * (height / 2);

    return { x: width / 2 + x * scale, y: height / 2 - y * scale, depth };
  };

  // The links first, under the atoms: each half of a claim as far as it is
  // drawn, a hairline and its dots, as faint as its predicate is far.
  const drawn: string[] = [];
  for (let at = 0; at < lines.length; at += LINK_STRIDE) {
    const reveal = lines[at + 2 * POINT_STRIDE] ?? 0;
    const half = lines[at + 2 * POINT_STRIDE + 1] ?? 0;
    const progress = Math.min(
      Math.max((links - reveal) / CLAIM_DRAW_WINDOW, 0),
      1,
    );
    const grown = Math.min(Math.max(progress * 2 - half, 0), 1);
    const from = project(
      lines[at] ?? 0,
      lines[at + 1] ?? 0,
      lines[at + 2] ?? 0,
    );
    const to = project(
      lines[at + POINT_STRIDE] ?? 0,
      lines[at + POINT_STRIDE + 1] ?? 0,
      lines[at + POINT_STRIDE + 2] ?? 0,
    );
    if (grown <= 0 || from === null || to === null) {
      continue;
    }
    const endX = from.x + (to.x - from.x) * grown;
    const endY = from.y + (to.y - from.y) * grown;
    const predicate = half < 0.5 ? to : from;
    const alpha = fade(predicate.depth) * LINK_OPACITY;
    const ends = `x1="${rounded(from.x)}" y1="${rounded(from.y)}" x2="${rounded(endX)}" y2="${rounded(endY)}"`;
    drawn.push(
      `<line ${ends} stroke-opacity="${alpha.toFixed(3)}"/>`,
      `<line ${ends} class="d" stroke-opacity="${(fade(predicate.depth) * DOT_OPACITY).toFixed(3)}"/>`,
    );
  }

  // The atoms, farthest first, so the near cover the far.
  for (let at = 0; at < points.length; at += POINT_STRIDE) {
    const seed = points[at + 3] ?? 0;
    const role = ROLE_BY_VALUE.get(points[at + 4] ?? 0) ?? 'identity';
    const claim = points[at + 5] ?? -1;
    const place = project(
      points[at] ?? 0,
      points[at + 1] ?? 0,
      points[at + 2] ?? 0,
    );
    if (place === null) {
      continue;
    }
    const size = sizeAt(place.depth, claim, links);
    const alpha = fade(place.depth);
    // Turned as the shaders turn it, by its seed.
    const turn = ((seed * 91) % 1) * 360;
    drawn.push(
      `<use href="#${role}" transform="translate(${rounded(place.x)} ${rounded(place.y)}) rotate(${turn.toFixed(0)}) scale(${size.toFixed(2)})" fill-opacity="${alpha.toFixed(3)}"/>`,
    );
  }

  // Each role's shape once, a unit across, in its colour.
  const shapes = ALL_ROLES.map((role) => {
    const [red, green, blue] = ROLE_COLOURS[role];

    return `<path id="${role}" d="${outlinePath(role, 1, 0)}" fill="rgb(${red} ${green} ${blue})"/>`;
  });

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid slice">`,
    `<defs>${shapes.join('')}</defs>`,
    `<style>line{stroke:${INK};stroke-width:1}.d{stroke-width:${DOT_WIDTH_PX};stroke-linecap:round;stroke-dasharray:0 ${DOT_SPACING_PX}}</style>`,
    ...drawn,
    '</svg>',
  ].join('\n');
}

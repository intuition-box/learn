'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

import {
  outlinePath,
  ROLES,
  shapeSize,
} from '@/components/playground/story-shapes';

import { rememberLanding } from './landing';
import { ROUTES } from './stations';

/*
 * Each link has a patch of the page's colour behind it, a little see-through
 * and blurred, because the field's atoms pass under the bar. The negative
 * margin keeps the words on the bar's edge, where they were before the patch.
 */
const LINK_CLASS =
  '-mx-2 rounded-md bg-bg/80 px-2 py-1 outline-accent backdrop-blur-sm focus-visible:outline-2';

/**
 * The logo in percent of its height, so it keeps its proportions at any
 * size: how tall each shape is, in `ROLES` order, the circle a little taller
 * than the rest, and the gap after each, edge to edge, the triangle tucking
 * into the circle's side. The shapes sit on one middle line, so the circle
 * reaches a little above and below the logo's box.
 */
const LOGO_HEIGHTS = [105, 100, 100, 100] as const;
const LOGO_GAPS = [-5, 10, 10, 0] as const;
/**
 * Each shape at the size that makes it its height, how wide it is then,
 * and where its box starts so the shapes sit their gaps apart.
 */
const LOGO_SHAPES = ROLES.map((role, index) => {
  const { width, height } = shapeSize(role);
  const size = (LOGO_HEIGHTS[index] ?? 100) / height;
  return { role, size, width: width * size };
}).map((shape, index, shapes) => {
  const left = shapes
    .slice(0, index)
    .reduce((sum, { width }, at) => sum + width + (LOGO_GAPS[at] ?? 0), 0);
  return { ...shape, x: left + (shape.width - shape.size) / 2 };
});
const LOGO_WIDTH = LOGO_SHAPES.reduce(
  (sum, { width }, index) => sum + width + (LOGO_GAPS[index] ?? 0),
  0,
);

/*
 * Read left to right, circle, triangle, square is subject, predicate, object:
 * a triple, the core idea the whole film teaches. The hexagon at the end is
 * the atom that is both a subject and an object, the way triples link into a
 * graph.
 */
/**
 * The site's logo: the four role shapes in a row, in black. Its height is
 * its size, `h-4.5` (18px) here; everything else follows from it.
 */
function Logo(): ReactNode {
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${LOGO_WIDTH} 100`}
      className="h-4.5 w-auto shrink-0 overflow-visible fill-black"
    >
      {LOGO_SHAPES.map(({ role, size, x }) => (
        <path
          key={role}
          d={outlinePath(role, size, size / 2)}
          transform={`translate(${x} ${(100 - size) / 2})`}
        />
      ))}
    </svg>
  );
}

/**
 * The bar at the top of the film's page. It stays in place
 * during a trip, and its links are plain: skipping to the documentation is
 * not a trip. Skipping is remembered: the site opens on the docs next time.
 */
export function TopBar(): ReactNode {
  return (
    <header className="flex items-center justify-between px-6 py-5">
      <Link
        href={ROUTES.play}
        className={`flex items-center gap-2 font-medium ${LINK_CLASS}`}
      >
        <Logo />
        Intuition
      </Link>
      <nav aria-label="Main">
        <Link
          href={ROUTES.docs}
          className={`text-sm text-fg-muted hover:text-fg ${LINK_CLASS}`}
          onClick={() => {
            rememberLanding('docs');
          }}
        >
          Skip to docs
        </Link>
      </nav>
    </header>
  );
}

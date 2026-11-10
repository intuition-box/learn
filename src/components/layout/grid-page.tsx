import type { CSSProperties, ReactNode } from 'react';

import { COLUMN_COUNT, GRID, MAIN, PAGE, PAGE_INSET } from './grid';

const COLUMNS = Array.from(
  { length: COLUMN_COUNT },
  (_, index) => `column-${index + 1}`,
);

/**
 * The grid's look, set once on the page, so the column lines and every
 * section's rule share it:
 *
 * - `--grid-color`: the grid's color at full strength. Blueprint blue unless
 *   the page passes its own, from Tailwind's palette: the drafting
 *   convention for construction lines.
 * - `--grid-marks-color`: the "+" marks, at 60% of it, firmer than the
 *   lines they cross.
 * - `--grid-lines-color`: the lines, at 30% of it, light enough that a card
 *   or a swatch set over them reads in its own colors.
 * - `--grid-edges-color`: the solid lines, the main body's two edges and
 *   the sections' rules, at 15%: solid, they would read twice as dark as
 *   the dashed lines, drawn only half the time, at the same strength.
 * - `--grid-lines-width`: a hairline, one device pixel wherever the screen
 *   has two to a CSS pixel, and 1px where it has one, as nothing finer can
 *   be drawn there.
 */
const THEME = [
  '[--grid-color:var(--color-sky-500)]',
  '[--grid-marks-color:color-mix(in_oklab,var(--grid-color)_60%,transparent)]',
  '[--grid-lines-color:color-mix(in_oklab,var(--grid-color)_30%,transparent)]',
  '[--grid-edges-color:color-mix(in_oklab,var(--grid-color)_15%,transparent)]',
  '[--grid-lines-width:1px]',
  '[@media(min-resolution:2dppx)]:[--grid-lines-width:0.5px]',
].join(' ');

const WIDTH = 'border-x-(length:--grid-lines-width)';

/**
 * The columns' dashes, drawn rather than left to the browser: 4px on and
 * 4px off at any width and in every browser, where a dashed border's dashes
 * shrink with the line and differ from one browser to the next. Every
 * column's dashes start at the page's top, so they stand level across it.
 */
const DASHES =
  '[border-image:repeating-linear-gradient(to_bottom,var(--grid-lines-color)_0_4px,transparent_4px_8px)_1]';

/**
 * The page's grid behind it: the main body's two edges, solid, and the
 * columns' edges between them, dashed, all in the one color. They fade in
 * from the top of the page and out at its foot, so the page eases into its
 * structure rather than starting cut off. Only the edges on a phone, where
 * every block is the full width.
 */
function GridLines(): ReactNode {
  return (
    <div
      aria-hidden
      className={`${PAGE} pointer-events-none absolute inset-0 -z-10`}
    >
      <div className={`${MAIN} ${PAGE_INSET}`}>
        <div
          className={`h-full ${WIDTH} border-(--grid-edges-color) [mask-image:linear-gradient(to_bottom,transparent,black_24rem,black_calc(100%-24rem),transparent)]`}
        >
          <div className={`${GRID} hidden h-full sm:grid`}>
            {COLUMNS.map((column) => (
              <div
                key={column}
                className={`${WIDTH} ${DASHES} first:border-s-0 last:border-e-0`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export interface GridPageProps {
  /**
   * The grid's color at full strength, any CSS color, to draw it in a
   * project's own: the marks take 60% of it, the dashed lines 30%, the
   * solid ones 15%. A stylesheet can set `--grid-color` instead, for a
   * dark theme.
   */
  color?: string | undefined;
  className?: string | undefined;
  children: ReactNode;
}

/**
 * A page drawn on its grid, as its theme: the column lines behind it from
 * its very top, so it holds the whole page, top bar included. Its sections
 * mark their tops with `GridRule`. A page laid out by `PAGE`.
 */
export function GridPage({
  color,
  className,
  children,
}: GridPageProps): ReactNode {
  // The one inline style: a color the page passes, not one the CSS knows.
  const style: (CSSProperties & Record<'--grid-color', string>) | undefined =
    color === undefined ? undefined : { '--grid-color': color };
  return (
    // Clipped across, so nothing drawn past the page's sides can scroll it
    // sideways; clip, not hidden, so the sticky contents still stick.
    <div
      className={`relative isolate overflow-x-clip ${THEME} ${className ?? ''}`}
      style={style}
    >
      <GridLines />
      {children}
    </div>
  );
}

/**
 * Where a rule crosses one of the main body's edges: a "+", its arms laid
 * exactly over the two lines, so it reads as their crossing drawn firmer.
 */
function Mark({ side }: { side: 'start' | 'end' }): ReactNode {
  return (
    // The edge's line is inside the main body: at its left edge on the
    // start side, a line's width in from its right edge on the end side.
    <span
      className={`absolute top-0 ${side === 'start' ? 'left-0' : 'right-(--grid-lines-width)'}`}
    >
      <span className="absolute top-0 left-[-4px] h-(--grid-lines-width) w-[calc(8px+var(--grid-lines-width))] bg-(--grid-marks-color)" />
      <span className="absolute top-[-4px] left-0 h-[calc(8px+var(--grid-lines-width))] w-(--grid-lines-width) bg-(--grid-marks-color)" />
    </span>
  );
}

/**
 * A section's top line, from one side of the window to the other, with a
 * "+" where it crosses each of the main body's edges. For the top of a
 * `relative` block exactly as wide as the main body's columns, inside a
 * `GridPage`. Behind the content, as the column lines are.
 */
export function GridRule(): ReactNode {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 -z-10"
    >
      {/* A window's width past either side, wherever the section sits: the page clips the rest. */}
      <div className="absolute inset-x-[-100vw] top-0 h-(--grid-lines-width) bg-(--grid-edges-color)" />
      <Mark side="start" />
      <Mark side="end" />
    </div>
  );
}

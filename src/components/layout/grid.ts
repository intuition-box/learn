/**
 * The whole page: a sidebar either side, fixed, and the main body between
 * them. The left sidebar holds the contents; the right one, as wide, is
 * empty, so the main body stands in the middle of the page.
 *
 * - From 1480px, sidebars of 16rem: room for the contents' rail.
 * - From xl to 1480px, sidebars of 4rem: room for the minimap's lines.
 * - Below xl, no sidebars: the main body takes the page.
 */
export const PAGE =
  'grid xl:grid-cols-[4rem_minmax(0,1fr)_4rem] min-[92.5rem]:grid-cols-[16rem_minmax(0,1fr)_16rem]';

/**
 * The main body's place on `PAGE`: between the sidebars, at most 72rem
 * wide, in the middle of the room they leave it.
 */
export const MAIN = 'row-start-1 mx-auto w-full max-w-6xl xl:col-start-2';

/** The main body's inset: its 12 columns start this far in from its edges. */
export const PAGE_INSET = 'px-4 sm:px-6';

/**
 * The page's grid: 12 columns, 12px apart, the same 12 from the top of the
 * page to the bottom. A page's main body is a `GRID`; every block inside it
 * that holds more blocks is a `SUBGRID`, which takes the page's own columns
 * rather than drawing its own, so every edge on the page lands on the
 * edge of one of the same 12 columns.
 *
 * Twelve, as it splits evenly into 2, 3, 4, 6 and 12.
 */
export const GRID = 'grid grid-cols-12 gap-x-3';

/** How many columns `GRID` draws. */
export const COLUMN_COUNT = 12;

/** A block across the whole grid that hands its children the page's columns. */
export const SUBGRID = 'col-span-full grid grid-cols-subgrid';

/**
 * How many of the 12 columns a block spans on a wide screen. As the screen
 * narrows, each span doubles until it is the full width:
 *
 * - 2: six to a row; three on a tablet, two on a phone.
 * - 3: four to a row; two below `lg`, one on a phone.
 * - 4: three to a row; two below `md`, one on a phone.
 * - 6: two to a row; one on a phone.
 * - 8: the width for text.
 * - 10: a wide figure.
 * - 12: the whole width.
 */
export const SPAN = {
  2: 'col-span-6 sm:col-span-4 lg:col-span-2',
  3: 'col-span-full sm:col-span-6 lg:col-span-3',
  4: 'col-span-full sm:col-span-6 md:col-span-4',
  6: 'col-span-full sm:col-span-6',
  8: 'col-span-full lg:col-span-8',
  10: 'col-span-full lg:col-span-10',
  12: 'col-span-full',
} as const;

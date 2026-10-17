import { LAST_STATION, LINK_LEVELS } from './time-field-geometry';

/** The three pages of the onboarding, in order. */
export const ROUTES = {
  watch: '/',
  play: '/play',
  docs: '/docs',
} as const;

/** Whether a path is the documentation, where the field is not shown. */
export function isDocsPath(pathname: string): boolean {
  return pathname === ROUTES.docs || pathname.startsWith(`${ROUTES.docs}/`);
}

/**
 * Where a page sits on the time axis the field behind it travels along.
 *
 * The video is station 0, the playground is 1 and the documentation is the
 * last. The camera flies only between pages. Any other path, a 404 for one,
 * shows the first station.
 */
export function stationFor(pathname: string): number {
  if (pathname === ROUTES.play) {
    return 1;
  }

  return isDocsPath(pathname) ? LAST_STATION : 0;
}

/**
 * How many of the field's links are drawn. None on the video, where the
 * atoms float alone. Some in the playground, drawn as the user arrives. All
 * of them on the way to the documentation.
 */
export function linkLevelFor(pathname: string): number {
  if (pathname === ROUTES.play) {
    return LINK_LEVELS.some;
  }

  return isDocsPath(pathname) ? LINK_LEVELS.all : LINK_LEVELS.none;
}

import { LAST_STATION, LINK_LEVELS } from './time-field-geometry';

/** The two pages of the onboarding, in order: the film, at the root, and the docs. */
export const ROUTES = {
  play: '/',
  docs: '/docs',
} as const;

/** Whether a path is the documentation, where the field is not shown. */
export function isDocsPath(pathname: string): boolean {
  return pathname === ROUTES.docs || pathname.startsWith(`${ROUTES.docs}/`);
}

/**
 * Where a page sits on the time axis the field behind it travels along.
 *
 * The film is station 1 and the documentation is the last. The camera flies
 * only between pages. Any other path, a 404 for one, shows the first
 * station, before the film.
 */
export function stationFor(pathname: string): number {
  if (pathname === ROUTES.play) {
    return 1;
  }

  return isDocsPath(pathname) ? LAST_STATION : 0;
}

/**
 * How many of the field's links are drawn. Some behind the film, drawn as
 * the user arrives; all of them on the way to the documentation; none on
 * any other page, where the atoms float alone.
 */
export function linkLevelFor(pathname: string): number {
  if (pathname === ROUTES.play) {
    return LINK_LEVELS.some;
  }

  return isDocsPath(pathname) ? LINK_LEVELS.all : LINK_LEVELS.none;
}

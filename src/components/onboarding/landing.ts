/**
 * Where the site opens for someone who has been before. The film, at the
 * root, is for a first visit; after that the site remembers a choice to go
 * on to the docs:
 *
 * - "Skip to docs", from the film's page.
 * - "Start building", at the film's end.
 *
 * It is kept in this browser's localStorage, and read by a small script that
 * runs before the film's page paints (`landingGateScript`), so a returning
 * visitor never sees it flash by on the way.
 */

import { ROUTES } from './stations';

export const LANDING_KEY = 'intuition:landing';

/** Where a returning visitor lands, by what is stored. */
const LANDING_ROUTES = { docs: ROUTES.docs } as const;

export type Landing = keyof typeof LANDING_ROUTES;

/** Remembers where the site should open next time. */
export function rememberLanding(landing: Landing): void {
  try {
    window.localStorage.setItem(LANDING_KEY, landing);
  } catch {
    // Storage can be off: a private window, or site data blocked. Then the
    // site forgets, and opens on the film as for a first visit,
    // which is all there is to recover.
  }
}

/**
 * The script that sends a returning visitor past the film. Served as
 * `/landing.js` and loaded, blocking, in the head of every page; it acts
 * only on the film's page, and never to send it to itself.
 *
 * It acts only when the site is opened: a link, a bookmark, a typed address.
 * Not on a reload, back or forward, and not on a link from within the site,
 * so "Try the onboarding" in the docs, or the logo, still shows the film.
 * Anything that fails, storage among it, leaves the film.
 */
export function landingGateScript(): string {
  return `(function () {
  try {
    if (location.pathname !== ${JSON.stringify(ROUTES.play)}) return;
    var entry = performance.getEntriesByType('navigation')[0];
    if (entry !== undefined && entry.type !== 'navigate') return;
    if (document.referrer !== '' && new URL(document.referrer).origin === location.origin) return;
    var route = ${JSON.stringify(LANDING_ROUTES)}[localStorage.getItem(${JSON.stringify(LANDING_KEY)})];
    if (typeof route === 'string' && route !== location.pathname) location.replace(route);
  } catch (error) {}
})();
`;
}

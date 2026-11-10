/**
 * Where the onboarding is served: the film at the root, and the
 * documentation at `/docs`.
 *
 * The subdomain is `learn` because the whole site teaches Intuition, and the
 * root is the film, not documentation. `/docs` is the path a developer or an
 * agent guesses for documentation on any domain.
 */
export const SITE_URL = 'https://learn.intuition.box';

/**
 * The site's pages: the film, at the root, the docs, and the brand page,
 * with the folder its downloads are served from.
 */
export const ROUTES = {
  play: '/',
  docs: '/docs',
  brand: '/brand',
  brandFiles: '/brand/files',
} as const;

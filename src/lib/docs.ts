import { createDocsRoute } from '@waveso/docs/next';

import { SITE_URL } from './site';

/**
 * One route, shared by every file under `src/app/docs`.
 *
 * Where the markdown lives and what the chrome says. It is mounted at the
 * package's default, `/docs`.
 */
export const docs = createDocsRoute({
  contentDir: 'content/docs',
  // Canonical URLs, and the links inside `llms.txt` and `llms-full.txt`,
  // are absolute on this origin.
  siteUrl: SITE_URL,
  /*
   * `llms.txt` and `llms-full.txt`, and the "Copy page" button that
   * reads the corpus. Remove this and the button stops rendering.
   */
  llms: {
    title: 'Intuition',
    description:
      'How to run an Intuition node, build a knowledge graph of atoms and ' +
      'triples, and publish it onchain.',
  },
});

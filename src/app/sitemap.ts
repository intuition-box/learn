import type { MetadataRoute } from 'next';

import { createDocsSitemap } from '@waveso/docs/next';

import { ROUTES, SITE_URL } from '@/lib/site';

export const dynamic = 'force-static';

/** Every public page: the film, and each docs page. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const docsPages = await createDocsSitemap({
    contentDir: 'content/docs',
    siteUrl: SITE_URL,
  });

  return [{ url: new URL(ROUTES.play, SITE_URL).href }, ...docsPages];
}

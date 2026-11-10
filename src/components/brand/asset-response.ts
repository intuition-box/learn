/**
 * The two halves of a route that serves a brand's files: the names to
 * write at build time, and the file for a name. A route passes its brand to
 * both and does nothing else.
 */

import { brandFiles, findBrandFile } from './asset-files';
import { PRESETS } from './asset-presets';
import type { BrandConfig } from './brand-config';
import { assertValidBrand } from './brand-validation';
import { rasterize } from './rasterize';

/**
 * Every file name, for `generateStaticParams`. Checks the brand first, so a
 * broken one fails the build with all its issues listed.
 */
export function brandFileParams(config: BrandConfig): { file: string }[] {
  assertValidBrand(config);
  return brandFiles(config).map(({ fileName }) => ({ file: fileName }));
}

/** The file named `file`: its SVG as written, or a PNG rendered at its preset's size. */
export function brandFileResponse(config: BrandConfig, file: string): Response {
  const found = findBrandFile(config, file);
  if (found === undefined) {
    return new Response('Not found', {
      status: 404,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    });
  }
  if (found.format === 'svg') {
    return new Response(found.asset.svg, {
      headers: { 'content-type': 'image/svg+xml' },
    });
  }
  return new Response(rasterize(found.asset.svg, PRESETS[found.asset.preset]), {
    headers: { 'content-type': 'image/png' },
  });
}

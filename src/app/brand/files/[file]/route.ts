import {
  brandFileParams,
  brandFileResponse,
} from '@/components/brand/asset-response';
import { LEARN_BRAND } from '@/lib/brand/learn-brand';

/*
 * The brand page's downloads: every asset as SVG and as PNG, written out as
 * files at build time, one per name `generateStaticParams` lists. nginx
 * serves them as any static file, its content type from the extension.
 *
 * Both values are literals: Next reads a route's segment config out of the
 * source before running any of it. `dynamicParams = false` makes a name not
 * listed a 404, in dev as in the build.
 */
export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams(): { file: string }[] {
  return brandFileParams(LEARN_BRAND);
}

/*
 * The params' type written out rather than `RouteContext`, a global that
 * exists only once `next dev` or `next build` has generated `.next/types`.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ file: string }> },
): Promise<Response> {
  return brandFileResponse(LEARN_BRAND, (await params).file);
}

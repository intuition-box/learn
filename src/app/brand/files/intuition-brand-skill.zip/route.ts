import { skillArchive } from '@/lib/brand/learn-skill';

/*
 * The brand skill, as one zip, written out at build time beside the other
 * brand files. Its folder name is the file's: a static segment, so it wins
 * over `[file]` beside it. nginx serves it as any static file.
 */
export const dynamic = 'force-static';

export function GET(): Response {
  return new Response(skillArchive(), {
    headers: { 'content-type': 'application/zip' },
  });
}

import { logoMarkFile } from '@/components/onboarding/logo-mark';

/*
 * The site's icon: the mark two by two, written out as a file at build
 * time from the same shapes as the mark on the page.
 */
export function GET(): Response {
  return new Response(logoMarkFile('grid'), {
    headers: { 'content-type': 'image/svg+xml' },
  });
}

export const dynamic = 'force-static';

import { landingGateScript } from '@/components/onboarding/landing';

/*
 * The script that sends a returning visitor past the welcome page, built
 * from the same key and routes the pages write with, so the two cannot
 * drift apart. Written out as a file at build time.
 */
export function GET(): Response {
  return new Response(landingGateScript(), {
    headers: { 'content-type': 'text/javascript; charset=utf-8' },
  });
}
export const dynamic = 'force-static';

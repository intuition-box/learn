import { fieldSvg } from '@/components/onboarding/field-svg';
import {
  LAST_STATION,
  LINK_LEVELS,
} from '@/components/onboarding/time-field-geometry';

/*
 * The docs home's header picture: the universe the trip into the docs flies
 * through, as it ends there, every claim drawn. Built once, with the site.
 */
export function GET(): Response {
  return new Response(
    fieldSvg({
      station: LAST_STATION,
      links: LINK_LEVELS.all,
      width: 1600,
      height: 900,
    }),
    { headers: { 'Content-Type': 'image/svg+xml' } },
  );
}
export const dynamic = 'force-static';

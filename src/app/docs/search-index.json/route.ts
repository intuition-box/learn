import { docs } from '@/lib/docs';

export const GET = docs.searchIndex;
/*
 * ⚠️ NOT OPTIONAL, AND IT HAS TO BE A LITERAL. Without it Next marks the
 * route dynamic and re-renders your whole corpus on every request, from
 * markdown that output tracing did not put in the deployment bundle.
 */
export const dynamic = 'force-static';

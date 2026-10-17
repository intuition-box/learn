import { docs } from '@/lib/docs';

/*
 * The corpus index — one line per page, in llmstxt.org's format.
 * Optional: `llms-full.txt` already carries every page and its URL.
 */
export const GET = docs.llmsTxt;
export const dynamic = 'force-static';

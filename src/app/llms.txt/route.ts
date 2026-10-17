import { docs } from '@/lib/docs';

/*
 * The documentation's index at the site's root as well as under `/docs`:
 * the llms.txt convention puts it at the root, and that is where an agent
 * looks first. The same file, so the two cannot drift apart.
 */
export const GET = docs.llmsTxt;
export const dynamic = 'force-static';

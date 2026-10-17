import { docs } from '@/lib/docs';

/*
 * Every page's markdown, in one file — for agents, and for the "Copy
 * page" button, which reads this and slices out the page it is on.
 */
export const GET = docs.llmsFullTxt;
export const dynamic = 'force-static';

import { docs } from '@/lib/docs';

export default docs.Page;
export const generateStaticParams = docs.generateStaticParams;
export const generateMetadata = docs.generateMetadata;
/*
 * ⚠️ A LITERAL `false`, NOT `docs.dynamicParams`. Next parses route
 * segment config out of the module before any of it runs, so a value it
 * has to execute an import to learn is no value at all — and the failure
 * is a build that succeeds while unlisted URLs render on demand.
 */
export const dynamicParams = false;

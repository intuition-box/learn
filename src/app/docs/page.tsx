import { docs } from '@/lib/docs';

/*
 * The index, and it needs its own file: `[...slug]` does not match the
 * mount itself. An optional catch-all (`[[...slug]]`) does, and then
 * leaves `/docs/index` live serving byte-identical HTML.
 */
export default docs.IndexPage;
export const generateMetadata = docs.generateMetadata;

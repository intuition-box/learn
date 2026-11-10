/**
 * Intuition's brand skill, packaged for the Brand skill button.
 *
 * ⚠️ PACKAGED, NEVER GENERATED. The skill in `skills/intuition-brand-skill/` is
 * written by hand and is the brand's source of truth; the brand page shows
 * the brand, and collaborators edit it. So nothing here reads `LEARN_BRAND`:
 * this zips the folder as it is, at build time, and the files route serves
 * the archive beside the logo and the images.
 */

import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { zip } from '@/lib/zip';
import type { ZipEntry } from '@/lib/zip';

/** The skill's folder name: its `name` in SKILL.md, and the folder inside the archive. */
export const SKILL_NAME = 'intuition-brand-skill';

/** Where the skill lives in the repository. */
export const SKILL_DIR = path.join(process.cwd(), 'skills', SKILL_NAME);

/** Every file in the skill, by its path inside the folder, sorted so the archive is stable. */
export function skillFiles(): string[] {
  return readdirSync(SKILL_DIR, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && !entry.name.startsWith('.'))
    .map((entry) =>
      path
        .relative(SKILL_DIR, path.join(entry.parentPath, entry.name))
        .split(path.sep)
        .join('/'),
    )
    .sort();
}

/** The skill as a zip: one folder, `intuition-brand-skill/`, holding every file as written. */
export function skillArchive(): Uint8Array<ArrayBuffer> {
  const entries: ZipEntry[] = skillFiles().map((file) => ({
    path: `${SKILL_NAME}/${file}`,
    data: readFileSync(path.join(SKILL_DIR, ...file.split('/'))),
  }));
  return zip(entries);
}

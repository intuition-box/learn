import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { ROUTES } from '@/lib/site';

import { LEARN_BRAND } from './learn-brand';
import { SKILL_DIR, SKILL_NAME, skillArchive, skillFiles } from './learn-skill';

const ROOT = path.join(import.meta.dirname, '..', '..', '..');

const read = (file: string): string =>
  readFileSync(path.join(SKILL_DIR, ...file.split('/')), 'utf8');

describe('the brand skill', () => {
  it('has its SKILL.md, its references and its tokens', () => {
    const files = skillFiles();
    expect(files).toContain('SKILL.md');
    expect(files.some((file) => file.startsWith('reference/'))).toBe(true);
    expect(files).toContain('tokens/tokens.json');
  });

  it('names itself as its folder, with a description an agent can match', () => {
    const frontmatter = /^---\n([\s\S]*?)\n---\n/.exec(read('SKILL.md'))?.[1];
    expect(frontmatter).toBeDefined();
    expect(frontmatter).toMatch(new RegExp(`^name: ${SKILL_NAME}$`, 'm'));
    // Quoted: the description holds a colon, which bare YAML reads as a key.
    const description = /^description: "(.*)"$/m.exec(frontmatter ?? '')?.[1];
    expect(description?.length).toBeGreaterThan(0);
    expect(description?.length).toBeLessThanOrEqual(1024);
  });

  it('links only to files it holds', () => {
    const files = new Set(skillFiles());
    for (const file of skillFiles().filter((name) => name.endsWith('.md'))) {
      for (const [, target = ''] of read(file).matchAll(/\]\(([^)#]+)\)/g)) {
        if (/^[a-z]+:/.test(target)) continue;
        const resolved = path.posix.normalize(
          path.posix.join(path.posix.dirname(file), target),
        );
        expect(files.has(resolved), `${file} → ${target}`).toBe(true);
      }
    }
  });

  it('zips every file under one folder, as written', () => {
    const folder = mkdtempSync(path.join(tmpdir(), 'skill-test-'));
    try {
      const archive = path.join(folder, 'skill.zip');
      writeFileSync(archive, skillArchive());
      execFileSync('unzip', ['-q', archive, '-d', folder]);
      for (const file of skillFiles()) {
        expect(
          readFileSync(
            path.join(folder, SKILL_NAME, ...file.split('/')),
            'utf8',
          ),
          file,
        ).toBe(read(file));
      }
    } finally {
      rmSync(folder, { recursive: true, force: true });
    }
  });

  it('is served where the brand page links to it', () => {
    const fileName = LEARN_BRAND.skill?.fileName ?? '';
    expect(fileName).toBe(`${SKILL_NAME}.zip`);
    expect(
      existsSync(
        path.join(ROOT, 'src', 'app', ROUTES.brandFiles, fileName, 'route.ts'),
      ),
    ).toBe(true);
  });
});

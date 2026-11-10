import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { zip } from './zip';

const text = (value: string): Uint8Array => new TextEncoder().encode(value);

describe('zip', () => {
  it('makes an archive that unzip reads back byte for byte', () => {
    const files = {
      'skill/SKILL.md': '# A skill\n\nWith a café in it.\n',
      'skill/reference/notes.md': 'x'.repeat(5000),
    };
    const folder = mkdtempSync(path.join(tmpdir(), 'zip-test-'));
    try {
      const archive = path.join(folder, 'skill.zip');
      writeFileSync(
        archive,
        zip(
          Object.entries(files).map(([name, value]) => ({
            path: name,
            data: text(value),
          })),
        ),
      );
      // `unzip -t` checks every entry's CRC against what it inflates.
      expect(
        execFileSync('unzip', ['-t', archive], { encoding: 'utf8' }),
      ).toMatch(/No errors detected/);
      execFileSync('unzip', ['-q', archive, '-d', path.join(folder, 'out')]);
      for (const [name, value] of Object.entries(files)) {
        expect(readFileSync(path.join(folder, 'out', name), 'utf8')).toBe(
          value,
        );
      }
    } finally {
      rmSync(folder, { recursive: true, force: true });
    }
  });

  it('makes the same bytes from the same files', () => {
    const entries = [{ path: 'a.md', data: text('a') }];
    expect(zip(entries)).toEqual(zip(entries));
  });
});

import { describe, expect, it } from 'vitest';

import { logoMarkFile } from './logo-mark';

describe('logoMarkFile', () => {
  const file = logoMarkFile('grid');

  it('draws the four shapes on a square', () => {
    const [, , width, height] = (/viewBox="([^"]+)"/.exec(file)?.[1] ?? '')
      .split(' ')
      .map(Number);
    expect(width).toBeGreaterThan(0);
    expect(width).toBe(height);
    expect(file.match(/<path /g)).toHaveLength(4);
  });

  it('turns white in dark mode, where black would disappear', () => {
    expect(file).toContain(
      '@media (prefers-color-scheme:dark){path{fill:#fff}}',
    );
  });
});

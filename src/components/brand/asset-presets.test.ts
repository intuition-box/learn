import { describe, expect, it } from 'vitest';

import { PRESETS } from './asset-presets';

describe('PRESETS', () => {
  it.each([
    ['x-banner', 1500, 500],
    ['x-avatar', 400, 400],
    ['og-image', 1200, 630],
    ['linkedin-banner', 1584, 396],
    ['desktop', 2560, 1440],
    ['phone', 1179, 2556],
    ['discord-banner', 960, 540],
  ] as const)('makes %s %i×%i', (id, width, height) => {
    expect(PRESETS[id]).toMatchObject({ width, height });
  });

  it('sizes every preset in whole pixels, under its own id', () => {
    for (const [id, preset] of Object.entries(PRESETS)) {
      expect(preset.id).toBe(id);
      expect(Number.isInteger(preset.width) && preset.width > 0).toBe(true);
      expect(Number.isInteger(preset.height) && preset.height > 0).toBe(true);
      expect(preset.label).not.toBe(preset.label.toUpperCase());
    }
  });
});

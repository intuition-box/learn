import { describe, expect, it } from 'vitest';

import { multiplayerSvg } from './brand-multiplayer';

describe('multiplayerSvg', () => {
  const frame = { width: 1920, height: 1080 };

  it('draws the same picture every time', () => {
    expect(multiplayerSvg(frame)).toBe(multiplayerSvg(frame));
  });

  it('draws all four shapes in their role colors', () => {
    const svg = multiplayerSvg(frame);
    for (const color of ['#7a86ff', '#2fe08b', '#ff4f5e', '#ff5fd2']) {
      expect(svg).toContain(color);
    }
  });

  it('sets its words as outlines, with no live text', () => {
    expect(multiplayerSvg(frame)).not.toContain('<text');
  });
});

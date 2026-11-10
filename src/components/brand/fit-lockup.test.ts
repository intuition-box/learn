import { describe, expect, it } from 'vitest';

import { fitLockup } from './fit-lockup';

describe('fitLockup', () => {
  it('fits the lockup and its margin, centred, tight on one axis', () => {
    const canvas = { width: 2048, height: 1024 };
    const { scale, frame, clearSpace } = fitLockup(
      { width: 400, height: 100 },
      canvas,
      50,
    );
    // The width is the tight axis: 2048 / (400 + 100).
    expect(scale).toBeCloseTo(4.096, 10);
    expect(clearSpace).toBeCloseTo(50 * scale, 10);
    expect(frame.x).toBeCloseTo(clearSpace, 10);
    expect(frame.x + frame.width + clearSpace).toBeCloseTo(canvas.width, 10);
    expect(frame.y - clearSpace).toBeGreaterThan(0);
    expect(frame.y + frame.height / 2).toBeCloseTo(canvas.height / 2, 10);
    expect(frame.width / frame.height).toBeCloseTo(4, 10);
  });

  it('is tight on the height when the content is tall', () => {
    const { frame, clearSpace } = fitLockup(
      { width: 10, height: 30 },
      { width: 100, height: 100 },
      5,
    );
    expect(frame.y).toBeCloseTo(clearSpace, 10);
    expect(frame.y + frame.height + clearSpace).toBeCloseTo(100, 10);
    expect(frame.x + frame.width / 2).toBeCloseTo(50, 10);
  });
});

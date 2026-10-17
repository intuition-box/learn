import { describe, expect, it } from 'vitest';

import {
  arcPoint,
  axisAngle,
  FRONT,
  fromTo,
  multiply,
  normalize,
  rotate,
  slerp,
  type Vec3,
} from './sphere';

/** How far apart two directions are: 0 when they are the same. */
function gap(a: Vec3, b: Vec3): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

const CLOSE = 1e-6;

describe('the rotations', () => {
  it('turn a quarter about y from the front to the right', () => {
    const turned = rotate(axisAngle([0, 1, 0], Math.PI / 2), FRONT);

    expect(gap(turned, [1, 0, 0])).toBeLessThan(CLOSE);
  });

  it('apply the right-hand rotation first when multiplied', () => {
    const quarterY = axisAngle([0, 1, 0], Math.PI / 2);
    const quarterX = axisAngle([1, 0, 0], Math.PI / 2);
    // y first: front to right; then x leaves the right where it is.
    const turned = rotate(multiply(quarterX, quarterY), FRONT);

    expect(gap(turned, [1, 0, 0])).toBeLessThan(CLOSE);
  });

  it('turn any direction onto any other, opposite ones included', () => {
    const directions: Vec3[] = [
      [1, 0, 0],
      [0, -1, 0],
      [0.3, 0.4, -0.866],
      [0, 0, -1],
    ];
    for (const direction of directions) {
      const turned = rotate(fromTo(direction, FRONT), normalize(direction));
      expect(gap(turned, FRONT)).toBeLessThan(CLOSE);
    }
  });

  it('slerp from one rotation to another, ending exactly on it', () => {
    const turn = axisAngle([0, 1, 0], 2);
    const start = rotate(slerp([0, 0, 0, 1], turn, 0), FRONT);
    const end = rotate(slerp([0, 0, 0, 1], turn, 1), FRONT);

    expect(gap(start, FRONT)).toBeLessThan(CLOSE);
    expect(gap(end, rotate(turn, FRONT))).toBeLessThan(CLOSE);
  });

  it('keep an arc on the sphere, ending at its two directions', () => {
    const a: Vec3 = [1, 0, 0];
    const b: Vec3 = [0, 1, 0];

    expect(gap(arcPoint(a, b, 0), a)).toBeLessThan(CLOSE);
    expect(gap(arcPoint(a, b, 1), b)).toBeLessThan(CLOSE);
    expect(Math.hypot(...arcPoint(a, b, 0.37))).toBeCloseTo(1, 6);
  });
});

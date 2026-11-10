import { describe, expect, it } from 'vitest';

import { activeHeading, readingPosition } from './active-heading';

const tops = [
  { href: '#logo', top: -900 },
  { href: '#colors', top: -100 },
  { href: '#typography', top: 400 },
];

describe('activeHeading', () => {
  it('is the last heading above the reading line', () => {
    expect(activeHeading(tops, 240, false)).toBe('#colors');
  });

  it('is the first while none has reached the line', () => {
    expect(
      activeHeading(
        tops.map((heading) => ({ ...heading, top: heading.top + 2000 })),
        240,
        false,
      ),
    ).toBe('#logo');
  });

  it('is the last at the end of the page', () => {
    expect(activeHeading(tops, 240, true)).toBe('#typography');
  });

  it('is none when there are no headings', () => {
    expect(activeHeading([], 240, false)).toBeUndefined();
  });
});

describe('readingPosition', () => {
  const at = (...tops: number[]) =>
    tops.map((top, index) => ({ href: `#${index}`, top }));

  it('is the share of the way from the heading passed to the next', () => {
    expect(readingPosition(at(-500, 100, 700), 250, false)).toBe(1.25);
  });

  it('is 0 before the first heading is reached', () => {
    expect(readingPosition(at(400, 900), 250, false)).toBe(0);
  });

  it('is the last index from the last heading on, and at the end', () => {
    expect(readingPosition(at(-900, -400), 250, false)).toBe(1);
    expect(readingPosition(at(-900, 400), 250, true)).toBe(1);
  });

  it('is 0 with no headings', () => {
    expect(readingPosition([], 250, false)).toBe(0);
  });
});

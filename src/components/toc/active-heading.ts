/** A heading of the contents, by its href, and how far its top is from the window's. */
export interface HeadingTop {
  href: string;
  top: number;
}

/**
 * Which heading is being read: the last one whose top has risen above the
 * reading line, or the first while none has; the last at the page's end,
 * where a short last section could never reach the line.
 */
export function activeHeading(
  tops: readonly HeadingTop[],
  readingLine: number,
  isAtEnd: boolean,
): string | undefined {
  if (isAtEnd) {
    return tops.at(-1)?.href;
  }
  const above = tops.filter(({ top }) => top <= readingLine);

  return (above.at(-1) ?? tops[0])?.href;
}

/**
 * Where the reading line is among the headings, as a heading's index and the
 * share of the way on to the next: 1.5 is halfway from the second heading
 * to the third. 0 before the first is reached, the last index at the page's
 * end and from the last heading on.
 */
export function readingPosition(
  tops: readonly HeadingTop[],
  readingLine: number,
  isAtEnd: boolean,
): number {
  const last = tops.length - 1;
  if (last < 0) {
    return 0;
  }
  if (isAtEnd) {
    return last;
  }
  const passed = tops.findLastIndex(({ top }) => top <= readingLine);
  if (passed < 0) {
    return 0;
  }
  const from = tops[passed];
  const to = tops[passed + 1];
  if (from === undefined || to === undefined || to.top <= from.top) {
    return passed;
  }
  const share = (readingLine - from.top) / (to.top - from.top);

  return passed + Math.min(Math.max(share, 0), 1);
}

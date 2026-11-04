import { describe, expect, it } from 'vitest';

import {
  CARD,
  CARD_ROWS,
  cardHeight,
  CLOSING,
  closingAt,
  type Circle,
  enrichmentLayout,
  fieldFlow,
  flowPath,
  globeAt,
  GRAPH_FIELDS,
  lineBack,
  PAGE_FIELDS,
  SOURCES,
  WIKI,
} from './story-enrichment';

const BADGE = { height: 22, gap: 8 };
const NARROW_BADGE = { height: 20, gap: 6 };

/** Whether `circle` is inside a `width` × `height` canvas. */
function isInside(circle: Circle, width: number, height: number): boolean {
  return (
    circle.x - circle.reach >= 0 &&
    circle.x + circle.reach <= width &&
    circle.y - circle.reach >= 0 &&
    circle.y + circle.reach <= height
  );
}

describe('enrichmentLayout', () => {
  it('puts the card alone on the left of a wide canvas, and on the right, one under another, Elon Musk, the graph and the page', () => {
    for (const [width, height] of [
      [1182, 470],
      [1134, 290],
      [622, 538],
    ] as const) {
      const layout = enrichmentLayout(width, height, BADGE);
      const { atom, atomSize, card, cardWidth, small, aside, page } = layout;
      const cardRight = card.x + cardWidth / 2;
      const nameBottom = atom.y + atomSize / 2 + BADGE.gap + BADGE.height;

      expect(layout.isStacked).toBe(false);
      expect(cardWidth).toBe(CARD.width);
      for (const left of [
        atom.x - atomSize / 2,
        small.x - small.reach,
        aside.x - aside.reach,
        page.x,
      ]) {
        expect(left).toBeGreaterThan(cardRight);
      }
      // One under another, each in the middle of the right part.
      expect(small.x).toBe(atom.x);
      expect(page.x + page.width / 2).toBeCloseTo(atom.x);
      expect(nameBottom).toBeLessThan(small.y - small.reach);
      expect(nameBottom).toBeLessThan(aside.y - aside.reach);
      expect(small.y + small.reach).toBeLessThan(page.y);
      expect(page.y + page.height).toBeLessThanOrEqual(height);
      expect(page.x + page.width).toBeLessThanOrEqual(width);
      for (const circle of [aside, small]) {
        expect(isInside(circle, width, height)).toBe(true);
      }
    }
  });

  it('stands him at the very top, where the menus of the two perspectives were, the sketch in the middle between him and the page', () => {
    for (const [width, height] of [
      [1182, 470],
      [1134, 290],
      [622, 538],
    ] as const) {
      const { atom, atomSize, small, aside, page } = enrichmentLayout(
        width,
        height,
        BADGE,
      );
      const nameBottom = atom.y + atomSize / 2 + BADGE.gap + BADGE.height;

      expect(atom.y - atomSize / 2).toBe(0);
      expect(page.y - (small.y + small.reach)).toBeCloseTo(
        small.y - small.reach - nameBottom,
      );
      // The graph, before it is a sketch, twice the gap under him.
      expect(aside.y - aside.reach - nameBottom).toBe(28);
    }
  });

  it('keeps the page where it stood, and its size, as he goes to the very top', () => {
    const { page } = enrichmentLayout(1182, 470, BADGE);

    expect(page.y).toBe(202);
    expect(page.y + page.height).toBe(454);
    expect(page.width).toBeCloseTo(420);
  });

  it('keeps the full card, and Elon Musk with his name, inside the canvas', () => {
    for (const [width, height, badge] of [
      [1182, 470, BADGE],
      [1134, 290, BADGE],
      [292, 365, NARROW_BADGE],
    ] as const) {
      const { atom, atomSize, card, cardWidth, row } = enrichmentLayout(
        width,
        height,
        badge,
      );

      expect(card.y).toBeGreaterThanOrEqual(0);
      expect(
        card.y + cardHeight(badge.height, CARD_ROWS, row),
      ).toBeLessThanOrEqual(height);
      expect(card.x - cardWidth / 2).toBeGreaterThanOrEqual(0);
      expect(card.x + cardWidth / 2).toBeLessThanOrEqual(width);
      expect(atom.y - atomSize / 2).toBeGreaterThanOrEqual(0);
      expect(
        atom.y + atomSize / 2 + badge.gap + badge.height,
      ).toBeLessThanOrEqual(height);
    }
  });

  it('gives the card’s rows their full height where there is room, and shortens them where there is not', () => {
    expect(enrichmentLayout(1182, 470, BADGE).row).toBe(CARD.row);
    expect(enrichmentLayout(1134, 290, BADGE).row).toBe(CARD.row);
    const short = enrichmentLayout(1134, 200, BADGE).row;
    expect(short).toBeLessThan(CARD.row);
    expect(short).toBeGreaterThanOrEqual(CARD.minRow);
    expect(enrichmentLayout(292, 365, NARROW_BADGE).row).toBe(CARD.minRow);
  });

  it('stacks a narrow canvas: he and the sketch side by side at the top, the card under them, the page under it', () => {
    const layout = enrichmentLayout(292, 365, NARROW_BADGE);
    const { atom, atomSize, small, card, aside, page } = layout;

    expect(layout.isStacked).toBe(true);
    expect(layout.cardWidth).toBe(CARD.narrowWidth);
    expect(atom.x + atomSize / 2).toBeLessThan(small.x - small.reach);
    expect(card.y).toBeGreaterThan(small.y + small.reach);
    expect(card.y).toBeGreaterThan(
      atom.y + atomSize / 2 + NARROW_BADGE.gap + NARROW_BADGE.height,
    );
    // The graph, before it is a sketch, under the card with the graph's rows.
    expect(aside.y - aside.reach).toBeGreaterThan(
      card.y + cardHeight(NARROW_BADGE.height, GRAPH_FIELDS.length, layout.row),
    );
    expect(page.y).toBeGreaterThan(
      card.y + cardHeight(NARROW_BADGE.height, CARD_ROWS, layout.row),
    );
    expect(page.y + page.height).toBeLessThanOrEqual(365);
  });

  it('keeps the page in the encyclopedia’s cropped shape side by side, and shows every section the data leaves when cropped further', () => {
    const wide = enrichmentLayout(1182, 470, BADGE);
    const deepest = Math.max(...SOURCES.map(({ y }) => y));

    expect(wide.page.height / wide.page.width).toBeCloseTo(
      WIKI.height / WIKI.width,
    );
    for (const [width, height, badge] of [
      [1182, 470, BADGE],
      [292, 365, NARROW_BADGE],
    ] as const) {
      const { page, scale } = enrichmentLayout(width, height, badge);

      expect(scale).toBeCloseTo(page.width / WIKI.width);
      expect(page.height / scale).toBeGreaterThan(deepest);
    }
  });

  it('gives every page field a source on the page, in the order they flow', () => {
    for (const [width, height, badge] of [
      [1182, 470, BADGE],
      [292, 365, NARROW_BADGE],
    ] as const) {
      const { sources, page } = enrichmentLayout(width, height, badge);

      expect(sources.map(({ id }) => id)).toEqual(
        PAGE_FIELDS.map(({ id }) => id),
      );
      for (const source of sources) {
        expect(source.y).toBeGreaterThan(page.y);
        expect(source.y).toBeLessThan(page.y + page.height);
      }
    }
  });
});

describe('PAGE_FIELDS', () => {
  it('takes each field from its own section of the page, the article’s or the infobox’s', () => {
    const sections = SOURCES.map(({ x, y }) => `${x},${y}`);

    expect(new Set(sections).size).toBe(PAGE_FIELDS.length);
    // Each on a line the article has, or a row the infobox has.
    const isOnThePage = PAGE_FIELDS.map(({ from }) =>
      'row' in from
        ? from.row < 2 + WIKI.infobox.more
        : from.line < (WIKI.body.paragraphs[from.paragraph]?.lines ?? 0),
    );
    expect(isOnThePage.every(Boolean)).toBe(true);
  });
});

describe('globeAt', () => {
  const layout = enrichmentLayout(1182, 470, BADGE);
  const room = layout.aside;
  const at = (start: Circle, parts: { out: number; small: number }) =>
    globeAt(layout, start, parts);
  // To the millionth of a pixel: the moves are sums of floats.
  const rounded = ({ x, y, reach }: Circle): Circle => ({
    x: Math.round(x * 1e6) / 1e6,
    y: Math.round(y * 1e6) / 1e6,
    reach: Math.round(reach * 1e6) / 1e6,
  });

  it('starts where the two perspectives became one', () => {
    const start: Circle = { x: 591, y: 235, reach: 150 };

    expect(at(start, { out: 0, small: 0 })).toEqual(start);
  });

  it('moves aside the size it was, its top where the room for it starts', () => {
    const start: Circle = { x: 591, y: 235, reach: room.reach - 20 };

    expect(rounded(at(start, { out: 1, small: 0 }))).toEqual(
      rounded({ x: room.x, y: room.y - 20, reach: room.reach - 20 }),
    );
  });

  it('shrinks to fit the room aside only where it was larger', () => {
    const start: Circle = { x: 591, y: 235, reach: room.reach + 20 };

    expect(rounded(at(start, { out: 1, small: 0 }))).toEqual(rounded(room));
  });

  it('then shrinks to a sketch, and stays there', () => {
    const start: Circle = { x: 591, y: 235, reach: 150 };

    expect(rounded(at(start, { out: 1, small: 1 }))).toEqual(
      rounded(layout.small),
    );
  });
});

describe('closing', () => {
  const lineCount = 1 + GRAPH_FIELDS.length + PAGE_FIELDS.length;
  const gone = (close: number, index: number) =>
    lineBack(closingAt(close, CLOSING.lines), index, lineCount);

  it('draws the lines back one by one, the last that came first', () => {
    expect(gone(0.1, lineCount - 1)).toBeGreaterThan(gone(0.1, lineCount - 2));
    expect(gone(0.1, 0)).toBe(0);
    for (let index = 0; index < lineCount; index += 1) {
      expect(gone(CLOSING.lines[1], index)).toBe(1);
    }
  });

  it('fades the page once its lines have gone', () => {
    const pageLines = PAGE_FIELDS.map(
      (_, index) => 1 + GRAPH_FIELDS.length + index,
    );

    expect(
      Math.min(...pageLines.map((index) => gone(CLOSING.page[0], index))),
    ).toBeGreaterThan(0.999);
  });
});

describe('cardHeight', () => {
  it('is the name alone without rows, and grows a row for each', () => {
    expect(cardHeight(22, 0, CARD.row)).toBe(22);
    expect(cardHeight(22, 2, 20) - cardHeight(22, 1, 20)).toBe(20);
    expect(CARD_ROWS).toBe(GRAPH_FIELDS.length + PAGE_FIELDS.length);
  });
});

describe('flowPath', () => {
  it('runs from where the data leaves to its row', () => {
    const points = flowPath({ x: 700, y: 200 }, { x: 400, y: 260 }, false);

    expect(points[0]).toEqual({ x: 700, y: 200 });
    expect(points.at(-1)).toEqual({ x: 400, y: 260 });
  });

  it('bows out to the left when stacked, but stays on the canvas', () => {
    const points = flowPath({ x: 20, y: 300 }, { x: 70, y: 100 }, true);

    expect(Math.min(...points.map(({ x }) => x))).toBeGreaterThanOrEqual(6);
    expect(Math.min(...points.map(({ x }) => x))).toBeLessThan(20);
  });
});

describe('fieldFlow', () => {
  it('flows the fields one after another, each overlapping the last', () => {
    const count = 3;

    expect(fieldFlow(0, 0, count)).toBe(0);
    expect(fieldFlow(0.35, 0, count)).toBeGreaterThan(
      fieldFlow(0.35, 1, count),
    );
    expect(fieldFlow(0.35, 1, count)).toBeGreaterThan(0);
    expect(fieldFlow(0.35, 2, count)).toBe(0);
    for (const index of [0, 1, 2]) {
      expect(fieldFlow(1, index, count)).toBe(1);
    }
  });

  it('gives fewer fields each a longer part of the same time', () => {
    expect(fieldFlow(1, 1, GRAPH_FIELDS.length)).toBe(1);
    expect(fieldFlow(0.5, 0, 2)).toBeLessThan(fieldFlow(0.5, 0, 3));
  });
});

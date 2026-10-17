import { describe, expect, it } from 'vitest';

import { isDocsPath, linkLevelFor, stationFor } from './stations';
import { LINK_LEVELS } from './time-field-geometry';

describe('stationFor', () => {
  it('gives each page of the onboarding its own station, in order', () => {
    expect(stationFor('/')).toBe(0);
    expect(stationFor('/play')).toBe(1);
    expect(stationFor('/docs')).toBe(2);
  });

  it('puts every page of the documentation at the last station', () => {
    expect(stationFor('/docs/node')).toBe(2);
  });

  it('puts an unknown path at the first station', () => {
    expect(stationFor('/nowhere')).toBe(0);
    // Not the documentation, though it starts with the same letters.
    expect(stationFor('/docsify')).toBe(0);
  });
});

describe('linkLevelFor', () => {
  it('draws more links on each page along the way', () => {
    const levels = ['/', '/play', '/docs'].map(linkLevelFor);

    expect(levels).toEqual([
      LINK_LEVELS.none,
      LINK_LEVELS.some,
      LINK_LEVELS.all,
    ]);
  });

  it('draws every link on the way to the documentation', () => {
    expect(linkLevelFor('/docs/node/run-a-node')).toBe(LINK_LEVELS.all);
  });
});

describe('isDocsPath', () => {
  it('is true for the documentation only', () => {
    expect(isDocsPath('/docs')).toBe(true);
    expect(isDocsPath('/docs/node')).toBe(true);
    expect(isDocsPath('/')).toBe(false);
    expect(isDocsPath('/play')).toBe(false);
    expect(isDocsPath('/docsify')).toBe(false);
  });
});

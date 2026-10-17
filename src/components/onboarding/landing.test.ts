import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  type Landing,
  LANDING_KEY,
  landingGateScript,
  rememberLanding,
} from './landing';

interface Visit {
  pathname?: string;
  stored?: string | null;
  navigation?: 'navigate' | 'reload' | 'back_forward';
  referrer?: string;
  /** Storage that throws, as in a private window. */
  isStorageBlocked?: boolean;
}

/** Runs the gate as the browser would, and says where it sent the visitor. */
function open({
  pathname = '/',
  stored = null,
  navigation = 'navigate',
  referrer = '',
  isStorageBlocked = false,
}: Visit): string | null {
  let replacedWith: string | null = null;
  const location = {
    origin: 'https://learn.intuition.box',
    pathname,
    replace: (url: string) => {
      replacedWith = url;
    },
  };
  const performance = {
    getEntriesByType: () => [{ type: navigation }],
  };
  const localStorage = {
    getItem: (key: string) => {
      if (isStorageBlocked) {
        throw new Error('SecurityError');
      }

      return key === LANDING_KEY ? stored : null;
    },
  };
  // The script is plain JavaScript for the browser, so it is run as one.
  // oxlint-disable-next-line typescript/no-implied-eval -- the script under test is a string by design.
  const run = new Function(
    'location',
    'performance',
    'document',
    'localStorage',
    landingGateScript(),
  );
  run(location, performance, { referrer }, localStorage);

  return replacedWith;
}

describe('landingGateScript', () => {
  it('leaves a first visit on the welcome page', () => {
    expect(open({})).toBeNull();
  });

  it('sends a returning visitor where they chose', () => {
    expect(open({ stored: 'play' })).toBe('/play');
    expect(open({ stored: 'docs' })).toBe('/docs');
  });

  it('sends them on when they come from another site', () => {
    expect(open({ stored: 'docs', referrer: 'https://www.google.com/' })).toBe(
      '/docs',
    );
  });

  it('leaves the welcome page when it was reached from within the site', () => {
    expect(
      open({
        stored: 'docs',
        referrer: 'https://learn.intuition.box/docs',
      }),
    ).toBeNull();
  });

  it('leaves the welcome page on a reload, back or forward', () => {
    expect(open({ stored: 'docs', navigation: 'reload' })).toBeNull();
    expect(open({ stored: 'docs', navigation: 'back_forward' })).toBeNull();
  });

  it('acts on the welcome page only', () => {
    expect(open({ stored: 'docs', pathname: '/play' })).toBeNull();
    expect(open({ stored: 'play', pathname: '/docs' })).toBeNull();
  });

  it('ignores anything stored that is not a landing', () => {
    expect(open({ stored: 'nowhere' })).toBeNull();
    expect(open({ stored: 'constructor' })).toBeNull();
    expect(open({ stored: '__proto__' })).toBeNull();
  });

  it('leaves the welcome page when storage is blocked', () => {
    expect(open({ isStorageBlocked: true })).toBeNull();
  });
});

describe('rememberLanding', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('stores what the gate reads', () => {
    const stored = new Map<string, string>();
    vi.stubGlobal('window', {
      localStorage: {
        setItem: (key: string, value: string) => stored.set(key, value),
      },
    });

    for (const landing of ['play', 'docs'] as const satisfies Landing[]) {
      rememberLanding(landing);
      expect(open({ stored: stored.get(LANDING_KEY) ?? null })).toBe(
        `/${landing}`,
      );
    }
  });

  it('does not throw when storage is blocked', () => {
    vi.stubGlobal('window', {
      localStorage: {
        setItem: () => {
          throw new Error('QuotaExceededError');
        },
      },
    });

    expect(() => {
      rememberLanding('docs');
    }).not.toThrow();
  });
});

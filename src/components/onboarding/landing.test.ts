import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  type Landing,
  LANDING_KEY,
  landingGateScript,
  rememberLanding,
} from './landing';

interface Visit {
  pathname?: string;
  search?: string;
  stored?: string | null;
  navigation?: 'navigate' | 'reload' | 'back_forward';
  referrer?: string;
  /** Storage that throws, as in a private window. */
  isStorageBlocked?: boolean;
  prefersReducedMotion?: boolean;
  hasWebGl2?: boolean;
}

/**
 * Runs the gate as the browser would, and says where it sent the visitor,
 * and what it marked for the film's entrance.
 */
function visit({
  pathname = '/',
  search = '',
  stored = null,
  navigation = 'navigate',
  referrer = '',
  isStorageBlocked = false,
  prefersReducedMotion = false,
  hasWebGl2 = true,
}: Visit): { replacedWith: string | null; entrance: string | undefined } {
  let replacedWith: string | null = null;
  const location = {
    origin: 'https://learn.intuition.box',
    pathname,
    search,
    replace: (url: string) => {
      replacedWith = url;
    },
  };
  const documentElement = { dataset: {} as Record<string, string> };
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
    'matchMedia',
    'WebGL2RenderingContext',
    landingGateScript(),
  );
  run(
    location,
    performance,
    { referrer, documentElement },
    localStorage,
    () => ({ matches: prefersReducedMotion }),
    hasWebGl2 ? class {} : undefined,
  );

  return { replacedWith, entrance: documentElement.dataset.entrance };
}

/** Where the gate sent the visitor, if anywhere. */
const open = (at: Visit) => visit(at).replacedWith;

describe('landingGateScript', () => {
  it('leaves a first visit on the film', () => {
    expect(open({})).toBeNull();
  });

  it('sends a returning visitor who chose the docs on to them', () => {
    expect(open({ stored: 'docs' })).toBe('/docs');
  });

  it('leaves the film for a choice from before it was the front page, never sending it to itself', () => {
    expect(open({ stored: 'play' })).toBeNull();
  });

  it('sends them on when they come from another site', () => {
    expect(open({ stored: 'docs', referrer: 'https://www.google.com/' })).toBe(
      '/docs',
    );
  });

  it('leaves the film when it was reached from within the site', () => {
    expect(
      open({
        stored: 'docs',
        referrer: 'https://learn.intuition.box/docs',
      }),
    ).toBeNull();
  });

  it('leaves the film on a reload, back or forward', () => {
    expect(open({ stored: 'docs', navigation: 'reload' })).toBeNull();
    expect(open({ stored: 'docs', navigation: 'back_forward' })).toBeNull();
  });

  it('acts on the film’s page only', () => {
    expect(open({ stored: 'docs', pathname: '/play' })).toBeNull();
    expect(open({ stored: 'docs', pathname: '/docs' })).toBeNull();
  });

  it('ignores anything stored that is not a landing', () => {
    expect(open({ stored: 'nowhere' })).toBeNull();
    expect(open({ stored: 'constructor' })).toBeNull();
    expect(open({ stored: '__proto__' })).toBeNull();
  });

  it('leaves the film when storage is blocked', () => {
    expect(open({ isStorageBlocked: true })).toBeNull();
  });

  it('marks the entrance to play on the film’s page', () => {
    expect(visit({}).entrance).toBe('welcome');
    expect(visit({ navigation: 'reload' }).entrance).toBe('welcome');
    expect(visit({ isStorageBlocked: true }).entrance).toBe('welcome');
  });

  it('shows the film straight away for a beat, reduced motion or no WebGL 2', () => {
    expect(visit({ search: '?step=vaults' }).entrance).toBeUndefined();
    expect(visit({ prefersReducedMotion: true }).entrance).toBeUndefined();
    expect(visit({ hasWebGl2: false }).entrance).toBeUndefined();
  });

  it('marks nothing when it sends the visitor on, or off the film’s page', () => {
    expect(visit({ stored: 'docs' }).entrance).toBeUndefined();
    expect(visit({ pathname: '/docs' }).entrance).toBeUndefined();
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

    for (const landing of ['docs'] as const satisfies Landing[]) {
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

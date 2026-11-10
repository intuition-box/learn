import { useCallback, useEffect, useRef, useState } from 'react';

import { activeHeading, readingPosition } from './active-heading';

/** How far down the window, as a share of its height, a heading is being read. */
const READING_LINE = 0.3;

/*
 * What says the reader has taken the page back after a jump: their own
 * scrolling, a key, a press, or the browser's back and forward. Until one
 * of these, the heading jumped to stays marked, so the marker does not run
 * through every section the smooth scroll passes, nor slip to the last one
 * when the page ends before the heading can reach the reading line.
 */
const TAKEOVER_EVENTS = [
  'wheel',
  'touchstart',
  'keydown',
  'pointerdown',
  'popstate',
] as const;

export interface ActiveHeading {
  /** The href of the heading being read, if there is one. */
  activeHref: string | undefined;
  /**
   * Where the reader is among the headings, continuously: a heading's index
   * and the share of the way on to the next (see `readingPosition`).
   */
  position: number;
  /**
   * Scrolls to the element `href` names, smoothly unless the reader asked
   * for less motion, puts it in the address as a new history entry, and
   * marks it read. False when no element on the page has that id, so the
   * caller can leave the click to the browser.
   */
  jumpTo: (href: string) => boolean;
}

/** The element an in-page href ('#' and an id) points at. */
function targetOf(href: string): HTMLElement | null {
  return href.startsWith('#') && href.length > 1
    ? document.getElementById(href.slice(1))
    : null;
}

/**
 * The heading being read, of those `hrefs` point at, as the page scrolls
 * and resizes: positions are read at most once a frame. The one source for
 * every stage of the contents on a page.
 */
export function useActiveHeading(hrefs: readonly string[]): ActiveHeading {
  const [activeHref, setActiveHref] = useState(hrefs[0]);
  const [position, setPosition] = useState(0);
  const isHeldRef = useRef(false);
  // The hrefs as one string, so a new array with the same hrefs is no change.
  const key = hrefs.join('\n');

  useEffect(() => {
    const tracked = key === '' ? [] : key.split('\n');
    let frame = 0;
    const update = (): void => {
      frame = 0;
      if (isHeldRef.current) {
        return;
      }
      const tops = tracked.flatMap((href) => {
        const target = targetOf(href);
        return target === null
          ? []
          : [{ href, top: target.getBoundingClientRect().top }];
      });
      const isAtEnd =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 2;
      const readingLine = window.innerHeight * READING_LINE;
      setActiveHref(activeHeading(tops, readingLine, isAtEnd));
      setPosition(readingPosition(tops, readingLine, isAtEnd));
    };
    const schedule = (): void => {
      if (frame === 0) {
        frame = requestAnimationFrame(update);
      }
    };
    const release = (): void => {
      if (isHeldRef.current) {
        isHeldRef.current = false;
        schedule();
      }
    };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    for (const type of TAKEOVER_EVENTS) {
      window.addEventListener(type, release, { capture: true, passive: true });
    }
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      for (const type of TAKEOVER_EVENTS) {
        window.removeEventListener(type, release, { capture: true });
      }
    };
  }, [key]);

  const jumpTo = useCallback(
    (href: string): boolean => {
      const target = targetOf(href);
      if (target === null) {
        return false;
      }
      const prefersLessMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches;
      target.scrollIntoView({
        behavior: prefersLessMotion ? 'instant' : 'smooth',
        block: 'start',
      });
      /*
       * Focus moves to the target, as a plain anchor moves where the next Tab
       * starts, so a keyboard reader carries on from the section, not from the
       * contents. Without a ring: it would outline the whole section.
       */
      if (!target.hasAttribute('tabindex')) {
        target.setAttribute('tabindex', '-1');
      }
      target.focus({ preventScroll: true, focusVisible: false });
      if (window.location.hash !== href) {
        window.history.pushState(null, '', href);
      }
      isHeldRef.current = true;
      setActiveHref(href);
      setPosition(Math.max(key.split('\n').indexOf(href), 0));
      return true;
    },
    [key],
  );

  return { activeHref, position, jumpTo };
}

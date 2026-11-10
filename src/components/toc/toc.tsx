'use client';

/*
 * A page's contents in three stages, from one scroll-following source:
 *
 *   <Toc items={items}>
 *     <TocRail />     lines with titles, for a wide margin
 *     <TocMinimap />  the lines alone, the titles in a hover card beside them
 *     <TocMenu />     a sticky bar with the current title, the links in a popover
 *   </Toc>
 *
 * `Toc` renders nothing of its own: it holds the items and the heading being
 * read, so the stages can sit anywhere under it, each shown where the page
 * has room for it. The breakpoints are the page's, so no stage has any.
 *
 * Self-contained, to move to Wave UI (`src/toc.tsx`) as it is: it imports
 * only React, Base UI and its own folder. On the way, map Learn's Graphite
 * classes to Wave UI's names, and join classes with `cn`, so a className can
 * override a default (`top-0` on the menu, say):
 *
 *   text-graphite-900    → text-contrast
 *   text-graphite-500    → text-muted (text-subtle for the group titles)
 *   bg-graphite-900      → bg-contrast (with its opacities)
 *   bg-graphite-0        → bg-foundation (the bar), bg-elevated (the panels)
 *   bg-graphite-100      → bg-edge
 *   border-graphite-100  → border-edge
 *   outline-graphite-900 → outline-focus
 */

import { createContext, use, useCallback, useMemo, useState } from 'react';
import type { MouseEvent, ReactNode } from 'react';
import { Popover } from '@base-ui/react/popover';

import { LineNav } from './line-nav';
import { useActiveHeading } from './use-active-heading';

export interface TocItem {
  title: string;
  /** '#' and the id of the element the item jumps to; unique in the list. */
  href: string;
  /** How deep the heading sits: 0, the default, for a section, 1 below it. */
  depth?: number;
}

export interface TocProps {
  items: readonly TocItem[];
  /** The stages, wherever they sit in the page; optional, as a Base UI root's. */
  children?: ReactNode;
}

export interface TocStageProps {
  /**
   * The navigation landmark's accessible name. When a page has more than one
   * stage in its markup at once, give each a name of its own.
   */
  label?: string;
  /** A small title above the lines, as "On this page"; none by default. */
  heading?: string;
  className?: string;
}

export interface TocMenuProps extends TocStageProps {
  /** The word the bar shows before the current title. */
  heading?: string;
}

interface TocContextValue {
  items: readonly TocItem[];
  activeHref: string | undefined;
  /** Where the reader is among the items, continuously (`readingPosition`). */
  position: number;
  onItemClick: (event: MouseEvent<HTMLAnchorElement>, href: string) => void;
}

const TocContext = createContext<TocContextValue | null>(null);

function useToc(part: string): TocContextValue {
  const context = use(TocContext);
  if (context === null) {
    throw new Error(`<${part}> must be inside <Toc>.`);
  }
  return context;
}

/**
 * The page's contents: tracks the heading being read for every stage below
 * it, and turns a click on any stage's link into a smooth jump.
 */
export function Toc({ items, children }: TocProps): ReactNode {
  const { activeHref, position, jumpTo } = useActiveHeading(
    items.map(({ href }) => href),
  );
  const onItemClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>, href: string): void => {
      // A click for a new tab or window is the browser's, and so is a link
      // with nothing on the page to jump to.
      const isPlainClick =
        event.button === 0 &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.shiftKey &&
        !event.altKey;
      if (isPlainClick && jumpTo(href)) {
        event.preventDefault();
      }
    },
    [jumpTo],
  );
  const value = useMemo(
    () => ({ items, activeHref, position, onItemClick }),
    [items, activeHref, position, onItemClick],
  );
  return <TocContext value={value}>{children}</TocContext>;
}

/** How deep an item sits, as far as the stages show: three steps. */
type Level = 0 | 1 | 2;

function levelOf(depth: number | undefined): Level {
  if (depth === undefined || depth <= 0) {
    return 0;
  }
  return depth === 1 ? 1 : 2;
}

const isCurrent = (href: string, activeHref: string | undefined) =>
  href === activeHref ? 'location' : undefined;

/**
 * A ruler of lines, one for each item with its title beside it and two
 * short ticks between: the current item's line grows, and so does a hovered
 * one's. The hit area reaches past the hairline for a finger or a pointer.
 */
export function TocRail({ className = '', heading }: TocStageProps): ReactNode {
  const { items, activeHref, position, onItemClick } = useToc('TocRail');
  if (items.length === 0) {
    return null;
  }
  return (
    <LineNav
      className={className}
      heading={heading}
      items={items.map(({ title, href }) => ({ title, href }))}
      activeHref={activeHref}
      position={position}
      // The rail stands still beside the page: scrolling its active link
      // into view would scroll the page itself.
      scrollActiveIntoView={false}
      onItemClick={(item, event) => onItemClick(event, item.href)}
    />
  );
}

/** A menu row, indented by depth past its padding. */
const PANEL_INDENT: Record<Level, string> = {
  0: 'ps-3',
  1: 'ps-6',
  2: 'ps-9',
};

/*
 * Where the minimap opens: 8px round its lines, the longest 40px. The lines
 * start past the list's 16px padding, below its 21px padding, and, with a
 * heading, below the heading's 16px line and the 16px under it; they end
 * above the 21px padding at the bottom.
 */
const TRIGGER = {
  plain: 'left-2 top-[13px] bottom-[13px] w-14',
  headed: 'left-2 top-[45px] bottom-[13px] w-14',
} as const;

/**
 * The lines alone, for a narrow margin: the rail without its titles. Hovered
 * or focused, it opens in place into the full rail in a card over the page.
 */
export function TocMinimap({
  className = '',
  heading,
}: TocStageProps): ReactNode {
  const { items, activeHref, position, onItemClick } = useToc('TocMinimap');
  if (items.length === 0) {
    return null;
  }
  return (
    // The rail's lines alone; hovered or focused, the full rail in a card
    // over the page: its titles fade in from the left as a border and a
    // ground fade in round it. At rest the card ignores the pointer but for
    // a zone 8px round the lines (`TRIGGER`); open, the whole card holds it.
    <div className={className}>
      <div className="group/card pointer-events-none relative z-50 -ms-4 w-max rounded-md border border-transparent transition-[background-color,border-color,box-shadow] delay-(--stagger-md) duration-(--duration-md) ease-(--ease) focus-within:pointer-events-auto focus-within:border-graphite-100 focus-within:bg-graphite-0 focus-within:shadow-sm focus-within:delay-0 hover:pointer-events-auto hover:border-graphite-100 hover:bg-graphite-0 hover:shadow-sm hover:delay-0">
        <span
          aria-hidden
          className={`pointer-events-auto absolute ${heading === undefined ? TRIGGER.plain : TRIGGER.headed} group-hover/card:pointer-events-none`}
        />
        <LineNav
          // The card's padding is the list's own, so the whole card is the
          // list: the pointer anywhere on it opens the titles. The list adds
          // nothing to the card's width (`contain-inline-size`), so a line's
          // spring can never widen it: the sizer below alone sets it.
          className="ps-4 pe-5 contain-inline-size"
          items={items.map(({ title, href }) => ({ title, href }))}
          activeHref={activeHref}
          position={position}
          titles="hover"
          heading={heading}
          scrollActiveIntoView={false}
          onItemClick={(item, event) => onItemClick(event, item.href)}
        />
        {/*
         * The card's width, always, open or not, so it never changes: its
         * widest title beside a line
         * at full length (the list's 16px padding, the 40px line and the
         * 12px gap), and 4px for the spring's overshoot, so a title never
         * reaches the border as its line springs.
         */}
        <div aria-hidden className="invisible h-0 overflow-hidden">
          {[heading, ...items.map(({ title }) => title)].map(
            (title) =>
              title !== undefined && (
                <div
                  key={title}
                  className="ps-18 pe-5 text-sm whitespace-nowrap"
                >
                  {title}
                </div>
              ),
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * A bar for a page with no margin to spare: sticky at the top, it names the
 * current section and opens the links in a popover. Choosing one closes it,
 * and so do Escape and a press outside (Base UI's).
 */
export function TocMenu({
  label = 'Contents',
  heading = 'Contents',
  className = '',
}: TocMenuProps): ReactNode {
  const { items, activeHref, onItemClick } = useToc('TocMenu');
  const [isOpen, setIsOpen] = useState(false);
  const current = items.find(({ href }) => href === activeHref) ?? items[0];
  if (current === undefined) {
    return null;
  }
  return (
    <nav
      aria-label={label}
      className={`sticky top-0 z-10 border-b border-graphite-100 bg-graphite-0/90 backdrop-blur-sm ${className}`}
    >
      <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
        <Popover.Trigger className="group flex h-12 w-full items-center gap-3 rounded-md text-left text-sm outline-graphite-900 focus-visible:outline-2">
          <span className="shrink-0 text-graphite-500">{heading}</span>
          <span aria-hidden className="h-4 w-px shrink-0 bg-graphite-900/20" />
          <span className="sr-only">, </span>
          <span className="min-w-0 flex-1 truncate font-medium text-graphite-900">
            {current.title}
          </span>
          <svg
            aria-hidden
            viewBox="0 0 16 16"
            className="size-4 shrink-0 text-graphite-500 transition-transform duration-(--duration-sm) ease-(--ease) group-data-popup-open:rotate-180"
          >
            <path
              d="M4 6l4 4 4-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner
            side="bottom"
            align="start"
            sideOffset={4}
            className="isolate z-50"
          >
            <Popover.Popup
              aria-label={heading}
              className="max-h-[min(var(--available-height),24rem)] w-(--anchor-width) origin-(--transform-origin) overflow-y-auto rounded-md border border-graphite-100 bg-graphite-0 p-1 shadow-lg transition-[opacity,scale] duration-(--duration-md) ease-(--ease) outline-none data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0"
            >
              <ol>
                {items.map((item) => (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      aria-current={isCurrent(item.href, activeHref)}
                      onClick={(event) => {
                        onItemClick(event, item.href);
                        setIsOpen(false);
                      }}
                      className={`group flex items-center gap-3 rounded-sm py-2 pe-3 text-sm text-graphite-500 outline-graphite-900 hover:text-graphite-900 focus-visible:outline-2 focus-visible:-outline-offset-2 aria-[current=location]:text-graphite-900 ${PANEL_INDENT[levelOf(item.depth)]}`}
                    >
                      <span
                        aria-hidden
                        className="block h-px w-3 shrink-0 bg-graphite-900/20 group-aria-[current=location]:bg-graphite-900"
                      />
                      {item.title}
                    </a>
                  </li>
                ))}
              </ol>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </nav>
  );
}

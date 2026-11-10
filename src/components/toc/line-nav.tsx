'use client';

import { memo, useEffect, useRef } from 'react';
import { motion } from 'motion/react';

import { cn } from './cn';

const lineVariants = {
  normal: { width: 24 },
  active: { width: 40 },
  hover: { width: 40 },
};

/*
 * Three ticks between items, every line 5.75px from the next, so items
 * stand 27px apart, as they did with two ticks 8px apart, and the titles
 * keep their spacing. The ticks are a gauge of how far the reader is on the
 * way to the next item: only the ticks after the item being read, and only
 * those reached, each a step lighter than the one above (`TICK_INK`).
 */
const TICKS = [1, 2, 3] as const;
type TickStep = (typeof TICKS)[number];
/*
 * The ticks reached, each a step lighter than the one above, in Graphite
 * 900: the current item in full, then 70%, 50% and 30%; the rest in
 * Graphite 100.
 */
const TICK_INK = {
  1: 'bg-graphite-900/70',
  2: 'bg-graphite-900/50',
  3: 'bg-graphite-900/30',
} as const;
/** At rest, the border's Graphite 100: a hairline, lighter than any tick reached. */
const REST = 'bg-graphite-100';

/*
 * How hidden titles show, in Wave UI's motion: from 4px to the left, blurred
 * and clear of ink, over a popup's 200ms on the one curve, a stagger after
 * the card around them; going, at once, before the card.
 */
const REVEAL =
  'opacity-0 -translate-x-(--offset-md) blur-(--blur-md) transition-[opacity,translate,filter,visibility] duration-(--duration-md) ease-(--ease) group-focus-within/line-nav:visible group-focus-within/line-nav:translate-x-0 group-focus-within/line-nav:opacity-100 group-focus-within/line-nav:blur-none group-focus-within/line-nav:delay-(--stagger-md) group-hover/line-nav:visible group-hover/line-nav:translate-x-0 group-hover/line-nav:opacity-100 group-hover/line-nav:blur-none group-hover/line-nav:delay-(--stagger-md)';

/** The color of tick `step` after item `index`, for the reader at `position`. */
function tickOpacity(
  index: number,
  step: TickStep,
  position: number | undefined,
): string {
  if (position === undefined || Math.floor(position) !== index) {
    return REST;
  }
  // The ticks reached: a quarter of the way on reaches the first.
  const reached = Math.floor((position - index) * (TICKS.length + 1));
  return step <= reached ? TICK_INK[step] : REST;
}

export type LineNavItem = {
  title: string;
  href: string;
};

export type LineNavProps = {
  className?: string;
  /** @fumadocsHref #linenavitem */
  items: LineNavItem[];
  /** Href of the active item. */
  activeHref?: string | undefined;
  /** Scroll the active item into view on mount. */
  scrollActiveIntoView?: boolean;
  /**
   * When the titles show: always, or only while the nav is hovered or holds
   * focus, fading in from the left; until then the lines alone, as a
   * minimap. Hidden titles take no room and catch no pointer.
   */
  titles?: 'always' | 'hover';
  /**
   * A small title above the lines, flush with them, in Wave UI's subtle:
   * "On this page". With `titles="hover"` it shows with the titles.
   */
  heading?: string | undefined;
  /**
   * Where the reader is, continuously: an item's index and the share of the
   * way on to the next. The ticks show the reader's place on the rail.
   */
  position?: number | undefined;
  /** Called when an item is clicked. */
  onItemClick?: (
    item: LineNavItem,
    event: React.MouseEvent<HTMLAnchorElement>,
  ) => void;
};

export function LineNav({
  className,
  items,
  activeHref,
  scrollActiveIntoView = true,
  titles = 'always',
  heading,
  position,
  onItemClick,
}: LineNavProps) {
  const activeItemRef = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    if (scrollActiveIntoView) {
      activeItemRef.current?.scrollIntoView({ block: 'center' });
    }
  }, [scrollActiveIntoView]);

  return (
    <nav
      className={cn(
        'group/line-nav flex flex-col gap-[5.75px] py-5.25',
        className,
      )}
      style={
        {
          '--line-nav-width': `${lineVariants.normal.width}px`,
        } as React.CSSProperties
      }
    >
      {heading !== undefined && (
        <p
          className={cn(
            // Wave UI's gap-4 to the first line, less the lines' own 5.75px.
            'mb-[calc(--spacing(4)-5.75px)] text-xs font-medium text-graphite-500',
            // Hidden, it keeps its line, so the lines never move when it
            // shows; it fades in with the titles (`REVEAL`).
            titles === 'hover' && `invisible whitespace-nowrap ${REVEAL}`,
          )}
        >
          {heading}
        </p>
      )}
      {items.map((item, index) => {
        const isActive = item.href === activeHref;

        return (
          <LineNavItem
            key={item.href}
            ref={isActive ? activeItemRef : undefined}
            title={item.title}
            href={item.href}
            active={isActive}
            isLast={index === items.length - 1}
            revealTitle={titles === 'hover'}
            ticks={TICKS.map((step) => tickOpacity(index, step, position))}
            onClick={
              onItemClick ? (event) => onItemClick(item, event) : undefined
            }
          />
        );
      })}
    </nav>
  );
}

const LineNavItem = memo(function LineNavItem({
  ref,
  title,
  href,
  active = false,
  isLast = false,
  revealTitle = false,
  ticks = [],
  onClick,
}: {
  ref?: React.Ref<HTMLAnchorElement> | undefined;
  title: string;
  href: string;
  active?: boolean;
  isLast?: boolean;
  revealTitle?: boolean;
  /** The color class of each of the three ticks after the item. */
  ticks?: readonly string[];
  onClick?: React.MouseEventHandler<HTMLAnchorElement> | undefined;
}) {
  return (
    <>
      {/*
        Rendered as a plain anchor to stay framework-agnostic. For client-side
        navigation in Next.js, swap `motion.a` for `motion.create(Link)`
        (import Link from "next/link").
      */}
      <motion.a
        ref={ref}
        aria-current={active ? 'page' : undefined}
        className="group relative flex h-px items-center gap-3 after:absolute after:top-1/2 after:left-0 after:size-full after:-translate-y-1/2 after:p-3.5"
        href={href}
        initial={false}
        animate={active ? 'active' : 'normal'}
        whileHover="hover"
        onClick={onClick}
      >
        <motion.span
          className="block h-px shrink-0 bg-graphite-100 transition-[background-color] duration-(--duration-sm) ease-(--ease) group-hover:bg-graphite-900 group-aria-[current=page]:bg-graphite-900"
          variants={lineVariants}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        />
        <span
          className={cn(
            'text-sm whitespace-nowrap text-graphite-500 transition-[color] duration-(--duration-sm) ease-(--ease) group-hover:text-graphite-900 group-aria-[current=page]:text-graphite-900',
          )}
        >
          <span
            className={cn(revealTitle && `invisible inline-block ${REVEAL}`)}
          >
            {title}
          </span>
        </span>
      </motion.a>

      {!isLast &&
        TICKS.map((step) => (
          <span
            key={step}
            className={cn(
              'block h-px w-(--line-nav-width) transition-[background-color] duration-(--duration-sm) ease-(--ease)',
              ticks[step - 1] ?? REST,
            )}
          />
        ))}
    </>
  );
});

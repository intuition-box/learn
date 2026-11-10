/**
 * A download button's look, from the brand's config: filled in a brand
 * color with an icon before its label, or outlined. The cards' links and
 * the page's skill share it.
 */

import type { CSSProperties, ReactNode } from 'react';

import { findColor } from './brand-config';
import type { BrandConfig, BrandIcon } from './brand-config';
import { isLight } from './color';

/** The download buttons' look, from the config: a fill, the ink on it, an icon. */
export interface ButtonLook {
  fill: string;
  ink: string;
  icon: BrandIcon;
}

export function buttonLook(config: BrandConfig): ButtonLook | undefined {
  const downloads = config.downloads;
  const fill =
    downloads === undefined ? undefined : findColor(config, downloads.color);
  if (downloads === undefined || fill === undefined) {
    return undefined;
  }
  return {
    fill: fill.value,
    ink: isLight(fill.value) ? 'text-graphite-900' : 'text-graphite-0',
    icon: downloads.icon,
  };
}

/**
 * A download button's class, and its fill: filled in the brand's color, or
 * outlined. The fill sits at 80% over a 4px blur of what is behind it, and
 * turns whole on hover.
 */
export function buttonProps(look: ButtonLook | undefined): {
  className: string;
  style?: CSSProperties & Record<'--fill', string>;
} {
  return look === undefined
    ? { className: 'btn btn-secondary' }
    : {
        className: `btn gap-1.5 ps-3 ${look.ink} bg-(--fill)/80 backdrop-blur-xs not-disabled:hover:bg-(--fill)`,
        // The fill is the brand's color, from the config: no token stands in for it.
        style: { '--fill': look.fill },
      };
}

/** The button's icon, in the label's ink. Decoration: the label says what it does. */
export function ButtonIcon({ icon }: { icon: BrandIcon }): ReactNode {
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${icon.size} ${icon.size}`}
      className="size-4 shrink-0"
    >
      {icon.paths.map(({ d, opacity }) => (
        <path key={d} d={d} fill="currentColor" opacity={opacity} />
      ))}
    </svg>
  );
}

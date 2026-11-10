import type { ReactNode } from 'react';

import { SPAN, SUBGRID } from '../layout/grid';
import { findColor } from './brand-config';
import type {
  BrandColor,
  BrandConfig,
  ColorGroup,
  ContrastPair,
  SectionMeta,
} from './brand-config';
import { BrandSection, DESCRIPTION, Subsection } from './brand-section';
import {
  contrastRatio,
  formatOklch,
  formatRatio,
  isLight,
  parseHex,
  rgbToOklch,
} from './color';

export interface ColorSectionProps {
  config: BrandConfig;
  section: SectionMeta;
}

/**
 * A color: a block of it, the palette step it is as a badge in its corner,
 * then its name, and its value as OKLCH and as HEX.
 */
function Swatch({ color }: { color: BrandColor }): ReactNode {
  return (
    // Three columns of the twelve: four swatches to a row.
    <li className={`${SPAN[3]} panel overflow-hidden`}>
      <div
        // 3:1, as the swatch is 3 cells wide: the color a cell tall.
        className="relative aspect-3/1"
        // The value is the content: no token could stand in for it.
        style={{ backgroundColor: color.value }}
      >
        {color.alias === undefined ? null : (
          <span
            className={`absolute top-3 right-3 rounded-sm px-1.5 py-0.5 font-mono text-xs ${
              // In the block's own ink: dark on a light color, white on a dark one.
              isLight(color.value)
                ? 'bg-graphite-900/10 text-graphite-900'
                : 'bg-graphite-0/15 text-graphite-0'
            }`}
          >
            {color.alias}
          </span>
        )}
      </div>
      {/* A rule between block and caption: white on a white page has no edge of its own. */}
      <div className="border-t border-graphite-100 px-4 py-3">
        <p className="text-sm font-medium">{color.name}</p>
        <p className="font-mono text-xs text-graphite-500">
          {formatOklch(rgbToOklch(parseHex(color.value)))}
        </p>
        <p className="font-mono text-xs text-graphite-500">{color.value}</p>
      </div>
    </li>
  );
}

/**
 * A palette's width: three columns for each of its swatches, as a swatch is,
 * so short palettes stand side by side in one row (Primary, Secondary and
 * Accent's four swatches), and a palette of four or more takes rows of its
 * own.
 */
function paletteSpan(swatches: number): string {
  if (swatches === 1) {
    return SPAN[3];
  }
  if (swatches === 2) {
    return 'col-span-full lg:col-span-6';
  }
  return swatches === 3 ? 'col-span-full lg:col-span-9' : 'col-span-full';
}

/**
 * A palette: its name set as a lockup's is, small over what it names, then
 * its swatches. Its name is a heading one level under whatever it sits in:
 * a subsection's (h4), or the section's (h3).
 */
function Palette({
  group,
  isInSubsection,
}: {
  group: ColorGroup;
  isInSubsection: boolean;
}): ReactNode {
  const Heading = isInSubsection ? 'h4' : 'h3';
  return (
    <div
      className={`${paletteSpan(group.colors.length)} grid grid-cols-subgrid`}
    >
      <Heading className="col-span-full mb-3 text-sm font-medium">
        {group.name}
      </Heading>
      <ul className={`${SUBGRID} list-none gap-y-3`}>
        {group.colors.map((color) => (
          <Swatch key={color.id} color={color} />
        ))}
      </ul>
    </div>
  );
}

interface PaletteRun {
  heading: string | undefined;
  /** The paragraph under the heading. */
  lead: string | undefined;
  groups: ColorGroup[];
}

/**
 * The palettes in runs, each opened by a palette with a heading and lasting
 * until the next: a run with no heading is the palettes before the first.
 */
function runsOf(groups: readonly ColorGroup[]): PaletteRun[] {
  const runs: PaletteRun[] = [];
  for (const group of groups) {
    const last = runs.at(-1);
    if (group.heading !== undefined || last === undefined) {
      runs.push({ heading: group.heading, lead: group.lead, groups: [group] });
    } else {
      last.groups.push(group);
    }
  }
  return runs;
}

/**
 * A pair: the chip is the pair's background, the sample set on it in the
 * foreground at full size, no box round it: "Aa" for a pair for text, the
 * shape itself for a pair for shapes. Then its name, its ratio and what it
 * is for, in the chip's own ink, so they always read, however the pair
 * does. The sample is hidden from assistive technology: the words say it.
 */
function ContrastChip({
  pair,
  foreground,
  background,
}: {
  pair: ContrastPair;
  foreground: BrandColor;
  background: BrandColor;
}): ReactNode {
  const use = pair.use ?? 'text';
  const ratio = contrastRatio(
    parseHex(foreground.value),
    parseHex(background.value),
  );
  const light = isLight(background.value);
  const { shape } = pair;
  return (
    <li
      className={`${SPAN[3]} flex items-center gap-4 rounded-lg border p-4 ${
        // White on a white page has no edge of its own; a dark chip has one.
        light
          ? 'border-graphite-100 text-graphite-900'
          : 'border-transparent text-graphite-0'
      }`}
      // The pair is the content: its own two colors.
      style={{ backgroundColor: background.value }}
    >
      {use === 'shapes' && shape !== undefined ? (
        <svg
          aria-hidden
          viewBox={`${shape.view.x} ${shape.view.y} ${shape.view.width} ${shape.view.height}`}
          className="size-10 shrink-0"
        >
          <path d={shape.d} fill={foreground.value} />
        </svg>
      ) : (
        <span
          aria-hidden
          className="w-10 shrink-0 text-center text-3xl leading-none font-medium"
          style={{ color: foreground.value }}
        >
          Aa
        </span>
      )}
      <span className="min-w-0 text-sm font-medium">
        {pair.name}
        <span
          className={`block text-xs font-normal ${light ? 'text-graphite-500' : 'text-graphite-0/70'}`}
        >
          {formatRatio(ratio)} · {use}
        </span>
      </span>
    </li>
  );
}

/**
 * The pairs, light chips first and dark ones after, each group under its
 * name, set small as a palette's is.
 */
function ContrastGroups({
  pairs,
}: {
  pairs: readonly {
    pair: ContrastPair;
    foreground: BrandColor;
    background: BrandColor;
  }[];
}): ReactNode {
  const groups = [
    {
      name: 'On light',
      pairs: pairs.filter((p) => isLight(p.background.value)),
    },
    {
      name: 'On dark',
      pairs: pairs.filter((p) => !isLight(p.background.value)),
    },
  ].filter((group) => group.pairs.length > 0);
  return (
    <div className={`${SUBGRID} gap-y-10`}>
      {groups.map((group) => (
        <div key={group.name} className={SUBGRID}>
          <h4 className="col-span-full mb-3 text-sm font-medium">
            {group.name}
          </h4>
          <ul className={`${SUBGRID} list-none gap-y-3`}>
            {group.pairs.map(({ pair, foreground, background }) => (
              <ContrastChip
                key={`${pair.foreground} on ${pair.background} for ${pair.use ?? 'text'}`}
                pair={pair}
                foreground={foreground}
                background={background}
              />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/**
 * How much of each color the brand shows: one bar, a pill, each color as
 * wide as its share, the share printed in it in the color's own ink. Read
 * out as one sentence; the segments are a picture of it.
 */
function UsageBar({
  usage,
}: {
  usage: readonly { color: BrandColor; share: number }[];
}): ReactNode {
  const said = usage
    .map(({ color, share }) => `${color.name} ${share}%`)
    .join(', ');
  return (
    <div
      role="img"
      aria-label={`Color usage: ${said}`}
      // A hairline round it: the white share has no edge of its own on a white page.
      className="col-span-full flex h-10 overflow-hidden rounded-full border border-graphite-100"
    >
      {usage.map(({ color, share }) => (
        <div
          key={color.id}
          className={`flex min-w-0 items-center justify-center overflow-hidden ${
            isLight(color.value) ? 'text-graphite-900' : 'text-graphite-0'
          }`}
          // The share and the color are the content: no token stands in for them.
          style={{
            flexGrow: share,
            flexBasis: 0,
            backgroundColor: color.value,
          }}
        >
          {/* Clipped rather than widening its segment, so the shares stay true. */}
          <span aria-hidden className="font-mono text-xs whitespace-nowrap">
            {share}%
          </span>
        </div>
      ))}
    </div>
  );
}

/** The colors, group by group, then how well chosen pairs of them read. */
export function ColorSection({
  config,
  section,
}: ColorSectionProps): ReactNode {
  const colors = config.colors;
  if (colors === undefined) {
    return null;
  }
  const pairs = (colors.contrast ?? []).flatMap((pair) => {
    const foreground = findColor(config, pair.foreground);
    const background = findColor(config, pair.background);
    return foreground === undefined || background === undefined
      ? []
      : [{ pair, foreground, background }];
  });

  const usage = (colors.usage?.shares ?? []).flatMap(({ color, share }) => {
    const found = findColor(config, color);
    return found === undefined ? [] : [{ color: found, share }];
  });

  return (
    <BrandSection section={section} lead={colors.lead}>
      {runsOf(colors.groups).map(({ heading, lead, groups }) =>
        heading === undefined ? (
          groups.map((group) => (
            <Palette key={group.name} group={group} isInSubsection={false} />
          ))
        ) : (
          <Subsection key={heading} label={heading}>
            {lead === undefined ? null : (
              <p className={`${DESCRIPTION} mb-4`}>{lead}</p>
            )}
            <div className={`${SUBGRID} gap-y-10`}>
              {groups.map((group) => (
                <Palette key={group.name} group={group} isInSubsection />
              ))}
            </div>
          </Subsection>
        ),
      )}
      {usage.length === 0 ? null : (
        <Subsection label="Usage">
          {colors.usage?.lead === undefined ? null : (
            <p className={`${DESCRIPTION} mb-4`}>{colors.usage.lead}</p>
          )}
          <UsageBar usage={usage} />
        </Subsection>
      )}
      {pairs.length === 0 ? null : (
        <Subsection label="Contrast">
          <p className={`${DESCRIPTION} mb-4`}>
            WCAG 2 contrast, rounded down. Text needs 4.5:1 for AA, 7:1 for AAA,
            and 3:1 when it is large. Shapes, icons and the parts of a picture
            need 3:1.
          </p>
          <ContrastGroups pairs={pairs} />
        </Subsection>
      )}
    </BrandSection>
  );
}

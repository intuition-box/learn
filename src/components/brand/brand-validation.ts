/**
 * Everything wrong with a brand's config that its types cannot catch: names
 * that would collide as files or as download links, SVGs whose shape or
 * size is not their preset's, colors that are not colors, references to
 * things that do not exist. The page and the files route both refuse a
 * brand with issues, so a mistake fails the build, every issue listed at
 * once, rather than shipping a squashed PNG.
 */

import { describeAsset } from './asset-files';
import { PRESETS } from './asset-presets';
import { brandAssets, presentSections } from './brand-config';
import type { BrandConfig, LogoAsset } from './brand-config';
import { readSvgRoot, SVG_NAMESPACE } from './svg-document';

export interface BrandIssue {
  /** Where it is, from the section in: 'social › x-banner'. */
  where: string;
  problem: string;
}

const KEBAB_CASE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const HEX = /^#[0-9a-f]{6}$/;
const TEXT = /<text[\s>]/;

/** The issues with one asset's SVG against its preset. */
function svgIssues(
  svg: string,
  presetId: keyof typeof PRESETS,
): readonly string[] {
  const preset = PRESETS[presetId];
  const root = readSvgRoot(svg);
  const problems: string[] = [];
  if (root.xmlns !== SVG_NAMESPACE) {
    problems.push(
      `has no xmlns="${SVG_NAMESPACE}": a downloaded file would not open as SVG`,
    );
  }

  const viewBox = root.viewBox;
  const [, , viewWidth = Number.NaN, viewHeight = Number.NaN] = viewBox ?? [];
  if (viewBox === undefined) {
    problems.push('has no viewBox');
  } else if (
    viewBox.length !== 4 ||
    !viewBox.every(Number.isFinite) ||
    viewWidth <= 0 ||
    viewHeight <= 0
  ) {
    problems.push(
      `viewBox ${viewBox.join(' ')} is not four numbers with a positive width and height`,
    );
  } else if (
    Math.abs(viewWidth * preset.height - viewHeight * preset.width) >
    1e-6 * viewWidth * preset.height
  ) {
    problems.push(
      `viewBox ${viewBox.join(' ')} is ${(viewWidth / viewHeight).toFixed(3)}:1, but preset ${preset.id} is ${preset.width}×${preset.height} (${(preset.width / preset.height).toFixed(3)}:1)`,
    );
  }

  if (root.width !== preset.width || root.height !== preset.height) {
    problems.push(
      `is ${root.width ?? '?'}×${root.height ?? '?'} (its width and height), but preset ${preset.id} is ${preset.width}×${preset.height}: a downloaded SVG would open at the wrong size`,
    );
  }

  if (TEXT.test(svg)) {
    problems.push(
      'draws text, but PNGs are rendered without fonts: outline the words as paths or leave them out',
    );
  }
  return problems;
}

/** Whether a logo's lockup, grown by its clear space, fits on its canvas. */
function clearSpaceFits(asset: LogoAsset): boolean {
  const { width, height } = PRESETS[asset.preset];
  const { x, y, width: lockupWidth, height: lockupHeight } = asset.lockup;
  const space = asset.clearSpace;
  // A hair of slack for the rounding of a lockup laid out by `fitLockup`.
  const slack = 1e-6 * Math.max(width, height);
  return (
    space >= 0 &&
    x - space >= -slack &&
    y - space >= -slack &&
    x + lockupWidth + space <= width + slack &&
    y + lockupHeight + space <= height + slack
  );
}

/** Every issue with `config`; none for a brand ready to render. */
export function brandIssues(config: BrandConfig): readonly BrandIssue[] {
  const issues: BrandIssue[] = [];
  const add = (where: string, problem: string): void => {
    issues.push({ where, problem });
  };

  if (!KEBAB_CASE.test(config.slug)) {
    add('brand', `slug "${config.slug}" is not kebab-case`);
  }

  // Assets: their names, their files.
  const assetSlugs = new Set<string>();
  // Case folded, since a screen reader says 'Logo' and 'logo' alike.
  const assetDescriptions = new Set<string>();
  for (const { section, asset } of brandAssets(config)) {
    const where = `${section} › ${asset.slug}`;
    if (!KEBAB_CASE.test(asset.slug)) {
      add(where, `slug "${asset.slug}" is not kebab-case`);
    }
    if (assetSlugs.has(asset.slug)) {
      add(
        where,
        `slug "${asset.slug}" is used by another asset, and the two would share file names`,
      );
    }
    assetSlugs.add(asset.slug);
    const description = describeAsset(asset);
    if (assetDescriptions.has(description.toLowerCase())) {
      add(
        where,
        `"${description}" (its name and preset) describes another asset too, and their download links would read alike`,
      );
    }
    assetDescriptions.add(description.toLowerCase());
    for (const problem of svgIssues(asset.svg, asset.preset)) {
      add(where, problem);
    }
  }

  // Colors: each one, then every reference to one.
  const colorIds = new Set<string>();
  for (const group of config.colors?.groups ?? []) {
    for (const color of group.colors) {
      const where = `colors › ${color.id}`;
      if (!KEBAB_CASE.test(color.id)) {
        add(where, `id "${color.id}" is not kebab-case`);
      }
      if (colorIds.has(color.id)) {
        add(where, `id "${color.id}" is used by another color`);
      }
      colorIds.add(color.id);
      if (!HEX.test(color.value)) {
        add(where, `value "${color.value}" is not a lowercase #rrggbb`);
      }
    }
  }
  for (const pair of config.colors?.contrast ?? []) {
    for (const id of [pair.foreground, pair.background]) {
      if (!colorIds.has(id)) {
        add(
          `colors › contrast ${pair.foreground} on ${pair.background}`,
          `no color has the id "${id}"`,
        );
      }
    }
  }
  for (const { section, asset } of brandAssets(config)) {
    if (asset.backdrop !== undefined && !colorIds.has(asset.backdrop)) {
      add(
        `${section} › ${asset.slug}`,
        `backdrop "${asset.backdrop}" is not a color's id`,
      );
    }
  }

  const shares = config.colors?.usage?.shares ?? [];
  for (const { color, share } of shares) {
    if (!colorIds.has(color)) {
      add('colors › usage', `no color has the id "${color}"`);
    }
    if (!Number.isInteger(share) || share <= 0) {
      add(
        'colors › usage',
        `${color}'s share ${share} is not a whole number above 0`,
      );
    }
  }
  const total = shares.reduce((sum, { share }) => sum + share, 0);
  if (shares.length > 0 && total !== 100) {
    add('colors › usage', `the shares add up to ${total}, not 100`);
  }

  const downloads = config.downloads;
  if (downloads !== undefined && !colorIds.has(downloads.color)) {
    add('downloads', `color "${downloads.color}" is not a color's id`);
  }

  const logo = config.logo;
  for (const asset of logo?.assets ?? []) {
    if (!clearSpaceFits(asset)) {
      add(
        `logo › ${asset.slug}`,
        `the lockup with ${asset.clearSpace}px of clear space round it does not fit on its ${PRESETS[asset.preset].width}×${PRESETS[asset.preset].height} canvas`,
      );
    }
  }

  // Sections the config has, with nothing in them.
  const isEmpty = {
    logo: (config.logo?.assets.length ?? 0) === 0,
    colors: !(config.colors?.groups ?? []).some(
      (group) => group.colors.length > 0,
    ),
    typography:
      (config.typography?.faces.length ?? 0) +
        (config.typography?.scale.length ?? 0) ===
      0,
    backgrounds: !(config.backgrounds?.kits ?? []).some(
      (kit) => kit.assets.length > 0,
    ),
    social: (config.social?.assets.length ?? 0) === 0,
    rules:
      (config.rules?.dos.length ?? 0) + (config.rules?.donts.length ?? 0) === 0,
  };
  for (const section of presentSections(config)) {
    if (isEmpty[section.key]) {
      add(section.key, 'is in the config but has nothing to show');
    }
  }
  for (const group of config.colors?.groups ?? []) {
    if (group.colors.length === 0) {
      add(`colors › ${group.name}`, 'is a group with no colors');
    }
    if (group.lead !== undefined && group.heading === undefined) {
      add(
        `colors › ${group.name}`,
        'has a lead but no heading to set it under',
      );
    }
  }

  return issues;
}

/** Throws one error listing every issue with `config`, if it has any. */
export function assertValidBrand(config: BrandConfig): void {
  const issues = brandIssues(config);
  if (issues.length > 0) {
    throw new Error(
      `Brand "${config.slug}" has ${issues.length} ${issues.length === 1 ? 'issue' : 'issues'}:\n${issues
        .map(({ where, problem }) => `- ${where}: ${problem}`)
        .join('\n')}`,
    );
  }
}

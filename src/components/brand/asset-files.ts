/**
 * The files a brand's pictures are downloaded as: each asset as SVG and as
 * PNG, named `<brand>-<asset>-<width>x<height>.<format>`. One name serves as
 * the file's URL and as its link's `download` attribute, so "Save link as"
 * and a click save the same file.
 */

import { PRESETS } from './asset-presets';
import { brandAssets } from './brand-config';
import type { BrandAsset, BrandConfig } from './brand-config';

export type AssetFormat = 'svg' | 'png';

/** The formats every asset is offered in, in the order its links come. */
export const ASSET_FORMATS = [
  'svg',
  'png',
] as const satisfies readonly AssetFormat[];

export interface BrandFile<Id extends string = string> {
  fileName: string;
  asset: BrandAsset<Id>;
  format: AssetFormat;
}

/** The name of an asset's file in `format`: 'intuition-x-banner-1500x500.png'. */
export function assetFileName(
  config: Pick<BrandConfig, 'slug'>,
  asset: Pick<BrandAsset, 'slug' | 'preset'>,
  format: AssetFormat,
): string {
  const { width, height } = PRESETS[asset.preset];
  return `${config.slug}-${asset.slug}-${width}x${height}.${format}`;
}

/**
 * An asset in words, as its download links name it: 'Graphite field, Phone
 * wallpaper 1179×2556'. A name alone is not enough, since one picture can
 * come in two sizes under one name, and a screen reader's list of links
 * shows the links without the caption that would tell them apart. The
 * preset's label is left out when it only repeats the name: 'X banner,
 * 1500×500'.
 */
export function describeAsset(
  asset: Pick<BrandAsset, 'name' | 'preset'>,
): string {
  const { label, width, height } = PRESETS[asset.preset];
  const size = `${width}×${height}`;
  return asset.name.toLowerCase() === label.toLowerCase()
    ? `${asset.name}, ${size}`
    : `${asset.name}, ${label} ${size}`;
}

/** Every file of the brand: each asset in page order, as SVG then PNG. */
export function brandFiles<Id extends string>(
  config: BrandConfig<Id>,
): readonly BrandFile<Id>[] {
  return brandAssets(config).flatMap(({ asset }) =>
    ASSET_FORMATS.map((format) => ({
      fileName: assetFileName(config, asset, format),
      asset,
      format,
    })),
  );
}

const FILES_BY_NAME = new WeakMap<BrandConfig, Map<string, BrandFile>>();

/**
 * The file named `fileName`, if the brand has one. Looked up by the whole
 * name, never parsed out of it, so nothing but a name the brand itself
 * produced can ever match: not a wrong extension, not a path.
 */
export function findBrandFile(
  config: BrandConfig,
  fileName: string,
): BrandFile | undefined {
  let files = FILES_BY_NAME.get(config);
  if (files === undefined) {
    files = new Map(brandFiles(config).map((file) => [file.fileName, file]));
    FILES_BY_NAME.set(config, files);
  }
  return files.get(fileName);
}

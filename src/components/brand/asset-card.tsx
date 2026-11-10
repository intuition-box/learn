import type { CSSProperties, ReactNode } from 'react';

import { assetFileName, describeAsset } from './asset-files';
import { PRESETS } from './asset-presets';
import { findColor } from './brand-config';
import type { BrandAsset, BrandConfig, LogoAsset } from './brand-config';
import { ParagraphContent } from './brand-section';
import { ButtonIcon, buttonLook, buttonProps } from './download-button';

export interface AssetCardProps {
  config: BrandConfig;
  asset: BrandAsset | LogoAsset;
  /** Where the brand's files are served: '/brand/files'. */
  filesBase: string;
  /** Its span on the page's grid. */
  className?: string | undefined;
}

/**
 * The caption over a picture on the page: its title, then a line that
 * describes it. Two lines always, so the pictures of a row start level.
 */
export function CardCaption({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}): ReactNode {
  return (
    <figcaption className="mb-3 grid gap-0.5">
      <span className="text-sm font-medium">{title}</span>
      <span className="text-xs text-graphite-500">{children}</span>
    </figcaption>
  );
}

/**
 * A picture to download: its caption, then the picture, then its links.
 * The picture is the SVG file itself, the one its first link saves, so what
 * the page shows is what a reader gets.
 */
export function AssetCard({
  config,
  asset,
  filesBase,
  className,
}: AssetCardProps): ReactNode {
  const preset = PRESETS[asset.preset];
  const svgName = assetFileName(config, asset, 'svg');
  const pngName = assetFileName(config, asset, 'png');
  const isPortrait = preset.height > preset.width;
  const backdrop =
    asset.backdrop === undefined
      ? undefined
      : findColor(config, asset.backdrop)?.value;
  // The one inline style: the backdrop's color is the content, not a token.
  const style: CSSProperties | undefined =
    backdrop === undefined ? undefined : { backgroundColor: backdrop };
  const minHeight = 'minHeight' in asset ? asset.minHeight : undefined;
  // The links show only the format; their hidden words say which file, size
  // included, so no two links on the page read alike out of context.
  const linkPrefix = `Download ${describeAsset(asset)}, as `;
  const look = buttonLook(config);
  const button = buttonProps(look);
  const icon = look === undefined ? null : <ButtonIcon icon={look.icon} />;

  return (
    <figure className={className}>
      <CardCaption title={asset.name}>
        {asset.note === undefined ? (
          <>
            {preset.label} · {preset.width}×{preset.height}
            {minHeight === undefined ? null : ` · min ${minHeight}px tall`}
          </>
        ) : (
          <ParagraphContent paragraph={asset.note} />
        )}
      </CardCaption>
      {/*
        The picture and its buttons, as wide as the picture, so the buttons
        centre under it: a portrait one hugs its phone, rather than leaving
        a page-wide frame round it.
      */}
      <div className={isPortrait ? 'w-fit max-w-full' : undefined}>
        <div className="panel overflow-hidden" style={style}>
          {/* oxlint-disable-next-line nextjs/no-img-element -- the specimen is the file its link downloads; an SVG has nothing to optimise */}
          <img
            src={`${filesBase}/${svgName}`}
            width={preset.width}
            height={preset.height}
            alt={asset.alt}
            loading="lazy"
            decoding="async"
            className={
              isPortrait ? 'h-auto max-h-[32rem] w-auto' : 'h-auto w-full'
            }
          />
        </div>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <a href={`${filesBase}/${svgName}`} download={svgName} {...button}>
            {icon}
            <span className="sr-only">{linkPrefix}</span>SVG
          </a>
          <a href={`${filesBase}/${pngName}`} download={pngName} {...button}>
            {icon}
            <span className="sr-only">{linkPrefix}</span>PNG
          </a>
        </div>
      </div>
    </figure>
  );
}

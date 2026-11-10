import type { ReactNode } from 'react';

import { SPAN, SUBGRID } from '../layout/grid';
import { AssetCard } from './asset-card';
import type {
  AssetSection as AssetSectionConfig,
  BrandConfig,
  SectionMeta,
} from './brand-config';
import { BrandSection } from './brand-section';

export interface AssetSectionProps {
  config: BrandConfig;
  section: SectionMeta;
  assets: AssetSectionConfig;
  filesBase: string;
}

/**
 * A section of pictures to download: the backgrounds, or the social images.
 * 12px across and 40px down: each card is a caption over a picture, a small
 * subsection of its own.
 */
export function AssetSection({
  config,
  section,
  assets,
  filesBase,
}: AssetSectionProps): ReactNode {
  return (
    <BrandSection section={section} lead={assets.lead}>
      <div className={`${SUBGRID} gap-y-10`}>
        {assets.assets.map((asset) => (
          <AssetCard
            key={asset.slug}
            config={config}
            asset={asset}
            filesBase={filesBase}
            className={SPAN[6]}
          />
        ))}
      </div>
    </BrandSection>
  );
}

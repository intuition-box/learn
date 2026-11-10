import type { ReactNode } from 'react';

import { SPAN, SUBGRID } from '../layout/grid';
import { AssetCard } from './asset-card';
import type {
  BrandConfig,
  KitSection as KitSectionConfig,
  SectionMeta,
} from './brand-config';
import {
  BrandSection,
  DESCRIPTION,
  Paragraphs,
  Subsection,
} from './brand-section';

export interface KitSectionProps {
  config: BrandConfig;
  section: SectionMeta;
  kits: KitSectionConfig;
  filesBase: string;
}

/**
 * Pictures as kits: a subsection per picture, what it is, then every size
 * of it to download, two to a row.
 */
export function KitSection({
  config,
  section,
  kits,
  filesBase,
}: KitSectionProps): ReactNode {
  return (
    <BrandSection section={section} lead={kits.lead}>
      {kits.kits.map((kit) => (
        <Subsection key={kit.name} label={kit.name}>
          <div className={`${DESCRIPTION} mb-6 flex flex-col gap-4`}>
            <Paragraphs paragraphs={kit.lead} />
          </div>
          <div className={`${SUBGRID} gap-y-10`}>
            {kit.assets.map((asset) => (
              <AssetCard
                key={asset.slug}
                config={config}
                asset={asset}
                filesBase={filesBase}
                className={SPAN[6]}
              />
            ))}
          </div>
        </Subsection>
      ))}
    </BrandSection>
  );
}

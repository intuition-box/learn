import type { ReactNode } from 'react';

import { GRID, MAIN, PAGE, PAGE_INSET } from '../layout/grid';
import { Toc, TocMenu, TocMinimap, TocRail } from '../toc/toc';
import { AssetSection } from './asset-section';
import { presentSections } from './brand-config';
import type { BrandConfig, SectionMeta } from './brand-config';
import { DESCRIPTION, Paragraphs } from './brand-section';
import { assertValidBrand } from './brand-validation';
import { ButtonIcon, buttonLook, buttonProps } from './download-button';
import { ColorSection } from './color-section';
import { KitSection } from './kit-section';
import { LogoSection } from './logo-section';
import { RulesSection } from './rules-section';
import { TypographySection } from './typography-section';

export interface BrandPageProps {
  config: BrandConfig;
  /** Where the brand's files are served, with no trailing slash: '/brand/files'. */
  filesBase: string;
}

/**
 * The brand's skill, for an agent: one for the whole brand, right under
 * the page's description, a link to its archive among the brand's files.
 */
function SkillButton({
  config,
  filesBase,
}: Pick<BrandPageProps, 'config' | 'filesBase'>): ReactNode {
  const { skill } = config;
  if (skill === undefined) {
    return null;
  }
  const look = buttonLook(config);
  return (
    <div className="col-span-full mt-6">
      <a
        href={`${filesBase}/${skill.fileName}`}
        download={skill.fileName}
        {...buttonProps(look)}
      >
        {look === undefined ? null : <ButtonIcon icon={look.icon} />}
        <span className="sr-only">Download {config.name}'s </span>
        Brand skill
      </a>
    </div>
  );
}

/** One section of the page, by its key. */
function Section({
  config,
  section,
  filesBase,
}: BrandPageProps & { section: SectionMeta }): ReactNode {
  switch (section.key) {
    case 'logo':
      return (
        <LogoSection config={config} section={section} filesBase={filesBase} />
      );
    case 'colors':
      return <ColorSection config={config} section={section} />;
    case 'typography':
      return <TypographySection config={config} section={section} />;
    case 'backgrounds':
      return config.backgrounds === undefined ? null : (
        <KitSection
          config={config}
          section={section}
          kits={config.backgrounds}
          filesBase={filesBase}
        />
      );
    case 'social':
      return config.social === undefined ? null : (
        <AssetSection
          config={config}
          section={section}
          assets={config.social}
          filesBase={filesBase}
        />
      );
    case 'rules':
      return <RulesSection config={config} section={section} />;
  }
}

/**
 * A brand's page, rendered from its config: a header, the contents, and
 * each section the config has, always in the same order.
 *
 * The page is three columns (`PAGE`): a fixed sidebar either side, the
 * left one holding the contents, the right one empty, and the main body
 * between them, at most 72rem wide. The main body is the page's 12-column
 * grid (`GRID`), which every section takes as its own. A brand with
 * issues (`brandIssues`) throws, every issue listed, rather than rendering
 * a page whose downloads are broken.
 *
 * Built in the brand's own system, from the site's tokens, so it cannot
 * drift from the site it describes.
 */
export function BrandPage({ config, filesBase }: BrandPageProps): ReactNode {
  assertValidBrand(config);
  const sections = presentSections(config);
  return (
    <Toc items={sections.map(({ id, title }) => ({ title, href: `#${id}` }))}>
      <div className={PAGE}>
        {/*
         * The contents in the left sidebar, under the site's logo, their top
         * level with the page's header, then held there as the page
         * scrolls. The rail where the sidebar has room for its titles, the
         * lines alone where it does not. A touch reader in
         * that narrower band gets the menu instead: Base UI's preview card
         * opens on a mouse's hover or a keyboard's focus, never on a tap, so
         * the minimap's titles would be out of reach. The rail shows its
         * titles, so it serves a touch reader as it is.
         */}
        <aside className="row-start-1 hidden ps-6 pt-24 xl:block">
          <div className="sticky top-24">
            <TocRail
              heading="On this page"
              className="hidden min-[92.5rem]:flex"
            />
            <TocMinimap
              heading="On this page"
              className="min-[92.5rem]:hidden pointer-coarse:hidden"
            />
          </div>
        </aside>
        <main className={`${MAIN} py-16 lg:py-24 ${PAGE_INSET}`}>
          <header className={GRID}>
            <h1 className="col-span-full text-4xl font-medium tracking-tight text-balance">
              {config.title}
            </h1>
            <div className={`${DESCRIPTION} mt-3 flex flex-col gap-3`}>
              <Paragraphs paragraphs={config.lead} />
            </div>
            <SkillButton config={config} filesBase={filesBase} />
          </header>
          {/*
           * The contents on a narrower window, which has no sidebar for
           * them, and for a touch reader where the sidebar has only the
           * minimap.
           */}
          <TocMenu
            label="Contents menu"
            className="-mx-4 mt-10 px-4 sm:-mx-6 sm:px-6 xl:hidden xl:max-[92.5rem]:pointer-coarse:block"
          />
          {sections.map((section) => (
            <Section
              key={section.id}
              config={config}
              section={section}
              filesBase={filesBase}
            />
          ))}
        </main>
      </div>
    </Toc>
  );
}

import { describe, expect, it } from 'vitest';

import { PRESETS } from './asset-presets';
import type { BrandAsset, BrandConfig } from './brand-config';
import { brandFixture } from './brand-fixture';
import type { FixtureColor } from './brand-fixture';
import { assertValidBrand, brandIssues } from './brand-validation';
import { svgDocument } from './svg-document';

/** The fixture with its one social image changed. */
function withSocial(
  change: Partial<BrandAsset<FixtureColor>>,
): BrandConfig<FixtureColor> {
  const brand = brandFixture();
  const [banner] = brand.social?.assets ?? [];
  if (banner === undefined) {
    throw new Error('The fixture has a social image');
  }
  return { ...brand, social: { assets: [{ ...banner, ...change }] } };
}

const problemsOf = (brand: BrandConfig) =>
  brandIssues(brand).map(({ where, problem }) => `${where}: ${problem}`);

describe('brandIssues', () => {
  it('finds nothing wrong with a sound brand', () => {
    expect(brandIssues(brandFixture())).toEqual([]);
  });

  it('wants kebab-case slugs, and no two assets with one', () => {
    expect(problemsOf({ ...brandFixture(), slug: 'Acme Co' })).toEqual([
      'brand: slug "Acme Co" is not kebab-case',
    ]);
    expect(problemsOf(withSocial({ slug: 'X_banner' }))).toEqual([
      'social › X_banner: slug "X_banner" is not kebab-case',
    ]);
    expect(problemsOf(withSocial({ slug: 'logo' }))).toEqual([
      'social › logo: slug "logo" is used by another asset, and the two would share file names',
    ]);
  });

  it('wants no two assets with one name and preset, whose links would read alike', () => {
    const brand = brandFixture();
    const [banner] = brand.social?.assets ?? [];
    if (banner === undefined) {
      throw new Error('The fixture has a social image');
    }
    const twice = (
      change: Partial<BrandAsset<FixtureColor>>,
    ): BrandConfig<FixtureColor> => ({
      ...brand,
      social: {
        assets: [banner, { ...banner, slug: 'x-banner-2', ...change }],
      },
    });
    expect(problemsOf(twice({}))).toEqual([
      'social › x-banner-2: "X banner, 1500×500" (its name and preset) describes another asset too, and their download links would read alike',
    ]);
    expect(problemsOf(twice({ name: 'x banner' }))).toEqual([
      'social › x-banner-2: "x banner, 1500×500" (its name and preset) describes another asset too, and their download links would read alike',
    ]);
    expect(
      problemsOf(
        twice({
          preset: 'og-image',
          svg: svgDocument(PRESETS['og-image'], ''),
        }),
      ),
    ).toEqual([]);
  });

  it('wants the SVG namespace and a viewBox', () => {
    expect(
      problemsOf(
        withSocial({
          svg: '<svg width="1500" height="500" viewBox="0 0 1500 500"></svg>',
        }),
      ),
    ).toEqual([
      'social › x-banner: has no xmlns="http://www.w3.org/2000/svg": a downloaded file would not open as SVG',
    ]);
    expect(
      problemsOf(
        withSocial({
          svg: '<svg xmlns="http://www.w3.org/2000/svg" width="1500" height="500"></svg>',
        }),
      ),
    ).toEqual(['social › x-banner: has no viewBox']);
    expect(
      problemsOf(
        withSocial({
          svg: '<svg xmlns="http://www.w3.org/2000/svg" width="1500" height="500" viewBox="0 0 0 500"></svg>',
        }),
      ),
    ).toEqual([
      'social › x-banner: viewBox 0 0 0 500 is not four numbers with a positive width and height',
    ]);
  });

  it('names the viewBox and the preset when the shapes differ', () => {
    const svg = svgDocument(PRESETS['x-banner'], '').replace(
      'viewBox="0 0 1500 500"',
      'viewBox="0 0 1600 900"',
    );
    expect(problemsOf(withSocial({ svg }))).toEqual([
      'social › x-banner: viewBox 0 0 1600 900 is 1.778:1, but preset x-banner is 1500×500 (3.000:1)',
    ]);
  });

  it("wants the file's width and height to be the preset's", () => {
    const svg = svgDocument({ width: 3000, height: 1000 }, '');
    expect(problemsOf(withSocial({ svg }))).toEqual([
      'social › x-banner: is 3000×1000 (its width and height), but preset x-banner is 1500×500: a downloaded SVG would open at the wrong size',
    ]);
  });

  it('takes a viewBox in other units, of the same shape', () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="1179" height="2556" viewBox="0 0 117.9 255.6"></svg>';
    expect(problemsOf(withSocial({ preset: 'phone', svg }))).toEqual([]);
  });

  it('refuses text, which the PNGs would draw without a font, but not a title', () => {
    const preset = PRESETS['x-banner'];
    expect(
      problemsOf(
        withSocial({ svg: svgDocument(preset, '<text x="0" y="9">Hi</text>') }),
      ),
    ).toEqual([
      'social › x-banner: draws text, but PNGs are rendered without fonts: outline the words as paths or leave them out',
    ]);
    expect(
      problemsOf(
        withSocial({ svg: svgDocument(preset, '<title>A banner</title>') }),
      ),
    ).toEqual([]);
  });

  it('wants colors with unique ids and lowercase #rrggbb values', () => {
    const brand = brandFixture();
    const broken: BrandConfig = {
      ...brand,
      colors: {
        groups: [
          {
            name: 'Core',
            colors: [
              { id: 'paper', name: 'Paper', value: '#FFFFFF' },
              { id: 'paper', name: 'Paper again', value: '#fff' },
              { id: 'ink', name: 'Ink', value: '#111111' },
              { id: 'grey', name: 'Grey', value: '#767676' },
            ],
          },
        ],
      },
    };
    expect(problemsOf(broken)).toEqual([
      'colors › paper: value "#FFFFFF" is not a lowercase #rrggbb',
      'colors › paper: id "paper" is used by another color',
      'colors › paper: value "#fff" is not a lowercase #rrggbb',
    ]);
  });

  it('wants every color a pair or a backdrop names to exist', () => {
    const brand = brandFixture();
    const [logo] = brand.logo?.assets ?? [];
    if (logo === undefined || brand.logo === undefined) {
      throw new Error('The fixture has a logo');
    }
    const broken: BrandConfig = {
      ...brand,
      logo: {
        assets: [{ ...logo, backdrop: 'night' }],
      },
      colors: {
        groups: brand.colors?.groups ?? [],
        contrast: [{ name: 'Text', foreground: 'ink', background: 'night' }],
      },
    };
    expect(problemsOf(broken)).toEqual([
      'colors › contrast ink on night: no color has the id "night"',
      'logo › logo: backdrop "night" is not a color\'s id',
    ]);
  });

  it("wants a logo's clear space to fit on its canvas", () => {
    const brand = brandFixture();
    const [logo] = brand.logo?.assets ?? [];
    if (logo === undefined) {
      throw new Error('The fixture has a logo');
    }
    const broken: BrandConfig = {
      ...brand,
      logo: { assets: [{ ...logo, clearSpace: logo.clearSpace + 1 }] },
    };
    expect(problemsOf(broken)).toEqual([
      `logo › logo: the lockup with ${logo.clearSpace + 1}px of clear space round it does not fit on its 1024×1024 canvas`,
    ]);
  });

  it('wants the usage shares to be colors, and to add up to 100', () => {
    const brand = brandFixture();
    const withShares = (
      shares: readonly { color: string; share: number }[],
    ): BrandConfig => ({
      ...brand,
      colors: { groups: brand.colors?.groups ?? [], usage: { shares } },
    });
    expect(
      problemsOf(
        withShares([
          { color: 'paper', share: 80 },
          { color: 'ink', share: 20 },
        ]),
      ),
    ).toEqual([]);
    expect(
      problemsOf(
        withShares([
          { color: 'paper', share: 80 },
          { color: 'night', share: 15.5 },
        ]),
      ),
    ).toEqual([
      'colors › usage: no color has the id "night"',
      "colors › usage: night's share 15.5 is not a whole number above 0",
      'colors › usage: the shares add up to 95.5, not 100',
    ]);
  });

  it("wants the download buttons' fill to be a color", () => {
    const icon = { size: 24, paths: [] };
    expect(
      problemsOf({ ...brandFixture(), downloads: { color: 'paper', icon } }),
    ).toEqual([]);
    expect(
      problemsOf({ ...brandFixture(), downloads: { color: 'teal', icon } }),
    ).toEqual(['downloads: color "teal" is not a color\'s id']);
  });

  it("wants a palette's lead under a heading", () => {
    const brand = brandFixture();
    const broken: BrandConfig = {
      ...brand,
      colors: {
        groups: (brand.colors?.groups ?? []).map((group) => ({
          ...group,
          lead: 'A paragraph.',
        })),
      },
    };
    expect(problemsOf(broken)).toEqual(
      (brand.colors?.groups ?? []).map(
        (group) =>
          `colors › ${group.name}: has a lead but no heading to set it under`,
      ),
    );
  });

  it('wants every section in the config to have something in it', () => {
    const broken: BrandConfig = {
      ...brandFixture(),
      backgrounds: { kits: [] },
      typography: { faces: [], scale: [] },
      rules: { dos: [], donts: [] },
    };
    expect(problemsOf(broken)).toEqual([
      'typography: is in the config but has nothing to show',
      'backgrounds: is in the config but has nothing to show',
      'rules: is in the config but has nothing to show',
    ]);
  });
});

describe('assertValidBrand', () => {
  it('lists every issue in one error', () => {
    const broken = { ...withSocial({ slug: 'Bad' }), slug: 'Also Bad' };
    expect(() => {
      assertValidBrand(broken);
    }).toThrow(
      'Brand "Also Bad" has 2 issues:\n- brand: slug "Also Bad" is not kebab-case\n- social › Bad: slug "Bad" is not kebab-case',
    );
    expect(() => {
      assertValidBrand(brandFixture());
    }).not.toThrow();
  });
});

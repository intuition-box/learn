import { describe, expect, it } from 'vitest';

import {
  assetFileName,
  brandFiles,
  describeAsset,
  findBrandFile,
} from './asset-files';
import { brandAssets } from './brand-config';
import { brandFixture } from './brand-fixture';

describe('assetFileName', () => {
  it('names a file by brand, asset, size and format', () => {
    expect(
      assetFileName(
        { slug: 'intuition' },
        { slug: 'og-image', preset: 'og-image' },
        'png',
      ),
    ).toBe('intuition-og-image-1200x630.png');
  });
});

describe('describeAsset', () => {
  it('names the asset, then where it goes and its size', () => {
    expect(describeAsset({ name: 'Graphite field', preset: 'phone' })).toBe(
      'Graphite field, Phone wallpaper 1179×2556',
    );
  });

  it('leaves out a label that only repeats the name, in any case', () => {
    expect(describeAsset({ name: 'X banner', preset: 'x-banner' })).toBe(
      'X banner, 1500×500',
    );
    expect(describeAsset({ name: 'x Banner', preset: 'x-banner' })).toBe(
      'x Banner, 1500×500',
    );
  });
});

describe('brandFiles', () => {
  it('offers every asset as SVG then PNG, in page order, with no name twice', () => {
    const brand = brandFixture();
    const names = brandFiles(brand).map(({ fileName }) => fileName);
    expect(names).toEqual([
      'acme-logo-1024x1024.svg',
      'acme-logo-1024x1024.png',
      'acme-x-banner-1500x500.svg',
      'acme-x-banner-1500x500.png',
    ]);
    expect(new Set(names).size).toBe(2 * brandAssets(brand).length);
  });
});

describe('findBrandFile', () => {
  const brand = brandFixture();

  it('finds every file by its name', () => {
    for (const file of brandFiles(brand)) {
      expect(findBrandFile(brand, file.fileName)).toEqual(file);
    }
  });

  it('finds nothing for a name the brand did not make', () => {
    for (const name of [
      'acme-logo-1024x1024.jpg',
      'acme-logo-1024x1024',
      'acme-logo-512x512.png',
      '../x.png',
      '../acme-logo-1024x1024.png',
      '',
    ]) {
      expect(findBrandFile(brand, name)).toBeUndefined();
    }
  });
});

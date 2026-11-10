import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { PRESETS } from './asset-presets';
import type { BrandConfig } from './brand-config';
import { brandFixture } from './brand-fixture';
import { BrandPage } from './brand-page';
import { svgDocument } from './svg-document';

/** The page as HTML, without the comments React puts between adjacent texts. */
const render = (config: BrandConfig): string =>
  renderToStaticMarkup(
    createElement(BrandPage, { config, filesBase: '/brand/files' }),
  ).replaceAll('<!-- -->', '');

/** Every match's first group, in order. */
const all = (html: string, pattern: RegExp): string[] =>
  Array.from(html.matchAll(pattern), ([, group = '']) => group);

describe('BrandPage', () => {
  const withTypography: BrandConfig = {
    ...brandFixture(),
    typography: {
      faces: [
        {
          name: 'System sans',
          role: 'Words',
          className: 'font-sans',
          stack: 'system-ui, sans-serif',
          weights: [400, 500],
        },
      ],
      scale: [{ name: 'Body', className: 'text-base', sample: 'A line.' }],
    },
  };

  it('shows only the sections the brand has, in their order, in the contents', () => {
    const html = render(withTypography);
    const sections = all(html, /<section id="([^"]+)"/g);
    expect(sections).toEqual([
      'logo',
      'colors',
      'typography',
      'social',
      'dos-and-donts',
    ]);
    const nav =
      /<nav class="[^"]*py-5\.25[^"]*".*?<\/nav>/s.exec(html)?.[0] ?? '';
    expect(all(nav, /href="#([^"]+)"/g)).toEqual(sections);
    expect(all(html, /<h2 id="([^"]+)"/g)).toEqual(
      sections.map((id) => `${id}-title`),
    );
    expect(html).not.toContain('id="backgrounds"');
  });

  it('has the contents in three stages: the rail, the minimap, and the menu', () => {
    const html = render(brandFixture());
    expect(html.match(/<nav class="[^"]*py-5\.25/g)).toHaveLength(2);
    expect(all(html, /<nav aria-label="([^"]+)"/g)).toEqual(['Contents menu']);
  });

  it('offers each picture as SVG and PNG, by name, with links that say what they save', () => {
    const html = render(brandFixture());
    expect(all(html, /download="([^"]+)"/g)).toEqual([
      'acme-logo-1024x1024.svg',
      'acme-logo-1024x1024.png',
      'acme-x-banner-1500x500.svg',
      'acme-x-banner-1500x500.png',
    ]);
    expect(html).toContain(
      '<a href="/brand/files/acme-logo-1024x1024.png" download="acme-logo-1024x1024.png" class="btn btn-secondary"><span class="sr-only">Download Logo, Square logo 1024×1024, as </span>PNG</a>',
    );
    expect(html).toContain('src="/brand/files/acme-x-banner-1500x500.svg"');
    expect(html).toContain('alt="A black dot on white."');
  });

  it('gives every download link a name of its own, though two pictures share a name', () => {
    const field = (preset: 'desktop' | 'phone') => ({
      slug: `field-${preset}`,
      name: 'Field',
      alt: 'A grey field.',
      preset,
      svg: svgDocument(PRESETS[preset], '', '#767676'),
    });
    const html = render({
      ...brandFixture(),
      backgrounds: {
        kits: [
          {
            name: 'Field',
            lead: ['A grey field.'],
            assets: [field('desktop'), field('phone')],
          },
        ],
      },
    });
    // A link's accessible name is its text, the hidden words included.
    const names = all(html, /<a [^>]*\bdownload="[^"]*"[^>]*>(.*?)<\/a>/g).map(
      (inner) => inner.replaceAll(/<[^>]+>/g, ''),
    );
    expect(names).toEqual([
      'Download Logo, Square logo 1024×1024, as SVG',
      'Download Logo, Square logo 1024×1024, as PNG',
      'Download Field, Desktop wallpaper 2560×1440, as SVG',
      'Download Field, Desktop wallpaper 2560×1440, as PNG',
      'Download Field, Phone wallpaper 1179×2556, as SVG',
      'Download Field, Phone wallpaper 1179×2556, as PNG',
      'Download X banner, 1500×500, as SVG',
      'Download X banner, 1500×500, as PNG',
    ]);
    expect(new Set(names).size).toBe(names.length);
  });

  it('labels each pair by its ratio and its use, light chips before dark, a shape for a pair meant for shapes', () => {
    const html = render(brandFixture());
    expect(html).toContain(
      'Text<span class="block text-xs font-normal text-graphite-500">18.8:1 · text',
    );
    expect(html).toContain(
      'Muted text<span class="block text-xs font-normal text-graphite-500">4.5:1 · text<',
    );
    expect(html).toContain('4.5:1 · shapes');
    expect(html).toContain(
      '<path d="M0 5A5 5 0 1 1 10 5A5 5 0 1 1 0 5Z" fill="#767676">',
    );
    expect(html.indexOf('On light')).toBeLessThan(html.indexOf('On dark'));
    expect(html).toContain(
      'Text on ink<span class="block text-xs font-normal text-graphite-0/70">18.8:1 · text',
    );
  });

  it('sets no title in capitals', () => {
    expect(render(withTypography)).not.toMatch(
      /<h[1-6][^>]*class="[^"]*\buppercase\b/,
    );
  });

  it('refuses a brand with issues', () => {
    expect(() => render({ ...brandFixture(), slug: 'Acme' })).toThrow(
      /not kebab-case/,
    );
  });
});

describe('the brand components', () => {
  it('import nothing from the app, so they can move to a package of their own', () => {
    const folder = import.meta.dirname;
    const offenders = readdirSync(folder).filter((file) =>
      /\bfrom\s+['"]@\//.test(readFileSync(path.join(folder, file), 'utf8')),
    );
    expect(offenders).toEqual([]);
  });
});

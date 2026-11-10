import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { createElement } from 'react';
import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { Toc, TocMenu, TocMinimap, TocRail } from './toc';
import type { TocItem } from './toc';

const ITEMS: readonly TocItem[] = [
  { title: 'Logo', href: '#logo' },
  { title: 'Colors', href: '#colors' },
  { title: 'Tints', href: '#tints', depth: 1 },
];

/** The contents of `items` with these stages, as HTML, without React's text separators. */
const renderWith = (
  items: readonly TocItem[],
  ...stages: ReactNode[]
): string =>
  renderToStaticMarkup(createElement(Toc, { items }, ...stages)).replaceAll(
    '<!-- -->',
    '',
  );

const render = (...stages: ReactNode[]): string => renderWith(ITEMS, ...stages);

/** The navigation landmark named `label`, as HTML. */
const nav = (html: string, label: string): string =>
  new RegExp(`<nav aria-label="${label}".*?</nav>`, 's').exec(html)?.[0] ?? '';

/** The rail: the LineNav, which takes no name of its own. */
const rail = (html: string): string =>
  /<nav class="[^"]*py-5\.25[^"]*".*?<\/nav>/s.exec(html)?.[0] ?? '';

/** Every match's first group, in order. */
const all = (html: string, pattern: RegExp): string[] =>
  Array.from(html.matchAll(pattern), ([, group = '']) => group);

describe('Toc', () => {
  it('shows the rail as a nav of links, the first one current until the page scrolls', () => {
    const html = rail(render(createElement(TocRail)));
    expect(all(html, /href="([^"]+)"/g)).toEqual([
      '#logo',
      '#colors',
      '#tints',
    ]);
    expect(all(html, /<a [^>]*>(.*?)<\/a>/g).map(textOf)).toEqual([
      'Logo',
      'Colors',
      'Tints',
    ]);
    expect(
      all(html, /<a [^>]*aria-current="page"[^>]*href="([^"]+)"/g),
    ).toEqual(['#logo']);
  });

  it("shows the minimap as the rail's lines, their titles hidden until it is hovered or focused", () => {
    const minimap = rail(render(createElement(TocMinimap)));
    expect(all(minimap, /href="([^"]+)"/g)).toEqual([
      '#logo',
      '#colors',
      '#tints',
    ]);
    expect(
      all(minimap, /<span class="[^"]*opacity-0[^"]*">([^<]+)<\/span>/g),
    ).toEqual(['Logo', 'Colors', 'Tints']);
    expect(
      all(minimap, /<a [^>]*aria-current="page"[^>]*href="([^"]+)"/g),
    ).toEqual(['#logo']);
  });

  it('shows the menu as a closed bar with the current title', () => {
    const menu = nav(
      render(
        createElement(TocMenu, { label: 'Menu', heading: 'On this page' }),
      ),
      'Menu',
    );
    const button = /<button [^>]*>(.*?)<\/button>/s.exec(menu)?.[0] ?? '';
    expect(button).toContain('aria-expanded="false"');
    expect(textOf(button)).toBe('On this page, Logo');
    // The links are in the popover, which is rendered only once it opens.
    expect(menu).not.toContain('href=');
  });

  it('gives the menu the label it is given', () => {
    const html = render(
      createElement(TocRail),
      createElement(TocMinimap),
      createElement(TocMenu, { label: 'Contents menu' }),
    );
    expect(all(html, /<nav aria-label="([^"]+)"/g)).toEqual(['Contents menu']);
  });

  it('renders no stage when there are no items', () => {
    expect(
      renderWith(
        [],
        createElement(TocRail),
        createElement(TocMinimap),
        createElement(TocMenu),
      ),
    ).toBe('');
  });

  it('refuses a stage outside the contents', () => {
    expect(() => renderToStaticMarkup(createElement(TocRail))).toThrow(
      /inside <Toc>/,
    );
  });
});

describe('the contents folder', () => {
  it('imports only React, motion, Base UI and its own files, so it can move to Wave UI as it is', () => {
    const folder = import.meta.dirname;
    const sources = readdirSync(folder).filter(
      (file) => /\.tsx?$/.test(file) && !file.endsWith('.test.ts'),
    );
    const specifiers = sources.flatMap((file) =>
      all(readFileSync(path.join(folder, file), 'utf8'), /\bfrom\s+'([^']+)'/g),
    );
    expect(specifiers.length).toBeGreaterThan(0);
    expect(
      specifiers.filter(
        (specifier) =>
          !/^(?:react|motion\/react|@base-ui\/react\/[a-z-]+|\.\/[a-z-]+)$/.test(
            specifier,
          ),
      ),
    ).toEqual([]);
  });
});

/** An element's text, as a screen reader would read its name: tags dropped. */
function textOf(html: string): string {
  return html.replaceAll(/<[^>]+>/g, '');
}

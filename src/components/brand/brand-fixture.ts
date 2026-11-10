/**
 * A small brand for the tests: a logo, three colors, one social image and
 * its rules, and no typography or backgrounds, so a test can see a missing
 * section stay off the page. Each call is a fresh copy, for a test to
 * break one thing in.
 */

import { PRESETS } from './asset-presets';
import { defineBrand } from './brand-config';
import type { BrandConfig } from './brand-config';
import { fitLockup } from './fit-lockup';
import { svgDocument } from './svg-document';

export type FixtureColor = 'paper' | 'ink' | 'grey';

export function brandFixture(): BrandConfig<FixtureColor> {
  const square = PRESETS['logo-square'];
  const { frame, clearSpace } = fitLockup({ width: 10, height: 10 }, square, 5);
  return defineBrand({
    slug: 'acme',
    name: 'Acme',
    title: 'Acme brand',
    lead: ['The logo and colors of Acme.'],
    logo: {
      lead: ['One square.'],
      assets: [
        {
          slug: 'logo',
          name: 'Logo',
          alt: 'A black square.',
          preset: 'logo-square',
          svg: svgDocument(
            square,
            `<rect x="${frame.x}" y="${frame.y}" width="${frame.width}" height="${frame.height}" fill="#111111"/>`,
          ),
          lockup: frame,
          clearSpace,
          minHeight: 24,
          backdrop: 'paper',
        },
      ],
      clearSpace: {
        name: 'Logo',
        rule: ['Half the logo on every side.'],
        alt: 'A black square with half its width clear on every side.',
        diagram: {
          logo: [{ d: 'M0 0H10V10H0Z', x: 0, y: 0 }],
          color: '#111111',
          boundary: { x: -5, y: -5, width: 20, height: 20 },
          guides: [{ x1: 0, y1: -5, x2: 0, y2: 15 }],
          unit: [{ d: 'M0 0H5V5H0Z', x: -5, y: -5 }],
        },
      },
    },
    colors: {
      groups: [
        {
          name: 'Core',
          colors: [
            { id: 'paper', name: 'Paper', value: '#ffffff' },
            { id: 'ink', name: 'Ink', value: '#111111' },
            { id: 'grey', name: 'Grey', value: '#767676' },
          ],
        },
      ],
      contrast: [
        { name: 'Text', foreground: 'ink', background: 'paper' },
        { name: 'Muted text', foreground: 'grey', background: 'paper' },
        {
          name: 'Dot',
          foreground: 'grey',
          background: 'paper',
          use: 'shapes',
          shape: {
            d: 'M0 5A5 5 0 1 1 10 5A5 5 0 1 1 0 5Z',
            view: { x: 0, y: 0, width: 10, height: 10 },
          },
        },
        { name: 'Text on ink', foreground: 'paper', background: 'ink' },
      ],
    },
    social: {
      assets: [
        {
          slug: 'x-banner',
          name: 'X banner',
          alt: 'A black dot on white.',
          preset: 'x-banner',
          svg: svgDocument(
            PRESETS['x-banner'],
            '<circle cx="750" cy="250" r="100" fill="#111111"/>',
            '#ffffff',
          ),
        },
      ],
    },
    rules: {
      dos: ['Keep the square square.'],
      donts: ['Set a heading in capitals.'],
    },
  });
}

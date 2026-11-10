import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { PRESETS } from '@/components/brand/asset-presets';
import {
  brandAssets,
  findColor,
  paragraphText,
} from '@/components/brand/brand-config';
import { brandIssues } from '@/components/brand/brand-validation';
import { rgbToHex } from '@/components/brand/color';
import { LOGO_MARK_COLOR } from '@/components/onboarding/logo-mark';
import { ROLE_COLORS } from '@/components/playground/story-shapes';
import { VAULT_COLORS } from '@/lib/icons';
import { ROUTES } from '@/lib/site';

import { LEARN_BRAND } from './learn-brand';

const ROOT = path.join(import.meta.dirname, '..', '..', '..');

const colorValue = (id: string) => findColor(LEARN_BRAND, id)?.value;

/** Every string a reader sees: titles, leads, captions, alt text, names, rules. */
function userFacingStrings(): string[] {
  const { logo, colors, typography, backgrounds, social, rules } = LEARN_BRAND;
  return [
    LEARN_BRAND.title,
    ...LEARN_BRAND.lead.map(paragraphText),
    ...[logo, colors, typography, backgrounds, social, rules].flatMap(
      (section) => (section?.lead ?? []).map(paragraphText),
    ),
    ...(logo?.construction === undefined
      ? []
      : [
          logo.construction.name,
          ...logo.construction.rule,
          logo.construction.alt,
          ...logo.construction.diagram.measures.map(({ text }) => text),
          ...logo.construction.diagram.radii.map(({ text }) => text),
        ]),
    ...(logo?.clearSpace === undefined
      ? []
      : [logo.clearSpace.name, ...logo.clearSpace.rule, logo.clearSpace.alt]),
    ...(logo?.reversedOverlay === undefined
      ? []
      : [
          logo.reversedOverlay.name,
          ...logo.reversedOverlay.rule,
          logo.reversedOverlay.alt,
          logo.reversedOverlay.diagram.loupe.label.text,
        ]),
    ...(backgrounds?.kits ?? []).flatMap((kit) => [
      kit.name,
      ...kit.lead.map(paragraphText),
    ]),
    ...(logo?.points ?? []).flatMap(({ term, text }) => [term, text]),
    logo?.drawing ?? '',
    ...brandAssets(LEARN_BRAND).flatMap(({ asset }) => [
      asset.name,
      asset.alt,
      ...(asset.note === undefined ? [] : [paragraphText(asset.note)]),
    ]),
    ...(colors?.groups ?? []).flatMap((group) => [
      group.name,
      group.heading ?? '',
      group.lead ?? '',
      ...group.colors.flatMap((color) => [color.name, color.alias ?? '']),
    ]),
    ...(colors?.contrast ?? []).map((pair) => pair.name),
    ...(typography?.faces ?? []).flatMap((face) => [face.name, face.role]),
    ...(typography?.scale ?? []).flatMap((step) => [step.name, step.sample]),
    ...(rules?.dos ?? []),
    ...(rules?.donts ?? []),
    ...Object.values(PRESETS).map(({ label }) => label),
  ].filter((text) => text !== '');
}

describe('LEARN_BRAND', () => {
  it('has no issues', () => {
    expect(brandIssues(LEARN_BRAND)).toEqual([]);
  });

  it('has every section, and every asset its file', () => {
    expect(brandAssets(LEARN_BRAND)).toHaveLength(45);
  });

  it('matches Graphite in globals.css, step for step', () => {
    const css = readFileSync(
      path.join(ROOT, 'src', 'app', 'globals.css'),
      'utf8',
    );
    const steps = Array.from(
      css.matchAll(/--color-graphite-(\d+):\s*(#[0-9a-f]{6})/g),
      ([, step = '', value = '']) => [step, value] as const,
    );
    expect(steps).toHaveLength(12);
    for (const [step, value] of steps) {
      expect(colorValue(`graphite-${step}`)).toBe(value);
    }
  });

  it('sets text in the Graphite its contrast pairs name', () => {
    const css = readFileSync(
      path.join(ROOT, 'src', 'app', 'globals.css'),
      'utf8',
    );
    const textColor = (token: string) =>
      new RegExp(`--wave-docs-${token}: var\\(--color-(graphite-\\d+)\\)`).exec(
        css,
      )?.[1];
    // The page is light: the pairs on white.
    const pairFor = (name: string) =>
      LEARN_BRAND.colors?.contrast?.find(
        (pair) => pair.name === name && pair.background === 'graphite-0',
      )?.foreground;
    expect(textColor('fg')).toBe(pairFor('Primary text'));
    expect(textColor('fg-muted')).toBe(pairFor('Muted text'));
  });

  it("draws the logo mark in the brand's primary, Graphite 900", () => {
    expect(colorValue('primary')).toBe(LOGO_MARK_COLOR);
    expect(colorValue('graphite-900')).toBe(LOGO_MARK_COLOR);
  });

  it("takes the atoms' and the vaults' colors from the film's constants", () => {
    expect(colorValue('subject')).toBe(rgbToHex(ROLE_COLORS.identity));
    expect(colorValue('predicate')).toBe(rgbToHex(ROLE_COLORS.predicate));
    expect(colorValue('object')).toBe(rgbToHex(ROLE_COLORS.object));
    expect(colorValue('bridge-object')).toBe(rgbToHex(ROLE_COLORS.bridge));
    expect(colorValue('against')).toBe(rgbToHex(VAULT_COLORS.against));
    expect(colorValue('for')).toBe(rgbToHex(VAULT_COLORS.for));
  });

  it('names the typefaces the site loads, by their own names', () => {
    const fonts = readFileSync(
      path.join(ROOT, 'src', 'lib', 'fonts.ts'),
      'utf8',
    );
    // A Google face by its loader's name, a local one by its files' folder.
    for (const face of LEARN_BRAND.typography?.faces ?? []) {
      const google = `${face.name.replaceAll(' ', '_')}({`;
      const local = `fonts/${face.name.toLowerCase().replaceAll(' ', '-')}/`;
      expect(fonts.includes(google) || fonts.includes(local), face.name).toBe(
        true,
      );
    }
  });

  it('sets no title, name, caption or rule in capitals', () => {
    for (const text of userFacingStrings()) {
      const isShouting = /[A-Z]{2}/.test(text) && text === text.toUpperCase();
      expect(isShouting, text).toBe(false);
    }
  });

  it('sets only the Label step in capitals: a tag, never a title', () => {
    const shouting = (LEARN_BRAND.typography?.scale ?? []).filter((step) =>
      step.className.split(' ').includes('uppercase'),
    );
    expect(shouting.map(({ name }) => name)).toEqual(['Label']);
  });

  it('calls a hexagon a bridge object in words, never a bridge', () => {
    for (const text of userFacingStrings()) {
      expect(text, text).not.toMatch(/\bbridge\b(?! object)/i);
    }
  });

  it('is served by the files route at its address', () => {
    expect(
      existsSync(
        path.join(ROOT, 'src', 'app', ROUTES.brandFiles, '[file]', 'route.ts'),
      ),
    ).toBe(true);
  });
});

/**
 * The sizes a brand's pictures are made for, in pixels: where each one is
 * used, and exactly how big that place wants it. Every asset names one, its
 * SVG is drawn at that size, and its PNG is cut to it.
 */
export interface Preset {
  id: string;
  /** Where the picture goes, in sentence case: 'X banner'. */
  label: string;
  width: number;
  height: number;
}

export const PRESETS = {
  'x-banner': { id: 'x-banner', label: 'X banner', width: 1500, height: 500 },
  'x-avatar': { id: 'x-avatar', label: 'X avatar', width: 400, height: 400 },
  'og-image': {
    id: 'og-image',
    label: 'Open Graph image',
    width: 1200,
    height: 630,
  },
  'linkedin-banner': {
    id: 'linkedin-banner',
    label: 'LinkedIn banner',
    width: 1584,
    height: 396,
  },
  desktop: {
    id: 'desktop',
    label: 'Desktop wallpaper',
    width: 2560,
    height: 1440,
  },
  phone: { id: 'phone', label: 'Phone wallpaper', width: 1179, height: 2556 },
  'discord-banner': {
    id: 'discord-banner',
    label: 'Discord banner',
    width: 960,
    height: 540,
  },
  // None of the places above fits a logo on its own: these two are a canvas
  // for a lockup and its clear space, square or wide, big enough to scale
  // down from.
  'logo-square': {
    id: 'logo-square',
    label: 'Square logo',
    width: 1024,
    height: 1024,
  },
  'logo-wide': {
    id: 'logo-wide',
    label: 'Wide logo',
    width: 2048,
    height: 1024,
  },
} as const satisfies Record<string, Preset>;

export type PresetId = keyof typeof PRESETS;

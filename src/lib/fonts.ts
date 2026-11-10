import { Instrument_Sans, Inter } from 'next/font/google';
import localFont from 'next/font/local';

/*
 * The site's three typefaces, all open source, served from the site
 * itself by Next.js, so no text shifts as they load. Each sets a variable
 * on <html> (`layout.tsx`), which `globals.css` points the documentation
 * stylesheet's own font tokens at, and the titles' rule at.
 *
 * - Instrument Sans: titles, refined and a touch narrow, a voice of its own.
 * - Inter: every other word, the most legible face on screens.
 * - Ioskeley Mono: code, compact and technical, built on Iosevka in the
 *   spirit of Berkeley Mono: served from `src/fonts/ioskeley-mono`, its own
 *   web build (v2.2.0), with its license, as Google Fonts does not carry it.
 *   Its zeros are slashed (`globals.css`), so a 0 never reads as an 8.
 */

export const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-instrument-sans',
  display: 'swap',
});

export const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const ioskeleyMono = localFont({
  src: [
    {
      path: '../fonts/ioskeley-mono/IoskeleyMono-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../fonts/ioskeley-mono/IoskeleyMono-Italic.woff2',
      weight: '400',
      style: 'italic',
    },
    {
      path: '../fonts/ioskeley-mono/IoskeleyMono-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-ioskeley-mono',
  display: 'swap',
  fallback: ['ui-monospace', 'monospace'],
  // Not preloaded: code is rare and below the fold, and most pages, the
  // film's among them, set none. A page that does fetches it when it needs it.
  preload: false,
});

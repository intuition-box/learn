import type { Hex } from './color';

/** The namespace a file needs to open as SVG outside a web page. */
export const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

interface Size {
  width: number;
  height: number;
}

/**
 * A whole SVG document at `size`: its width, height and viewBox all the
 * preset's own pixels, so the file opens at its size and draws in the same
 * units it is measured in. `background`, if given, fills it edge to edge;
 * without it the file is transparent.
 */
export function svgDocument(
  size: Size,
  body: string,
  background?: Hex,
): string {
  const { width, height } = size;
  const fill =
    background === undefined
      ? ''
      : `<rect width="${width}" height="${height}" fill="${background}"/>`;
  return `<svg xmlns="${SVG_NAMESPACE}" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${fill}${body}</svg>\n`;
}

/** What a document's root `<svg>` tag says about its size, as written. */
export interface SvgRoot {
  xmlns?: string;
  /** Plain numbers (or numbers in `px`); anything else, a percentage say, is left out. */
  width?: number;
  height?: number;
  /** Every number of the viewBox, split on spaces or commas: four when it is well formed. */
  viewBox?: readonly number[];
}

const ATTRIBUTE = /([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
const LENGTH = /^\s*(\d+(?:\.\d+)?)(?:px)?\s*$/;

/** A length attribute as a number of pixels, or nothing for any other unit. */
function readLength(value: string | undefined): number | undefined {
  const match = value === undefined ? null : LENGTH.exec(value);
  return match?.[1] === undefined ? undefined : Number(match[1]);
}

/**
 * Reads the first `<svg …>` tag of a document: enough to check a file's size
 * against its preset without parsing the rest of it.
 */
export function readSvgRoot(svg: string): SvgRoot {
  const tag = /<svg\b([^>]*)>/.exec(svg)?.[1];
  if (tag === undefined) {
    return {};
  }
  const attributes = new Map(
    Array.from(tag.matchAll(ATTRIBUTE), ([, name = '', double, single]) => [
      name,
      double ?? single ?? '',
    ]),
  );
  const viewBox = attributes.get('viewBox');
  const xmlns = attributes.get('xmlns');
  const width = readLength(attributes.get('width'));
  const height = readLength(attributes.get('height'));
  return {
    ...(xmlns === undefined ? {} : { xmlns }),
    ...(width === undefined ? {} : { width }),
    ...(height === undefined ? {} : { height }),
    ...(viewBox === undefined
      ? {}
      : {
          viewBox: viewBox
            .trim()
            .split(/[\s,]+/)
            .map(Number),
        }),
  };
}

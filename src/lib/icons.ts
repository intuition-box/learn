/**
 * The site's icons, as SVG path data on a square box, so one icon can be
 * drawn as an `<svg>` or on a canvas (`new Path2D(d)`). Saulo supplies
 * them: replace one here and every place that draws it follows.
 */

/** One shape of an icon: its path, filled in the icon's colour at this opacity. */
export interface IconPath {
  d: string;
  opacity: number;
  /** What the shape stands for, for a drawer that colours it by that. */
  part?: 'subject' | 'predicate' | 'object';
}

export interface Icon {
  /** Units across and down. */
  size: number;
  /** Drawn in order, the first underneath. */
  paths: readonly IconPath[];
}

/** A person: shoulders, and the head over them, lighter. */
export const USER_ICON: Icon = {
  size: 24,
  paths: [
    {
      d: 'M 12 13 C 14.396 13 16.575 13.694 18.178 14.671 C 18.978 15.161 19.662 15.736 20.156 16.361 C 20.642 16.977 21 17.713 21 18.5 C 21 19.345 20.589 20.011 19.997 20.486 C 19.437 20.936 18.698 21.234 17.913 21.442 C 16.335 21.859 14.229 22 12 22 C 9.771 22 7.665 21.86 6.087 21.442 C 5.302 21.234 4.563 20.936 4.003 20.486 C 3.41 20.01 3 19.345 3 18.5 C 3 17.713 3.358 16.977 3.844 16.361 C 4.338 15.736 5.021 15.161 5.822 14.671 C 7.425 13.694 9.605 13 12 13 Z',
      opacity: 1,
    },
    {
      d: 'M 12 2 C 15.849 2 18.255 6.167 16.33 9.5 C 15.437 11.047 13.786 12 12 12 C 8.151 12 5.745 7.833 7.67 4.5 C 8.563 2.953 10.214 2 12 2 Z',
      opacity: 0.3,
    },
  ],
};

/**
 * A triple: its subject, a circle; its object, a square; its predicate, a
 * triangle over them. In one colour, the subject lightest.
 */
export const TRIPLE_ICON: Icon = {
  size: 24,
  paths: [
    {
      d: 'M13 10C13 7.23849 15.2385 5 18 5C20.7615 5 23 7.23849 23 10C23 12.7615 20.7615 15 18 15C15.2385 15 13 12.7615 13 10Z',
      opacity: 0.2,
      part: 'subject',
    },
    {
      d: 'M4 15.25C4 14.0077 5.00773 13 6.25 13H10.75C11.9923 13 13 14.0077 13 15.25V19.75C13 20.9923 11.9923 22 10.75 22H6.25C5.00773 22 4 20.9923 4 19.75V15.25Z',
      opacity: 0.4,
      part: 'object',
    },
    {
      d: 'M4.60871 2.79674C5.23026 1.7344 6.77001 1.73442 7.3915 2.79681L10.7788 8.58591C11.4032 9.65419 10.632 11 9.38742 11H2.61276C1.36815 11 0.596755 9.65454 1.22118 8.58627L4.60871 2.79674Z',
      opacity: 1,
      part: 'predicate',
    },
  ],
};

/** A star, five-pointed, its points rounded. */
export const STAR_ICON: Icon = {
  size: 18,
  paths: [
    {
      d: 'M13.4814 16.29C13.3623 16.29 13.2421 16.2617 13.1328 16.2041L8.99998 14.0322L4.86718 16.2041C4.61428 16.3364 4.30757 16.314 4.07717 16.147C3.84667 15.979 3.73148 15.6944 3.77928 15.4131L4.56928 10.8125L1.22648 7.55419C1.02238 7.35499 0.948182 7.05659 1.03698 6.78519C1.12488 6.51369 1.35928 6.31599 1.64248 6.27489L6.26158 5.60349L8.32697 1.41799C8.58087 0.906285 9.41878 0.906285 9.67268 1.41799L11.7381 5.60349L16.3572 6.27489C16.6404 6.31589 16.8748 6.51369 16.9627 6.78519C17.0516 7.05669 16.9773 7.35499 16.7732 7.55419L13.4304 10.8125L14.2204 15.4131C14.2683 15.6943 14.153 15.979 13.9225 16.147C13.7916 16.2417 13.6367 16.29 13.4814 16.29Z',
      opacity: 0.4,
    },
  ],
};

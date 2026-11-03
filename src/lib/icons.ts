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

/** An icon with an open ring in it, where whoever draws it sets something. */
export interface RingedIcon extends Icon {
  /** Where its shape stands, in the icon's units: its top left, and its size. */
  box: { x: number; y: number; size: number };
  /** The ring's middle and radius, in the icon's units. */
  ring: { x: number; y: number; radius: number };
}

/** A medal: a rosette round an open ring, the place it stands for set in the ring. */
export const MEDAL_ICON: RingedIcon = {
  size: 31.701,
  paths: [
    {
      d: 'M23.957,19.572l0.32-4.617l3.039-3.489l-3.039-3.49l-0.32-4.617l-4.615-0.32L15.852,0l-3.491,3.039l-4.616,0.32l-0.32,4.618l-3.038,3.49l3.038,3.489l0.32,4.616l4.617,0.319l3.491,3.037l3.49-3.037L23.957,19.572z M15.791,17.826c-3.546,0-6.422-2.875-6.422-6.42s2.875-6.422,6.422-6.422c3.547,0,6.422,2.876,6.422,6.422C22.213,14.952,19.337,17.826,15.791,17.826z',
      opacity: 1,
    },
  ],
  box: { x: 4.387, y: 0, size: 22.929 },
  ring: { x: 15.791, y: 11.406, radius: 6.422 },
};

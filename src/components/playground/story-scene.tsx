import { type ReactNode, useEffect, useRef } from 'react';

import { readCssColour } from '@/components/onboarding/field-gl';
import { ROLE_COLOURS } from '@/components/onboarding/field-scene';
import { STAR_ICON, USER_ICON } from '@/lib/icons';
import {
  arcPoint,
  axisAngle,
  dot,
  IDENTITY_ROTATION,
  multiply,
  type Quat,
  rotate,
  slerp,
  type Vec3,
} from '@/lib/sphere';

import { dotsAlong, PIXELS_PER_DOT } from './story-dots';
import {
  ATOMS,
  type AtomId,
  type FlatScene,
  type PlaneState,
  type Role,
  type Scene,
  TRIPLES,
  turnToFace,
  viewOf,
  WHOLE_SHARE,
} from './story-model';
import {
  type BlendedPlane,
  PLANE,
  type PlaneEnd,
  type PlanePoint,
  planeAt,
} from './story-plane';
import { traceShape } from './story-shapes';

/** How far the eye is from the cloud's centre, in radii: the perspective. */
const EYE_DISTANCE = 3.2;
/** An atom's size as a share of the cloud's radius, before perspective. */
const ATOM_SHARE = 0.064;
/** Points along each part of a triple's line, which curves round the cloud. */
const ARC_STEPS = 16;
/** How fast the dots flow: `dotsAlong`'s units for each radian of line. */
const DOT_UNITS_PER_RADIAN = 500;
/**
 * How far up the cloud sits, in CSS pixels, so the atoms and the names
 * under them are in the middle together.
 */
const LIFT_PX = 14;
/** Radians turned per CSS pixel dragged. */
const DRAG_RADIANS_PER_PX = 0.008;
/** How long a spin after a drag takes to lose two thirds of its speed. */
const INERTIA_MS = 450;
/** How long the cloud takes to turn back to the film. */
const RETURN_MS = 700;
/**
 * How far the cloud behind an open plane moves as the reader moves the
 * plane, as a share of it: less, being farther away.
 */
const PAN_PARALLAX = 0.5;
/**
 * How much of the plane, in CSS pixels, stays in view however the reader
 * moves it: at least half of it, and never less than this, unless it is
 * smaller than this, then all of it. A plane wider than the view can be
 * moved until either end of it is in view, as a list scrolls.
 */
const PLANE_IN_VIEW_PX = 160;
/** Slower than this, in CSS pixels a millisecond, a moved plane has stopped. */
const SETTLED_DRIFT = 0.002;
/** A press that moves less than this, in CSS pixels, is a click. */
const CLICK_SLOP_PX = 4;
/**
 * The cloud behind an open plane: how out of focus it goes, in CSS pixels
 * of blur, how much it fades, as a share of it, and how far it rises, in
 * CSS pixels, so it stands behind and above the plane.
 */
const DEPTH_OF_FIELD = { blurPx: 4, fade: 0.4, risePx: 106 } as const;
/**
 * The plane's zoom: the closest it comes when a claim is small, and the
 * least at which its words still read. Below that, on a narrow screen, it
 * stays at the least and follows the newest triple.
 */
const PLANE_ZOOM = { max: 1.15, min: 0.82 } as const;
/** The room the plane keeps from the edges, in CSS pixels. */
const PLANE_MARGIN_PX = 20;
/** How far in from each edge, in CSS pixels, the scene fades out. */
const EDGE_FADE_PX = 28;
/** Below this canvas width, in CSS pixels, names are set a size smaller. */
const NARROW_PX = 480;
/** A name's badge: the plane's, so a name reads the same on both. */
const BADGE = PLANE.badge;
const BADGE_NARROW = { height: 20, padding: 7, fontSize: 12, gap: 6 } as const;
/** The least room, in CSS pixels, between two names side by side. */
const BADGE_SPACING_PX = 6;
/** How far apart up the cloud, as a share of its radius, two rows of atoms are. */
const ROW_APART = 0.1;
/**
 * A triple's hairline, under its dots: its width in CSS pixels, and how
 * dark, as a share of the ink. Faint: the dots carry the line.
 */
const LINE = { width: 1, alpha: 0.16 } as const;
/** A frame round a triple inside a claim: how strong its tint is, inside and round it. */
const FRAME = { fill: 0.07, stroke: 0.45 } as const;
/**
 * Each vault's colour on the lines to it: the palette's red against the
 * triple, its green for it. Until they show their side, the lines are grey.
 */
const SIDE_COLOURS = {
  against: ROLE_COLOURS.object,
  for: ROLE_COLOURS.predicate,
} as const;
/** A perspective's outline, round or square: a faint fill, a dashed hairline. */
const OUTLINE = { fill: 0.025, stroke: 0.12, dash: [3, 4] } as const;
/**
 * The flat perspective: its square, as a share of its cell; the room inside
 * it, as a share of the square; its corners; its atoms, as a share of the
 * cloud's; and how far its atoms have come before their names do.
 */
const FLAT = {
  square: 0.9,
  inset: 0.1,
  cornerPx: 10,
  atomScale: 1.25,
  namesFrom: 0.8,
} as const;

/**
 * Two square cells for two perspectives of the cloud, the first for the
 * cloud and the second for the map: side by side on a wide canvas, one
 * above the other on a narrow one.
 */
function cellsOf(
  width: number,
  height: number,
): { first: ScreenPoint; second: ScreenPoint; side: number } {
  if (width >= height * 1.25) {
    return {
      first: { x: width / 4, y: height / 2 },
      second: { x: (width * 3) / 4, y: height / 2 },
      side: Math.min(width / 2, height),
    };
  }

  return {
    first: { x: width / 2, y: height / 4 },
    second: { x: width / 2, y: (height * 3) / 4 },
    side: Math.min(width, height / 2),
  };
}

/**
 * A ranked list's top three, a star before each name: platinum, gold,
 * copper, the first the brightest. And the star's size, in a name's units,
 * and the room after it.
 */
const RANK_COLOURS: readonly Rgb[] = [
  [229, 228, 226],
  [227, 179, 65],
  [184, 115, 51],
];
const STAR = { size: 12, gap: 4 } as const;

/** A star before a name: its colour, and how far it has come, 0 to 1. */
interface Star {
  colour: Rgb;
  amount: number;
}

/** The star before a name ranked in a list's top three, as far as `amount` has come. */
function starOf(rank: number | undefined, amount: number): Star | undefined {
  const colour = rank === undefined ? undefined : RANK_COLOURS[rank];

  return colour === undefined || amount <= 0 ? undefined : { colour, amount };
}

/** A position on its line: a small pill of the page's colour, ringed with a hairline. */
const WEIGHT = { height: 18, padding: 6, fontSize: 11 } as const;

export interface StorySceneProps {
  scene: Scene;
  /** What the scene shows, in words. */
  label: string;
  /** Whether the film is playing. As it starts, the cloud turns back to it. */
  isPlaying: boolean;
  /** A click or tap on the scene: plays or pauses it, as on a video. */
  onPress: () => void;
  /** The reader has started turning the cloud: the film holds meanwhile. */
  onLookAround: () => void;
}

interface ScreenPoint {
  x: number;
  y: number;
}

interface Projected extends ScreenPoint {
  /** -1 at the back of the cloud, 1 at the front. */
  z: number;
  /** How much nearer the eye than the centre makes it look. */
  scale: number;
}

type Rgb = readonly [number, number, number];

interface Badge {
  height: number;
  padding: number;
  fontSize: number;
  gap: number;
}

/** The shape an atom is drawn as: `progress` of the way from one role's to another's. */
interface ShapeRole {
  from: Role;
  to: Role;
  progress: number;
}

/** A line to draw: see `drawLine`. */
interface Line {
  /** Its own dots: the same line keeps the same dots. */
  id: string;
  points: readonly ScreenPoint[];
  /** Its length for the dots' speed. */
  units: number;
  progress: number;
  alpha: number;
  /** How far its dots have flowed. */
  flow: number;
  fade?: readonly number[];
  /** Its colour: the ink, unless given. */
  colour?: Rgb;
}

/** Where an atom is drawn: its shape's middle, its size, and its name's scale. */
interface Placement extends ScreenPoint {
  size: number;
  badgeScale: number;
}

/** An atom the plane shares with the cloud, on its way out of the cloud or out of it. */
interface Lifted extends Placement {
  /** 0 in the cloud, 1 on the plane. */
  amount: number;
  /** Where it was in the cloud: -1 at the back, 1 at the front. */
  z: number;
  /** Where it was in the cloud, for a name it leaves there. */
  origin: Placement;
  /** Whether it takes its name with it: 0 when a word on the plane is its name. */
  named: number;
  /** Where its name goes on the plane, when not under it. */
  nameSide?: 'left' | 'right';
  /** The star before its name, ranked in a list. */
  star?: Star;
}

/** Where the plane is: the claim on it, and how it is placed on the canvas. */
interface PlaneView {
  blended: BlendedPlane;
  zoom: number;
  /** Where the plane's middle, on the line its shapes are on, is on the canvas. */
  origin: ScreenPoint;
}

function mix(a: Rgb, b: Rgb, t: number): Rgb {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

/** A colour from 0 to 255 channels. */
function rgba([r, g, b]: Rgb, alpha = 1): string {
  return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${alpha})`;
}

/** A CSS colour token, in 0 to 255 channels. */
function readToken(name: string): Rgb {
  const [r, g, b] = readCssColour(name);

  return [r * 255, g * 255, b * 255];
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clamp01(value: number): number {
  return Math.min(Math.max(value, 0), 1);
}

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

/** The angle between two directions, in radians. */
function angleBetween(a: Vec3, b: Vec3): number {
  return Math.acos(Math.min(Math.max(dot(a, b), -1), 1));
}

/** The length of each straight part of a line through `points`. */
function segmentLengths(points: readonly ScreenPoint[]): number[] {
  return points.slice(1).map((point, index) => {
    const from = points[index] ?? point;

    return Math.hypot(point.x - from.x, point.y - from.y);
  });
}

/**
 * How much of a line shows `distance` along it, between the shares `fade`
 * gives at each of its points.
 */
function fadeAlong(
  lengths: readonly number[],
  fade: readonly number[],
  distance: number,
): number {
  let left = distance;
  for (const [index, part] of lengths.entries()) {
    if (left <= part || index === lengths.length - 1) {
      const share = part === 0 ? 0 : Math.min(left / part, 1);
      const from = fade[index] ?? 0;

      return from + ((fade[index + 1] ?? from) - from) * share;
    }
    left -= part;
  }

  return fade.at(-1) ?? 0;
}

/**
 * The point `distance` along a line through `points`, and the line's normal
 * there: the direction across it, for a dot that sits just off the line.
 */
function pointAlong(
  points: readonly ScreenPoint[],
  lengths: readonly number[],
  distance: number,
): ScreenPoint & { normal: ScreenPoint } {
  let left = distance;
  for (const [index, part] of lengths.entries()) {
    const from = points[index];
    const to = points[index + 1];
    if (from === undefined || to === undefined) {
      break;
    }
    if (left <= part || index === lengths.length - 1) {
      const share = part === 0 ? 0 : Math.min(left / part, 1);

      return {
        x: from.x + (to.x - from.x) * share,
        y: from.y + (to.y - from.y) * share,
        normal:
          part === 0
            ? { x: 0, y: 0 }
            : { x: -(to.y - from.y) / part, y: (to.x - from.x) / part },
      };
    }
    left -= part;
  }
  const last = points.at(-1) ?? { x: 0, y: 0 };

  return { ...last, normal: { x: 0, y: 0 } };
}

/**
 * The playground's stage: the cloud, a sphere the story's atoms stand on,
 * drawn as `sceneAt` gives it. The film turns the cloud to each beat; the
 * reader can drag it round to look, or with a plane open, move the plane
 * about, flat, which holds the film, and both go back to the film as the
 * film plays on or moves to another beat.
 *
 * Atoms are drawn in their role's shape and colour, morphing as they take a
 * role, with their names under them. A triple is a faint line of flowing ink
 * dots through its three atoms, curving round the cloud, drawn from the
 * subject on. Drawn on a canvas, only while something moves.
 */
export function StoryScene(props: StorySceneProps): ReactNode {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const planeRef = useRef<HTMLCanvasElement>(null);
  // What the drawing and the listeners read, in a ref, so they see the
  // latest props without being set up again.
  const latest = useRef({
    props,
    // The reader's own turn of the cloud, on top of the film's.
    turn: IDENTITY_ROTATION as Quat,
    spin: { axis: [0, 1, 0] as Vec3, speed: 0 },
    // With a plane open, the reader's own move of it, in CSS pixels, and
    // how fast it is still gliding after a drag, in CSS pixels a millisecond.
    pan: { x: 0, y: 0 } as ScreenPoint,
    drift: { x: 0, y: 0 } as ScreenPoint,
    // Where the plane is on the canvas before the reader's move, to keep
    // some of it in view.
    planeBox: null as {
      left: number;
      right: number;
      top: number;
      bottom: number;
    } | null,
    returning: null as {
      from: Quat;
      fromPan: ScreenPoint;
      startedAt: number;
    } | null,
    drag: null as {
      startX: number;
      startY: number;
      lastX: number;
      lastY: number;
      lastAt: number;
      hasMoved: boolean;
    } | null,
    frame: 0,
    lastTick: 0,
    refresh: null as (() => void) | null,
    returnToFilm: null as (() => void) | null,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    const planeCanvas = planeRef.current;
    const plane = planeCanvas?.getContext('2d');
    if (
      canvas === null ||
      context === null ||
      context === undefined ||
      planeCanvas === null ||
      plane === null ||
      plane === undefined
    ) {
      return;
    }
    // One object for the life of the canvas: its fields change, it does not.
    const state = latest.current;
    const isStill = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    const ink = readToken('--wave-docs-fg');
    // The page's own colour: the words on a name's badge.
    const page = readToken('--wave-docs-bg');
    // A vault's lines before they show their side, the ring round a
    // position, and a person, in the icon's own colour.
    const grey = readToken('--color-graphite-500');
    const ring = readToken('--color-graphite-100');
    const personColour = readToken('--color-graphite-950');
    const personPaths = USER_ICON.paths.map((path) => ({
      path: new Path2D(path.d),
      opacity: path.opacity,
    }));
    const starPath = new Path2D(STAR_ICON.paths[0]?.d ?? '');
    const fontFamily = getComputedStyle(canvas).fontFamily;

    /**
     * Fades a canvas out toward its four edges, so a line or a name that
     * runs past one, when a narrow screen follows the story or the plane is
     * dragged, runs off softly.
     */
    function fadeEdges(
      target: CanvasRenderingContext2D,
      width: number,
      height: number,
    ): void {
      target.globalCompositeOperation = 'destination-out';
      // Each gradient runs from an edge inward: left, right, top, bottom.
      for (const [fromX, fromY, toX, toY] of [
        [0, 0, EDGE_FADE_PX, 0],
        [width, 0, width - EDGE_FADE_PX, 0],
        [0, 0, 0, EDGE_FADE_PX],
        [0, height, 0, height - EDGE_FADE_PX],
      ] as const) {
        const fade = target.createLinearGradient(fromX, fromY, toX, toY);
        fade.addColorStop(0, 'rgba(0, 0, 0, 1)');
        fade.addColorStop(1, 'rgba(0, 0, 0, 0)');
        target.fillStyle = fade;
        // The band along that edge, the whole length of the canvas.
        const isAcross = fromY === toY;
        target.fillRect(
          Math.min(fromX, toX),
          Math.min(fromY, toY),
          isAcross ? EDGE_FADE_PX : width,
          isAcross ? height : EDGE_FADE_PX,
        );
      }
      target.globalCompositeOperation = 'source-over';
    }

    /** An atom's shape, `size` across, morphing between two roles' shapes. */
    function drawShape(
      target: CanvasRenderingContext2D,
      x: number,
      y: number,
      size: number,
      role: ShapeRole,
    ): void {
      const paint = rgba(
        mix(ROLE_COLOURS[role.from], ROLE_COLOURS[role.to], role.progress),
      );
      // One fill of the rounded outline: nothing is painted twice, so a
      // shape fading in is evenly see-through, with no darker rim.
      target.beginPath();
      traceShape(target, x, y, size, role.from, role.to, role.progress);
      target.fillStyle = paint;
      target.fill();
    }

    /**
     * A name in an ink badge, centred on `x`, its top at `top`. The target's
     * font is already set, centred on the middle.
     */
    function drawBadge(
      target: CanvasRenderingContext2D,
      label: string,
      x: number,
      top: number,
      badge: Badge,
      star?: Star,
    ): void {
      const textWidth = target.measureText(label).width;
      // A star before the name takes room in the badge as it comes.
      const room =
        star === undefined ? 0 : (STAR.size + STAR.gap) * star.amount;
      const left = x - (textWidth + room) / 2 - badge.padding;
      target.fillStyle = rgba(ink);
      target.beginPath();
      target.roundRect(
        left,
        top,
        textWidth + room + badge.padding * 2,
        badge.height,
        badge.height / 2,
      );
      target.fill();
      if (star !== undefined && star.amount > 0) {
        const alpha = target.globalAlpha;
        target.save();
        target.translate(
          left + badge.padding,
          top + (badge.height - STAR.size) / 2,
        );
        target.scale(STAR.size / STAR_ICON.size, STAR.size / STAR_ICON.size);
        target.globalAlpha = alpha * star.amount;
        target.fillStyle = rgba(star.colour);
        target.fill(starPath);
        target.restore();
      }
      target.fillStyle = rgba(page);
      target.fillText(label, x + room / 2, top + badge.height / 2 + 0.5);
    }

    /**
     * A line through `points`, drawn as far as `progress` of it: a faint
     * hairline, and fine dots of ink, `flow` along it. With `fade`, how much
     * of the line shows at each point: a line drawn only near one end.
     */
    function drawLine(target: CanvasRenderingContext2D, line: Line): void {
      const { points, progress, alpha, fade } = line;
      const colour = line.colour ?? ink;
      const lengths = segmentLengths(points);
      const length = lengths.reduce((sum, part) => sum + part, 0);
      if (length <= 0 || progress <= 0) {
        return;
      }
      const drawn = length * progress;
      target.lineWidth = LINE.width;
      if (fade === undefined) {
        target.strokeStyle = rgba(colour, LINE.alpha * alpha);
        target.beginPath();
        target.moveTo(points[0]?.x ?? 0, points[0]?.y ?? 0);
        let covered = 0;
        for (const [index, part] of lengths.entries()) {
          covered += part;
          const end =
            covered <= drawn
              ? points[index + 1]
              : pointAlong(points, lengths, drawn);
          if (end !== undefined) {
            target.lineTo(end.x, end.y);
          }
          if (covered >= drawn) {
            break;
          }
        }
        target.stroke();
      } else {
        // Piece by piece, each as strong as the line is there.
        let covered = 0;
        for (const [index, part] of lengths.entries()) {
          const from = points[index];
          const to = points[index + 1];
          if (from === undefined || to === undefined || covered >= drawn) {
            break;
          }
          const share = part === 0 ? 1 : Math.min((drawn - covered) / part, 1);
          const shown = ((fade[index] ?? 0) + (fade[index + 1] ?? 0)) / 2;
          covered += part;
          if (shown < 0.01) {
            continue;
          }
          target.strokeStyle = rgba(colour, LINE.alpha * alpha * shown);
          target.beginPath();
          target.moveTo(from.x, from.y);
          target.lineTo(
            from.x + (to.x - from.x) * share,
            from.y + (to.y - from.y) * share,
          );
          target.stroke();
        }
      }

      target.fillStyle = rgba(colour);
      const dots = dotsAlong(
        line.id,
        line.units,
        Math.round(length / PIXELS_PER_DOT),
        line.flow,
        progress,
      );
      for (const dotAt of dots) {
        const distance = dotAt.along * length;
        const shown =
          fade === undefined ? 1 : fadeAlong(lengths, fade, distance);
        if (shown < 0.01) {
          continue;
        }
        const at = pointAlong(points, lengths, distance);
        target.globalAlpha = dotAt.alpha * alpha * shown;
        target.beginPath();
        target.arc(
          at.x + at.normal.x * dotAt.offset,
          at.y + at.normal.y * dotAt.offset,
          dotAt.radius,
          0,
          2 * Math.PI,
        );
        target.fill();
      }
      target.globalAlpha = 1;
    }

    /**
     * Where the plane is, if one is open: the claim blended from the beat's
     * start to its end, zoomed to fit, or where it cannot fit, held where
     * its names read and following the newest triple.
     */
    function viewPlane(width: number, height: number): PlaneView | null {
      if (plane === null || plane === undefined) {
        return null;
      }
      const { from, to, progress, fit } = state.props.scene.plane;
      if (from === null && to === null) {
        state.planeBox = null;

        return null;
      }
      plane.font = `500 ${PLANE.badge.fontSize}px ${fontFamily}`;
      const blended = planeAt(
        from,
        to,
        progress,
        (text) => plane.measureText(text).width,
        (atom) => ATOMS[atom].label,
        fit,
      );
      // Sized once, by the claim the chapter builds to, so it does not zoom
      // again at each step; or by the claim itself, without one.
      const size = blended.fit ?? {
        width: blended.right - blended.left,
        top: blended.top,
        bottom: blended.bottom,
      };
      const wanted = Math.min(
        PLANE_ZOOM.max,
        (width - PLANE_MARGIN_PX * 2) / size.width,
        (height - PLANE_MARGIN_PX * 2) / (size.bottom - size.top),
      );
      const zoom = Math.max(wanted, PLANE_ZOOM.min);
      // Toward the focus where the claim cannot fit, or where the beat
      // centres it on any screen.
      const centred = (claim: PlaneState | null): number =>
        claim?.isFocusCentred === true ? 1 : 0;
      const turn = Math.max(
        Math.min(Math.max((zoom / wanted - 1) / 0.3, 0), 1),
        lerp(centred(from), centred(to), blended.settle),
      );
      const centreOne = (id: string): number => {
        const frame = blended.frames.find((candidate) => candidate.id === id);
        if (frame !== undefined) {
          return frame.x + frame.width / 2;
        }

        return blended.atoms.find((atom) => atom.id === id)?.x ?? 0;
      };
      const centreOf = (focus: PlaneState['focus'] | undefined): number =>
        focus === undefined
          ? 0
          : typeof focus === 'string'
            ? centreOne(focus)
            : (centreOne(focus[0]) + centreOne(focus[1])) / 2;
      const fromFocus = centreOf(from?.focus ?? to?.focus);
      const toFocus = centreOf(to?.focus ?? from?.focus);
      const focus = (fromFocus + (toFocus - fromFocus) * blended.settle) * turn;

      const placed = {
        x: width / 2 - focus * zoom,
        // The whole claim in the middle, up and down: one that grows a
        // branch above it moves down to make room.
        y: height / 2 - ((blended.top + blended.bottom) / 2) * zoom,
      };
      state.planeBox = {
        left: placed.x + blended.left * zoom,
        right: placed.x + blended.right * zoom,
        top: placed.y + blended.top * zoom,
        bottom: placed.y + blended.bottom * zoom,
      };

      return {
        blended,
        zoom,
        // Where the film puts it, and then where the reader moved it.
        origin: { x: placed.x + state.pan.x, y: placed.y + state.pan.y },
      };
    }

    /**
     * An atom where `placement` puts it: its shape, and its name under it,
     * the name scaled with the plane, so one atom can travel from the cloud
     * to the plane and grow as it comes.
     */
    function drawAtom(
      target: CanvasRenderingContext2D,
      label: string,
      placement: Placement,
      role: ShapeRole,
      named = 1,
      nameSide?: 'left' | 'right',
      sideness = 1,
      star?: Star,
    ): void {
      drawShape(target, placement.x, placement.y, placement.size, role);
      if (named > 0) {
        const alpha = target.globalAlpha;
        target.globalAlpha = alpha * named;
        drawName(target, label, placement, nameSide, sideness, star);
        target.globalAlpha = alpha;
      }
    }

    /**
     * An atom's name, under where `placement` puts its shape, or beside it,
     * to the right or the left: `sideness` of the way from under it to
     * there, for an atom on its way out of the cloud, whose one name moves
     * round its shape as it comes.
     */
    function drawName(
      target: CanvasRenderingContext2D,
      label: string,
      placement: Placement,
      side?: 'left' | 'right',
      sideness = 1,
      star?: Star,
    ): void {
      const { badge } = PLANE;
      target.save();
      target.font = `500 ${badge.fontSize}px ${fontFamily}`;
      target.textAlign = 'center';
      target.textBaseline = 'middle';
      if (side !== undefined) {
        const direction = side === 'right' ? 1 : -1;
        const scale = placement.badgeScale;
        const textWidth = target.measureText(label).width;
        const under = {
          x: placement.x,
          y:
            placement.y +
            placement.size / 2 +
            (badge.gap + badge.height / 2) * scale,
        };
        // A star in the badge widens it away from the shape, so the side
        // nearest the shape stays where it is.
        const room =
          star === undefined ? 0 : (STAR.size + STAR.gap) * star.amount;
        const beside = {
          x:
            placement.x +
            (placement.size / 2 +
              (badge.gap + badge.padding + (textWidth + room) / 2) * scale) *
              direction,
          y: placement.y,
        };
        target.translate(
          lerp(under.x, beside.x, sideness),
          lerp(under.y, beside.y, sideness),
        );
        target.scale(scale, scale);
        drawBadge(target, label, 0, -badge.height / 2, badge, star);
      } else {
        target.translate(placement.x, placement.y + placement.size / 2);
        target.scale(placement.badgeScale, placement.badgeScale);
        drawBadge(target, label, 0, badge.gap, badge);
      }
      target.restore();
    }

    /**
     * A person's position, `value`, in a small pill centred on `at`, scaled
     * with the plane as names are.
     */
    function drawWeight(
      target: CanvasRenderingContext2D,
      value: string,
      at: ScreenPoint,
      scale: number,
      alpha: number,
    ): void {
      target.save();
      target.translate(at.x, at.y);
      target.scale(scale, scale);
      target.globalAlpha = alpha;
      target.font = `600 ${WEIGHT.fontSize}px ${fontFamily}`;
      target.textAlign = 'center';
      target.textBaseline = 'middle';
      const width = target.measureText(value).width + WEIGHT.padding * 2;
      target.beginPath();
      target.roundRect(
        -width / 2,
        -WEIGHT.height / 2,
        width,
        WEIGHT.height,
        WEIGHT.height / 2,
      );
      target.fillStyle = rgba(page);
      target.fill();
      target.lineWidth = 1 / scale;
      target.strokeStyle = rgba(ring);
      target.stroke();
      target.fillStyle = rgba(ink);
      target.fillText(value, 0, 0.5);
      target.restore();
    }

    /**
     * A person, `size` across, centred on `at`: the icon's shapes, each at
     * its own strength.
     */
    function drawPerson(
      target: CanvasRenderingContext2D,
      at: ScreenPoint,
      size: number,
      alpha: number,
    ): void {
      target.save();
      target.translate(at.x - size / 2, at.y - size / 2);
      target.scale(size / USER_ICON.size, size / USER_ICON.size);
      target.fillStyle = rgba(personColour);
      for (const { path, opacity } of personPaths) {
        target.globalAlpha = alpha * opacity;
        target.fill(path);
      }
      target.restore();
    }

    /**
     * The plane, sharp in front of the cloud: a branch off the graph, drawn
     * as the cloud is drawn, only flat. First, the lines that run from the
     * atoms it shares with the cloud back into it, sharp near the plane and
     * fading as they go; then each triple inside the claim, in a rounded
     * frame tinted the role it fills; each triple's line, drawn as it
     * arrives, to the frame where its object is a whole triple; and the
     * atoms. One the
     * cloud already has is the same atom, on its way out of the cloud, or
     * out of it: `lifted` says where it is.
     */
    function drawPlane(
      view: PlaneView | null,
      reaching: readonly Line[],
      lifted: ReadonlyMap<AtomId, Lifted>,
    ): void {
      if (planeCanvas === null || plane === null || plane === undefined) {
        return;
      }
      const width = planeCanvas.clientWidth;
      const height = planeCanvas.clientHeight;
      const ratio = Math.min(window.devicePixelRatio, 2);
      plane.setTransform(ratio, 0, 0, ratio, 0, 0);
      plane.clearRect(0, 0, width, height);
      plane.lineCap = 'butt';
      for (const line of reaching) {
        drawLine(plane, line);
      }
      if (view === null) {
        fadeEdges(plane, width, height);

        return;
      }

      const { blended, zoom, origin } = view;
      plane.setTransform(
        ratio * zoom,
        0,
        0,
        ratio * zoom,
        ratio * origin.x,
        ratio * origin.y,
      );
      plane.lineWidth = 1 / zoom;
      for (const frame of blended.frames) {
        const tint = ROLE_COLOURS[frame.role];
        plane.globalAlpha = frame.presence;
        plane.fillStyle = rgba(tint, FRAME.fill);
        plane.strokeStyle = rgba(tint, FRAME.stroke);
        plane.beginPath();
        plane.roundRect(
          frame.x,
          frame.top,
          frame.width,
          frame.bottom - frame.top,
          PLANE.frameRadius,
        );
        plane.fill();
        plane.stroke();
      }
      plane.globalAlpha = 1;
      plane.setTransform(ratio, 0, 0, ratio, 0, 0);

      const placed = blended.atoms.map((atom) => {
        const out = lifted.get(atom.id);

        return {
          atom,
          out,
          placement: out ?? {
            x: origin.x + atom.x * zoom,
            y: origin.y + atom.y * zoom,
            size: PLANE.atomSize * zoom * (0.55 + 0.45 * atom.presence),
            badgeScale: zoom,
          },
        };
      });

      // Each triple's line, subject to predicate to object: from an atom's
      // middle, or a frame's edge where the whole triple is what it joins.
      // A new one grows from its start once what it joins is in place; one
      // that no longer joins the same draws back toward its start.
      const endAt = (end: PlaneEnd, side: 'from' | 'to'): ScreenPoint => {
        if ('atom' in end) {
          const atom = placed.find(
            (candidate) => candidate.atom.id === end.atom,
          );

          return atom?.placement ?? origin;
        }
        const frame = blended.frames.find(
          (candidate) => candidate.id === end.frame,
        );
        if (frame === undefined) {
          return origin;
        }

        // From the middle of its top, for a claim rising from it; else
        // from its right edge, or to its left, on the claim's line.
        if (end.isTop === true) {
          return {
            x: origin.x + (frame.x + frame.width / 2) * zoom,
            y: origin.y + frame.top * zoom,
          };
        }

        return {
          x:
            origin.x +
            (side === 'from' ? frame.x + frame.width : frame.x) * zoom,
          y: origin.y,
        };
      };
      plane.lineCap = 'round';
      for (const link of blended.links) {
        const from = endAt(link.from, 'from');
        const to = endAt(link.to, 'to');
        drawLine(plane, {
          id: link.id,
          points: [from, to],
          units: Math.hypot(to.x - from.x, to.y - from.y),
          progress: link.presence,
          alpha: 1,
          flow: state.props.scene.flow,
        });
      }
      // A list member's line carries its triple's weight: the line is the
      // triple's own, out of the cloud with its atoms.
      for (const weight of blended.weights) {
        if (weight.weighed > 0) {
          const from = endAt({ atom: weight.from }, 'from');
          const to = endAt({ atom: weight.to }, 'to');
          const { weightAt } = PLANE.list;
          drawWeight(
            plane,
            String(weight.value),
            {
              x: lerp(from.x, to.x, weightAt),
              y: lerp(from.y, to.y, weightAt),
            },
            zoom,
            weight.weighed,
          );
        }
      }

      // A triple's vaults: the lines down from its frame, grey until they
      // show the vault they lead to; each person's position, on their line;
      // and the people, arriving as atoms do.
      const onCanvas = (point: PlanePoint): ScreenPoint => ({
        x: origin.x + point.x * zoom,
        y: origin.y + point.y * zoom,
      });
      for (const line of blended.vaultLines) {
        const from = onCanvas(line.from);
        const to = onCanvas(line.to);
        drawLine(plane, {
          id: line.id,
          points: [from, to],
          units: Math.hypot(to.x - from.x, to.y - from.y),
          progress: line.presence,
          alpha: 1,
          flow: state.props.scene.flow,
          colour:
            line.side === null
              ? grey
              : mix(grey, SIDE_COLOURS[line.side], line.sided),
        });
      }
      for (const line of blended.vaultLines) {
        if (line.weight !== undefined && line.weighed > 0) {
          drawWeight(
            plane,
            String(line.weight.value),
            onCanvas(line.weight),
            zoom,
            line.weighed,
          );
        }
      }
      for (const person of blended.people) {
        if (person.presence > 0) {
          drawPerson(
            plane,
            onCanvas(person),
            PLANE.atomSize * zoom * (0.55 + 0.45 * person.presence),
            person.presence,
          );
        }
      }

      // An atom the cloud has keeps its shape from there: it is the same
      // atom. It sharpens as it comes out of the cloud.
      const cloudRoles = new Map(
        state.props.scene.atoms.map((atom) => [atom.id, atom.role]),
      );
      for (const { atom, out, placement } of placed) {
        const cloudRole =
          out === undefined ? undefined : cloudRoles.get(atom.id);
        plane.globalAlpha = out?.amount ?? atom.presence;
        drawAtom(
          plane,
          ATOMS[atom.id].label,
          placement,
          cloudRole ?? {
            from: atom.fromRole,
            to: atom.role,
            progress: atom.roleProgress,
          },
          atom.named,
          atom.nameSide,
          out?.amount ?? 1,
          starOf(atom.rank, atom.ranked),
        );
      }
      // Plain words, not yet atoms: written after an atom, breaking apart,
      // settling where their names go. Set at the size they were measured
      // at, and scaled with the plane, so they keep the spaces between them.
      plane.setTransform(
        ratio * zoom,
        0,
        0,
        ratio * zoom,
        ratio * origin.x,
        ratio * origin.y,
      );
      plane.font = `500 ${PLANE.badge.fontSize}px ${fontFamily}`;
      plane.textAlign = 'center';
      plane.textBaseline = 'middle';
      plane.fillStyle = rgba(ink);
      // A word that is becoming its atom's name grows the name's pill
      // behind it, and turns the pill's colour round: it is the name.
      const { badge } = PLANE;
      for (const words of blended.words) {
        if (words.alpha <= 0) {
          continue;
        }
        if (words.pill > 0) {
          const textWidth = plane.measureText(words.text).width;
          plane.globalAlpha = words.alpha * words.pill;
          plane.fillStyle = rgba(ink);
          plane.beginPath();
          plane.roundRect(
            words.x - textWidth / 2 - badge.padding,
            words.y - badge.height / 2,
            textWidth + badge.padding * 2,
            badge.height,
            badge.height / 2,
          );
          plane.fill();
        }
        plane.globalAlpha = words.alpha;
        plane.fillStyle = rgba(mix(ink, page, words.pill));
        plane.fillText(words.text, words.x, words.y + 0.5);
      }
      plane.globalAlpha = 1;
      plane.setTransform(ratio, 0, 0, ratio, 0, 0);
      fadeEdges(plane, width, height);
    }

    /** A faint dashed outline, round the path `trace` gives: a perspective's shape. */
    function drawOutline(
      target: CanvasRenderingContext2D,
      trace: (target: CanvasRenderingContext2D) => void,
    ): void {
      target.save();
      target.beginPath();
      trace(target);
      target.fillStyle = rgba(ink, OUTLINE.fill);
      target.fill();
      target.setLineDash(OUTLINE.dash);
      target.lineWidth = 1;
      target.strokeStyle = rgba(ink, OUTLINE.stroke);
      target.stroke();
      target.restore();
    }

    /**
     * The flat perspective: the cloud's atoms on a map of it, in a square
     * `side` across round `cell`. Each atom leaves its place on the cloud
     * for its place on the map, then the map's lines grow, straight, and
     * the names come, as many as fit.
     */
    function drawFlat(
      flat: FlatScene,
      cell: ScreenPoint,
      side: number,
      project: (direction: Vec3) => Projected,
      radius: number,
      badge: Badge,
    ): void {
      if (context === null || context === undefined) {
        return;
      }
      const square = side * FLAT.square;
      const left = cell.x - square / 2;
      const top = cell.y - square / 2;
      const inset = square * FLAT.inset;
      context.globalAlpha = flat.arrive;
      drawOutline(context, (target) => {
        target.roundRect(left, top, square, square, FLAT.cornerPx);
      });
      context.globalAlpha = 1;
      const size = ATOM_SHARE * radius * FLAT.atomScale;
      const placed = state.props.scene.atoms.flatMap((atom) => {
        const spot = flat.places.get(atom.id);
        if (spot === undefined || atom.presence <= 0) {
          return [];
        }
        const from = project(atom.at);
        const to = {
          x: left + inset + spot.x * (square - inset * 2),
          y: top + inset + spot.y * (square - inset * 2),
        };

        return [
          {
            atom,
            x: lerp(from.x, to.x, flat.arrive),
            y: lerp(from.y, to.y, flat.arrive),
            size: lerp(ATOM_SHARE * radius * from.scale, size, flat.arrive),
            alpha:
              atom.presence *
              lerp(0.2 + 0.8 * ((from.z + 1) / 2), 1, flat.arrive),
          },
        ];
      });
      if (flat.arrive <= 0) {
        return;
      }
      const at = (id: AtomId) => placed.find((spot) => spot.atom.id === id);
      context.lineCap = 'round';
      for (const { id, progress } of flat.triples) {
        const { subject, predicate, object } = TRIPLES[id];
        const points = [at(subject), at(predicate), at(object)].flatMap(
          (spot) => (spot === undefined ? [] : [{ x: spot.x, y: spot.y }]),
        );
        if (points.length === 3 && progress > 0) {
          drawLine(context, {
            id: `flat:${id}`,
            points,
            units: segmentLengths(points).reduce((sum, part) => sum + part, 0),
            progress,
            alpha: 1,
            flow: state.props.scene.flow,
          });
        }
      }
      for (const spot of placed) {
        context.globalAlpha = spot.alpha;
        drawShape(context, spot.x, spot.y, spot.size, spot.atom.role);
      }
      // The names as the atoms land, those it names first first, each
      // where it does not meet another.
      const named = clamp01(
        (flat.arrive - FLAT.namesFrom) / (1 - FLAT.namesFrom),
      );
      if (named > 0) {
        context.font = `500 ${badge.fontSize}px ${fontFamily}`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.globalAlpha = named;
        // Those it names first, then the things, then the predicates.
        const rank = ({ atom }: (typeof placed)[number]): number => {
          const index = flat.namedFirst.indexOf(atom.id);
          if (index !== -1) {
            return index;
          }

          return (
            flat.namedFirst.length + (atom.role.to === 'predicate' ? 1 : 0)
          );
        };
        const taken: Array<{
          left: number;
          right: number;
          top: number;
          bottom: number;
        }> = [];
        for (const spot of placed.toSorted((a, b) => rank(a) - rank(b))) {
          if (flat.unnamed.includes(spot.atom.id)) {
            continue;
          }
          const textWidth = context.measureText(spot.atom.label).width;
          // Under the atom, or to its left, level with it.
          const isLeft = flat.namedLeft.includes(spot.atom.id);
          const width = textWidth + badge.padding * 2;
          const box = isLeft
            ? {
                left: spot.x - spot.size / 2 - badge.gap - width,
                right: spot.x - spot.size / 2 - badge.gap,
                top: spot.y - badge.height / 2,
                bottom: spot.y + badge.height / 2,
              }
            : {
                left: spot.x - width / 2,
                right: spot.x + width / 2,
                top: spot.y + spot.size / 2 + badge.gap,
                bottom: spot.y + spot.size / 2 + badge.gap + badge.height,
              };
          const isCovering = taken.some(
            (other) =>
              box.left < other.right + BADGE_SPACING_PX &&
              box.right > other.left - BADGE_SPACING_PX &&
              box.top < other.bottom + BADGE_SPACING_PX &&
              box.bottom > other.top - BADGE_SPACING_PX,
          );
          if (!isCovering) {
            taken.push(box);
            drawBadge(
              context,
              spot.atom.label,
              (box.left + box.right) / 2,
              box.top,
              badge,
            );
          }
        }
      }
      context.globalAlpha = 1;
    }

    function draw(): void {
      if (canvas === null || context === null || context === undefined) {
        return;
      }
      // Out of focus behind an open plane, and gone when a beat takes it
      // away, with the lines that reach back into it.
      const { depth, cloud } = state.props.scene;
      canvas.style.filter =
        depth > 0.001
          ? `blur(${(depth * DEPTH_OF_FIELD.blurPx).toFixed(2)}px)`
          : '';
      canvas.style.opacity = String((1 - depth * DEPTH_OF_FIELD.fade) * cloud);

      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const ratio = Math.min(window.devicePixelRatio, 2);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.clearRect(0, 0, width, height);

      const { camera, atoms, triples, cloudFlow } = state.props.scene;
      const planeView = viewPlane(width, height);
      // Where each atom on the plane stands there, on the canvas.
      const onPlane = new Map<
        AtomId,
        ScreenPoint & {
          presence: number;
          named: number;
          nameSide?: 'left' | 'right';
          star?: Star;
        }
      >();
      if (planeView !== null) {
        for (const atom of planeView.blended.atoms) {
          const star = starOf(atom.rank, atom.ranked);
          onPlane.set(atom.id, {
            x: planeView.origin.x + atom.x * planeView.zoom,
            y: planeView.origin.y + atom.y * planeView.zoom,
            presence: atom.presence,
            named: atom.named,
            ...(atom.nameSide === undefined ? {} : { nameSide: atom.nameSide }),
            ...(star === undefined ? {} : { star }),
          });
        }
      }
      // The cloud and the plane are one structure: the cloud behind moves
      // with the atoms the two share, where they finally stand in the claim
      // the chapter builds to, so it takes its place once and keeps it as
      // they come out one by one. It moves as far as the first of them has
      // come out, so it never jumps as that one starts to.
      const finalXs = planeView?.blended.fit?.xs;
      const sharedXs = atoms.flatMap((atom) => {
        if (atom.presence <= 0 || planeView === null) {
          return [];
        }
        const there = finalXs?.get(atom.id);
        if (there !== undefined) {
          return [planeView.origin.x + there * planeView.zoom];
        }
        const made = onPlane.get(atom.id);

        return made === undefined ? [] : [made.x];
      });
      const comeOut = Math.max(
        0,
        ...atoms.map((atom) => onPlane.get(atom.id)?.presence ?? 0),
      );
      // Moved by the reader, it moves less, being farther away.
      const slide =
        (sharedXs.length === 0
          ? 0
          : (sharedXs.reduce((sum, x) => sum + x, 0) / sharedXs.length -
              state.pan.x -
              width / 2) *
            comeOut) +
        state.pan.x * PAN_PARALLAX;
      const rise = state.pan.y * PAN_PARALLAX;

      const view = viewOf(camera, width, height);
      // With a second perspective beside it, the cloud moves aside into a
      // square cell of its own, and the map takes the other.
      const { flat } = state.props.scene;
      const aside = flat?.aside ?? 0;
      const cells = cellsOf(width, height);
      const radius = lerp(view.radius, cells.side * WHOLE_SHARE, aside);
      const centre = {
        x: lerp(width / 2, cells.first.x, aside),
        y: lerp(height / 2, cells.first.y, aside),
      };
      // The film's turn brings what the camera faces to the front; the
      // reader's comes after it.
      const orientation = multiply(state.turn, turnToFace(view.facing));
      // Looking down on the cloud lowers what it faces, the equator's front:
      // the picture is lifted as much, so the arc stays in the middle. Behind
      // an open plane, it rises above it. All of it in view, it is centred.
      const lift =
        (LIFT_PX + radius * view.facing[1]) * (1 - (camera.whole ?? 0)) +
        depth * DEPTH_OF_FIELD.risePx +
        (camera.raise ?? 0) * radius;
      const project = (direction: Vec3): Projected => {
        const [x, y, z] = rotate(orientation, direction);
        const scale = EYE_DISTANCE / (EYE_DISTANCE - z);

        return {
          x: centre.x + slide + x * radius * scale,
          y: centre.y - lift + rise - y * radius * scale,
          z,
          scale,
        };
      };
      // All of it in view, its outline: round, as the map's is square.
      const whole = camera.whole ?? 0;
      if (whole > 0) {
        const middle = project([0, 0, 0]);
        context.globalAlpha = whole;
        drawOutline(context, (target) => {
          target.arc(
            middle.x,
            middle.y,
            (radius * EYE_DISTANCE) / Math.sqrt(EYE_DISTANCE ** 2 - 1),
            0,
            2 * Math.PI,
          );
        });
        context.globalAlpha = 1;
      }
      /** 0 at the back of the cloud to 1 at the front. */
      const frontness = (z: number): number => (z + 1) / 2;
      const badge = width < NARROW_PX ? BADGE_NARROW : BADGE;

      // An atom the plane shares with the cloud is the same atom: it comes
      // out of the cloud to its place on the plane, growing as it comes.
      const lifted = new Map<AtomId, Lifted>();
      for (const atom of atoms) {
        const target = onPlane.get(atom.id);
        if (target === undefined || planeView === null || atom.presence <= 0) {
          continue;
        }
        const from = project(atom.at);
        const amount = target.presence;
        const inCloud = {
          x: from.x,
          y: from.y,
          size: ATOM_SHARE * radius * from.scale,
          badgeScale: badge.fontSize / PLANE.badge.fontSize,
        };
        lifted.set(atom.id, {
          origin: inCloud,
          named: target.named,
          ...(target.nameSide === undefined
            ? {}
            : { nameSide: target.nameSide }),
          ...(target.star === undefined ? {} : { star: target.star }),
          x: lerp(from.x, target.x, amount),
          y: lerp(from.y, target.y, amount),
          size: lerp(
            ATOM_SHARE * radius * from.scale,
            PLANE.atomSize * planeView.zoom,
            amount,
          ),
          badgeScale: lerp(
            badge.fontSize / PLANE.badge.fontSize,
            planeView.zoom,
            amount,
          ),
          amount,
          z: from.z,
        });
      }

      // Each triple's line, under the atoms, drawn as far as it has got. An
      // atom on its way out of the cloud takes its end of the line with it,
      // and the plane draws that end again, sharp: a reminder of where it
      // came from, so it holds still.
      const reaching: Line[] = [];
      context.lineCap = 'round';
      context.lineJoin = 'round';
      for (const triple of triples) {
        if (triple.progress <= 0) {
          continue;
        }
        const [subject, predicate, object] = triple.points;
        const path: Vec3[] = [];
        for (const [from, to] of [
          [subject, predicate],
          [predicate, object],
        ] as const) {
          for (
            let step = path.length === 0 ? 0 : 1;
            step <= ARC_STEPS;
            step++
          ) {
            path.push(arcPoint(from, to, step / ARC_STEPS));
          }
        }
        const projected = path.map(project);
        const last = projected.length - 1;
        const ends = TRIPLES[triple.id];
        // A triple whose three atoms all come out comes out whole, with
        // them: each point of its line moves with the atoms either side of
        // it, from the curve round the cloud to a straight line between
        // them, as far as they have come.
        const outs = [ends.subject, ends.predicate, ends.object].map((id) =>
          lifted.get(id),
        );
        const [outSubject, outPredicate, outObject] = outs;
        const isWhole =
          outSubject !== undefined &&
          outPredicate !== undefined &&
          outObject !== undefined;
        // Otherwise, how much of each point an atom at either end pulls with
        // it.
        const pulls = [
          {
            out: outSubject,
            end: projected[0],
            weight: (index: number) => Math.max(1 - index / ARC_STEPS, 0) ** 2,
          },
          {
            out: outObject,
            end: projected[last],
            weight: (index: number) =>
              Math.max(1 - (last - index) / ARC_STEPS, 0) ** 2,
          },
        ];
        const points = projected.map((point, index) => {
          if (isWhole) {
            // Along the straight line between its atoms where they are,
            // off it as far as the curve was, less as they come out.
            const isFirstHalf = index <= ARC_STEPS;
            const share = isFirstHalf
              ? index / ARC_STEPS
              : (index - ARC_STEPS) / ARC_STEPS;
            const [from, to] = isFirstHalf
              ? [outSubject, outPredicate]
              : [outPredicate, outObject];
            const [start, end] = isFirstHalf
              ? [projected[0], projected[ARC_STEPS]]
              : [projected[ARC_STEPS], projected[last]];
            const amount = lerp(from.amount, to.amount, share);
            const chord = {
              x: lerp(start?.x ?? point.x, end?.x ?? point.x, share),
              y: lerp(start?.y ?? point.y, end?.y ?? point.y, share),
            };

            return {
              x: lerp(from.x, to.x, share) + (point.x - chord.x) * (1 - amount),
              y: lerp(from.y, to.y, share) + (point.y - chord.y) * (1 - amount),
            };
          }
          let { x, y } = point;
          for (const { out, end, weight } of pulls) {
            if (out !== undefined && end !== undefined) {
              x += (out.x - end.x) * weight(index);
              y += (out.y - end.y) * weight(index);
            }
          }

          return { x, y };
        });
        const units =
          (angleBetween(subject, predicate) + angleBetween(predicate, object)) *
          DOT_UNITS_PER_RADIAN;
        // A line round the back of the cloud fades, as its atoms do.
        const nearness = 0.15 + 0.85 * frontness(project(predicate).z);
        // Coming out whole, it sharpens on the plane as it leaves the cloud,
        // as its atoms do.
        const comeOut = isWhole
          ? Math.min(outSubject.amount, outPredicate.amount, outObject.amount)
          : 0;
        drawLine(context, {
          id: triple.id,
          points,
          units,
          progress: triple.progress,
          alpha: nearness * (1 - comeOut),
          flow: cloudFlow,
        });
        if (isWhole) {
          reaching.push({
            id: triple.id,
            points,
            units,
            progress: triple.progress,
            alpha: comeOut,
            flow: cloudFlow,
          });
        } else if (pulls.some(({ out }) => out !== undefined)) {
          reaching.push({
            id: triple.id,
            points,
            units,
            progress: triple.progress,
            alpha: cloud,
            flow: cloudFlow,
            fade: points.map((_, index) =>
              Math.min(
                pulls.reduce(
                  (sum, { out, weight }) =>
                    sum + (out === undefined ? 0 : weight(index) * out.amount),
                  0,
                ),
                1,
              ),
            ),
          });
        }
      }

      // The atoms, back to front, so nearer ones cover farther ones. Each
      // grows in as it arrives.
      const shown = atoms
        .filter((atom) => atom.presence > 0 && !lifted.has(atom.id))
        .map((atom) => ({ atom, at: project(atom.at) }))
        .sort((a, b) => a.at.z - b.at.z);
      for (const { atom, at } of shown) {
        context.globalAlpha = atom.presence * (0.2 + 0.8 * frontness(at.z));
        drawShape(
          context,
          at.x,
          at.y,
          ATOM_SHARE * radius * at.scale * (0.55 + 0.45 * atom.presence),
          atom.role,
        );
      }

      // Their names, in ink badges under them, after the shape arrives, and
      // only on the half of the cloud that faces the viewer. Nearest first:
      // where the cloud curves away its atoms close up, and a name that
      // would cover a nearer one is left out until the cloud turns.
      context.font = `500 ${badge.fontSize}px ${fontFamily}`;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      const placed: Array<{
        left: number;
        right: number;
        top: number;
        bottom: number;
        /** How far up the cloud its atom stands: the row it is in. */
        row: number;
      }> = [];
      // An atom on its way out keeps the name it had here, or the lack of
      // one: its place among the names is still where it stood.
      const naming = [
        ...shown.map(({ atom, at }) => ({ atom, at, isLeaving: false })),
        ...atoms
          .filter((atom) => atom.presence > 0 && lifted.has(atom.id))
          .map((atom) => ({ atom, at: project(atom.at), isLeaving: true })),
      ].sort((a, b) => b.at.z - a.at.z);
      const namedHere = new Set<AtomId>();
      for (const { atom, at, isLeaving } of naming) {
        if (at.z < 0.1) {
          continue;
        }
        const textWidth = context.measureText(atom.label).width;
        const left = at.x - textWidth / 2 - badge.padding;
        const right = at.x + textWidth / 2 + badge.padding;
        const top = at.y + ATOM_SHARE * radius * at.scale * 0.5 + badge.gap;
        const bottom = top + badge.height;
        // Names in a row of the cloud sit along one line, so only their
        // sides can meet; in another row, a name can sit under them.
        const row = atom.at[1];
        const isCovering = placed.some(
          (other) =>
            left < other.right + BADGE_SPACING_PX &&
            right > other.left - BADGE_SPACING_PX &&
            (Math.abs(row - other.row) < ROW_APART ||
              (top < other.bottom + BADGE_SPACING_PX &&
                bottom > other.top - BADGE_SPACING_PX)),
        );
        if (isCovering) {
          continue;
        }
        placed.push({ left, right, top, bottom, row });
        if (isLeaving) {
          namedHere.add(atom.id);
          continue;
        }
        context.globalAlpha =
          atom.presence ** 2 * (0.35 + 0.65 * frontness(at.z));
        drawBadge(context, atom.label, at.x, top, badge);
      }

      // An atom on its way out, still in the cloud's focus as it leaves it:
      // the plane draws it again, sharpening as it comes.
      for (const atom of atoms) {
        const out = lifted.get(atom.id);
        if (out !== undefined && out.amount < 1) {
          context.globalAlpha =
            atom.presence * (1 - out.amount) * (0.2 + 0.8 * frontness(out.z));
          // One whose name is a word on the plane leaves its name here.
          const isNamed = namedHere.has(atom.id);
          drawAtom(
            context,
            atom.label,
            out,
            atom.role,
            isNamed ? out.named : 0,
            out.nameSide,
            out.amount,
            out.star,
          );
          if (isNamed && out.named === 0) {
            drawName(context, atom.label, out.origin);
          }
        }
      }
      context.globalAlpha = 1;
      if (flat !== null) {
        drawFlat(flat, cells.second, cells.side, project, radius, badge);
      }

      fadeEdges(context, width, height);
      drawPlane(planeView, reaching, lifted);
    }

    function isGliding(): boolean {
      return Math.hypot(state.drift.x, state.drift.y) > SETTLED_DRIFT;
    }

    function isMoving(): boolean {
      return (
        state.returning !== null ||
        state.drag !== null ||
        state.spin.speed > 0.00002 ||
        isGliding()
      );
    }

    /** The reader's move of the plane, kept to where some of it shows. */
    function keepInView(pan: ScreenPoint): ScreenPoint {
      const box = state.planeBox;
      if (box === null || canvas === null) {
        return { x: 0, y: 0 };
      }
      const along = (
        value: number,
        from: number,
        to: number,
        room: number,
      ): number => {
        const size = to - from;
        const kept = Math.min(
          size,
          Math.max(size / 2, PLANE_IN_VIEW_PX),
          room - PLANE_MARGIN_PX,
        );

        return Math.min(Math.max(value, kept - to), room - kept - from);
      };

      return {
        x: along(pan.x, box.left, box.right, canvas.clientWidth),
        y: along(pan.y, box.top, box.bottom, canvas.clientHeight),
      };
    }

    function tick(now: number): void {
      const elapsed =
        state.lastTick === 0 ? 16 : Math.min(now - state.lastTick, 50);
      state.lastTick = now;
      if (state.returning !== null) {
        const t = Math.min((now - state.returning.startedAt) / RETURN_MS, 1);
        const eased = easeOutCubic(t);
        state.turn = slerp(state.returning.from, IDENTITY_ROTATION, eased);
        state.pan = {
          x: state.returning.fromPan.x * (1 - eased),
          y: state.returning.fromPan.y * (1 - eased),
        };
        if (t >= 1) {
          state.returning = null;
        }
      } else if (state.drag === null) {
        const decay = Math.exp(-elapsed / INERTIA_MS);
        if (state.spin.speed > 0.00002) {
          state.turn = multiply(
            axisAngle(state.spin.axis, state.spin.speed * elapsed),
            state.turn,
          );
          state.spin.speed *= decay;
        }
        if (isGliding()) {
          const wanted = {
            x: state.pan.x + state.drift.x * elapsed,
            y: state.pan.y + state.drift.y * elapsed,
          };
          state.pan = keepInView(wanted);
          // At the edge of where it can go, it stops there.
          state.drift = {
            x: state.pan.x === wanted.x ? state.drift.x * decay : 0,
            y: state.pan.y === wanted.y ? state.drift.y * decay : 0,
          };
        }
      }
      draw();
      if (isMoving()) {
        state.frame = requestAnimationFrame(tick);
      } else {
        state.frame = 0;
        state.lastTick = 0;
      }
    }

    function requestTick(): void {
      if (state.frame === 0) {
        state.frame = requestAnimationFrame(tick);
      }
    }

    /**
     * Turns the cloud, and moves the plane, back from where the reader left
     * them to the film's view.
     */
    function returnToFilm(): void {
      const isPanned = state.pan.x !== 0 || state.pan.y !== 0;
      if (
        Math.abs(state.turn[3]) > 0.999999 &&
        state.spin.speed === 0 &&
        !isPanned
      ) {
        return;
      }
      state.spin.speed = 0;
      state.drift = { x: 0, y: 0 };
      if (isStill) {
        state.turn = IDENTITY_ROTATION;
        state.pan = { x: 0, y: 0 };
        draw();

        return;
      }
      state.returning = {
        from: state.turn,
        fromPan: state.pan,
        startedAt: performance.now(),
      };
      requestTick();
    }

    function resize(): void {
      const ratio = Math.min(window.devicePixelRatio, 2);
      for (const target of [canvas, planeCanvas]) {
        if (target !== null) {
          target.width = Math.round(target.clientWidth * ratio);
          target.height = Math.round(target.clientHeight * ratio);
        }
      }
      draw();
    }

    function pointFor(event: PointerEvent): ScreenPoint {
      const box = canvas?.getBoundingClientRect();

      return {
        x: event.clientX - (box?.left ?? 0),
        y: event.clientY - (box?.top ?? 0),
      };
    }

    function handlePointerDown(event: PointerEvent): void {
      canvas?.setPointerCapture(event.pointerId);
      const { x, y } = pointFor(event);
      state.returning = null;
      state.spin.speed = 0;
      state.drift = { x: 0, y: 0 };
      state.drag = {
        startX: x,
        startY: y,
        lastX: x,
        lastY: y,
        lastAt: performance.now(),
        hasMoved: false,
      };
      if (canvas !== null) {
        canvas.style.cursor = 'grabbing';
      }
    }

    function handlePointerMove(event: PointerEvent): void {
      const drag = state.drag;
      if (drag === null) {
        return;
      }
      const point = pointFor(event);
      if (
        !drag.hasMoved &&
        Math.hypot(point.x - drag.startX, point.y - drag.startY) > CLICK_SLOP_PX
      ) {
        drag.hasMoved = true;
        state.props.onLookAround();
      }
      if (!drag.hasMoved) {
        return;
      }
      const dx = point.x - drag.lastX;
      const dy = point.y - drag.lastY;
      const now = performance.now();
      const distance = Math.hypot(dx, dy);
      // With a plane open, a drag moves the plane, flat, and the cloud
      // behind it with it; otherwise it turns the cloud.
      if (state.props.scene.depth > 0.5) {
        const elapsed = Math.max(now - drag.lastAt, 1);
        state.pan = keepInView({ x: state.pan.x + dx, y: state.pan.y + dy });
        state.drift = { x: dx / elapsed, y: dy / elapsed };
      } else if (distance > 0) {
        const angle = distance * DRAG_RADIANS_PER_PX;
        state.turn = multiply(axisAngle([dy, dx, 0], angle), state.turn);
        state.spin = {
          axis: [dy, dx, 0],
          speed: angle / Math.max(now - drag.lastAt, 1),
        };
      }
      drag.lastX = point.x;
      drag.lastY = point.y;
      drag.lastAt = now;
      draw();
    }

    function endDrag(isClick: boolean): void {
      const drag = state.drag;
      state.drag = null;
      if (canvas !== null) {
        canvas.style.cursor = '';
      }
      if (drag === null) {
        return;
      }
      if (!drag.hasMoved) {
        state.spin.speed = 0;
        if (isClick) {
          state.props.onPress();
        }

        return;
      }
      // A drag that stopped before letting go does not spin or glide on.
      if (isStill || performance.now() - drag.lastAt > 80) {
        state.spin.speed = 0;
        state.drift = { x: 0, y: 0 };
      }
      requestTick();
    }

    function handlePointerUp(): void {
      endDrag(true);
    }

    function handlePointerCancel(): void {
      endDrag(false);
    }

    state.refresh = draw;
    state.returnToFilm = returnToFilm;
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('pointercancel', handlePointerCancel);
    resize();

    return () => {
      cancelAnimationFrame(state.frame);
      state.frame = 0;
      state.refresh = null;
      state.returnToFilm = null;
      observer.disconnect();
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('pointercancel', handlePointerCancel);
    };
  }, []);

  // A new scene: hand it to the drawing and draw it. As the film plays on,
  // or moves to another beat, the cloud turns back from where the reader
  // left it.
  useEffect(() => {
    const state = latest.current;
    const previous = state.props;
    state.props = props;
    if (
      (props.isPlaying && !previous.isPlaying) ||
      props.scene.beat.id !== previous.scene.beat.id
    ) {
      state.returnToFilm?.();
    }
    state.refresh?.();
  });

  return (
    // Square on a phone; from tablet width up it fills the card the
    // playground gives it, the welcome video's shape.
    <div className="relative aspect-square w-full md:aspect-auto md:min-h-0 md:flex-1">
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={props.label}
        className="absolute inset-0 size-full cursor-grab touch-none rounded-lg"
      />
      {/* The plane, sharp in front of the cloud: drawn, never touched. */}
      <canvas
        ref={planeRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 size-full"
      />
    </div>
  );
}

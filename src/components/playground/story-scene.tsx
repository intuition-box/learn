import { type ReactNode, useEffect, useRef } from 'react';

import { MEDAL_ICON, USER_ICON } from '@/lib/icons';
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
  bodyLineY,
  CARD,
  cardHeight,
  CLOSING,
  closingAt,
  type EnrichmentLayout,
  enrichmentLayout,
  fieldFlow,
  flowPath,
  globeAt,
  GRAPH_FIELDS,
  infoboxRowY,
  lineBack,
  PAGE_FIELDS,
  WIKI,
} from './story-enrichment';
import {
  ATOMS,
  type AtomId,
  CROWD,
  type CrowdAtom,
  type PlaneState,
  type Role,
  type Scene,
  THE_WAY_ON,
  TRIPLES,
  WAY_APART,
  turnToFace,
  viewOf,
  WHOLE_SHARE,
} from './story-model';
import {
  type BlendedPicker,
  type BlendedPlane,
  PLANE,
  type PlaneEnd,
  type PlanePoint,
  planeAt,
} from './story-plane';
import { ROLE_COLOURS, traceShape } from './story-shapes';

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
const PLANE_ZOOM = { max: 1.4, min: 0.82 } as const;
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
 * A ranked list's top three, a medal before each name, outside its badge
 * and as tall, its place in its ring: gold, silver, copper. And how tall
 * its numeral stands against the ring's radius, as the one in the icon does.
 */
const RANK_COLOURS: readonly Rgb[] = [
  [227, 179, 65],
  [168, 169, 173],
  [184, 115, 51],
];
const MEDAL = { numeral: 1.116 } as const;

/** A medal before a name: its colour, its place, and how far it has come, 0 to 1. */
interface Medal {
  colour: Rgb;
  place: number;
  amount: number;
}

/** The medal before a name ranked in a list's top three, as far as `amount` has come. */
function medalOf(rank: number | undefined, amount: number): Medal | undefined {
  const colour = rank === undefined ? undefined : RANK_COLOURS[rank];

  return rank === undefined || colour === undefined || amount <= 0
    ? undefined
    : { colour, place: rank + 1, amount };
}

/** A menu of perspectives, as drawn: where it is, what it offers, and how far it shows and opens. */
type Menu = Pick<
  BlendedPicker,
  'x' | 'y' | 'width' | 'options' | 'chosen' | 'presence' | 'open' | 'highlight'
>;

/**
 * Above each of two globes, the menu of whose perspective it is: the room
 * between the menu and the globe, and the least room left under the globe.
 */
const GLOBE_MENU = { gap: 24, under: 32 } as const;
/**
 * An atom set back on the cloud, there but in none of the triples it shows:
 * how much of its shape shows, and of its name.
 */
const SET_BACK = { shape: PLANE.faded, name: 0.1 } as const;

/**
 * An atom shown quieter than the rest, so the one the beat is about stands
 * out: how much of it shows, its shape and its name.
 */
const QUIET = 0.3;

/**
 * How much the way on's name grows as its neighbours quieten, from any
 * name's size to a button's, down from its top: its shape, and the gap
 * between them, stay as they are. The page's link takes its size from the
 * scene.
 */
const WAY_SCALE = 32 / 22;

/** The room above a globe for its menu. */
const GLOBE_MENU_ROOM = PLANE.picker.height + GLOBE_MENU.gap;

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
  /**
   * The way on, a link: the scene shows it as the name of its last
   * triple's predicate (`THE_WAY_ON`), where it would draw the name, and
   * pulses it once the atoms round it have quietened. It reads its size,
   * full grown, from `--way-height`, `--way-padding` and `--way-font` on its
   * box, how far it has grown from `--way-scale`, to scale by from its
   * top's middle, its pulse's colour from `--way-pulse`, and whether to
   * pulse from `data-pulsing`.
   */
  way?: ReactNode;
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
  /** The medal before its name, ranked in a list. */
  medal?: Medal;
}

/**
 * The film's ending, on the cloud: the wider graph's atoms, the atoms shown
 * quieter, and the predicate that is the way on, whose name the page shows
 * as a link, where the cloud would draw it.
 */
interface Ending {
  crowd: readonly CrowdAtom[];
  /** How far the wider graph's atoms have come, 0 to 1. */
  crowdShown: number;
  quiet: ReadonlyMap<AtomId, number>;
  /**
   * Atoms whose names sit above them throughout, not under: where the way
   * on's name, grown, would not fit between its neighbours' under the
   * line, theirs.
   */
  risen: ReadonlySet<AtomId>;
  button: AtomId;
  /** How large the way on's name is: 1 as any name, growing to `WAY_SCALE`. */
  grow: number;
  /**
   * Where the way on is, for the scene to draw its shape over the haze and
   * the page its name: the cloud draws neither.
   */
  placeButton: (way: WayPlace) => void;
}

/** Where the way on is: its shape, and its name, if it shows one. */
interface WayPlace extends ScreenPoint {
  size: number;
  role: ShapeRole;
  alpha: number;
  name: { x: number; top: number; alpha: number } | null;
}

/** The way on's neighbours in its triple: its subject and its object. */
const WAY_NEIGHBOURS: ReadonlySet<AtomId> = new Set(
  Object.values(TRIPLES)
    .filter((triple) => triple.predicate === THE_WAY_ON)
    .flatMap((triple): AtomId[] => [triple.subject, triple.object]),
);
const NONE_RISEN: ReadonlySet<AtomId> = new Set();

/** Between an atom on the cloud's rim and the scene's edge, as the film ends. */
const RIM_ROOM_PX = 2;

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

/**
 * A CSS colour token, in 0 to 255 channels. The browser converts it, by
 * painting it on a canvas, because a computed colour can come back in any
 * colour space (`lab()`, `oklch()`).
 */
function readToken(name: string): Rgb {
  const value = getComputedStyle(document.documentElement).getPropertyValue(
    name,
  );
  const context = document.createElement('canvas').getContext('2d');
  if (context === null || value === '') {
    return [0, 0, 0];
  }
  context.fillStyle = value;
  context.fillRect(0, 0, 1, 1);
  const [red = 0, green = 0, blue = 0] = context.getImageData(0, 0, 1, 1).data;

  return [red, green, blue];
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;
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
  const wayRef = useRef<HTMLDivElement>(null);
  const hazeRef = useRef<HTMLDivElement>(null);
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
    const medalPath = new Path2D(MEDAL_ICON.paths[0]?.d ?? '');
    const fontFamily = getComputedStyle(canvas).fontFamily;

    /**
     * A medal, `size` across, its top left at `x`, `y`: the rosette, then
     * its place in the ring, centred on what the numeral covers, as tall as
     * the icon's own.
     */
    function drawMedal(
      target: CanvasRenderingContext2D,
      medal: Medal,
      x: number,
      y: number,
      size: number,
    ): void {
      const { box, ring } = MEDAL_ICON;
      const scale = size / box.size;
      target.save();
      target.globalAlpha *= medal.amount;
      target.fillStyle = rgba(medal.colour);
      target.translate(x, y);
      target.save();
      target.scale(scale, scale);
      target.translate(-box.x, -box.y);
      target.fill(medalPath, 'evenodd');
      target.restore();
      const numeral = String(medal.place);
      target.font = `700 100px ${fontFamily}`;
      const tall = target.measureText(numeral);
      const fontSize =
        (100 * ring.radius * MEDAL.numeral * scale) /
        (tall.actualBoundingBoxAscent + tall.actualBoundingBoxDescent);
      target.font = `700 ${fontSize}px ${fontFamily}`;
      target.textAlign = 'left';
      target.textBaseline = 'alphabetic';
      const set = target.measureText(numeral);
      target.fillText(
        numeral,
        (ring.x - box.x) * scale -
          (set.actualBoundingBoxRight - set.actualBoundingBoxLeft) / 2,
        (ring.y - box.y) * scale +
          (set.actualBoundingBoxAscent - set.actualBoundingBoxDescent) / 2,
      );
      target.restore();
    }

    /**
     * Fades a canvas out toward its four edges, so a line or a name that
     * runs past one, when a narrow screen follows the story or the plane is
     * dragged, runs off softly; `amount` of the way, where less runs past.
     */
    function fadeEdges(
      target: CanvasRenderingContext2D,
      width: number,
      height: number,
      amount = 1,
    ): void {
      if (amount <= 0) {
        return;
      }
      target.globalCompositeOperation = 'destination-out';
      // Each gradient runs from an edge inward: left, right, top, bottom.
      for (const [fromX, fromY, toX, toY] of [
        [0, 0, EDGE_FADE_PX, 0],
        [width, 0, width - EDGE_FADE_PX, 0],
        [0, 0, 0, EDGE_FADE_PX],
        [0, height, 0, height - EDGE_FADE_PX],
      ] as const) {
        const fade = target.createLinearGradient(fromX, fromY, toX, toY);
        fade.addColorStop(0, `rgba(0, 0, 0, ${amount})`);
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
      medal?: Medal,
    ): void {
      const textWidth = target.measureText(label).width;
      const left = x - textWidth / 2 - badge.padding;
      target.fillStyle = rgba(ink);
      target.beginPath();
      target.roundRect(
        left,
        top,
        textWidth + badge.padding * 2,
        badge.height,
        badge.height / 2,
      );
      target.fill();
      // A medal before the badge, outside it, as tall.
      if (medal !== undefined && medal.amount > 0) {
        drawMedal(
          target,
          medal,
          left - PLANE.medal.gap - badge.height,
          top,
          badge.height,
        );
      }
      target.fillStyle = rgba(page);
      target.fillText(label, x, top + badge.height / 2 + 0.5);
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
      const { from, to, progress, fit, durationMs } = state.props.scene.plane;
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
        durationMs,
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
      medal?: Medal,
    ): void {
      drawShape(target, placement.x, placement.y, placement.size, role);
      if (named > 0) {
        const alpha = target.globalAlpha;
        target.globalAlpha = alpha * named;
        drawName(target, label, placement, nameSide, sideness, medal);
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
      medal?: Medal,
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
        // A medal stands before the badge: to the right of the shape, the
        // badge moves over to make room for it as it comes.
        const room =
          medal === undefined || direction < 0
            ? 0
            : (badge.height + PLANE.medal.gap) * medal.amount;
        const beside = {
          x:
            placement.x +
            (placement.size / 2 +
              (badge.gap + room + badge.padding + textWidth / 2) * scale) *
              direction,
          y: placement.y,
        };
        target.translate(
          lerp(under.x, beside.x, sideness),
          lerp(under.y, beside.y, sideness),
        );
        target.scale(scale, scale);
        drawBadge(target, label, 0, -badge.height / 2, badge, medal);
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
      // Seen through a perspective, a frame round the claim, as faint as a
      // line between atoms, which shows as the menu does.
      const { picker } = blended;
      if (picker !== null && picker.presence > 0) {
        const { frame } = picker;
        plane.globalAlpha = picker.presence;
        plane.strokeStyle = rgba(ink, LINE.alpha);
        plane.lineWidth = PLANE.picker.border / zoom;
        plane.beginPath();
        plane.roundRect(
          frame.x,
          frame.y,
          frame.width,
          frame.height,
          PLANE.frameRadius,
        );
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
          alpha: lerp(1, PLANE.faded, link.faded),
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
      // show the vault they lead to, a side's running together as far as
      // its vault; each person's position, on their line, and each vault's
      // total, where its lines run together; and the people, arriving as
      // atoms do.
      const onCanvas = (point: PlanePoint): ScreenPoint => ({
        x: origin.x + point.x * zoom,
        y: origin.y + point.y * zoom,
      });
      for (const line of blended.vaultLines) {
        const points = line.points.map(onCanvas);
        drawLine(plane, {
          id: line.id,
          points,
          units: segmentLengths(points).reduce((sum, part) => sum + part, 0),
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
        if (line.total !== undefined && line.sided > 0) {
          drawWeight(
            plane,
            String(line.total.value),
            onCanvas(line.total),
            zoom,
            line.sided,
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
        plane.globalAlpha =
          (out?.amount ?? atom.presence) * lerp(1, PLANE.faded, atom.faded);
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
          medalOf(atom.rank, atom.ranked),
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
      // The menu of perspectives over the fade: it is the page's, not the
      // picture's, and stays whole near an edge.
      if (blended.picker !== null) {
        plane.setTransform(
          ratio * zoom,
          0,
          0,
          ratio * zoom,
          ratio * origin.x,
          ratio * origin.y,
        );
        drawMenu(plane, blended.picker);
        plane.setTransform(ratio, 0, 0, ratio, 0, 0);
      }
    }

    /**
     * A menu of perspectives, in `target`'s units: closed, the one chosen and
     * its chevrons, on ink, as a name is; open, the people to choose from in
     * a list below it, the one highlighted lighter.
     */
    function drawMenu(target: CanvasRenderingContext2D, picker: Menu): void {
      if (picker.presence <= 0) {
        return;
      }
      const { height, padding, chevrons, row, inset, radius } = PLANE.picker;
      const { x, y, width, options } = picker;
      target.save();
      target.font = `500 ${PLANE.badge.fontSize}px ${fontFamily}`;
      target.textAlign = 'left';
      target.textBaseline = 'middle';
      target.globalAlpha = picker.presence;
      target.fillStyle = rgba(ink);
      target.beginPath();
      target.roundRect(x, y, width, height, radius);
      target.fill();
      target.fillStyle = rgba(page);
      target.fillText(
        options[picker.chosen] ?? '',
        x + padding,
        y + height / 2 + 0.5,
      );
      // Two chevrons, one up and one down: it opens.
      const middle = {
        x: x + width - padding - chevrons / 2,
        y: y + height / 2,
      };
      target.strokeStyle = rgba(page, 0.7);
      target.lineWidth = 1.5;
      target.lineCap = 'round';
      target.lineJoin = 'round';
      target.beginPath();
      for (const direction of [-1, 1]) {
        target.moveTo(middle.x - 3.5, middle.y + 2 * direction);
        target.lineTo(middle.x, middle.y + 5.5 * direction);
        target.lineTo(middle.x + 3.5, middle.y + 2 * direction);
      }
      target.stroke();

      if (picker.open > 0) {
        // Open, the list drops a little as it shows.
        const { drop } = PLANE.picker;
        const top = y + height + drop - (1 - picker.open) * drop;
        target.globalAlpha = picker.presence * picker.open;
        target.shadowColor = 'rgba(0, 0, 0, 0.18)';
        target.shadowBlur = 16;
        target.shadowOffsetY = 6;
        target.fillStyle = rgba(ink);
        target.beginPath();
        target.roundRect(
          x,
          top,
          width,
          options.length * row + inset * 2,
          radius,
        );
        target.fill();
        target.shadowColor = 'transparent';
        target.fillStyle = rgba(page, 0.14);
        target.beginPath();
        target.roundRect(
          x + inset,
          top + inset + picker.highlight * row,
          width - inset * 2,
          row,
          radius - inset / 2,
        );
        target.fill();
        target.fillStyle = rgba(page);
        for (const [index, option] of options.entries()) {
          target.fillText(
            option,
            x + padding,
            top + inset + (index + 0.5) * row + 0.5,
          );
        }
      }
      target.restore();
    }

    /**
     * The last chapter, over the cloud: Elon Musk out of the graph, above
     * it; the page about him, coming in under the graph's sketch; the card
     * the data builds, on its own; and the lines that carry the data into
     * it: his name from him, the data of his triples from the graph, then
     * the page's from its sections, each row opening as its data nears.
     */
    function drawEnrichment(
      target: CanvasRenderingContext2D,
      layout: EnrichmentLayout,
      musk: {
        at: Placement;
        role: ShapeRole;
        /** How strong his shape and his name are: as in the graph, at first. */
        shape: number;
        name: number;
      },
      badge: Badge,
      graphSources: readonly ScreenPoint[],
    ): void {
      const { enrichment, flow } = state.props.scene;
      if (enrichment === null) {
        return;
      }
      const { graph, page: paging, data, close } = enrichment;
      const { isStacked, card, cardWidth, row } = layout;
      const { at } = musk;
      // As the film ends, the page fades where it stands, once its lines
      // have gone (see `CLOSING`). It rises a little into place as it comes.
      const shown =
        paging * (1 - easeInOutCubic(closingAt(close, CLOSING.page)));
      const rise = (1 - paging) * 12;
      // How far each piece of data has flowed: his name, from him; the
      // data of his triples, from the graph; then the page's. As the film
      // ends, each goes back as it came, the last that came first.
      const fromTheGraph = GRAPH_FIELDS.length + 1;
      const lineCount = fromTheGraph + PAGE_FIELDS.length;
      const unwound = closingAt(close, CLOSING.lines);
      const kept = (amount: number, index: number): number =>
        Math.min(amount, 1 - lineBack(unwound, index, lineCount));
      const named = kept(fieldFlow(graph, 0, fromTheGraph), 0);
      const fields = [...GRAPH_FIELDS, ...PAGE_FIELDS];
      const flows = [
        ...GRAPH_FIELDS.map((_, index) =>
          kept(fieldFlow(graph, index + 1, fromTheGraph), index + 1),
        ),
        ...PAGE_FIELDS.map((_, index) =>
          kept(
            fieldFlow(data, index, PAGE_FIELDS.length),
            fromTheGraph + index,
          ),
        ),
      ];
      // A row opens as its data nears it, and its value shows as the data
      // arrives; as it goes, the other way round. The card itself comes as
      // his name nears it, as a row does, rising a little into place, and
      // goes as his name leaves it.
      const openedFor = (amount: number): number =>
        easeOutCubic(Math.min(Math.max((amount - 0.55) / 0.35, 0), 1));
      const arrivedOf = (amount: number): number =>
        Math.min(Math.max((amount - 0.8) / 0.2, 0), 1);
      const present = openedFor(named);
      const top = card.y + (1 - present) * 8;
      const opened = flows.map(openedFor);
      const rows = opened.reduce((sum, open) => sum + open, 0);
      const left = card.x - cardWidth / 2;
      const facing = left + cardWidth;
      const rowY = (index: number): number =>
        top + badge.height + row * index + row / 2;

      if (shown > 0) {
        drawWikiPage(target, layout, rise, shown, data);
      }

      // The lines, each from where its data leaves to where it goes in
      // the card, on the side that faces it, drawn out as the data flows,
      // and drawn back as it goes.
      const lines = [
        {
          id: 'name',
          from: { x: at.x, y: at.y },
          // Stacked, he stands above the card: straight down to it.
          to: isStacked
            ? { x: at.x, y: top }
            : { x: facing, y: top + badge.height / 2 },
          progress: named,
          isStacked: false,
          alpha: 1,
        },
        ...graphSources.map((from, index) => ({
          id: GRAPH_FIELDS[index]?.id ?? '',
          from,
          to: { x: facing, y: rowY(index) },
          progress: flows[index] ?? 0,
          isStacked: false,
          alpha: 1,
        })),
        ...layout.sources.map((source, index) => ({
          id: source.id,
          from: { x: source.x, y: source.y + rise },
          to: {
            x: isStacked ? left : facing,
            y: rowY(GRAPH_FIELDS.length + index),
          },
          progress: flows[GRAPH_FIELDS.length + index] ?? 0,
          isStacked,
          alpha: paging,
        })),
      ];
      target.save();
      target.globalAlpha = 1;
      for (const line of lines) {
        if (line.progress <= 0) {
          continue;
        }
        const points = flowPath(line.from, line.to, line.isStacked);
        drawLine(target, {
          id: `enrichment-${line.id}`,
          points,
          units: segmentLengths(points).reduce((sum, part) => sum + part, 0),
          progress: line.progress,
          alpha: line.alpha,
          flow,
        });
      }

      // He, with his name under him, as in the graph.
      target.font = `500 ${badge.fontSize}px ${fontFamily}`;
      target.textAlign = 'center';
      target.textBaseline = 'middle';
      target.globalAlpha = musk.shape;
      drawShape(target, at.x, at.y, at.size, musk.role);
      target.globalAlpha = musk.name;
      drawBadge(
        target,
        ATOMS.elonMusk.label,
        at.x,
        at.y + at.size / 2 + badge.gap,
        badge,
      );

      // The card: his name, once it has come from him, and under it each
      // row as it opens, its value arriving with its data.
      if (present > 0) {
        target.globalAlpha = present;
        target.fillStyle = rgba(ink);
        target.beginPath();
        target.roundRect(
          left,
          top,
          cardWidth,
          cardHeight(badge.height, rows, row),
          CARD.radius,
        );
        target.fill();
        target.save();
        target.clip();
        target.fillStyle = rgba(page, arrivedOf(named));
        target.fillText(
          ATOMS.elonMusk.label,
          card.x,
          top + badge.height / 2 + 0.5,
        );
        target.fillStyle = rgba(page, 0.14 * Math.min(rows, 1));
        target.fillRect(
          left + CARD.padding,
          top + badge.height,
          cardWidth - CARD.padding * 2,
          1,
        );
        // A smaller size where the rows are shorter, to fit them all.
        target.font = `400 ${row < 18 ? CARD.fontSize - 1 : CARD.fontSize}px ${fontFamily}`;
        for (const [index, field] of fields.entries()) {
          const open = opened[index] ?? 0;
          if (open <= 0) {
            continue;
          }
          const labelWidth = target.measureText(field.label).width;
          target.textAlign = 'left';
          target.fillStyle = rgba(page, 0.55 * open);
          target.fillText(field.label, left + CARD.padding, rowY(index));
          target.textAlign = 'right';
          target.fillStyle = rgba(page, arrivedOf(flows[index] ?? 0));
          target.fillText(
            fitted(
              target,
              field.value,
              cardWidth - CARD.padding * 3 - labelWidth,
            ),
            facing - CARD.padding,
            rowY(index),
          );
        }
        target.restore();
      }
      target.restore();
    }

    /** `text`, or as many of its words as fit in `room`, and an ellipsis. */
    function fitted(
      target: CanvasRenderingContext2D,
      text: string,
      room: number,
    ): string {
      const words = text.split(' ');
      for (let count = words.length; count > 0; count -= 1) {
        const shown =
          count === words.length ? text : `${words.slice(0, count).join(' ')}…`;
        if (target.measureText(shown).width <= room) {
          return shown;
        }
      }

      return '…';
    }

    /**
     * The encyclopedia page, in its own units (`WIKI`), scaled onto its
     * box: the header with the menu and the logo, search and the account
     * link, the contents down the left, the article as skeleton lines under
     * its title, and the infobox with his name, a portrait and the two
     * facts. Each section the data leaves is tinted while it does.
     */
    function drawWikiPage(
      target: CanvasRenderingContext2D,
      layout: EnrichmentLayout,
      rise: number,
      shown: number,
      data: number,
    ): void {
      const { page: box, scale } = layout;
      // The encyclopedia's own colours: its text, its links, its rules and
      // its pale panels.
      const text: Rgb = [32, 33, 34];
      const link: Rgb = [51, 102, 204];
      const rule: Rgb = [162, 169, 177];
      const pale: Rgb = [234, 236, 240];
      const serif = 'Georgia, "Times New Roman", serif';
      const hairline = 1 / scale;
      const bar = (
        x: number,
        y: number,
        width: number,
        height: number,
        colour: Rgb,
        alpha = 1,
      ): void => {
        target.fillStyle = rgba(colour, alpha);
        target.beginPath();
        target.roundRect(x, y, width, height, height / 2);
        target.fill();
      };
      const line = (x1: number, y1: number, x2: number, colour: Rgb): void => {
        target.strokeStyle = rgba(colour);
        target.lineWidth = hairline;
        target.beginPath();
        target.moveTo(x1, y1);
        target.lineTo(x2, y1);
        target.stroke();
      };
      // Tinted while its field's data flows, most at its middle.
      const tint = (index: number): number => {
        const f = fieldFlow(data, index, PAGE_FIELDS.length);

        return 4 * f * (1 - f);
      };

      target.save();
      target.globalAlpha = shown;
      target.translate(box.x, box.y + rise);
      target.fillStyle = rgba(page);
      target.strokeStyle = rgba(ring);
      target.lineWidth = 1;
      target.beginPath();
      target.roundRect(0, 0, box.width, box.height, 10);
      target.fill();
      target.stroke();
      target.clip();
      target.scale(scale, scale);
      target.textBaseline = 'middle';

      // The header: the menu, the logo, search, and the account link.
      const { header } = WIKI;
      for (const offset of [-6, 0, 6]) {
        bar(
          header.menu.x,
          header.y + offset - 1.25,
          header.menu.width,
          2.5,
          text,
        );
      }
      const { globe } = header;
      target.fillStyle = rgba([200, 204, 209]);
      target.beginPath();
      target.arc(globe.x, header.y, globe.radius, 0, 2 * Math.PI);
      target.fill();
      target.strokeStyle = rgba(rule);
      target.lineWidth = 1.2;
      for (const across of [0.35, 0.75]) {
        target.beginPath();
        target.ellipse(
          globe.x,
          header.y,
          globe.radius * across,
          globe.radius,
          0,
          0,
          2 * Math.PI,
        );
        target.stroke();
      }
      for (const height of [-0.5, 0, 0.5]) {
        const half = globe.radius * Math.sqrt(1 - height * height);
        target.beginPath();
        target.moveTo(globe.x - half, header.y + height * globe.radius);
        target.lineTo(globe.x + half, header.y + height * globe.radius);
        target.stroke();
      }
      target.fillStyle = rgba(text);
      target.textAlign = 'left';
      // The wordmark in its small capitals, set by hand: a browser that
      // cannot make them would fall back to lower case.
      target.textBaseline = 'alphabetic';
      let wordmarkX = header.wordmark.x;
      for (const [letters, share] of [
        ['W', 1],
        ['IKIPEDI', 0.8],
        ['A', 1],
      ] as const) {
        target.font = `${header.wordmark.size * share}px ${serif}`;
        target.fillText(
          letters,
          wordmarkX,
          header.wordmark.y + header.wordmark.size * 0.36,
        );
        wordmarkX += target.measureText(letters).width + 0.6;
      }
      target.textBaseline = 'middle';
      target.font = `${header.tagline.size}px ${serif}`;
      target.fillText(
        'The Free Encyclopedia',
        header.tagline.x,
        header.tagline.y,
      );
      const { search } = WIKI;
      target.strokeStyle = rgba(rule);
      target.lineWidth = 1.2;
      target.beginPath();
      target.roundRect(search.x, search.y, search.width, search.height, 2);
      target.stroke();
      target.beginPath();
      target.arc(search.x + 18, header.y - 1, 6, 0, 2 * Math.PI);
      target.moveTo(search.x + 22.5, header.y + 3.5);
      target.lineTo(search.x + 27, header.y + 8);
      target.strokeStyle = rgba(text, 0.7);
      target.lineWidth = 2;
      target.stroke();
      bar(search.x + 36, header.y - 4, 112, 8, pale);
      const { account, more } = WIKI;
      bar(
        account.right - account.width,
        account.y - 4,
        account.width,
        8,
        link,
        0.45,
      );
      for (const offset of [-6, 0, 6]) {
        target.fillStyle = rgba(text);
        target.beginPath();
        target.arc(more.x + offset, more.y, 2, 0, 2 * Math.PI);
        target.fill();
      }

      // The contents, down the left.
      const { contents } = WIKI;
      for (const [index, width] of contents.widths.entries()) {
        const y = contents.y + index * contents.gap;
        bar(
          contents.x,
          y - 4,
          width,
          8,
          index < 2 ? text : link,
          index < 2 ? 0.28 : 0.4,
        );
      }

      // The article: its title, its tabs, and its words as skeleton lines,
      // here and there a link.
      const { title, rule: titleRule, tabs, from, body } = WIKI;
      target.fillStyle = rgba(text);
      target.font = `${title.size}px ${serif}`;
      target.fillText(ATOMS.elonMusk.label, title.x, title.y);
      line(title.x, titleRule.y, titleRule.right, rule);
      for (const [x, width, colour] of [
        [title.x, 40, text],
        [title.x + 50, 26, link],
        [titleRule.right - 224, 30, text],
        [titleRule.right - 182, 72, link],
        [titleRule.right - 98, 72, link],
      ] as const) {
        bar(x, tabs.y - 4, width, 8, colour, colour === link ? 0.45 : 0.3);
      }
      line(title.x, tabs.y + 14, titleRule.right, pale);
      bar(title.x, from.y - 4, from.width, 8, text, 0.18);

      // Each line a field's data leaves, tinted as it does.
      for (const [index, { from }] of PAGE_FIELDS.entries()) {
        if ('row' in from) {
          continue;
        }
        target.fillStyle = rgba(ink, 0.06 * tint(index));
        target.beginPath();
        target.roundRect(
          body.x - 8,
          bodyLineY(from.paragraph, from.line) - 6,
          body.width + 16,
          body.bar + 12,
          6,
        );
        target.fill();
      }
      for (const [index, paragraph] of body.paragraphs.entries()) {
        for (let row = 0; row < paragraph.lines; row += 1) {
          const y = paragraph.y + row * body.line;
          const isLast = row === paragraph.lines - 1;
          const width =
            body.width * (isLast ? 0.42 + ((index * 3) % 5) * 0.08 : 1);
          bar(body.x, y, width, body.bar, ring);
          // A link, somewhere on most lines.
          const seed = (index * 7 + row * 13) % 11;
          if (seed > 2 && !isLast) {
            const span = 44 + seed * 6;
            bar(
              body.x + ((seed * 53 + row * 29) % (body.width - span)),
              y,
              span,
              body.bar,
              link,
              0.32,
            );
          }
        }
      }

      // The infobox: his name, a portrait, the two facts, and more rows.
      const { infobox } = WIKI;
      const rows = 2 + infobox.more;
      const infoHeight =
        infobox.titleHeight +
        infobox.image.height +
        48 +
        rows * infobox.row +
        10;
      target.fillStyle = rgba([248, 249, 250]);
      target.strokeStyle = rgba(rule);
      target.lineWidth = hairline;
      target.beginPath();
      target.rect(infobox.x, infobox.y, infobox.width, infoHeight);
      target.fill();
      target.stroke();
      target.fillStyle = rgba(pale);
      target.fillRect(
        infobox.x + 6,
        infobox.y + 6,
        infobox.width - 12,
        infobox.titleHeight - 6,
      );
      target.fillStyle = rgba(text);
      target.textAlign = 'center';
      target.font = `700 ${infobox.size + 3}px ${fontFamily}`;
      target.fillText(
        ATOMS.elonMusk.label,
        infobox.x + infobox.width / 2,
        infobox.y + 3 + infobox.titleHeight / 2,
      );
      const imageTop = infobox.y + infobox.titleHeight + 6;
      target.fillStyle = rgba([200, 204, 209]);
      target.fillRect(
        infobox.x + 6,
        imageTop,
        infobox.width - 12,
        infobox.image.height - 12,
      );
      drawPerson(
        target,
        {
          x: infobox.x + infobox.width / 2,
          y: imageTop + (infobox.image.height - 12) / 2,
        },
        110,
        0.4 * shown,
      );
      target.globalAlpha = shown;
      bar(
        infobox.x + infobox.width / 2 - 56,
        imageTop + infobox.image.height + 2,
        112,
        8,
        link,
        0.4,
      );
      target.font = `400 ${infobox.size}px ${fontFamily}`;
      for (let index = 0; index < rows; index += 1) {
        const y = infoboxRowY(index);
        const fieldIndex = PAGE_FIELDS.findIndex(
          ({ from }) => 'row' in from && from.row === index,
        );
        const field = PAGE_FIELDS[fieldIndex];
        if (field !== undefined) {
          target.fillStyle = rgba(ink, 0.06 * tint(fieldIndex));
          target.fillRect(
            infobox.x + 4,
            y - infobox.row / 2 + 2,
            infobox.width - 8,
            infobox.row - 4,
          );
          target.fillStyle = rgba(text);
          target.textAlign = 'left';
          target.font = `700 ${infobox.size}px ${fontFamily}`;
          target.fillText(field.label, infobox.x + 10, y);
          target.font = `400 ${infobox.size}px ${fontFamily}`;
          target.textAlign = 'right';
          target.fillText(field.value, infobox.x + infobox.width - 10, y);
        } else {
          bar(infobox.x + 10, y - 4, 44 + (index % 3) * 12, 8, text, 0.22);
          bar(
            infobox.x + infobox.width - 10 - (70 + (index % 2) * 30),
            y - 4,
            70 + (index % 2) * 30,
            8,
            link,
            0.4,
          );
        }
      }

      target.restore();
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
          medal?: Medal;
        }
      >();
      if (planeView !== null) {
        for (const atom of planeView.blended.atoms) {
          const medal = medalOf(atom.rank, atom.ranked);
          onPlane.set(atom.id, {
            x: planeView.origin.x + atom.x * planeView.zoom,
            y: planeView.origin.y + atom.y * planeView.zoom,
            presence: atom.presence,
            named: atom.named,
            ...(atom.nameSide === undefined ? {} : { nameSide: atom.nameSide }),
            ...(medal === undefined ? {} : { medal }),
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
      // With another perspective beside it, the cloud moves aside into a
      // square cell of its own, and its copy, splitting off, takes the other;
      // each leaves room above it for the menu of whose perspective it is.
      // Side by side, the two stand right under their menus, the menus at
      // the top of the film, as large as the room under them allows.
      const { other } = state.props.scene;
      const aside = other?.aside ?? 0;
      const cells = cellsOf(width, height);
      const reachShare = EYE_DISTANCE / Math.sqrt(EYE_DISTANCE ** 2 - 1);
      const isSideBySide = cells.first.y === cells.second.y;
      const splitRadius = isSideBySide
        ? Math.min(
            cells.side * WHOLE_SHARE,
            (height - GLOBE_MENU_ROOM - GLOBE_MENU.under) / (2 * reachShare),
          )
        : (cells.side - GLOBE_MENU_ROOM) * WHOLE_SHARE;
      // In the last chapter, the two become one again the size each was
      // beside the other, and the one graph keeps that size.
      const { enrichment } = state.props.scene;
      const oneRadius = enrichment === null ? view.radius : splitRadius;
      const partedRadius = lerp(oneRadius, splitRadius, aside);
      // Side by side, each shrinks from its top, which moves from where the
      // one graph's was to just under its menu, at the film's top throughout.
      const top = lerp(
        height / 2 - oneRadius * reachShare,
        GLOBE_MENU_ROOM,
        aside,
      );
      const centreOf = (cell: ScreenPoint): ScreenPoint => ({
        x: lerp(width / 2, cell.x, aside),
        y: isSideBySide
          ? top + partedRadius * reachShare
          : lerp(height / 2, cell.y + GLOBE_MENU_ROOM / 2, aside),
      });
      const badge = width < NARROW_PX ? BADGE_NARROW : BADGE;
      // Then it moves aside as Elon Musk comes out of it, and shrinks to a
      // sketch above the page; and as the film ends it comes home, to the
      // middle, as large as the scene: from its very top, where the menus
      // and Elon Musk stood, to its foot, where the caption starts, but for
      // room for an atom on its rim to show whole. Furthest out, an atom
      // stands where the eye's line grazes the sphere, nearer than its
      // middle, and so larger.
      const rimScale = EYE_DISTANCE / (EYE_DISTANCE - 1 / EYE_DISTANCE);
      const homeReach =
        (Math.min(width, height) / 2 - RIM_ROOM_PX) /
        (1 + (ATOM_SHARE * rimScale) / 2 / reachShare);
      const enriched =
        enrichment === null ? null : enrichmentLayout(width, height, badge);
      const parted = centreOf(cells.first);
      const home = { ...parted, reach: partedRadius * reachShare };
      const away =
        enriched === null || enrichment === null
          ? null
          : globeAt(enriched, home, enrichment);
      const globe =
        away === null || enrichment === null
          ? null
          : {
              x: lerp(away.x, width / 2, enrichment.home),
              y: lerp(away.y, height / 2, enrichment.home),
              reach: lerp(away.reach, homeReach, enrichment.home),
            };
      const radius = globe === null ? partedRadius : globe.reach / reachShare;
      // The film's turn brings what the camera faces to the front; the
      // reader's comes after it.
      const orientation = multiply(state.turn, turnToFace(view.facing));
      // Looking down on the cloud lowers what it faces, the equator's front:
      // the picture is lifted as much, so the arc stays in the middle. Behind
      // an open plane, it rises above it. All of it in view, it is centred.
      const whole = camera.whole ?? 0;
      const liftOf = (sphereRadius: number): number =>
        (LIFT_PX + sphereRadius * view.facing[1]) * (1 - whole) +
        depth * DEPTH_OF_FIELD.risePx +
        (camera.raise ?? 0) * sphereRadius;
      // A sphere round `centre`, `sphereRadius` across, the cloud or its
      // copy, turned to `facing`; the reader's turn turns both.
      const projectFrom =
        (
          centre: ScreenPoint,
          turned: Quat,
          sphereRadius = radius,
          lift = liftOf(sphereRadius),
        ) =>
        (direction: Vec3): Projected => {
          const [x, y, z] = rotate(turned, direction);
          const scale = EYE_DISTANCE / (EYE_DISTANCE - z);

          return {
            x: centre.x + slide + x * sphereRadius * scale,
            y: centre.y - lift + rise - y * sphereRadius * scale,
            z,
            scale,
          };
        };
      // In the last chapter the graph is not lifted: it holds still as the
      // camera turns back to the film's first frame.
      const project = projectFrom(
        globe ?? parted,
        orientation,
        radius,
        globe === null ? liftOf(radius) : 0,
      );
      const projectOther = projectFrom(centreOf(cells.second), orientation);
      // All of it in view, its outline, round: the copy's too.
      if (whole > 0) {
        for (const projecting of other === null
          ? [project]
          : [project, projectOther]) {
          const middle = projecting([0, 0, 0]);
          context.globalAlpha = whole;
          drawOutline(context, (target) => {
            target.arc(middle.x, middle.y, radius * reachShare, 0, 2 * Math.PI);
          });
        }
        context.globalAlpha = 1;
      }
      /** 0 at the back of the cloud to 1 at the front. */
      const frontness = (z: number): number => (z + 1) / 2;

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
          ...(target.medal === undefined ? {} : { medal: target.medal }),
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
      // In the last chapter, Elon Musk comes out of the cloud the same way,
      // taking his end of his triples' lines with him, to where he stands
      // above the graph; he is drawn there over it. As the film ends, he
      // goes back into it with it, and the cloud draws him again.
      // Where the way on is, if the cloud shows it. It grows as its
      // neighbours quieten.
      const way: { at: WayPlace | null } = { at: null };
      const wayGrow = lerp(
        1,
        WAY_SCALE,
        Math.max(0, ...state.props.scene.quiet.values()),
      );
      // Whether its neighbours' names fit under the line beside its own,
      // grown, where the cloud comes home: if not, theirs sit above them,
      // throughout, so no name ever changes sides.
      const homeRadius = homeReach / reachShare;
      const apartPx =
        Math.sin(WAY_APART) *
        homeRadius *
        (EYE_DISTANCE / (EYE_DISTANCE - Math.cos(WAY_APART)));
      const halfOf = (label: string, scale: number): number => {
        context.font = `500 ${badge.fontSize * scale}px ${fontFamily}`;

        return context.measureText(label).width / 2 + badge.padding * scale;
      };
      const isRisen =
        halfOf(ATOMS[THE_WAY_ON].label, WAY_SCALE) +
          Math.max(
            ...[...WAY_NEIGHBOURS].map((id) => halfOf(ATOMS[id].label, 1)),
          ) +
          BADGE_SPACING_PX >
        apartPx;
      const musk = atoms.find((atom) => atom.id === 'elonMusk');
      const out = (enrichment?.out ?? 0) * (1 - (enrichment?.home ?? 0));
      let muskOut: Lifted | null = null;
      if (enriched !== null && musk !== undefined && out > 0) {
        const from = project(musk.at);
        const inCloud = {
          x: from.x,
          y: from.y,
          size: ATOM_SHARE * radius * from.scale,
          badgeScale: 1,
        };
        muskOut = {
          origin: inCloud,
          named: 1,
          x: lerp(from.x, enriched.atom.x, out),
          y: lerp(from.y, enriched.atom.y, out),
          size: lerp(inCloud.size, enriched.atomSize, out),
          badgeScale: 1,
          amount: out,
          z: from.z,
        };
        lifted.set('elonMusk', muskOut);
      }

      /**
       * A sphere of atoms and the triples between them, as `project` turns
       * and places it, at `opacity`: the cloud, or its copy. `lifted` says
       * which atoms are on their way out to the plane, and `setBack` those in
       * none of its triples, and how far. In the last chapter, `sketch` says
       * whose name comes first, and how much of the cloud's detail shows, 1
       * to 0, as it becomes a sketch of itself: its names, and the atoms in
       * none of its triples. It returns the lines that reach out of it to
       * the plane.
       */
      const drawSphere = (
        sphere: {
          atoms: readonly Scene['atoms'][number][];
          triples: readonly Scene['triples'][number][];
        },
        project: (direction: Vec3) => Projected,
        lifted: ReadonlyMap<AtomId, Lifted>,
        opacity: number,
        setBack: ReadonlyMap<AtomId, number>,
        sketch?: { first: AtomId; detail: number },
        ending?: Ending,
      ): Line[] => {
        const detail = sketch?.detail ?? 1;
        // An atom in none of its triples, its shape and its name, set back;
        // one shown quieter, quieter.
        const showing = (id: AtomId, part: keyof typeof SET_BACK): number =>
          lerp(1, SET_BACK[part], setBack.get(id) ?? 0) *
          lerp(1, QUIET, ending?.quiet.get(id) ?? 0);
        const isSetBack = (id: AtomId): boolean =>
          (setBack.get(id) ?? 0) >= 0.5;
        // Each triple's line, under the atoms, drawn as far as it has got. An
        // atom on its way out of the cloud takes its end of the line with it,
        // and the plane draws that end again, sharp: a reminder of where it
        // came from, so it holds still.
        const reaching: Line[] = [];
        const { atoms, triples } = sphere;
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
              weight: (index: number) =>
                Math.max(1 - index / ARC_STEPS, 0) ** 2,
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
                x:
                  lerp(from.x, to.x, share) +
                  (point.x - chord.x) * (1 - amount),
                y:
                  lerp(from.y, to.y, share) +
                  (point.y - chord.y) * (1 - amount),
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
            (angleBetween(subject, predicate) +
              angleBetween(predicate, object)) *
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
            alpha: nearness * (1 - comeOut) * opacity,
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
                      sum +
                      (out === undefined ? 0 : weight(index) * out.amount),
                    0,
                  ),
                  1,
                ),
              ),
            });
          }
        }

        // The wider graph's atoms, set back, behind the rest, growing in as
        // they come.
        const crowdShown = ending?.crowdShown ?? 0;
        const crowd =
          crowdShown > 0
            ? (ending?.crowd ?? []).map((atom) => ({
                atom,
                at: project(atom.at),
              }))
            : [];
        for (const { atom, at } of crowd) {
          context.globalAlpha =
            opacity *
            SET_BACK.shape *
            crowdShown *
            (0.2 + 0.8 * frontness(at.z));
          drawShape(
            context,
            at.x,
            at.y,
            ATOM_SHARE * radius * at.scale * (0.55 + 0.45 * crowdShown),
            { from: atom.role, to: atom.role, progress: 1 },
          );
        }

        // The atoms, back to front, so nearer ones cover farther ones. Each
        // grows in as it arrives.
        const shown = atoms
          .filter((atom) => atom.presence > 0 && !lifted.has(atom.id))
          .map((atom) => ({ atom, at: project(atom.at) }))
          .sort((a, b) => a.at.z - b.at.z);
        // The way on's shape the scene draws over the haze.
        let wayShape: Omit<WayPlace, 'name'> | null = null;
        let wayName: WayPlace['name'] = null;
        for (const { atom, at } of shown) {
          const alpha =
            opacity *
            showing(atom.id, 'shape') *
            lerp(1, detail, setBack.get(atom.id) ?? 0) *
            atom.presence *
            (0.2 + 0.8 * frontness(at.z));
          const size =
            ATOM_SHARE * radius * at.scale * (0.55 + 0.45 * atom.presence);
          if (ending !== undefined && atom.id === ending.button) {
            wayShape = { x: at.x, y: at.y, size, role: atom.role, alpha };
            continue;
          }
          context.globalAlpha = alpha;
          drawShape(context, at.x, at.y, size, atom.role);
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
        ]
          // The sketch's first, then those its triples join, then those set
          // back.
          .sort(
            (a, b) =>
              Number(b.atom.id === sketch?.first) -
                Number(a.atom.id === sketch?.first) ||
              Number(isSetBack(a.atom.id)) - Number(isSetBack(b.atom.id)) ||
              b.at.z - a.at.z,
          );
        // Where a name `half` wide either side of its middle goes, under an
        // atom at `at` in the cloud's row `row`: its middle and its top, or
        // `null` where it would cover a name already there.
        // `tall` high, and one that sits above its atom, as `isRisen` says.
        const placeName = (
          at: Projected,
          half: number,
          row: number,
          tall: number = badge.height,
          isRisen = false,
        ): { x: number; top: number } | null => {
          const shape = ATOM_SHARE * radius * at.scale * 0.5;
          const { gap } = badge;
          // Inside the film, however the reader turns it: a name that would
          // run off its foot sits above its atom, and one at a side moves in.
          const x = Math.min(
            Math.max(at.x, half + BADGE_SPACING_PX),
            width - half - BADGE_SPACING_PX,
          );
          const under = at.y + shape + gap;
          const top =
            isRisen || under + tall > height - BADGE_SPACING_PX
              ? at.y - shape - gap - tall
              : under;
          const left = x - half;
          const right = x + half;
          const bottom = top + tall;
          // Names in a row of the cloud sit along one line, so only their
          // sides can meet; in another row, a name can sit under them. One
          // risen above its atom is off its row's line.
          const isCovering = placed.some(
            (other) =>
              left < other.right + BADGE_SPACING_PX &&
              right > other.left - BADGE_SPACING_PX &&
              ((!isRisen && Math.abs(row - other.row) < ROW_APART) ||
                (top < other.bottom + BADGE_SPACING_PX &&
                  bottom > other.top - BADGE_SPACING_PX)),
          );
          if (isCovering) {
            return null;
          }
          placed.push({ left, right, top, bottom, row });

          return { x, top };
        };
        const namedHere = new Set<AtomId>();
        for (const { atom, at, isLeaving } of naming) {
          if (at.z < 0.1) {
            continue;
          }
          // The way on's name, a button, as large as it has grown; and its
          // neighbours', above them where the ending says.
          const isButton = atom.id === ending?.button;
          const grow = isButton ? ending.grow : 1;
          context.font = `500 ${badge.fontSize * grow}px ${fontFamily}`;
          const textWidth = context.measureText(atom.label).width;
          context.font = `500 ${badge.fontSize}px ${fontFamily}`;
          const name = placeName(
            at,
            textWidth / 2 + badge.padding * grow,
            atom.at[1],
            badge.height * grow,
            ending?.risen.has(atom.id) ?? false,
          );
          if (name === null) {
            continue;
          }
          if (isLeaving) {
            namedHere.add(atom.id);
            continue;
          }
          if (detail <= 0) {
            continue;
          }
          const alpha =
            opacity *
            detail *
            showing(atom.id, 'name') *
            atom.presence ** 2 *
            (0.35 + 0.65 * frontness(at.z));
          // The way on's name is the page's link, placed here.
          if (isButton) {
            wayName = { x: name.x, top: name.top, alpha };
            continue;
          }
          context.globalAlpha = alpha;
          drawBadge(context, atom.label, name.x, name.top, badge);
        }
        // The wider graph's names, last, where no other name is: blank, set
        // back, as a name no triple joins is.
        for (const { atom, at } of crowd.toSorted((a, b) => b.at.z - a.at.z)) {
          if (at.z < 0.1) {
            continue;
          }
          const name = placeName(at, atom.name / 2, atom.at[1]);
          if (name === null) {
            continue;
          }
          context.globalAlpha =
            opacity *
            SET_BACK.name *
            crowdShown ** 2 *
            (0.35 + 0.65 * frontness(at.z));
          context.fillStyle = rgba(ink);
          context.beginPath();
          context.roundRect(
            name.x - atom.name / 2,
            name.top,
            atom.name,
            badge.height,
            badge.height / 2,
          );
          context.fill();
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
              out.medal,
            );
            if (isNamed && out.named === 0) {
              drawName(context, atom.label, out.origin);
            }
          }
        }
        context.globalAlpha = 1;
        if (wayShape !== null) {
          ending?.placeButton({ ...wayShape, name: wayName });
        }

        return reaching;
      };
      const reaching = drawSphere(
        {
          atoms:
            muskOut === null
              ? atoms
              : atoms.filter((atom) => atom.id !== 'elonMusk'),
          triples,
        },
        project,
        lifted,
        1,
        state.props.scene.setBack,
        // A sketch, without its detail, while it is small; whole again
        // once it is home.
        enrichment === null
          ? undefined
          : {
              first: 'elonMusk',
              detail: 1 - enrichment.small * (1 - enrichment.home),
            },
        enrichment === null
          ? undefined
          : {
              crowd: CROWD,
              crowdShown: state.props.scene.crowd,
              quiet: state.props.scene.quiet,
              risen: isRisen ? WAY_NEIGHBOURS : NONE_RISEN,
              button: THE_WAY_ON,
              grow: wayGrow,
              placeButton: (place) => {
                way.at = place;
              },
            },
      );
      placeWay(way.at?.name ?? null, wayGrow, badge);
      placeHaze(way.at, homeReach, (wayGrow - 1) / (WAY_SCALE - 1));
      // The copy over the cloud as it splits off, the two one at first.
      if (other !== null) {
        drawSphere(
          other,
          projectOther,
          new Map(),
          Math.min(aside * 4, 1),
          other.setBack,
        );
      }

      // All of it in view, nothing runs past an edge to fade.
      fadeEdges(context, width, height, 1 - whole);
      // Above each globe, whose perspective it is, closed, coming as the two
      // split: over the fade, as the page's, not the picture's.
      if (other !== null) {
        const { padding, chevrons, height: tall } = PLANE.picker;
        context.font = `500 ${PLANE.badge.fontSize}px ${fontFamily}`;
        const across =
          Math.max(
            ...other.viewers.map((viewer) => context.measureText(viewer).width),
          ) +
          padding * 3 +
          chevrons;
        const reach = radius * reachShare;
        for (const [chosen, projecting] of [project, projectOther].entries()) {
          const middle = projecting([0, 0, 0]);
          drawMenu(context, {
            x: middle.x - across / 2,
            y: isSideBySide ? 0 : middle.y - reach - GLOBE_MENU.gap - tall,
            width: across,
            options: other.viewers,
            chosen,
            presence: aside,
            open: 0,
            highlight: chosen,
          });
        }
      }
      drawPlane(planeView, reaching, lifted);
      // The way on's shape, over the haze.
      if (way.at !== null && plane !== null && plane !== undefined) {
        plane.globalAlpha = way.at.alpha;
        drawShape(plane, way.at.x, way.at.y, way.at.size, way.at.role);
        plane.globalAlpha = 1;
      }
      if (
        enriched !== null &&
        musk !== undefined &&
        muskOut !== null &&
        plane !== null &&
        plane !== undefined
      ) {
        // Where the data of each of his triples leaves the graph.
        const at = muskOut;
        const graphSources = GRAPH_FIELDS.map(({ atom }) => {
          const source = atoms.find((drawn) => drawn.id === atom);

          return source === undefined ? at : project(source.at);
        });
        // As strong as the cloud has him while he is in it, set back as the
        // film ends, and whole once out.
        const front = frontness(at.z);
        const setBackHim = state.props.scene.setBack.get('elonMusk') ?? 0;
        drawEnrichment(
          plane,
          enriched,
          {
            at,
            role: musk.role,
            shape: lerp(
              (0.2 + 0.8 * front) * lerp(1, SET_BACK.shape, setBackHim),
              1,
              out,
            ),
            name: lerp(
              (0.35 + 0.65 * front) * lerp(1, SET_BACK.name, setBackHim),
              1,
              out,
            ),
          },
          badge,
          graphSources,
        );
      }
    }

    /**
     * Shows the page's link for the way on over `at`, where the cloud would
     * draw its name, its middle and its top, as strong, a name's `badge`
     * grown `grow` times; or hides it, where the cloud shows no name for
     * it. Once the atoms round it have quietened, it pulses, in the
     * predicate's green. It is laid out once, full grown, and scaled from
     * its top's middle as it grows: text laid out again at each size
     * shimmers as it snaps to the pixels, where scaled it grows smoothly,
     * and rests crisp.
     */
    function placeWay(at: WayPlace['name'], grow: number, badge: Badge): void {
      const way = wayRef.current;
      if (way === null) {
        return;
      }
      const quiet = [...state.props.scene.quiet.values()];
      way.dataset.shown = String(at !== null && at.alpha > 0.01);
      way.dataset.pulsing = String(
        quiet.length > 0 && quiet.every((amount) => amount >= 1),
      );
      way.style.setProperty('--way-height', `${badge.height * WAY_SCALE}px`);
      way.style.setProperty('--way-padding', `${badge.padding * WAY_SCALE}px`);
      way.style.setProperty('--way-font', `${badge.fontSize * WAY_SCALE}px`);
      way.style.setProperty('--way-scale', String(grow / WAY_SCALE));
      way.style.setProperty('--way-pulse', rgba(ROLE_COLOURS.predicate));
      if (at !== null) {
        way.style.left = `${at.x}px`;
        way.style.top = `${at.top}px`;
        way.style.opacity = String(at.alpha);
      }
    }

    /**
     * The haze over the cloud behind the way on at `at`, as it grows: clear
     * round it, rising to the page's white at 40% and a 2px blur at `reach`
     * from it and beyond, so the way on stands forward and the cloud stays
     * there; as strong as `amount`.
     */
    function placeHaze(
      at: ScreenPoint | null,
      reach: number,
      amount: number,
    ): void {
      const haze = hazeRef.current;
      if (haze === null) {
        return;
      }
      if (at === null || amount <= 0) {
        haze.style.opacity = '0';
        return;
      }
      const mask = `radial-gradient(circle at ${at.x}px ${at.y}px, transparent 0, black ${reach}px)`;
      haze.style.opacity = String(amount);
      haze.style.maskImage = mask;
      haze.style.setProperty('-webkit-mask-image', mask);
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
    // Taller than wide on a phone; from tablet width up it fills the card
    // the film's page gives it.
    <div className="relative aspect-[4/5] w-full md:aspect-auto md:min-h-0 md:flex-1">
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={props.label}
        className="absolute inset-0 size-full cursor-grab touch-none rounded-lg"
      />
      {/*
       * The haze over the cloud behind the way on, as the film ends: the
       * page's white and a blur, clear round the way on, placed as the
       * scene draws.
       */}
      <div
        ref={hazeRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-lg bg-bg/40 opacity-0 backdrop-blur-[2px]"
      />
      {/* The plane, sharp in front of the cloud: drawn, never touched. */}
      <canvas
        ref={planeRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 size-full"
      />
      {/* The way on, over its predicate's name, placed as the scene draws. */}
      {props.way !== undefined && (
        <div
          ref={wayRef}
          data-shown="false"
          className="invisible absolute top-0 left-0 -translate-x-1/2 data-[shown=true]:visible"
        >
          {props.way}
        </div>
      )}
    </div>
  );
}

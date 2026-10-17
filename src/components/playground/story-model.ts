/**
 * The playground's story: a short film in chapters, told one beat at a
 * time, each with a caption. Pure, so it is tested without a canvas.
 *
 * The whole film is a function of one number, the time. The atoms stand on
 * a sphere, the cloud, which turns to show each beat. Each beat leaves the
 * scene in a state of its own: where each atom stands, the role it plays,
 * which triples are drawn and which way the cloud faces. The scene at any
 * moment is the previous beat's state moving toward the current one's. So
 * playing, pausing, scrubbing back and stepping forward are one operation,
 * and the picture cannot drift away from the caption.
 */

import type { ROLE_COLOURS } from '@/components/onboarding/field-scene';
import {
  arcPoint,
  axisAngle,
  FRONT,
  multiply,
  type Quat,
  type Vec3,
} from '@/lib/sphere';

import {
  HANGING_RISE,
  type PlaneBranch,
  type PlaneClaim,
  type PlaneList,
  type PlaneTerm,
  type PlaneVaults,
  planeSentence,
} from './story-plane';

/**
 * The shape an atom is drawn as, and its colour: the role it plays in its
 * triples. Circle, triangle, square, as in the field behind the page: the
 * subject, the predicate, the object. An atom on its own is drawn as a
 * circle. One that is the object of a triple and the subject of another is
 * drawn as both at once: a hexagon, between the circle and the square, in a
 * colour between theirs. The same four as the field behind the page.
 */
export type Role = keyof typeof ROLE_COLOURS;

/**
 * The camera: the direction of the cloud that faces the viewer, and how
 * close it is. At zoom 1 a triple spans a wide screen, and more is closer.
 * `focus` is where it turns when the screen is too narrow to show all it is
 * asked to: the part of the scene the beat is about.
 */
export interface Camera {
  readonly facing: Vec3;
  readonly zoom: number;
  readonly focus?: Vec3;
  /**
   * How far, 0 to 1, the camera has pulled back to show the whole cloud,
   * on any screen, whether its names can stay apart or not.
   */
  readonly whole?: number;
  /** How far up the picture is moved, as a share of the cloud's radius. */
  readonly raise?: number;
}

/** The atoms the story uses. */
export const ATOMS = {
  elonMusk: { label: 'Elon Musk' },
  spacex: { label: 'SpaceX' },
  founderOf: { label: 'founder of' },
  owns: { label: 'owns' },
  xai: { label: 'xAI' },
  best: { label: 'best' },
  aiCompany: { label: 'AI company' },
  believes: { label: 'believes' },
  willBeWorth: { label: 'will be worth' },
  ordersOfMagnitude: { label: 'orders of magnitude' },
  moreThan: { label: 'more than' },
  currentEarthEconomy: { label: 'current Earth economy' },
  estimatedAt: { label: 'estimated at' },
  hundredTrillion: { label: '$100+ trillion' },
  sourcedBy: { label: 'sourced by' },
  tweet: { label: 'Tweet' },
  openai: { label: 'OpenAI' },
  anthropic: { label: 'Anthropic' },
} as const satisfies Record<string, { label: string }>;

export type AtomId = keyof typeof ATOMS;

/**
 * A triple's atoms. Where a whole triple is the subject or the object, the
 * line meets it at its predicate, and the triple is named.
 */
interface TripleAtoms {
  subject: AtomId;
  predicate: AtomId;
  object: AtomId;
  subjectTriple?: string;
  objectTriple?: string;
}

/** The triples the story draws. */
export const TRIPLES = {
  elonFoundedSpacex: {
    subject: 'elonMusk',
    predicate: 'founderOf',
    object: 'spacex',
  },
  spacexOwnsXai: {
    subject: 'spacex',
    predicate: 'owns',
    object: 'xai',
  },
  xaiBestAiCompany: {
    subject: 'xai',
    predicate: 'best',
    object: 'aiCompany',
  },
  openaiBestAiCompany: {
    subject: 'openai',
    predicate: 'best',
    object: 'aiCompany',
  },
  anthropicBestAiCompany: {
    subject: 'anthropic',
    predicate: 'best',
    object: 'aiCompany',
  },
  // The nested triples, as the cloud holds them in the end.
  moreThanEconomy: {
    subject: 'ordersOfMagnitude',
    predicate: 'moreThan',
    object: 'currentEarthEconomy',
  },
  spacexWorth: {
    subject: 'spacex',
    predicate: 'willBeWorth',
    object: 'moreThan',
    objectTriple: 'orders of magnitude more than current Earth economy',
  },
  elonBelieves: {
    subject: 'elonMusk',
    predicate: 'believes',
    object: 'willBeWorth',
    objectTriple:
      'SpaceX will be worth orders of magnitude more than current Earth economy',
  },
  economyEstimated: {
    subject: 'currentEarthEconomy',
    predicate: 'estimatedAt',
    object: 'hundredTrillion',
  },
  beliefSourced: {
    subject: 'believes',
    predicate: 'sourcedBy',
    object: 'tweet',
    subjectTriple: 'what Elon Musk believes',
  },
} as const satisfies Record<string, TripleAtoms>;

export type TripleId = keyof typeof TRIPLES;

export const CHAPTERS = [
  { id: 'atoms', title: 'Atoms' },
  { id: 'triples', title: 'Triples' },
  { id: 'nested', title: 'Nested triples' },
  { id: 'vaults', title: 'Vaults' },
  { id: 'lists', title: 'Lists' },
  { id: 'perspectives', title: 'Perspectives' },
] as const;

export type ChapterId = (typeof CHAPTERS)[number]['id'];

/**
 * Part of a caption: plain words, where `\n` starts a new line, a role
 * named beside its shape, or a link.
 */
export type CaptionPart =
  | string
  | { role: Role; text: string }
  /** Words that open a page elsewhere, in a new tab. */
  | { href: string; text: string };

/**
 * When, within a beat's motion, a change happens: the share of the motion it
 * starts at and the share it is done by, each from 0 to 1. Staggering them
 * is what makes a beat read as one thing after another.
 */
type During = readonly [start: number, end: number];

interface AtomState {
  /** A direction from the cloud's centre. */
  at: Vec3;
  role: Role;
  /** When it moves, or arrives. */
  during?: During;
  /**
   * When it takes its role, when that is not when it moves. An atom that
   * arrives with this arrives as a plain atom, and takes its role later in
   * the same beat: as a line reaches it, say.
   */
  roleDuring?: During;
}

/** The scene as a beat leaves it. */
/** A claim opened on the plane, and the part of it to keep in view. */
export interface PlaneState extends PlaneClaim {
  /**
   * The chip or frame a narrow screen follows: the part the beat is about,
   * as a narrow screen follows the newest triple in the cloud. Or two, to
   * follow the middle between them.
   */
  focus: string | readonly [string, string];
  /** Whether every screen, not only a narrow one, centres the focus. */
  isFocusCentred?: boolean;
}

interface StageState {
  camera: Camera & { during?: During };
  atoms: Partial<Record<AtomId, AtomState>>;
  triples: Partial<Record<TripleId, { during?: During }>>;
  /** The plane opened in front of the cloud, or none. */
  plane?: PlaneState & { during?: During };
  /** How far the cloud behind the plane is out of focus, 0 to 1. */
  depth?: number;
  /**
   * Whether the cloud's dots hold still: behind a plane with a claim of its
   * own, the cloud's lines are a reminder.
   */
  isCloudStill?: boolean;
  /**
   * How much of the cloud shows, 0 to 1, and when that changes: all of it,
   * unless a beat takes it away.
   */
  cloud?: { shown: number; during?: During };
  /** A second perspective of the cloud: its atoms flat, on a map. */
  flat?: FlatState;
}

/** The flat perspective, as a beat leaves it. */
interface FlatState {
  /** The triples it does not trust, and leaves out. */
  distrusted?: readonly TripleId[];
  /** When those it trusts no longer draw back. */
  during?: During;
}

interface BeatSpec {
  id: string;
  chapter: ChapterId;
  caption: readonly CaptionPart[];
  /** What the scene shows, in words, where the beat says it better than its parts. */
  alt?: string;
  /** How long the beat's motion takes. It then holds, for the caption. */
  motionMs: number;
  stage: StageState;
}

/** Radians round the cloud between neighbouring atoms of a triple. */
const SPACING = 0.4;

/**
 * The direction `steps` spacings round the cloud's equator from the front,
 * to the right when positive: where a story told left to right stands.
 */
function onEquator(steps: number): Vec3 {
  const angle = steps * SPACING;

  return [Math.sin(angle), 0, Math.cos(angle)];
}

/**
 * The direction `steps` spacings round the cloud from the front, and
 * `latitude` radians up from the equator, or down when negative.
 */
function onSphere(steps: number, latitude: number): Vec3 {
  const angle = steps * SPACING;

  return [
    Math.sin(angle) * Math.cos(latitude),
    Math.sin(latitude),
    Math.cos(angle) * Math.cos(latitude),
  ];
}

/**
 * A camera `steps` spacings round the equator, raised `tilt` radians above
 * it, looking down on the cloud: from there the equator curves away round
 * the sphere, where head on it is a straight line.
 */
function lookingDown(steps: number, tilt: number): Vec3 {
  const angle = steps * SPACING;

  return [
    Math.sin(angle) * Math.cos(tilt),
    Math.sin(tilt),
    Math.cos(angle) * Math.cos(tilt),
  ];
}

/** How far above the equator the camera rises once the chain shows the cloud's shape. */
const TILT = 0.26;

/** The cloud as the chapter of triples leaves it: every atom and triple in place. */
const WHOLE_GRAPH: Pick<StageState, 'atoms' | 'triples'> = {
  atoms: {
    elonMusk: { at: onEquator(-1), role: 'identity' },
    founderOf: { at: FRONT, role: 'predicate' },
    spacex: { at: onEquator(1), role: 'subjectAndObject' },
    owns: { at: onEquator(2), role: 'predicate' },
    xai: { at: onEquator(3), role: 'subjectAndObject' },
    best: { at: onEquator(4), role: 'predicate' },
    aiCompany: { at: onEquator(5), role: 'object' },
  },
  triples: { elonFoundedSpacex: {}, spacexOwnsXai: {}, xaiBestAiCompany: {} },
};

/**
 * The cloud as the chapter of lists leaves it: the whole graph, and two
 * more AI companies below xAI, each the best, as it is.
 */
const LISTED_GRAPH: Pick<StageState, 'atoms' | 'triples'> = {
  atoms: {
    ...WHOLE_GRAPH.atoms,
    anthropic: { at: onSphere(3.3, -0.3), role: 'identity' },
    openai: { at: onSphere(4.7, -0.3), role: 'identity' },
  },
  triples: {
    ...WHOLE_GRAPH.triples,
    anthropicBestAiCompany: {},
    openaiBestAiCompany: {},
  },
};

/**
 * Every atom and triple of the story on the cloud: the graph so far, and
 * the nested triples from the plane, each atom where its neighbours are.
 */
const STORY_GRAPH: Pick<StageState, 'atoms' | 'triples'> = {
  atoms: {
    ...LISTED_GRAPH.atoms,
    believes: { at: onSphere(-0.17, 0.5), role: 'predicate' },
    willBeWorth: { at: onSphere(1.5, 0.48), role: 'predicate' },
    ordersOfMagnitude: { at: onSphere(0.55, 1), role: 'identity' },
    moreThan: { at: onSphere(2.1, 1.02), role: 'predicate' },
    currentEarthEconomy: { at: onSphere(3.64, 0.9), role: 'subjectAndObject' },
    estimatedAt: { at: onSphere(4.6, 0.55), role: 'predicate' },
    hundredTrillion: { at: onSphere(5.3, 0.3), role: 'object' },
    sourcedBy: { at: onSphere(-1.6, 0.6), role: 'predicate' },
    tweet: { at: onSphere(-1.83, 0.22), role: 'object' },
  },
  triples: {
    ...LISTED_GRAPH.triples,
    moreThanEconomy: {},
    spacexWorth: {},
    elonBelieves: {},
    economyEstimated: {},
    beliefSourced: {},
  },
};

/** The atoms the plane held, which arrive on the cloud as the story becomes one graph. */
const FROM_THE_PLANE: readonly AtomId[] = [
  'believes',
  'willBeWorth',
  'ordersOfMagnitude',
  'moreThan',
  'currentEarthEconomy',
  'estimatedAt',
  'hundredTrillion',
  'sourcedBy',
  'tweet',
];

/** The whole cloud in view, as the story ends: facing its middle, from a little above. */
const WHOLE_VIEW: Camera = {
  facing: lookingDown(1.55, 0.3),
  zoom: 0.35,
  whole: 1,
};

/**
 * The cloud behind the plane: the whole graph, unchanged, pushed back and
 * out of focus. The camera faces founder of, so it stands behind the plane
 * between Elon Musk and SpaceX, and looks down on the cloud, so the chain
 * on from SpaceX curves away round it.
 */
const UP_CLOSE: StageState = {
  ...WHOLE_GRAPH,
  camera: { facing: lookingDown(0, TILT), zoom: 0.45, during: [0, 0.7] },
  depth: 1,
  isCloudStill: true,
};

/**
 * Elon Musk believes (SpaceX will be worth (orders of magnitude more than
 * current Earth economy)): his post of 8 October 2026, as a claim.
 */
const BELIEF: PlaneTerm = {
  triple: {
    id: 'belief',
    subject: { atom: 'elonMusk' },
    predicate: 'believes',
    object: {
      triple: {
        id: 'worth',
        subject: { atom: 'spacex' },
        predicate: 'willBeWorth',
        object: {
          triple: {
            id: 'more',
            subject: { atom: 'ordersOfMagnitude' },
            predicate: 'moreThan',
            object: { atom: 'currentEarthEconomy' },
          },
        },
      },
    },
  },
};

/** A claim of its own about the current Earth economy: what it is worth. */
const ESTIMATE: PlaneBranch = {
  id: 'estimate',
  subject: { atom: 'currentEarthEconomy' },
  predicate: 'estimatedAt',
  object: 'hundredTrillion',
};

/** A claim about the whole belief: where it comes from, his post. */
const SOURCE: PlaneBranch = {
  id: 'source',
  subject: { frame: 'belief' },
  predicate: 'sourcedBy',
  object: 'tweet',
};

/**
 * The whole belief's two vaults, and six people with a position in them:
 * three against it, on the left, and three for it, on the right.
 */
const POSITIONS: PlaneVaults = {
  frame: 'belief',
  against: [400, 200, 20],
  for: [200, 150, 80],
};

/**
 * The best AI company, by everyone who says so: a list of three triples,
 * each with its own weight.
 */
const BEST_AI_COMPANY: PlaneList = {
  id: 'bestAiCompany',
  members: [
    { atom: 'xai', weight: 780 },
    { atom: 'anthropic', weight: 910 },
    { atom: 'openai', weight: 640 },
  ],
  predicate: 'best',
  object: 'aiCompany',
  isWeighed: true,
};

/**
 * The cloud behind the list: as the chapter leaves it, pushed back and out
 * of focus, the camera facing best, behind the list, and a little below
 * the equator, so the chain on to SpaceX stands to the list's left, level
 * with its middle.
 */
const LISTED_CLOSE: StageState = {
  ...LISTED_GRAPH,
  camera: { facing: lookingDown(5, -0.35), zoom: 0.45, during: [0, 0.7] },
  depth: 1,
};

/** The claim in the place of the object, atom by atom, as it reads. */
const BELIEVED_CLAIM: readonly AtomId[] = [
  'spacex',
  'willBeWorth',
  'ordersOfMagnitude',
  'moreThan',
  'currentEarthEconomy',
];

const BEAT_SPECS: readonly BeatSpec[] = [
  {
    id: 'atom',
    chapter: 'atoms',
    caption: [
      'Everything in Intuition starts with an atom, the smallest unit of knowledge.\nAn atom can be anything: this one is a person.',
    ],
    motionMs: 1400,
    stage: {
      camera: { facing: FRONT, zoom: 1.5 },
      atoms: { elonMusk: { at: FRONT, role: 'identity', during: [0.2, 1] } },
      triples: {},
    },
  },
  {
    id: 'second-atom',
    chapter: 'atoms',
    caption: ['SpaceX is an atom too.\nThis one is an organization.'],
    motionMs: 1600,
    stage: {
      camera: { facing: FRONT, zoom: 1.2 },
      atoms: {
        elonMusk: {
          at: onEquator(-0.5),
          role: 'identity',
          during: [0, 0.65],
        },
        spacex: {
          at: onEquator(0.5),
          role: 'identity',
          during: [0.4, 1],
        },
      },
      triples: {},
    },
  },
  {
    id: 'third-atom',
    chapter: 'atoms',
    caption: [
      'Even “founder of” is an atom.\nOne that relates two others is called a predicate.',
    ],
    motionMs: 1800,
    stage: {
      camera: { facing: FRONT, zoom: 1 },
      atoms: {
        elonMusk: {
          at: onEquator(-1),
          role: 'identity',
          during: [0, 0.6],
        },
        spacex: {
          at: onEquator(1),
          role: 'identity',
          during: [0, 0.6],
        },
        founderOf: { at: FRONT, role: 'identity', during: [0.45, 1] },
      },
      triples: {},
    },
  },
  {
    id: 'triple',
    chapter: 'triples',
    caption: [
      'Connected, three atoms form a triple: a ',
      { role: 'identity', text: 'subject' },
      ', a ',
      { role: 'predicate', text: 'predicate' },
      ' and an ',
      { role: 'object', text: 'object' },
      '.\nTogether they read: Elon Musk is the founder of SpaceX.',
    ],
    // The line is drawn from the subject to the object, and each atom takes
    // its role's shape as the line reaches it.
    motionMs: 2600,
    stage: {
      camera: { facing: FRONT, zoom: 1 },
      atoms: {
        elonMusk: { at: onEquator(-1), role: 'identity' },
        founderOf: { at: FRONT, role: 'predicate', during: [0.3, 0.6] },
        spacex: {
          at: onEquator(1),
          role: 'object',
          during: [0.62, 0.95],
        },
      },
      triples: { elonFoundedSpacex: { during: [0, 0.7] } },
    },
  },
  {
    id: 'object-as-subject',
    chapter: 'triples',
    caption: [
      'An object can also be a subject.\nSpaceX is the ',
      { role: 'object', text: 'object' },
      ' of one triple and the ',
      { role: 'identity', text: 'subject' },
      ' of the next, so it is drawn as both: a ',
      { role: 'subjectAndObject', text: 'hexagon' },
      '.',
    ],
    // The cloud turns and pulls back as owns and xAI arrive. Then the line
    // leaves SpaceX, which becomes a hexagon as it does, and each new atom
    // takes its role as the line reaches it. On a narrow screen the cloud
    // turns to the new triple, and the first one curves away round it.
    motionMs: 3800,
    stage: {
      camera: {
        facing: onEquator(1),
        zoom: 0.68,
        focus: onEquator(2),
        during: [0, 0.4],
      },
      atoms: {
        elonMusk: { at: onEquator(-1), role: 'identity' },
        founderOf: { at: FRONT, role: 'predicate' },
        spacex: {
          at: onEquator(1),
          role: 'subjectAndObject',
          during: [0.45, 0.62],
        },
        owns: {
          at: onEquator(2),
          role: 'predicate',
          during: [0.15, 0.4],
          roleDuring: [0.64, 0.8],
        },
        xai: {
          at: onEquator(3),
          role: 'object',
          during: [0.25, 0.5],
          roleDuring: [0.86, 1],
        },
      },
      triples: {
        elonFoundedSpacex: {},
        spacexOwnsXai: { during: [0.45, 0.95] },
      },
    },
  },
  {
    id: 'graph',
    chapter: 'triples',
    caption: [
      'xAI now plays both roles too, so it becomes a ',
      { role: 'subjectAndObject', text: 'hexagon' },
      '.\nLinked like this, triples form a graph: one web of knowledge that grows with every triple.',
    ],
    // As best and AI company arrive, the camera pulls back and rises a
    // little, and the chain is seen curving away round the cloud: the
    // shape everything after this is told on. Then the line leaves xAI,
    // which becomes a hexagon as it does.
    motionMs: 4200,
    stage: {
      camera: {
        facing: lookingDown(3, TILT),
        zoom: 0.6,
        focus: lookingDown(4, TILT),
        during: [0, 0.5],
      },
      atoms: {
        elonMusk: { at: onEquator(-1), role: 'identity' },
        founderOf: { at: FRONT, role: 'predicate' },
        spacex: { at: onEquator(1), role: 'subjectAndObject' },
        owns: { at: onEquator(2), role: 'predicate' },
        xai: {
          at: onEquator(3),
          role: 'subjectAndObject',
          during: [0.48, 0.64],
        },
        best: {
          at: onEquator(4),
          role: 'predicate',
          during: [0.18, 0.42],
          roleDuring: [0.66, 0.8],
        },
        aiCompany: {
          at: onEquator(5),
          role: 'object',
          during: [0.28, 0.52],
          roleDuring: [0.86, 1],
        },
      },
      triples: {
        elonFoundedSpacex: {},
        spacexOwnsXai: {},
        xaiBestAiCompany: { during: [0.48, 0.95] },
      },
    },
  },
  {
    id: 'look-closer',
    chapter: 'nested',
    caption: [
      'Triples can also be about other triples.\nLook closer at what Elon Musk believes: not one thing, but a whole triple, in the place of the ',
      { role: 'object', text: 'object' },
      '.',
    ],
    // The cloud falls back and out of focus, and Elon Musk comes out of it,
    // toward the viewer, onto a plane in front of it, sharp. Once he
    // settles, believes stands beside him, and what he believes, still
    // words, in a frame: the object. Then the lines join them.
    motionMs: 4000,
    stage: {
      ...UP_CLOSE,
      plane: {
        term: BELIEF,
        focus: 'believes',
        spelled: BELIEVED_CLAIM,
        folded: ['worth'],
        during: [0.1, 1],
      },
    },
  },
  {
    id: 'divide',
    chapter: 'nested',
    caption: [
      'That triple breaks into its parts, and holds one of its own: a triple can stand in the place of any ',
      { role: 'object', text: 'object' },
      '.',
    ],
    // The words in the frame break apart, then a frame inside it shows the
    // claim it holds: orders of magnitude and the rest.
    motionMs: 3600,
    stage: {
      ...UP_CLOSE,
      plane: { term: BELIEF, focus: 'more', spelled: BELIEVED_CLAIM },
    },
  },
  {
    id: 'nested',
    chapter: 'nested',
    caption: [
      'Each part becomes an atom. Triples nest without limit, so a whole thought becomes one triple:\nElon Musk believes SpaceX will be worth orders of magnitude more than the current Earth economy.',
    ],
    // The words move down to where the names go, the atoms arrive in their
    // shapes, SpaceX out of the cloud, and then the lines grow.
    motionMs: 4400,
    stage: {
      ...UP_CLOSE,
      plane: { term: BELIEF, focus: 'worth' },
    },
  },
  {
    id: 'estimated',
    chapter: 'nested',
    caption: [
      'Any atom can start a triple of its own: the current Earth economy is estimated at $100+ trillion.\nNow the ',
      { role: 'object', text: 'object' },
      ' of one triple and the ',
      { role: 'identity', text: 'subject' },
      ' of another, it becomes a ',
      { role: 'subjectAndObject', text: 'hexagon' },
      '.',
    ],
    // The whole claim moves down to make room, and across, to centre the
    // current Earth economy; then estimated at and $100+ trillion arrive in
    // a column above it; the lines grow up to them; and it takes both
    // roles.
    motionMs: 4200,
    stage: {
      ...UP_CLOSE,
      plane: {
        term: BELIEF,
        focus: 'currentEarthEconomy',
        isFocusCentred: true,
        branches: [ESTIMATE],
      },
    },
  },
  {
    id: 'sourced',
    chapter: 'nested',
    caption: [
      'A whole triple can be the subject of another, too.\nWhat Elon Musk believes is sourced by a ',
      {
        href: 'https://x.com/elonmusk/status/2108315261044445330',
        text: 'Tweet',
      },
      ', posted on 8 October 2026.',
    ],
    // The whole claim comes back to the middle, a frame forms round all of
    // it, tinted the subject it now is, and from the middle of its top
    // sourced by and Tweet rise, as the last claim did.
    motionMs: 4400,
    stage: {
      ...UP_CLOSE,
      plane: {
        term: BELIEF,
        focus: 'belief',
        frame: 'identity',
        branches: [ESTIMATE, SOURCE],
      },
    },
  },
  {
    id: 'vaults',
    chapter: 'vaults',
    caption: ['Every triple has two vaults, one against it and one for it.'],
    // At once, what rose from the whole triple draws back and goes, the
    // current Earth economy, an object and nothing else again, is a square
    // again, the cloud behind goes, and the triple rises to the top. Then
    // six people arrive below it, and grey lines grow down from its frame,
    // split in two, one side for each vault, and split again to reach them.
    motionMs: 4400,
    stage: {
      ...UP_CLOSE,
      cloud: { shown: 0, during: HANGING_RISE },
      plane: {
        term: BELIEF,
        focus: 'belief',
        frame: 'identity',
        vaults: POSITIONS,
      },
    },
  },
  {
    id: 'positions',
    chapter: 'vaults',
    caption: [
      'Anyone can take a position by depositing into either, and the positions give the triple its weight.\nA triple is a claim, not a fact: its weight shows how many stand behind it, and how much.',
    ],
    // Each person's position shows on their line; then each side takes its
    // vault's colour: red against, green for.
    motionMs: 3200,
    stage: {
      ...UP_CLOSE,
      cloud: { shown: 0 },
      plane: {
        term: BELIEF,
        focus: 'belief',
        frame: 'identity',
        vaults: { ...POSITIONS, isWeighed: true, isSided: true },
      },
    },
  },
  {
    id: 'list-back',
    chapter: 'lists',
    caption: ['Back in the graph, one triple says xAI is the best AI company.'],
    // The plane closes: the triple, its vaults and the people go, and
    // Elon Musk and SpaceX go back to their places in the cloud, as the
    // cloud comes back. Then it comes into focus as the camera turns to xAI
    // best AI company, where the chapter of triples left it.
    motionMs: 4400,
    stage: {
      ...WHOLE_GRAPH,
      camera: {
        facing: lookingDown(3, TILT),
        zoom: 0.6,
        focus: lookingDown(4, TILT),
        during: [0.4, 1],
      },
      cloud: { shown: 1, during: [0, 0.45] },
    },
  },
  {
    id: 'list-grows',
    chapter: 'lists',
    caption: [
      'Anyone can say the same of another.\nTriples that share a predicate and an object form a list.',
    ],
    // The camera turns down a little as Anthropic and OpenAI arrive below
    // xAI; then each one's line grows through the same best to the same AI
    // company, one after the other: no atom is drawn twice.
    motionMs: 4400,
    stage: {
      ...LISTED_GRAPH,
      // Facing best, so the two below it, either side of it, stand evenly
      // under it, their lines to it the same length; and raised, so the
      // list stands in the middle.
      camera: {
        facing: lookingDown(4, 0.02),
        zoom: 0.6,
        raise: 0.14,
        focus: onSphere(4, -0.15),
        during: [0, 0.4],
      },
      atoms: {
        ...LISTED_GRAPH.atoms,
        anthropic: {
          at: onSphere(3.3, -0.3),
          role: 'identity',
          during: [0.15, 0.4],
        },
        openai: {
          at: onSphere(4.7, -0.3),
          role: 'identity',
          during: [0.25, 0.5],
        },
      },
      triples: {
        ...LISTED_GRAPH.triples,
        anthropicBestAiCompany: { during: [0.5, 0.72] },
        openaiBestAiCompany: { during: [0.72, 0.95] },
      },
    },
  },
  {
    id: 'list',
    chapter: 'lists',
    caption: [
      'Each triple in a list has vaults of its own, and so a weight of its own.',
    ],
    // The cloud falls back and out of focus, and the list's five atoms come
    // out of it onto the plane, their lines with them: its members in a
    // column, best and AI company across from them. Then each weight shows.
    motionMs: 4800,
    stage: {
      ...LISTED_CLOSE,
      plane: {
        term: { list: BEST_AI_COMPANY },
        // A narrow screen follows the members and best together.
        focus: ['xai', 'best'],
        during: [0.1, 1],
      },
    },
  },
  {
    id: 'ranked',
    chapter: 'lists',
    caption: [
      'The positions in each triple’s vaults rank the list: the more weight, the higher it stands.',
    ],
    // The members move into order, the heaviest on top.
    motionMs: 2800,
    stage: {
      ...LISTED_CLOSE,
      plane: {
        term: { list: { ...BEST_AI_COMPANY, isRanked: true } },
        focus: ['xai', 'best'],
      },
    },
  },
  {
    id: 'one-graph',
    chapter: 'perspectives',
    caption: [
      'Everything so far is one graph: every atom and triple, on one graph.',
    ],
    alt: 'Every atom and triple of the story, on one graph.',
    // The list goes back into the cloud, which comes into focus as the
    // camera pulls back to show all of it. Then the atoms the plane held
    // arrive in their places on it, and their triples' lines grow.
    motionMs: 5200,
    stage: {
      ...STORY_GRAPH,
      camera: { ...WHOLE_VIEW, during: [0.1, 0.55] },
      atoms: {
        ...STORY_GRAPH.atoms,
        ...Object.fromEntries(
          FROM_THE_PLANE.map((id) => [
            id,
            { ...STORY_GRAPH.atoms[id], during: [0.5, 0.68] },
          ]),
        ),
      },
      triples: {
        ...STORY_GRAPH.triples,
        moreThanEconomy: { during: [0.68, 0.95] },
        spacexWorth: { during: [0.68, 0.95] },
        elonBelieves: { during: [0.68, 0.95] },
        economyEstimated: { during: [0.68, 0.95] },
        beliefSourced: { during: [0.68, 0.95] },
      },
    },
  },
  {
    id: 'flat',
    chapter: 'perspectives',
    caption: ['The same atoms can be seen another way.'],
    alt: 'Two perspectives of the same atoms: the graph, round, and beside it a map of it, flat.',
    // The cloud moves aside; its atoms leave it, each for its place on a
    // flat map of it; then the map's lines grow, subject to object.
    motionMs: 5200,
    stage: { ...STORY_GRAPH, camera: WHOLE_VIEW, flat: {} },
  },
  {
    id: 'perspectives',
    chapter: 'perspectives',
    caption: [
      'Two perspectives of the same atoms: what you see depends on whose triples you trust.',
    ],
    alt: 'Two perspectives of the same atoms: the round one with every triple, the flat one without the triples it does not trust.',
    // The flat perspective does not trust what Elon Musk believes, nor
    // where it comes from, nor that OpenAI is the best AI company: those
    // lines draw back on the map alone.
    motionMs: 3000,
    stage: {
      ...STORY_GRAPH,
      camera: WHOLE_VIEW,
      flat: {
        distrusted: [
          'elonBelieves',
          'spacexWorth',
          'beliefSourced',
          'openaiBestAiCompany',
        ],
        during: [0.2, 0.7],
      },
    },
  },
];

/** A caption as plain text: for a screen reader, and to time the read. */
export function captionText(caption: readonly CaptionPart[]): string {
  return caption
    .map((part) => (typeof part === 'string' ? part : part.text))
    .join('');
}

/**
 * How long a beat holds after its motion, for its caption to be read: an
 * unhurried 17 characters a second, and never less than a moment.
 */
const MS_PER_CHARACTER = 60;
const MIN_HOLD_MS = 2500;

export interface Beat extends BeatSpec {
  index: number;
  /** When the beat starts and ends, in milliseconds from the start. */
  start: number;
  end: number;
}

export const BEATS: readonly Beat[] = BEAT_SPECS.reduce<Beat[]>(
  (beats, spec, index) => {
    const start = beats.at(-1)?.end ?? 0;
    const hold = Math.max(
      MIN_HOLD_MS,
      captionText(spec.caption).length * MS_PER_CHARACTER,
    );

    return [
      ...beats,
      { ...spec, index, start, end: start + spec.motionMs + hold },
    ];
  },
  [],
);

/** The whole film, in milliseconds. */
export const DURATION = BEATS.at(-1)?.end ?? 0;

/**
 * How far the cloud's dots have flowed at `time`: as far as the film has
 * played, less the beats that hold them still behind a plane, where its
 * lines are a reminder. Behind a list they flow on: its lines are the
 * cloud's own, out on the plane.
 */
function cloudFlowAt(time: number): number {
  return BEATS.reduce(
    (flowed, beat) =>
      beat.stage.isCloudStill === true
        ? flowed
        : flowed +
          Math.min(Math.max(time - beat.start, 0), beat.end - beat.start),
    0,
  );
}

/** The claim each chapter's plane builds to: its last beat's. */
const FINAL_PLANES = new Map(
  CHAPTERS.map((chapter) => [
    chapter.id,
    BEATS.findLast(
      (beat) => beat.chapter === chapter.id && beat.stage.plane !== undefined,
    )?.stage.plane ?? null,
  ]),
);

export interface ChapterSpan {
  id: ChapterId;
  title: string;
  start: number;
  end: number;
}

/** Each chapter, and when it starts and ends. */
export const CHAPTER_SPANS: readonly ChapterSpan[] = CHAPTERS.map((chapter) => {
  const beats = BEATS.filter((beat) => beat.chapter === chapter.id);

  return {
    ...chapter,
    start: beats[0]?.start ?? 0,
    end: beats.at(-1)?.end ?? 0,
  };
});

function firstBeat(): Beat {
  const beat = BEATS[0];
  if (beat === undefined) {
    throw new Error('The story has no beats.');
  }

  return beat;
}

/** The beat playing at `time`; past the end, the last. */
export function beatAt(time: number): Beat {
  return BEATS.findLast((beat) => beat.start <= time) ?? firstBeat();
}

/** The chapter playing at `time`. */
export function chapterAt(time: number): ChapterSpan {
  const { chapter } = beatAt(time);

  return (
    CHAPTER_SPANS.find((span) => span.id === chapter) ?? {
      ...CHAPTERS[0],
      start: 0,
      end: DURATION,
    }
  );
}

/**
 * Where a step lands in a beat. Playing, at its start, so its motion plays.
 * Paused, where its motion is done, so the picture matches the caption.
 */
export type StepLanding = 'start' | 'settled';

/** Within this much of a landing, stepping back goes to the beat before. */
const STEP_BACK_GRACE_MS = 1200;

function landing(beat: Beat, at: StepLanding): number {
  return at === 'start' ? beat.start : beat.start + beat.motionMs;
}

/**
 * What a step moves by: a beat (the arrow keys), a chapter (Page Up and
 * Page Down) or the whole film (Home and End).
 */
export type StepUnit = 'beat' | 'chapter' | 'film';

/** The beat each unit opens with, in order. */
function openingBeats(unit: StepUnit): readonly Beat[] {
  if (unit === 'beat') {
    return BEATS;
  }
  if (unit === 'film') {
    return [firstBeat()];
  }

  return CHAPTER_SPANS.flatMap(
    (span) => BEATS.find((beat) => beat.chapter === span.id) ?? [],
  );
}

/**
 * Where a step takes the film from `time`. Forward: the next unit, or the
 * end after the last. Back: the start of this one, or the one before when
 * this one has only just started, as a media player does; never before the
 * first, so a paused film never lands on an empty stage.
 */
export function stepFrom(
  time: number,
  direction: 1 | -1,
  at: StepLanding,
  unit: StepUnit = 'beat',
): number {
  const units = openingBeats(unit);
  const index = Math.max(
    units.findLastIndex((beat) => beat.start <= time),
    0,
  );
  if (direction === 1) {
    const next = units[index + 1];

    return next === undefined ? DURATION : landing(next, at);
  }
  const current = units[index] ?? firstBeat();
  const here = landing(current, at);
  const previous = units[index - 1];
  if (time - here > STEP_BACK_GRACE_MS || previous === undefined) {
    return here;
  }

  return landing(previous, at);
}

/** One atom as drawn at a moment. */
export interface DrawnAtom {
  id: AtomId;
  label: string;
  /** A direction from the cloud's centre. */
  at: Vec3;
  /** The shape it is drawn as: `progress` of the way from one to another. */
  role: { from: Role; to: Role; progress: number };
  /** 0 when absent, 1 when fully there. */
  presence: number;
}

/** One triple as drawn at a moment: a line through its three atoms. */
export interface DrawnTriple {
  id: TripleId;
  points: readonly [Vec3, Vec3, Vec3];
  /** How much of the line is drawn, from the subject on: 0 to 1. */
  progress: number;
}

/** The flat perspective as drawn at a moment. */
export interface FlatScene {
  /** How far the cloud has moved aside for it, 0 to 1. */
  aside: number;
  /** How far its atoms have come from the cloud to the map, 0 to 1. */
  arrive: number;
  /** Each atom's place on the map, from 0 to 1 across and down. */
  places: ReadonlyMap<AtomId, { x: number; y: number }>;
  /** Each triple's line on the map, drawn from its subject as far as `progress`. */
  triples: ReadonlyArray<{ id: TripleId; progress: number }>;
  /**
   * Atoms that keep their names where names would meet, before the rest,
   * the things before the predicates: it names Anthropic, the cloud OpenAI.
   */
  namedFirst: readonly AtomId[];
  /** Names set beside their atoms, to the left, not under them: near the map's foot. */
  namedLeft: readonly AtomId[];
  /**
   * Atoms it leaves unnamed: OpenAI, which the cloud names as it names
   * Anthropic, and those whose triples it does not trust.
   */
  unnamed: readonly AtomId[];
}

export interface Scene {
  beat: Beat;
  camera: Camera;
  atoms: DrawnAtom[];
  triples: DrawnTriple[];
  /**
   * The plane in front of the cloud: the claim as the beat found it and as
   * it leaves it, `progress` of the way between. Both `null` when no plane
   * is open.
   */
  plane: {
    from: PlaneState | null;
    to: PlaneState | null;
    progress: number;
    /**
     * The claim the chapter builds to, as its last beat leaves it: the
     * plane sizes itself by it, and stands each claim where it will stand,
     * from the start.
     */
    fit: PlaneState | null;
  };
  /** How far the cloud is out of focus behind the plane, 0 to 1. */
  depth: number;
  /** How much of the cloud shows, 0 to 1. */
  cloud: number;
  /** The flat perspective beside the cloud, or `null`. */
  flat: FlatScene | null;
  /**
   * How far the dots along the lines have flowed: the film's time, held at
   * 0 when motion is reduced.
   */
  flow: number;
  /**
   * The same for the cloud's lines, held once the cloud first goes out of
   * focus: behind a plane, its lines are a reminder, and stay still.
   */
  cloudFlow: number;
}

function clamp01(value: number): number {
  return Math.min(Math.max(value, 0), 1);
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** How far along its own part of the motion a change is. */
function within(progress: number, during: During = [0, 1]): number {
  const [start, end] = during;

  return clamp01((progress - start) / (end - start));
}

/** How far along its own part of the motion a change is, eased. */
function along(progress: number, during: During = [0, 1]): number {
  return easeInOutCubic(within(progress, during));
}

/**
 * When, as the flat perspective opens, the cloud moves aside, the atoms fly
 * to the map, and its lines grow.
 */
const FLAT_OPENING = {
  aside: [0, 0.35],
  arrive: [0.3, 0.7],
  lines: [0.7, 1],
} as const satisfies Record<string, During>;

/**
 * Each atom's place on the flat map: the cloud's longitude across and its
 * latitude down, stretched to fill a square, so every atom keeps its
 * neighbours.
 */
function mapOf(
  atoms: Partial<Record<AtomId, AtomState>>,
): ReadonlyMap<AtomId, { x: number; y: number }> {
  const spots = Object.entries(atoms).flatMap(([id, state]) => {
    if (state === undefined) {
      return [];
    }
    const [x, y, z] = state.at;

    return [
      {
        id: id as AtomId,
        lon: Math.atan2(x, z),
        lat: Math.asin(Math.min(Math.max(y, -1), 1)),
      },
    ];
  });
  const lons = spots.map((spot) => spot.lon);
  const lats = spots.map((spot) => spot.lat);
  const [west, east] = [Math.min(...lons), Math.max(...lons)];
  const [south, north] = [Math.min(...lats), Math.max(...lats)];

  return new Map(
    spots.map(({ id, lon, lat }) => [
      id,
      { x: (lon - west) / (east - west), y: (north - lat) / (north - south) },
    ]),
  );
}

/** The atom ids, in the order they are listed. */
const ATOM_IDS = Object.keys(ATOMS) as AtomId[];
const TRIPLE_IDS = Object.keys(TRIPLES) as TripleId[];

/**
 * The scene at `time`. With `isStill`, for a reader who asked for reduced
 * motion, there is no motion: each beat shows as it is left.
 */
export function sceneAt(time: number, isStill = false): Scene {
  const beat = beatAt(time);
  const target = beat.stage;
  // Before the first beat, the stage is empty, with the camera already set.
  const previous: StageState = BEATS[beat.index - 1]?.stage ?? {
    camera: target.camera,
    atoms: {},
    triples: {},
  };
  const progress = isStill ? 1 : clamp01((time - beat.start) / beat.motionMs);

  const camera = along(progress, target.camera.during);
  // The chapter that sizes the plane: this beat's, or, as the plane closes,
  // the one before's, so it keeps its size as it goes.
  const planeChapter =
    target.plane !== undefined
      ? beat.chapter
      : previous.plane !== undefined
        ? BEATS[beat.index - 1]?.chapter
        : undefined;
  const atoms: DrawnAtom[] = [];
  for (const id of ATOM_IDS) {
    const from = previous.atoms[id];
    const to = target.atoms[id];
    const state = to ?? from;
    if (state === undefined) {
      continue;
    }
    const t = along(progress, to?.during ?? from?.during);
    // An atom that arrives to take its role later arrives plain.
    const fromRole =
      from?.role ?? (to?.roleDuring === undefined ? state.role : 'identity');
    atoms.push({
      id,
      label: ATOMS[id].label,
      at:
        from !== undefined && to !== undefined
          ? arcPoint(from.at, to.at, t)
          : state.at,
      role: {
        from: fromRole,
        to: state.role,
        progress: along(progress, to?.roleDuring ?? to?.during ?? from?.during),
      },
      presence: from === undefined ? t : to === undefined ? 1 - t : 1,
    });
  }

  const triples: DrawnTriple[] = [];
  for (const id of TRIPLE_IDS) {
    const isBefore = previous.triples[id] !== undefined;
    const after = target.triples[id];
    if (!isBefore && after === undefined) {
      continue;
    }
    const { subject, predicate, object } = TRIPLES[id];
    const point = (atom: AtomId): Vec3 =>
      atoms.find((drawn) => drawn.id === atom)?.at ?? FRONT;
    const t = along(progress, after?.during);
    triples.push({
      id,
      points: [point(subject), point(predicate), point(object)],
      progress: isBefore ? (after === undefined ? 1 - t : 1) : t,
    });
  }

  return {
    beat,
    camera: {
      facing: arcPoint(previous.camera.facing, target.camera.facing, camera),
      focus: arcPoint(
        previous.camera.focus ?? previous.camera.facing,
        target.camera.focus ?? target.camera.facing,
        camera,
      ),
      whole: lerp(previous.camera.whole ?? 0, target.camera.whole ?? 0, camera),
      raise: lerp(previous.camera.raise ?? 0, target.camera.raise ?? 0, camera),
      // Zoom moves on a log scale, so a pull back feels even throughout.
      zoom: Math.exp(
        lerp(
          Math.log(previous.camera.zoom),
          Math.log(target.camera.zoom),
          camera,
        ),
      ),
    },
    atoms,
    triples,
    plane: {
      from: previous.plane ?? null,
      to: target.plane ?? null,
      // Evenly: the plane eases each of its own stages.
      progress: within(
        progress,
        target.plane?.during ?? previous.plane?.during,
      ),
      fit:
        planeChapter === undefined
          ? null
          : (FINAL_PLANES.get(planeChapter) ?? null),
    },
    depth: lerp(previous.depth ?? 0, target.depth ?? 0, camera),
    cloud: lerp(
      previous.cloud?.shown ?? 1,
      target.cloud?.shown ?? 1,
      along(progress, target.cloud?.during ?? previous.cloud?.during),
    ),
    flow: isStill ? 0 : time,
    cloudFlow: isStill ? 0 : cloudFlowAt(time),
    flat: flatAt(previous, target, progress, triples),
  };
}

/** The flat perspective `progress` of the way from one beat's to the next. */
function flatAt(
  previous: StageState,
  target: StageState,
  progress: number,
  drawn: readonly DrawnTriple[],
): FlatScene | null {
  const was = previous.flat;
  const is = target.flat;
  if (was === undefined && is === undefined) {
    return null;
  }
  const isOpening = was === undefined;
  const trusts = (flat: FlatState | undefined, id: TripleId): number =>
    flat !== undefined && !(flat.distrusted ?? []).includes(id) ? 1 : 0;
  const lines = along(
    progress,
    isOpening ? FLAT_OPENING.lines : (is?.during ?? was?.during),
  );

  return {
    aside: isOpening ? along(progress, FLAT_OPENING.aside) : 1,
    arrive: isOpening ? along(progress, FLAT_OPENING.arrive) : 1,
    places: mapOf(target.atoms),
    triples: drawn.map(({ id }) => ({
      id,
      progress: lerp(trusts(was, id), trusts(is, id), lines),
    })),
    namedFirst: ['anthropic'],
    namedLeft: ['anthropic'],
    unnamed: ['openai', 'believes', 'tweet', 'sourcedBy', 'willBeWorth'],
  };
}

/**
 * The turn that brings `facing` to the front with the equator level: round
 * the vertical first, then up or down, as a camera on a tripod turns. The
 * shortest turn would also roll the picture once the camera rises.
 */
export function turnToFace(facing: Vec3): Quat {
  const [x, y, z] = facing;
  const longitude = Math.atan2(x, z);
  const latitude = Math.asin(Math.min(Math.max(y, -1), 1));

  return multiply(
    axisAngle([1, 0, 0], latitude),
    axisAngle([0, 1, 0], -longitude),
  );
}

/** The whole cloud's radius, as a share of the canvas's shorter side. */
export const WHOLE_SHARE = 0.42;

/** The cloud's radius at zoom 1, as a share of the canvas's width. */
export const RADIUS_SHARE = 0.57;
/**
 * The smallest radius, in CSS pixels, at which the names under neighbouring
 * atoms stay apart.
 */
export const MIN_RADIUS_PX = 168;
/**
 * How much closer than asked the camera comes before it has turned all the
 * way to its focus: it turns as it comes closer, never with a jump.
 */
const FOCUS_BLEND = 0.3;

/** How the cloud is shown: the direction facing the viewer, and its radius. */
export interface View {
  facing: Vec3;
  radius: number;
}

/**
 * The camera's view on a canvas `width` CSS pixels wide. It shows what it
 * is asked to while the names stay apart. On a screen too narrow for that,
 * the cloud grows no smaller than the names allow and turns to the focus: a
 * phone follows the story where a wide screen shows all of it.
 */
export function viewOf(
  camera: Camera,
  width: number,
  height = Number.POSITIVE_INFINITY,
): View {
  const wanted = width * RADIUS_SHARE * camera.zoom;
  const radius = Math.max(wanted, MIN_RADIUS_PX);
  const turn = wanted > 0 ? clamp01((radius / wanted - 1) / FOCUS_BLEND) : 1;
  // Pulled back to all of it, it is as large as the shorter side allows,
  // and faces what the camera faces on any screen.
  const whole = camera.whole ?? 0;

  return {
    facing: arcPoint(
      camera.facing,
      camera.focus ?? camera.facing,
      turn * (1 - whole),
    ),
    radius: lerp(radius, Math.min(width, height) * WHOLE_SHARE, whole),
  };
}

/** "400, 200 and 20" */
function listed(values: readonly (number | string)[]): string {
  return values.length < 2
    ? values.join('')
    : `${values.slice(0, -1).join(', ')} and ${values.at(-1) ?? ''}`;
}

/** A triple's vaults, and the people with a position in them, in words. */
function describeVaults(vaults: PlaneVaults): string {
  const side = (positions: readonly number[], which: string): string =>
    `${positions.length} ${which} it${vaults.isWeighed === true ? `, with ${listed(positions)}` : ''}`;

  return ` ${vaults.against.length + vaults.for.length} people have a position in its two vaults: ${side(vaults.against, 'against')}, and ${side(vaults.for, 'for')}.`;
}

/** What the scene shows, in words: the canvas's label. */
export function describeScene(scene: Scene): string {
  if (scene.beat.alt !== undefined) {
    return scene.beat.alt;
  }
  // Up close on the plane, the claim on it is what shows.
  const { plane } = scene;
  const shown = plane.progress >= 0.5 ? plane.to : (plane.from ?? plane.to);
  if (shown !== null && (plane.from !== null || plane.progress >= 0.5)) {
    const labelOf = (atom: AtomId): string => ATOMS[atom].label;

    if ('atom' in shown.term) {
      return `An atom, up close: ${labelOf(shown.term.atom)}.`;
    }
    if ('list' in shown.term) {
      const { members, predicate, object, isRanked } = shown.term.list;
      const order = isRanked
        ? members.toSorted((a, b) => b.weight - a.weight)
        : members;

      return `A list of triples, each ${labelOf(predicate)} ${labelOf(object)}: ${listed(order.map((member) => `${labelOf(member.atom)}, with ${member.weight}`))}${isRanked === true ? ', ranked by weight' : ''}.`;
    }

    const branches = (shown.branches ?? [])
      .map(
        ({ subject, predicate, object }) =>
          ` And a triple of its own: ${'atom' in subject ? labelOf(subject.atom) : 'the whole triple'} ${labelOf(predicate)} ${labelOf(object)}.`,
      )
      .join('');
    const vaults =
      shown.vaults === undefined ? '' : describeVaults(shown.vaults);

    return (shown.spelled?.length ?? 0) > 0
      ? `A triple, still in words: ${planeSentence(shown.term, labelOf)}.`
      : `A triple: ${planeSentence(shown.term, labelOf)}.${branches}${vaults}`;
  }

  const drawn = scene.triples.filter((triple) => triple.progress >= 0.5);
  if (drawn.length > 0) {
    return drawn
      .map(({ id }) => {
        const triple: TripleAtoms = TRIPLES[id];
        const named = (atom: AtomId, whole: string | undefined): string =>
          whole === undefined ? ATOMS[atom].label : `the triple ${whole}`;

        return `A triple: ${named(triple.subject, triple.subjectTriple)}, the subject; ${ATOMS[triple.predicate].label}, the predicate; ${named(triple.object, triple.objectTriple)}, the object.`;
      })
      .join(' ');
  }
  // Left to right, as the story runs round the cloud.
  const longitude = ([x, , z]: Vec3): number => Math.atan2(x, z);
  const present = scene.atoms
    .filter((atom) => atom.presence >= 0.5)
    .toSorted((a, b) => longitude(a.at) - longitude(b.at))
    .map((atom) => atom.label);
  if (present.length === 0) {
    return 'An empty scene.';
  }

  return present.length === 1
    ? `An atom: ${present[0] ?? ''}.`
    : `Atoms: ${present.slice(0, -1).join(', ')} and ${present.at(-1) ?? ''}.`;
}

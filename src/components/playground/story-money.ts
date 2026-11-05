/**
 * The money flow chapter: a deposit played on the plane the chapter of
 * vaults leaves, the same triple and vault, from one of its depositors. Lines
 * and amounts are placed from what the plane has laid out, and move with the
 * film's clock, so the chapter plays, pauses and scrubs with the rest.
 */
import { sentFlow, SENT } from '@/components/money-flow/money-flow-model';
import { VAULT_ICON, VAULT_SIZE, type VaultOf } from '@/lib/icons';

import type { PlanePoint } from './story-plane';

/** The money flow at a moment of the film. */
export interface MoneyFlowMoment {
  view: 'deposit' | 'fees';
  /** How far the picture has played, from when its money moves. */
  seconds: number;
  /** How much of the money shows, 0 to 1. */
  shown: number;
  /** How far the other positions have gone, 0 to 1. */
  quiet: number;
}

/** The line and the person the deposit is played from: the middle one for it. */
export const DEPOSITOR = 'worth:for:1';

/** What the plane lays out that the money flow reaches. */
export interface MoneyFlowAnchors {
  /** The depositor's line: from them, to where their side meets, to the vault. */
  line: readonly [PlanePoint, PlanePoint, PlanePoint];
  /** The triple's vault, and the triple inside it. */
  vault: PlanePoint;
  inner: { x: number; width: number; bottom: number };
  /** Where each of its atoms stands along the line, the triple's own and the inner one's. */
  spacex: number;
  willBeWorth: number;
  innerAtoms: readonly number[];
}

/** A new line, drawn as far as its coin has run, or a stretch of a line already there. */
export interface MoneyRun {
  id: string;
  points: readonly PlanePoint[];
  /** When its coin sets off. */
  at: number;
  coin: 'money' | 'fee';
  /** Whether the line exists only for this run, so it grows with the coin. */
  isNew: boolean;
  /** How much of it shows once run: less, for what the last picture left. */
  held?: number;
}

/** An amount in a pill, on a line, with what it is in words beside or under it. */
export interface MoneyStop {
  id: string;
  amount: string;
  label?: string;
  labelAt?: 'right' | 'under';
  isFee?: boolean;
  at: number;
  point: PlanePoint;
  held?: number;
}

/** A vault the money reaches, shown for the picture. */
export interface MoneyVault {
  id: string;
  of: VaultOf;
  point: PlanePoint;
  size: number;
  /** Nothing reached it: drawn faded, with a 0 beside it. */
  isEmpty?: boolean;
}

export interface MoneyPicture {
  runs: MoneyRun[];
  stops: MoneyStop[];
  vaults: MoneyVault[];
  /** The line from the inner triple's frame down to its vault. */
  trunks: (readonly PlanePoint[])[];
}

/** How long a coin takes along a run, and an amount to appear. */
export const RUN_SECONDS = 0.7;
export const STOP_SECONDS = 0.3;

/** A step of a picture: what it brings appears, then the lines leaving it start. */
const STEP = 1.1;
const appearsAt = (step: number): number => step * STEP;
const runsAt = (step: number): number => 0.4 + step * STEP;

/** How far from the depositor's line the fees stand, and the protocol's from them. */
const BRANCH = 105;
const PROTOCOL = 85;

/** How much of the deposit's picture stays behind the fees'. */
const HELD = 0.3;

/** The atoms' vaults, small enough for the room under their names. */
const ATOM_VAULT_SIZE = 12;
const ATOM_VAULT_ABOVE_FRAME = 8;

/** From the middle of a vault's shape to its bottom corner, as large as `size`. */
function baseOf(point: PlanePoint, size: number): PlanePoint {
  const { box, base } = VAULT_ICON;
  const scale = size / VAULT_ICON.size;

  return {
    x: point.x + (base.x - (box.x + box.width / 2)) * scale,
    y: point.y + (base.y - (box.y + box.height / 2)) * scale,
  };
}

const lerp = (from: PlanePoint, to: PlanePoint, t: number): PlanePoint => ({
  x: from.x + (to.x - from.x) * t,
  y: from.y + (to.y - from.y) * t,
});

/** An amount to two decimals at most. */
const trust = (value: number): string =>
  value.toLocaleString('en-US', { maximumFractionDigits: 2 });

function depositPicture({ line }: MoneyFlowAnchors): MoneyPicture {
  const flow = sentFlow(SENT);
  const [from, meet, face] = line;
  const split = lerp(from, meet, 0.5);
  const builder = { x: meet.x + BRANCH, y: split.y };
  const fees = { x: meet.x + BRANCH, y: meet.y };

  return {
    trunks: [],
    vaults: [],
    runs: [
      {
        id: 'sent',
        points: [from, split],
        at: runsAt(0),
        coin: 'money',
        isNew: false,
      },
      {
        id: 'builder',
        points: [split, builder],
        at: runsAt(0),
        coin: 'fee',
        isNew: true,
      },
      {
        id: 'enters',
        points: [split, meet],
        at: runsAt(1),
        coin: 'money',
        isNew: false,
      },
      {
        id: 'fees',
        points: [meet, fees],
        at: runsAt(1),
        coin: 'fee',
        isNew: true,
      },
      {
        id: 'position',
        points: [meet, face],
        at: runsAt(2),
        coin: 'money',
        isNew: false,
      },
    ],
    stops: [
      {
        id: 'sent',
        amount: trust(flow.sent),
        label: 'sent',
        labelAt: 'right',
        at: appearsAt(0),
        point: lerp(from, split, 0.5),
      },
      {
        id: 'builder',
        amount: trust(flow.builderFee),
        label: 'builder fee',
        labelAt: 'under',
        isFee: true,
        at: appearsAt(1),
        point: builder,
      },
      {
        id: 'enters',
        amount: trust(flow.deposit),
        at: appearsAt(1),
        point: lerp(split, meet, 0.5),
      },
      {
        id: 'fees',
        amount: trust(flow.fees),
        label: 'fees',
        labelAt: 'under',
        isFee: true,
        at: appearsAt(2),
        point: fees,
      },
      {
        id: 'position',
        amount: trust(flow.position),
        label: 'position',
        labelAt: 'right',
        at: appearsAt(3),
        point: lerp(face, meet, 0.6),
      },
    ],
  };
}

function feesPicture(anchors: MoneyFlowAnchors): MoneyPicture {
  const flow = sentFlow(SENT);
  const { vault, inner, spacex, willBeWorth, innerAtoms } = anchors;
  const deposit = depositPicture(anchors);
  const fees = deposit.stops.find((stop) => stop.id === 'fees')?.point ?? vault;
  const bar = fees.y;
  const atomRow = inner.bottom - ATOM_VAULT_ABOVE_FRAME;
  const innerVault = { x: inner.x + inner.width / 2, y: vault.y };
  const atomVault = (id: string, x: number, isEmpty: boolean): MoneyVault => ({
    id,
    of: 'atom',
    point: { x, y: atomRow },
    size: ATOM_VAULT_SIZE,
    ...(isEmpty ? { isEmpty } : {}),
  });
  const protocol = { x: fees.x + PROTOCOL, y: fees.y };
  const toTerm = (id: string, to: PlanePoint): MoneyRun => ({
    id,
    points: [fees, { x: to.x, y: bar }, to],
    at: runsAt(0),
    coin: 'fee',
    isNew: true,
  });
  const toSpacex = baseOf({ x: spacex, y: atomRow }, ATOM_VAULT_SIZE);
  const toWorth = baseOf({ x: willBeWorth, y: atomRow }, ATOM_VAULT_SIZE);
  const toVault = baseOf(vault, VAULT_SIZE);
  const toInner = baseOf(innerVault, VAULT_SIZE);
  const gain = (id: string, amount: number, to: PlanePoint): MoneyStop => ({
    id,
    amount: `+${trust(amount)}`,
    at: appearsAt(1),
    point: { x: to.x, y: (bar + to.y) / 2 },
  });

  return {
    trunks: [[innerVault, { x: innerVault.x, y: inner.bottom }]],
    vaults: [
      atomVault('spacex', spacex, false),
      atomVault('willBeWorth', willBeWorth, false),
      ...innerAtoms.map((x, index) => atomVault(`inner:${index}`, x, true)),
      {
        id: 'inner',
        of: 'triple',
        point: innerVault,
        size: VAULT_SIZE,
      },
    ],
    runs: [
      ...deposit.runs.map((run) => ({
        ...run,
        at: -1 - RUN_SECONDS,
        held: run.id === 'fees' ? 1 : HELD,
      })),
      toTerm('to-spacex', toSpacex),
      toTerm('to-worth', toWorth),
      toTerm('to-vault', toVault),
      toTerm('to-inner', toInner),
      {
        id: 'protocol',
        points: [fees, protocol],
        at: runsAt(0),
        coin: 'fee',
        isNew: true,
      },
    ],
    stops: [
      // All but the position, where the inner triple's line now runs.
      ...deposit.stops
        .filter((stop) => stop.id !== 'position')
        .map((stop) => ({
          ...stop,
          at: -1,
          held: stop.id === 'fees' ? 1 : HELD,
        })),
      gain('spacex', flow.perTerm, toSpacex),
      gain('willBeWorth', flow.perTerm, toWorth),
      gain('vault', flow.entry, toVault),
      gain('inner', flow.perTerm, toInner),
      {
        id: 'protocol',
        amount: trust(flow.protocol),
        label: 'protocol',
        labelAt: 'under',
        isFee: true,
        at: appearsAt(1),
        point: protocol,
      },
    ],
  };
}

/** The picture of a view, placed on the plane. */
export function moneyPicture(
  view: MoneyFlowMoment['view'],
  anchors: MoneyFlowAnchors,
): MoneyPicture {
  return view === 'deposit' ? depositPicture(anchors) : feesPicture(anchors);
}

/** A point `t` of the way along `points`, 0 to 1. */
export function alongPoints(
  points: readonly PlanePoint[],
  t: number,
): PlanePoint {
  const lengths = points.slice(1).map((point, index) => {
    const from = points[index] ?? point;

    return Math.hypot(point.x - from.x, point.y - from.y);
  });
  let left = t * lengths.reduce((sum, length) => sum + length, 0);
  for (const [index, length] of lengths.entries()) {
    const from = points[index];
    const to = points[index + 1];
    if (from !== undefined && to !== undefined && left <= length) {
      return lerp(from, to, length === 0 ? 0 : left / length);
    }
    left -= length;
  }

  return points.at(-1) ?? { x: 0, y: 0 };
}

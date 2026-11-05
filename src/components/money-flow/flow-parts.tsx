import type { CSSProperties, ReactNode } from 'react';

import type { Role } from '@/components/playground/story-model';
import {
  outlinePath,
  ROLE_COLOURS,
} from '@/components/playground/story-shapes';
import {
  FEE_ICON,
  VAULT_ICON,
  VAULT_SIZE,
  vaultFace,
  type VaultOf,
} from '@/lib/icons';

/** The width both views are drawn to, and the column they share: the middle. */
export const WIDTH = 1200;
export const CENTRE = 600;

/** The terms' columns on the nested triple. */
export const SPACEX_X = 390;
export const WORTH_X = 555;
const ORDERS_X = 760;
const MORE_THAN_X = 900;
const EARTH_X = 1050;

const OUTER = { x: 30, width: 1140, height: 244 };
const INNER = { x: 670, width: 480, height: 176 };
const INNER_TOP = 16;
export const INNER_X = INNER.x + INNER.width / 2;

/** How far down the claim, from its top, a term's parts sit, its vault under its name. */
const SHAPE_Y = 78;
const NAME_Y = 118;
const VAULT_Y = 158;
const SHAPE_SIZE = 48;

/** How far down the triples' own vaults sit: each under its box. */
const INNER_VAULT_Y = 218;
const OUTER_VAULT_Y = 280;

/** The column a line rises in to the outer triple's vault. */
export const OUTER_VAULT_X = 110;
const FIGURES_X = 54;

const VAULT_SCALE = VAULT_SIZE / VAULT_ICON.size;
const FROM_MIDDLE = VAULT_ICON.size / 2;
const FOR_PORT_X = (VAULT_ICON.ports.for.x - FROM_MIDDLE) * VAULT_SCALE;
const FOR_PORT_Y = (VAULT_ICON.ports.for.y - FROM_MIDDLE) * VAULT_SCALE;
const BASE_Y = (VAULT_ICON.base.y - FROM_MIDDLE) * VAULT_SCALE;

/**
 * Where lines rise to on the claim, from its top, as in the film: on a triple,
 * money goes to its side for it, so a line meets the corner of its blue face;
 * on an atom, which has no sides, the bottom corner.
 */
export const outerVaultPort = (top: number): number =>
  top + OUTER_VAULT_Y + FOR_PORT_Y;
export const innerVaultPort = (top: number): number =>
  top + INNER_VAULT_Y + FOR_PORT_Y;
export const termVaultBase = (top: number): number => top + VAULT_Y + BASE_Y;

const innerTop = (top: number): number => top + INNER_TOP;

const CORNER = 12;
const FEE_INSET = 10;
const CHARACTER_WIDTH = 7.2;
const NAME_PADDING = 12;
const NAME_HEIGHT = 26;

/** An amount in TRUST, to two decimals at most. */
export const number = (value: number): string =>
  value.toLocaleString('en-US', { maximumFractionDigits: 2 });

/**
 * A line from a point to a bar, along it and on to a target, its corners
 * rounded. A target straight ahead goes straight there.
 */
export function route(
  fromX: number,
  fromY: number,
  bar: number,
  toX: number,
  toY: number,
): string {
  if (fromX === toX) {
    return `M${fromX} ${fromY}V${toY}`;
  }

  const side = toX > fromX ? 1 : -1;
  const way = toY > fromY ? 1 : -1;

  return [
    `M${fromX} ${fromY}`,
    `V${bar - way * CORNER}`,
    `Q${fromX} ${bar} ${fromX + side * CORNER} ${bar}`,
    `H${toX - side * CORNER}`,
    `Q${toX} ${bar} ${toX} ${bar + way * CORNER}`,
    `V${toY}`,
  ].join('');
}

/** How long a step of the animation takes: a coin's run, and a pause. */
const STEP = 1.1;
const RUN_START = 0.4;

/** When what a step brings appears, and when the lines leaving it start. */
export const appearsAt = (step: number): number => step * STEP;
export const runsAt = (step: number): number => RUN_START + step * STEP;

const delay = (seconds: number): CSSProperties => ({
  animationDelay: `${seconds}s`,
});

/** The coins, as the fee icon draws them: the money large and light, a fee small and solid. */
const COINS = {
  money: { r: 9, fillOpacity: 0.3 },
  fee: { r: 5, fillOpacity: 1 },
} as const;

export function Flow({
  d,
  at,
  coin,
  strong = false,
}: {
  d: string;
  /** When it appears, and its coin sets off. */
  at: number;
  coin: keyof typeof COINS;
  strong?: boolean;
}): ReactNode {
  return (
    <g>
      <path
        d={d}
        fill="none"
        strokeWidth={strong ? 3 : 1.5}
        markerEnd={`url(#money-flow-${strong ? 'strong' : 'arrow'})`}
        style={delay(at)}
        className={`money-flow-in ${strong ? 'stroke-fg' : 'stroke-fg-muted'}`}
      />
      <circle
        {...COINS[coin]}
        style={{ ...delay(at), offsetPath: `path("${d}")` }}
        className="money-flow-coin fill-fg"
      />
    </g>
  );
}

interface AmountProps {
  x: number;
  y: number;
  width: number;
  height: number;
  amount: string;
  label: string;
  look?: 'plain' | 'strong' | 'optional';
  /** It is a fee: the fee icon in its corner. */
  fee?: boolean;
  /** When it appears. */
  at: number;
}

/** The fee icon, its top left corner at a point. */
function FeeMark({ x, y }: { x: number; y: number }): ReactNode {
  return (
    <g transform={`translate(${x} ${y})`}>
      {FEE_ICON.paths.map(({ d, opacity }) => (
        <path key={d} d={d} fillOpacity={opacity} className="fill-fg" />
      ))}
    </g>
  );
}

/** A box of money: its amount, and in words what it is. */
export function Amount({
  x,
  y,
  width,
  height,
  amount,
  label,
  look = 'plain',
  fee = false,
  at,
}: AmountProps): ReactNode {
  const strong = look === 'strong';

  return (
    <g style={delay(at)} className="money-flow-in">
      <rect
        x={x - width / 2}
        y={y}
        width={width}
        height={height}
        rx={12}
        strokeDasharray={look === 'optional' ? '5 5' : undefined}
        className={strong ? 'fill-fg' : 'fill-bg stroke-border-strong'}
      />
      {fee && <FeeMark x={x - width / 2 + FEE_INSET} y={y + FEE_INSET} />}
      <text
        x={x}
        y={y + height / 2 - 2}
        textAnchor="middle"
        fontSize={23}
        fontWeight={600}
        className={strong ? 'fill-bg' : 'fill-fg'}
      >
        {amount}
      </text>
      <text
        x={x}
        y={y + height / 2 + 20}
        textAnchor="middle"
        fontSize={13}
        className={strong ? 'fill-bg' : 'fill-fg-muted'}
      >
        {label}
      </text>
    </g>
  );
}

/** What reaches a term, in a small pill on its line. */
export function Gain({
  x,
  y,
  amount,
  at,
}: {
  x: number;
  y: number;
  amount: string;
  /** When it appears. */
  at: number;
}): ReactNode {
  const width = 26 + amount.length * CHARACTER_WIDTH;

  return (
    <g style={delay(at)} className="money-flow-in">
      <rect
        x={x - width / 2}
        y={y - 12}
        width={width}
        height={24}
        rx={12}
        className="fill-bg stroke-border-strong"
      />
      <text
        x={x}
        y={y + 5}
        textAnchor="middle"
        fontSize={13}
        fontWeight={600}
        className="fill-fg"
      >
        {amount}
      </text>
    </g>
  );
}

/** A vault, by the rule every vault is drawn by: the faces it uses solid, the rest grey. */
function Vault({ x, y, of }: { x: number; y: number; of: VaultOf }): ReactNode {
  const half = VAULT_SIZE / 2;

  return (
    <g transform={`translate(${x - half} ${y - half}) scale(${VAULT_SCALE})`}>
      {VAULT_ICON.paths.map(({ d, face }) => {
        const { colour, opacity } = vaultFace(of, face);

        return (
          <path
            key={face}
            d={d}
            fill={`rgb(${colour.join(' ')})`}
            fillOpacity={opacity}
          />
        );
      })}
    </g>
  );
}

/** Nothing reached this vault: a 0 beside it. */
function Zero({ x, y }: { x: number; y: number }): ReactNode {
  return (
    <text
      x={x + VAULT_SIZE / 2 + 8}
      y={y + 5}
      fontSize={13}
      fontWeight={600}
      className="fill-fg-muted"
    >
      0
    </text>
  );
}

interface TermProps {
  x: number;
  top: number;
  shape: Role;
  name: string;
  /** Nothing reached its vault: drawn faded, with a 0 beside it. */
  empty: boolean;
}

/** A term as the film draws it: its shape, its name in a pill, and under them its vault. */
function Term({ x, top, shape, name, empty }: TermProps): ReactNode {
  const width = name.length * CHARACTER_WIDTH + NAME_PADDING * 2;
  const [red, green, blue] = ROLE_COLOURS[shape];
  const vaultY = top + VAULT_Y;
  const shapeTop = top + SHAPE_Y - SHAPE_SIZE / 2;

  return (
    <g>
      <g opacity={empty ? 0.4 : 1}>
        <path
          d={`M${x} ${vaultY - VAULT_SIZE / 2}V${top + NAME_Y + NAME_HEIGHT / 2}`}
          strokeWidth={1}
          className="stroke-fg-muted"
        />
        <Vault x={x} y={vaultY} of="atom" />
        <path
          transform={`translate(${x - SHAPE_SIZE / 2} ${shapeTop})`}
          d={outlinePath(shape, SHAPE_SIZE, SHAPE_SIZE / 2)}
          fill={`rgb(${red} ${green} ${blue})`}
        />
        <rect
          x={x - width / 2}
          y={top + NAME_Y - NAME_HEIGHT / 2}
          width={width}
          height={NAME_HEIGHT}
          rx={NAME_HEIGHT / 2}
          className="fill-fg"
        />
        <text
          x={x}
          y={top + NAME_Y + 5}
          textAnchor="middle"
          fontSize={13}
          fontWeight={500}
          className="fill-bg"
        >
          {name}
        </text>
      </g>
      {empty && <Zero x={x} y={vaultY} />}
    </g>
  );
}

interface NestedTripleProps {
  top: number;
  /** What the outer triple's vault gains, its size and what it is. */
  gain: string;
  gainNotes: readonly string[];
  /** When the gain and its notes appear. */
  gainAt: number;
  /** What the words in the inner triple's box say of it. */
  innerNote: string;
  /** Whether the vaults of SpaceX, will be worth and the inner triple received anything. */
  termsPaid: boolean;
}

/** The claim the deposit lands on: the outer triple, the inner one inside it. */
export function NestedTriple({
  top,
  gain,
  gainNotes,
  gainAt,
  innerNote,
  termsPaid,
}: NestedTripleProps): ReactNode {
  const innerBottom = innerTop(top) + INNER.height;
  const outerBottom = top + OUTER.height;
  const outerVaultX = OUTER_VAULT_X - FOR_PORT_X;
  const innerVaultX = INNER_X - FOR_PORT_X;

  return (
    <g>
      <rect
        {...OUTER}
        y={top}
        rx={16}
        fill="rgb(255 79 94 / 0.06)"
        stroke="rgb(255 79 94 / 0.35)"
      />
      <rect
        {...INNER}
        y={innerTop(top)}
        rx={14}
        fill="rgb(255 79 94 / 0.09)"
        stroke="rgb(255 79 94 / 0.35)"
      />

      <path
        d={`M${outerVaultX} ${top + OUTER_VAULT_Y - VAULT_SIZE / 2}V${outerBottom}`}
        strokeWidth={1}
        className="stroke-fg-muted"
      />
      <Vault x={outerVaultX} y={top + OUTER_VAULT_Y} of="triple" />
      <text x={FIGURES_X} y={top + 36} fontSize={13} className="fill-fg-muted">
        Outer triple's vault
      </text>
      <g style={delay(gainAt)} className="money-flow-in">
        <text
          x={FIGURES_X}
          y={top + 80}
          fontSize={34}
          fontWeight={600}
          className="fill-fg"
        >
          {gain}
        </text>
        {gainNotes.map((note, index) => (
          <text
            key={note}
            x={FIGURES_X}
            y={top + 114 + index * 22}
            fontSize={13}
            className="fill-fg-muted"
          >
            {note}
          </text>
        ))}
      </g>

      <text
        x={INNER.x + 16}
        y={innerTop(top) + 24}
        fontSize={13}
        className="fill-fg-muted"
      >
        {innerNote}
      </text>
      <g opacity={termsPaid ? 1 : 0.4}>
        <path
          d={`M${innerVaultX} ${top + INNER_VAULT_Y - VAULT_SIZE / 2}V${innerBottom}`}
          strokeWidth={1}
          className="stroke-fg-muted"
        />
        <Vault x={innerVaultX} y={top + INNER_VAULT_Y} of="triple" />
      </g>

      <Term
        x={SPACEX_X}
        top={top}
        shape="subjectAndObject"
        name="SpaceX"
        empty={!termsPaid}
      />
      <Term
        x={WORTH_X}
        top={top}
        shape="predicate"
        name="will be worth"
        empty={!termsPaid}
      />
      <Term
        x={ORDERS_X}
        top={top}
        shape="identity"
        name="orders of magnitude"
        empty
      />
      <Term
        x={MORE_THAN_X}
        top={top}
        shape="predicate"
        name="more than"
        empty
      />
      <Term
        x={EARTH_X}
        top={top}
        shape="object"
        name="current Earth economy"
        empty
      />
    </g>
  );
}

function Arrowhead({ id, size }: { id: string; size: number }): ReactNode {
  return (
    <marker
      id={id}
      viewBox="0 0 10 10"
      refX={9}
      refY={5}
      markerUnits="userSpaceOnUse"
      markerWidth={size}
      markerHeight={size}
      orient="auto"
    >
      <path
        d="M0 0L10 5L0 10Z"
        className={id.endsWith('strong') ? 'fill-fg' : 'fill-fg-muted'}
      />
    </marker>
  );
}

interface DrawingProps {
  height: number;
  label: string;
  children: ReactNode;
}

/** A view's drawing, in a card that scrolls sideways on a phone so its words stay readable. */
export function Drawing({ height, label, children }: DrawingProps): ReactNode {
  const defs = (
    <defs>
      <Arrowhead id="money-flow-arrow" size={9} />
      <Arrowhead id="money-flow-strong" size={12} />
    </defs>
  );

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-bg p-4 md:p-6">
      <svg
        viewBox={`0 0 ${WIDTH} ${height}`}
        role="img"
        aria-label={label}
        className="block h-auto w-full min-w-3xl font-sans"
      >
        {defs}
        {children}
      </svg>
    </div>
  );
}

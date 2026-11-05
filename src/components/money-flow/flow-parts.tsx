import type { ReactNode } from 'react';

import type { Role } from '@/components/playground/story-model';
import {
  outlinePath,
  ROLE_COLOURS,
} from '@/components/playground/story-shapes';
import { VAULT_ICON, VAULT_SIZE, vaultFace, type VaultOf } from '@/lib/icons';

/** The width both views are drawn to, and the column they share: the middle. */
export const WIDTH = 1200;
export const CENTRE = 600;

/** The terms' columns on the nested triple. */
export const SPACEX_X = 390;
export const WORTH_X = 555;
const ORDERS_X = 760;
const MORE_THAN_X = 900;
const EARTH_X = 1050;

const OUTER = { x: 30, width: 1140, height: 240 };
const INNER = { x: 670, width: 480, height: 190 };
const INNER_TOP = 32;
export const INNER_X = INNER.x + INNER.width / 2;

/** How far down the triple, from its top, a term's parts sit. */
const VAULT_Y = 100;
const SHAPE_Y = 150;
const NAME_Y = 192;
const SHAPE_SIZE = 48;

/** Where the triples' own vaults stand: the outer's beside its figures, the inner's in its box. */
export const OUTER_VAULT_X = 110;
const FIGURES_X = 142;
const OUTER_VAULT_Y = 52;
const INNER_VAULT_Y = 26;

/** Where a line lands on the triple, from its top: on the top of a vault. */
export const TRIPLE_HEIGHT = OUTER.height;
const onVault = (y: number): number => y - VAULT_SIZE / 2;
export const outerVaultTop = (top: number): number =>
  onVault(top + OUTER_VAULT_Y);
export const innerVaultTop = (top: number): number =>
  onVault(top + INNER_TOP + INNER_VAULT_Y);
export const termVaultTop = (top: number): number => onVault(top + VAULT_Y);

const innerTop = (top: number): number => top + INNER_TOP;

const CORNER = 12;
const CHARACTER_WIDTH = 7.2;
const NAME_PADDING = 12;
const NAME_HEIGHT = 26;

export const number = (value: number): string => value.toLocaleString('en-US');

/**
 * A line from a point down to a bar, along it and down to a target, its
 * corners rounded. A target straight below goes straight there.
 */
export function drop(
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

  return [
    `M${fromX} ${fromY}`,
    `V${bar - CORNER}`,
    `Q${fromX} ${bar} ${fromX + side * CORNER} ${bar}`,
    `H${toX - side * CORNER}`,
    `Q${toX} ${bar} ${toX} ${bar + CORNER}`,
    `V${toY}`,
  ].join('');
}

export function Flow({
  d,
  strong = false,
}: {
  d: string;
  strong?: boolean;
}): ReactNode {
  return (
    <path
      d={d}
      fill="none"
      strokeWidth={strong ? 3 : 1.5}
      markerEnd={`url(#money-flow-${strong ? 'strong' : 'arrow'})`}
      className={strong ? 'stroke-fg' : 'stroke-fg-muted'}
    />
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
}: AmountProps): ReactNode {
  const strong = look === 'strong';

  return (
    <g>
      <rect
        x={x - width / 2}
        y={y}
        width={width}
        height={height}
        rx={12}
        strokeDasharray={look === 'optional' ? '5 5' : undefined}
        className={strong ? 'fill-fg' : 'fill-bg stroke-border-strong'}
      />
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
}: {
  x: number;
  y: number;
  amount: string;
}): ReactNode {
  const width = 26 + amount.length * CHARACTER_WIDTH;

  return (
    <g>
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
  const scale = VAULT_SIZE / VAULT_ICON.size;

  return (
    <g
      transform={`translate(${x - VAULT_SIZE / 2} ${y - VAULT_SIZE / 2}) scale(${scale})`}
    >
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

/**
 * A term as the film draws it, its shape and its name in a pill under it,
 * with its vault, where what reaches it lands: over it here, for the money
 * comes down, its line on to the term as in the film.
 */
function Term({ x, top, shape, name, empty }: TermProps): ReactNode {
  const width = name.length * CHARACTER_WIDTH + NAME_PADDING * 2;
  const [red, green, blue] = ROLE_COLOURS[shape];
  const vaultY = top + VAULT_Y;
  const shapeTop = top + SHAPE_Y - SHAPE_SIZE / 2;

  return (
    <g>
      <g opacity={empty ? 0.4 : 1}>
        <path
          d={`M${x} ${vaultY + VAULT_SIZE / 2}V${shapeTop}`}
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
  innerNote,
  termsPaid,
}: NestedTripleProps): ReactNode {
  const innerVaultY = innerTop(top) + INNER_VAULT_Y;

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

      <Vault x={OUTER_VAULT_X} y={top + OUTER_VAULT_Y} of="triple" />
      <text x={FIGURES_X} y={top + 36} fontSize={13} className="fill-fg-muted">
        Outer triple's vault
      </text>
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

      <text
        x={INNER.x + 16}
        y={innerTop(top) + 24}
        fontSize={13}
        className="fill-fg-muted"
      >
        {innerNote}
      </text>
      <g opacity={termsPaid ? 1 : 0.4}>
        <Vault x={INNER_X} y={innerVaultY} of="triple" />
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
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-bg p-4 md:p-6">
      <svg
        viewBox={`0 0 ${WIDTH} ${height}`}
        role="img"
        aria-label={label}
        className="block h-auto w-full min-w-3xl font-sans"
      >
        <defs>
          <Arrowhead id="money-flow-arrow" size={9} />
          <Arrowhead id="money-flow-strong" size={12} />
        </defs>
        {children}
      </svg>
    </div>
  );
}

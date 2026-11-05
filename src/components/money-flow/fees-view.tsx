import type { ReactNode } from 'react';

import type { DepositFlow, FeesByKind } from './money-flow-model';

import {
  Amount,
  CENTRE,
  Drawing,
  drop,
  Flow,
  Gain,
  INNER_X,
  innerVaultTop,
  NestedTriple,
  number,
  OUTER_VAULT_X,
  outerVaultTop,
  SPACEX_X,
  termVaultTop,
  WORTH_X,
} from './flow-parts';
import { feesByKind } from './money-flow-model';

const HEIGHT = 544;
const FEES = { y: 12, height: 68 };
const SPLIT = { y: 138, height: 76 };
const SPLIT_BAR = 110;
const FRACTION_BAR = 238;
const TRIPLE = 288;
const GAIN_Y = FRACTION_BAR + 20;
const PROTOCOL_X = 960;

const CELL = 'py-2 text-right tabular-nums';

/** What receives a deposit's fees, by kind. */
function FeeSplit({
  title,
  fees,
  children,
}: {
  title: string;
  fees: FeesByKind;
  children: ReactNode;
}): ReactNode {
  return (
    <section className="rounded-2xl border border-border bg-bg p-5">
      <h2 className="text-sm font-medium">{title}</h2>
      <table className="mt-3 w-full text-sm">
        <thead>
          <tr className="border-b border-border text-fg-muted">
            <th scope="col" className="py-2 text-left font-normal">
              To atoms
            </th>
            <th scope="col" className="py-2 text-right font-normal">
              To triples
            </th>
            <th scope="col" className="py-2 text-right font-normal">
              To the protocol
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="py-2 text-left tabular-nums">
              {number(fees.atoms)} TRUST
            </td>
            <td className={CELL}>{number(fees.triples)} TRUST</td>
            <td className={CELL}>{number(fees.protocol)} TRUST</td>
          </tr>
        </tbody>
      </table>
      {children}
    </section>
  );
}

/**
 * Where the fees go: to the protocol, to the triple's vault, and to its three
 * terms, where they stop. Under it, the same by kind.
 */
export function FeesView({ flow }: { flow: DepositFlow }): ReactNode {
  const feesEnd = FEES.y + FEES.height;
  const splitEnd = SPLIT.y + SPLIT.height;
  const toTerm = (x: number, y: number): string =>
    drop(CENTRE, splitEnd, FRACTION_BAR, x, y);

  return (
    <div className="flex flex-col gap-4">
      <Drawing
        height={HEIGHT}
        label={`Of ${number(flow.fees)} TRUST in fees, ${number(flow.protocol)} goes to the protocol, ${number(flow.entry)} stays in the outer triple's vault, and ${number(flow.perTerm)} goes to each of SpaceX, will be worth and the inner triple. The inner triple's atoms get nothing from this deposit.`}
      >
        <NestedTriple
          top={TRIPLE}
          gain={`+${number(flow.entry)}`}
          gainNotes={['Entry fee: lifts what', 'its shares are worth']}
          innerNote="Inner triple keeps its part"
          termsPaid
        />

        <Flow d={drop(CENTRE, feesEnd, SPLIT_BAR, OUTER_VAULT_X, SPLIT.y)} />
        <Flow d={`M${CENTRE} ${feesEnd}V${SPLIT.y}`} />
        <Flow d={drop(CENTRE, feesEnd, SPLIT_BAR, PROTOCOL_X, SPLIT.y)} />
        <Flow d={`M${OUTER_VAULT_X} ${splitEnd}V${outerVaultTop(TRIPLE)}`} />
        <Flow d={toTerm(SPACEX_X, termVaultTop(TRIPLE))} />
        <Flow d={toTerm(WORTH_X, termVaultTop(TRIPLE))} />
        <Flow d={toTerm(INNER_X, innerVaultTop(TRIPLE))} />

        <Amount
          x={CENTRE}
          {...FEES}
          width={220}
          amount={number(flow.fees)}
          label={`Fees on ${number(flow.deposit)} (2.65%)`}
        />
        <Amount
          x={OUTER_VAULT_X}
          {...SPLIT}
          width={140}
          amount={number(flow.entry)}
          label="Entry fee (0.5%)"
        />
        <Amount
          x={CENTRE}
          {...SPLIT}
          width={220}
          amount={number(flow.atomFraction)}
          label="Atom deposit fraction (0.9%)"
        />
        <Amount
          x={PROTOCOL_X}
          {...SPLIT}
          width={170}
          amount={number(flow.protocol)}
          label="Protocol fee (1.25%)"
        />

        <Gain x={SPACEX_X} y={GAIN_Y} amount={`+${flow.perTerm}`} />
        <Gain x={WORTH_X} y={GAIN_Y} amount={`+${flow.perTerm}`} />
        <Gain x={INNER_X} y={GAIN_Y} amount={`+${flow.perTerm}`} />
      </Drawing>

      <FeeSplit
        title={`Fees of ${number(flow.deposit)} on the outer triple`}
        fees={feesByKind(flow, 2)}
      >
        <p className="mt-3 text-sm text-fg-muted">
          Atoms: 6 each to SpaceX and will be worth. Triples: 10 to the outer
          triple and 6 to the inner triple. Each part lifts what that vault's
          shares are worth, and none goes further down.
        </p>
      </FeeSplit>
    </div>
  );
}

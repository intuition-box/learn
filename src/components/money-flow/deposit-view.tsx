import type { ReactNode } from 'react';

import type { DepositFlow } from './money-flow-model';

import {
  Amount,
  appearsAt,
  CENTRE,
  Drawing,
  route,
  Flow,
  NestedTriple,
  number,
  OUTER_VAULT_X,
  outerVaultPort,
  runsAt,
} from './flow-parts';
import { BUILDER_FLAT, BUILDER_RATE } from './money-flow-model';

const HEIGHT = 686;
const CLAIM = 12;
const SPLIT = { y: 352, height: 76 };
const ENTERS = { y: 486, height: 68 };
const SENT = { y: 606, height: 68 };
const TO_VAULT_BAR = 326;
const SPLIT_BAR = 457;
const SENT_BAR = 580;
const BUILDER_X = 880;
const FEES_X = 960;

/** The money itself, rising from what the user sends to the position. All of it in one vault. */
export function DepositView({ flow }: { flow: DepositFlow }): ReactNode {
  const splitEnd = SPLIT.y + SPLIT.height;
  const entersEnd = ENTERS.y + ENTERS.height;

  return (
    <Drawing
      height={HEIGHT}
      label={`The user sends ${number(flow.sent)} TRUST: ${number(flow.builderFee)} for the builder, and ${number(flow.deposit)} into MultiVault. ${number(flow.fees)} of it goes to fees, and the ${number(flow.position)} left is the depositor's position, all of it in the outer triple's vault and none in any atom.`}
    >
      <NestedTriple
        top={CLAIM}
        gain={`+${number(flow.position)}`}
        gainNotes={['The whole position', 'buys shares here']}
        gainAt={appearsAt(3)}
        innerNote="Inner triple: 0"
        termsPaid={false}
      />

      <Flow
        d={`M${CENTRE} ${SENT.y}V${entersEnd}`}
        at={runsAt(0)}
        coin="money"
      />
      <Flow
        d={route(CENTRE, SENT.y, SENT_BAR, BUILDER_X, entersEnd)}
        at={runsAt(0)}
        coin="fee"
      />
      <Flow
        d={route(CENTRE, ENTERS.y, SPLIT_BAR, FEES_X, splitEnd)}
        at={runsAt(1)}
        coin="fee"
      />
      <Flow
        d={`M${CENTRE} ${ENTERS.y}V${splitEnd}`}
        at={runsAt(1)}
        coin="money"
        strong
      />
      <Flow
        d={route(
          CENTRE,
          SPLIT.y,
          TO_VAULT_BAR,
          OUTER_VAULT_X,
          outerVaultPort(CLAIM),
        )}
        at={runsAt(2)}
        coin="money"
        strong
      />

      <Amount
        x={CENTRE}
        {...SENT}
        width={220}
        amount={number(flow.sent)}
        label="User sends"
        at={appearsAt(0)}
      />
      <Amount
        x={BUILDER_X}
        {...ENTERS}
        width={270}
        amount={number(flow.builderFee)}
        label={`Builder fee, optional (${BUILDER_RATE / 100}% of ${number(flow.sent)} + ${BUILDER_FLAT})`}
        look="optional"
        at={appearsAt(1)}
        fee
      />
      <Amount
        x={CENTRE}
        {...ENTERS}
        width={220}
        amount={number(flow.deposit)}
        label="Enters MultiVault"
        at={appearsAt(1)}
      />
      <Amount
        x={CENTRE}
        {...SPLIT}
        width={220}
        amount={number(flow.position)}
        label="Position (97.35%)"
        look="strong"
        at={appearsAt(2)}
      />
      <Amount
        x={FEES_X}
        {...SPLIT}
        width={170}
        amount={number(flow.fees)}
        label="Fees (2.65%)"
        at={appearsAt(2)}
        fee
      />
    </Drawing>
  );
}

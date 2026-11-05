import type { ReactNode } from 'react';

import type { DepositFlow } from './money-flow-model';

import {
  Amount,
  CENTRE,
  Drawing,
  drop,
  Flow,
  NestedTriple,
  number,
  OUTER_VAULT_X,
  outerVaultTop,
} from './flow-parts';

const HEIGHT = 660;
const TO_VAULT_BAR = 370;
const SENT = { y: 12, height: 68 };
const ENTERS = { y: 132, height: 68 };
const SPLIT = { y: 258, height: 76 };
const SPLIT_BAR = 230;
const TRIPLE = 402;
const BUILDER_X = 880;
const FEES_X = 960;

/** The money itself: what the user sends, and where the position lands. All of it in one vault. */
export function DepositView({ flow }: { flow: DepositFlow }): ReactNode {
  const sentEnd = SENT.y + SENT.height;
  const entersEnd = ENTERS.y + ENTERS.height;

  return (
    <Drawing
      height={HEIGHT}
      label={`The user sends ${number(flow.sent)} TRUST: ${number(flow.builderFee)} for the builder, and ${number(flow.deposit)} into MultiVault. ${number(flow.fees)} of it goes to fees, and the ${number(flow.position)} left is the depositor's position, all of it in the outer triple's vault and none in any atom.`}
    >
      <NestedTriple
        top={TRIPLE}
        gain={`+${number(flow.position)}`}
        gainNotes={['The whole position', 'buys shares here']}
        innerNote="Inner triple: 0"
        termsPaid={false}
      />

      <Flow d={`M${CENTRE} ${sentEnd}V${ENTERS.y}`} />
      <Flow
        d={drop(CENTRE, sentEnd, (sentEnd + ENTERS.y) / 2, BUILDER_X, ENTERS.y)}
      />
      <Flow d={drop(CENTRE, entersEnd, SPLIT_BAR, FEES_X, SPLIT.y)} />
      <Flow d={`M${CENTRE} ${entersEnd}V${SPLIT.y}`} strong />
      <Flow
        d={drop(
          CENTRE,
          SPLIT.y + SPLIT.height,
          TO_VAULT_BAR,
          OUTER_VAULT_X,
          outerVaultTop(TRIPLE),
        )}
        strong
      />

      <Amount
        x={CENTRE}
        {...SENT}
        width={220}
        amount={number(flow.sent)}
        label="User sends"
      />
      <Amount
        x={BUILDER_X}
        {...ENTERS}
        width={210}
        amount={number(flow.builderFee)}
        label="Builder fee, optional (1%)"
        look="optional"
      />
      <Amount
        x={CENTRE}
        {...ENTERS}
        width={220}
        amount={number(flow.deposit)}
        label="Enters MultiVault"
      />
      <Amount
        x={CENTRE}
        {...SPLIT}
        width={220}
        amount={number(flow.position)}
        label="Position (97.35%)"
        look="strong"
      />
      <Amount
        x={FEES_X}
        {...SPLIT}
        width={170}
        amount={number(flow.fees)}
        label="Fees (2.65%)"
      />
    </Drawing>
  );
}

---
title: Deposit and redeem
description: Deposit TRUST into a term's vault to signal, redeem shares to withdraw, and protect each transaction against price changes.
---

A deposit buys shares in a term's vault. It is a signal: support for an atom,
agreement with a triple, or disagreement with a triple, made through its
counter-triple. Redeeming returns shares to the vault in exchange for TRUST.
See
[Vaults and signals](../concepts/vaults-and-signals.md) for the model and its
fees.

## Before you begin

You need:

- the `config` object with a wallet client, as set up in
  [Publish onchain](./publish-onchain.md#set-up),
- an account that holds TRUST, or testnet TRUST, and
- the identifier of a registered term. To register one, see
  [Publish onchain](./publish-onchain.md).

## Choose a curve

Every deposit and redemption names a bonding curve, and each term has one
vault per curve. Use the protocol's default curve unless your application has
a reason to choose another:

```ts
import { multiVaultGetBondingCurveConfig } from '@0xintuition/protocol';

const { defaultCurveId } = await multiVaultGetBondingCurveConfig(config);
```

A term's vault on the default curve opens when the term is created. A vault
on another curve opens with the first deposit into it.

## Deposit

`deposit` takes the receiver of the shares, the term, the curve, and the
minimum number of shares you accept. The amount to deposit is the
transaction's value.

1. Preview the deposit to see how many shares it buys after fees:

   ```ts
   import { multiVaultPreviewDeposit } from '@0xintuition/protocol';
   import { parseEther } from 'viem';

   const amount = parseEther('1');

   const [expectedShares] = await multiVaultPreviewDeposit(config, {
     args: [termId, defaultCurveId, amount],
   });
   ```

   `termId` is the identifier of the atom, triple, or counter-triple you
   deposit into. `parseEther('1')` is 1 TRUST, in wei.

2. Set the minimum you accept. The price can move between the preview and
   the transaction. This example tolerates a 1% change:

   ```ts
   const minShares = (expectedShares * 99n) / 100n;
   ```

3. Send the deposit:

   ```ts
   import { multiVaultDeposit } from '@0xintuition/protocol';

   const hash = await multiVaultDeposit(config, {
     args: [account.address, termId, defaultCurveId, minShares],
     value: amount,
   });

   await publicClient.waitForTransactionReceipt({ hash });
   ```

   `account.address` is your own address, so the shares are yours.

After the transaction is mined, `multiVaultGetShares` returns your new
balance:

```ts
import { multiVaultGetShares } from '@0xintuition/protocol';

const shares = await multiVaultGetShares(config, {
  args: [account.address, termId, defaultCurveId],
});
```

The amount must be at least the contract's minimum deposit, `minDeposit`,
which you can read with `multiVaultGetGeneralConfig`. If the deposit would buy
fewer shares than `minShares`, the transaction reverts and you keep your
TRUST.

### Signal disagreement with a triple

To disagree with a triple, deposit into its counter-triple:

```ts
import { calculateCounterTripleId } from '@0xintuition/ids';

const counterTripleId = calculateCounterTripleId(tripleId);
```

Then deposit into `counterTripleId` as above. An account can hold shares on
only one side of a triple per curve. To change sides, redeem your shares on
the other side first.

## Redeem

`redeem` takes the receiver of the TRUST, the term, the curve, the number of
shares, and the minimum amount you accept.

1. Read how many shares you can redeem:

   ```ts
   import { multiVaultMaxRedeem } from '@0xintuition/protocol';

   const sharesToRedeem = await multiVaultMaxRedeem(config, {
     args: [account.address, termId, defaultCurveId],
   });
   ```

   To redeem part of a position, use a smaller number.

2. Preview the redemption to see what it pays after fees:

   ```ts
   import { multiVaultPreviewRedeem } from '@0xintuition/protocol';

   const [expectedAssets] = await multiVaultPreviewRedeem(config, {
     args: [termId, defaultCurveId, sharesToRedeem],
   });

   const minAssets = (expectedAssets * 99n) / 100n;
   ```

3. Send the redemption:

   ```ts
   import { multiVaultRedeem } from '@0xintuition/protocol';

   const hash = await multiVaultRedeem(config, {
     args: [account.address, termId, defaultCurveId, sharesToRedeem, minAssets],
   });

   await publicClient.waitForTransactionReceipt({ hash });
   ```

The TRUST is sent to the receiver, here your own address.

## Deposit or redeem in batches

`multiVaultDepositBatch` and `multiVaultRedeemBatch` act on several vaults in
one transaction. They take one receiver and parallel arrays, one entry per
vault:

```ts
import { multiVaultDepositBatch } from '@0xintuition/protocol';

const amounts = [parseEther('0.5'), parseEther('0.5')];

const hash = await multiVaultDepositBatch(config, {
  args: [
    account.address,
    [atomId, tripleId],
    [defaultCurveId, defaultCurveId],
    amounts,
    [0n, 0n],
  ],
  value: amounts[0] + amounts[1],
});
```

The transaction's value must equal the sum of the amounts. The last array
holds the minimum shares for each vault. `0n` accepts any result, so set real
minimums from a preview in production. `multiVaultRedeemBatch` takes the
receiver, the terms, the curves, the shares, and the minimum amounts.

## Read the result of a transaction

The `Deposited` and `Redeemed` events report the exact outcome. The
`@0xintuition/protocol` event parsers wait for the receipt and decode them:

```ts
import { eventParseDeposited } from '@0xintuition/protocol';

const [event] = await eventParseDeposited(publicClient, hash);
event.args.shares; // Shares received
event.args.assetsAfterFees; // TRUST added to the vault, after fees
```

`eventParseRedeemed` does the same for redemptions.

## Deposit on behalf of another account

By default, only the receiver can deposit for itself or redeem its own
shares. An account can allow another address to do either, for example a
[fee proxy](./fee-proxy.md):

```ts
import { multiVaultApprove } from '@0xintuition/protocol';

const hash = await multiVaultApprove(config, {
  args: [operatorAddress, 1],
});
```

`operatorAddress` is the address you approve. The second argument is the
approval type:

| Value | Allows the address to             |
| ----- | --------------------------------- |
| `0`   | Nothing. Revokes an approval      |
| `1`   | Deposit on your behalf            |
| `2`   | Redeem on your behalf             |
| `3`   | Deposit and redeem on your behalf |

## Common errors

| Error                                   | Cause                                                           |
| --------------------------------------- | --------------------------------------------------------------- |
| `MultiVault_DepositBelowMinimumDeposit` | The amount is below `minDeposit`                                |
| `MultiVault_SlippageExceeded`           | The result is below `minShares` or `minAssets`                  |
| `MultiVault_HasCounterStake`            | You hold shares on the other side of this triple, on this curve |
| `MultiVault_InsufficientSharesInVault`  | You asked to redeem more shares than you can                    |
| `MultiVault_SenderNotApproved`          | The sender is not approved to deposit for the receiver          |
| `MultiVault_RedeemerNotApproved`        | The sender is not approved to redeem for the receiver           |
| `MultiVaultCore_TermDoesNotExist`       | The term is not registered                                      |

## Related

- [Vaults and signals](../concepts/vaults-and-signals.md)
- [Read the chain](./read-the-chain.md)
- [Fee proxy](./fee-proxy.md)

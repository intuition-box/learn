---
title: Read the chain
description: Check whether terms are registered, read their data, and read vaults, share prices, and positions from the MultiVault contract.
---

Reading from the protocol needs only an RPC endpoint. The public Intuition
endpoints need no key. Every read on this page is a call to the `MultiVault`
contract, made through a helper from `@0xintuition/protocol`.

## Before you begin

Install the packages, as described in [Packages](./packages.md):

```bash
pnpm add @0xintuition/protocol@3.0.0 @0xintuition/deployments@alpha @0xintuition/ids@alpha viem
```

## Set up a client

```ts
import {
  getMultiVaultAddressFromChainId,
  intuitionMainnet,
} from '@0xintuition/deployments';
import { createPublicClient, http } from 'viem';

const publicClient = createPublicClient({
  chain: intuitionMainnet,
  transport: http(),
});

const config = {
  address: getMultiVaultAddressFromChainId(intuitionMainnet.id),
  publicClient,
};
```

Replace `intuitionMainnet` with `intuitionTestnet` to read the testnet. The
examples below use this `config`.

## Check whether terms are registered

`isTermCreated` accepts the identifier of an atom, a triple, or a
counter-triple. Derive the identifier offline with `@0xintuition/ids`.

```ts
import { calculateAtomId } from '@0xintuition/ids';
import { multiVaultIsTermCreated } from '@0xintuition/protocol';

const atomId = calculateAtomId('hello');

const isCreated = await multiVaultIsTermCreated(config, { args: [atomId] });
```

To check several terms, use a multicall. It sends one request, however many
terms you ask about.

```ts
import { MultiVaultAbi } from '@0xintuition/protocol';
import type { Hex } from 'viem';

const ids: Hex[] = [calculateAtomId('hello'), calculateAtomId('world')];

const results = await publicClient.multicall({
  allowFailure: false,
  contracts: ids.map((id) => ({
    address: config.address,
    abi: MultiVaultAbi,
    functionName: 'isTermCreated' as const,
    args: [id] as const,
  })),
});
// One boolean per identifier, in the order of ids
```

## Read a term

An atom's data is stored onchain as bytes. Decode it to read text atoms.

```ts
import { multiVaultGetAtom } from '@0xintuition/protocol';
import { hexToString } from 'viem';

const data = await multiVaultGetAtom(config, { args: [atomId] });
const text = hexToString(data); // 'hello'
```

A triple is stored as the identifiers of its subject, predicate, and object.

```ts
import { multiVaultGetTriple } from '@0xintuition/protocol';

const [subjectId, predicateId, objectId] = await multiVaultGetTriple(config, {
  args: [tripleId],
});
```

`tripleId` is the identifier of a registered triple. Derive it with
`calculateTripleId`, and derive its counter-triple with
`calculateCounterTripleId`. Both are in `@0xintuition/ids`.

To find out what kind of term an identifier names, use `multiVaultIsAtom`,
`multiVaultIsTriple`, or `multiVaultIsCounterTriple`.

## Read a vault

Each term has one vault per bonding curve. Terms are created on the
protocol's default curve. Read its identifier once and reuse it:

```ts
import {
  multiVaultCurrentSharePrice,
  multiVaultGetBondingCurveConfig,
  multiVaultGetVault,
} from '@0xintuition/protocol';

const { defaultCurveId } = await multiVaultGetBondingCurveConfig(config);

const [totalAssets, totalShares] = await multiVaultGetVault(config, {
  args: [atomId, defaultCurveId],
});

const sharePrice = await multiVaultCurrentSharePrice(config, {
  args: [atomId, defaultCurveId],
});
```

Amounts are in wei, the smallest unit of TRUST. Format them for display with
`formatEther` from viem. See [Vaults and signals](../concepts/vaults-and-signals.md)
for how vaults and curves work.

## Read an account's position

A position is the number of shares an account holds in one vault.

```ts
import {
  multiVaultConvertToAssets,
  multiVaultGetShares,
} from '@0xintuition/protocol';

const shares = await multiVaultGetShares(config, {
  args: [accountAddress, atomId, defaultCurveId],
});

const value = await multiVaultConvertToAssets(config, {
  args: [atomId, defaultCurveId, shares],
});
```

`accountAddress` is the address of the account. `value` is what the shares
are worth at the current share price, before the fees that apply on
redemption. To see what a redemption would pay after fees, preview it, as
described in [Deposit and redeem](./deposit-and-redeem.md#redeem).

The contract answers for one account and one vault at a time. To list every
position an account holds, query a node. See
[Query with SQL](./query-with-sql.md#positions-of-an-account).

## Read costs and fees

The cost of creating a term and the vault fee rates are contract
configuration and can change. Read them when you need them.

```ts
import {
  multiVaultGetAtomCost,
  multiVaultGetGeneralConfig,
  multiVaultGetTripleCost,
  multiVaultGetVaultFees,
} from '@0xintuition/protocol';

const atomCost = await multiVaultGetAtomCost(config);
const tripleCost = await multiVaultGetTripleCost(config);

const { entryFee, exitFee, protocolFee } = await multiVaultGetVaultFees(config);
const { feeDenominator, minDeposit } = await multiVaultGetGeneralConfig(config);
```

Costs are in wei. A fee rate is a fraction of `feeDenominator`: the fee on an
amount is `amount × rate / feeDenominator`. `minDeposit` is the smallest
deposit the contract accepts.

## Other read helpers

`@0xintuition/protocol` wraps the `MultiVault` functions in helpers with the
prefix `multiVault`. These are the ones applications use most.

| Helper                                                         | Returns                                                     |
| -------------------------------------------------------------- | ----------------------------------------------------------- |
| `multiVaultMaxRedeem`                                          | The most shares an account can redeem from a vault          |
| `multiVaultConvertToShares`                                    | The shares an amount buys at the current price, before fees |
| `multiVaultPreviewDeposit`, `multiVaultPreviewRedeem`          | The outcome of a deposit or a redemption, after fees        |
| `multiVaultPreviewAtomCreate`, `multiVaultPreviewTripleCreate` | The outcome of a creation with an initial deposit           |
| `multiVaultGetCounterIdFromTripleId`                           | The counter-triple of a triple                              |
| `multiVaultCalculateAtomId`, `multiVaultCalculateTripleId`     | The contract's own identifier derivation                    |

The preview helpers simulate the call from an account, so their
configuration also needs a `walletClient`. The identifier helpers return the
same values as `@0xintuition/ids`, which needs no network call.

## Read at scale

Contract reads answer questions about individual terms. To search, filter, or
traverse the graph, query an Intuition Core node, which indexes the chain's
events. See the [REST API](./rest-api.md) and
[Query with SQL](./query-with-sql.md).

## Related

- [Networks and contracts](./networks-and-contracts.md)
- [Publish onchain](./publish-onchain.md)
- [Deposit and redeem](./deposit-and-redeem.md)

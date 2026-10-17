---
title: Publish onchain
description: Register atoms and triples with the MultiVault contract, with an optional first deposit into their vaults.
---

Publishing registers a term with the protocol. The term keeps its identifier.
What changes is that it becomes permanent and public, and gains a vault that
anyone can deposit into.

## Before you begin

You need:

- the packages installed, as described in [Packages](./packages.md),
- an account that holds TRUST, or testnet TRUST from
  [testnet.hub.intuition.systems](https://testnet.hub.intuition.systems) when
  you work on the testnet, and
- the data of the atoms you intend to create.

Develop against the testnet or a [local devnet](../node/local-devnet.md)
before you send transactions on mainnet.

## Set up

```ts
import {
  getMultiVaultAddressFromChainId,
  intuitionTestnet,
} from '@0xintuition/deployments';
import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);

const publicClient = createPublicClient({
  chain: intuitionTestnet,
  transport: http(),
});

const walletClient = createWalletClient({
  account,
  chain: intuitionTestnet,
  transport: http(),
});

const config = {
  address: getMultiVaultAddressFromChainId(intuitionTestnet.id),
  publicClient,
  walletClient,
};
```

`PRIVATE_KEY` is the private key of the account that pays for the
transactions. To sign with a browser wallet instead, see
[Use a browser wallet](./packages.md#use-a-browser-wallet).

## Check whether a term exists

A term can be registered only once. Creating an atom whose data is already
registered reverts with `MultiVault_AtomExists`, and creating an existing
triple reverts with `MultiVault_TripleExists`. Check before you send:

```ts
import { calculateAtomId } from '@0xintuition/ids';
import { multiVaultIsTermCreated } from '@0xintuition/protocol';
import { toHex } from 'viem';

const data = toHex('https://github.com/oven-sh/bun');
const atomId = calculateAtomId(data);

const exists = await multiVaultIsTermCreated(config, { args: [atomId] });
```

`toHex` encodes the text as UTF-8 bytes, which is the form the contract
stores. Derive the identifier from the same bytes you send, so the two always
match.

## Create atoms

`createAtoms` takes two arrays of the same length: the atom data, as bytes,
and one amount per atom.

1. Read the current atom cost:

   ```ts
   import { multiVaultGetAtomCost } from '@0xintuition/protocol';

   const atomCost = await multiVaultGetAtomCost(config);
   ```

2. Send the transaction. Its value must equal the sum of the amounts:

   ```ts
   import { multiVaultCreateAtoms } from '@0xintuition/protocol';

   const hash = await multiVaultCreateAtoms(config, {
     args: [[data], [atomCost]],
     value: atomCost,
   });
   ```

3. Wait for the transaction to be mined:

   ```ts
   const receipt = await publicClient.waitForTransactionReceipt({ hash });
   ```

   `receipt.status` is `success`, and `multiVaultIsTermCreated` now returns
   `true` for `atomId`.

Each amount must be at least the atom cost. Any amount above the cost is
deposited, after fees, into the new atom's vault on your behalf. To create
several atoms in one transaction, add more entries to both arrays.

The contract also limits the size of a call. Read the limits before you
build large batches or long atom data:

```ts
import { multiVaultGetGeneralConfig } from '@0xintuition/protocol';

const { atomDataMaxLength } = await multiVaultGetGeneralConfig(config);
```

`atomDataMaxLength` is the longest atom data the contract accepts, in bytes.
A call also accepts at most `MAX_BATCH_SIZE` entries, a constant of the
`MultiVault` contract.

The helper simulates the transaction before sending it, so a call that would
revert throws an error before any gas is spent.

### Structured atoms

An atom's data can be any bytes, but data that follows a shared structure
lets applications agree on the same atom. `@0xintuition/classifications`
builds JSON-LD atom data for known kinds of things, with the fields in a fixed
order:

```ts
import { buildAtomData } from '@0xintuition/classifications';
import { toHex } from 'viem';

const accountData = toHex(
  buildAtomData('ethereum-account', {
    address: '0x0000000000000000000000000000000000000001',
  }),
);
```

Install it with `pnpm add @0xintuition/classifications@alpha`. Create
`accountData` with `createAtoms`, as above.

## Create triples

`createTriples` takes four arrays of the same length: the subject, predicate,
and object identifiers, and one amount per triple. Every term must already be
registered. A subject or an object can itself be a triple.

This example states that a repository has the tag `javascript runtime`, using
the canonical `has tag` predicate. A canonical predicate is an atom like any
other, and it may not be registered on the network yet. The example first
creates whichever of the three atoms are missing, the predicate included.

```ts
import { calculateAtomId, calculateTripleId } from '@0xintuition/ids';
import { atomData as hasTagData } from '@0xintuition/predicates/hasTag';
import {
  multiVaultCreateAtoms,
  multiVaultCreateTriples,
  multiVaultGetAtomCost,
  multiVaultGetTripleCost,
  multiVaultIsTermCreated,
} from '@0xintuition/protocol';
import { toHex, type Hex } from 'viem';

const subject = toHex('https://github.com/oven-sh/bun');
const predicate = toHex(hasTagData);
const object = toHex('javascript runtime');

// 1. Create the atoms that are not registered yet.
const missing: Hex[] = [];
for (const atomData of [subject, predicate, object]) {
  const isCreated = await multiVaultIsTermCreated(config, {
    args: [calculateAtomId(atomData)],
  });
  if (!isCreated) missing.push(atomData);
}

if (missing.length > 0) {
  const atomCost = await multiVaultGetAtomCost(config);
  const hash = await multiVaultCreateAtoms(config, {
    args: [missing, missing.map(() => atomCost)],
    value: atomCost * BigInt(missing.length),
  });
  await publicClient.waitForTransactionReceipt({ hash });
}

// 2. Create the triple.
const subjectId = calculateAtomId(subject);
const predicateId = calculateAtomId(predicate);
const objectId = calculateAtomId(object);
const tripleCost = await multiVaultGetTripleCost(config);

const hash = await multiVaultCreateTriples(config, {
  args: [[subjectId], [predicateId], [objectId], [tripleCost]],
  value: tripleCost,
});
await publicClient.waitForTransactionReceipt({ hash });

const tripleId = calculateTripleId(subjectId, predicateId, objectId);
```

As with atoms, each amount must be at least the triple cost, and any amount
above it is deposited into the triple's vault. Creating a triple also opens
the vault of its counter-triple, so others can signal disagreement. An
account can hold shares on only one side of a triple, as described in
[Deposit and redeem](./deposit-and-redeem.md#signal-disagreement-with-a-triple).
See also [Triples](../concepts/triples.md) and
[Predicates](../concepts/predicates.md).

## Build transactions without sending them

Some components sign elsewhere, such as a smart account or a backend
service. For these, the create, deposit, and redeem helpers have `Encode`
variants that return calldata instead of sending a transaction:

```ts
import { multiVaultCreateAtomsEncode } from '@0xintuition/protocol';

const calldata = multiVaultCreateAtomsEncode([data], [atomCost]);
```

Send the calldata to the `MultiVault` address with a value equal to the sum of
the amounts.

## Common errors

The contract reverts with a named error. viem includes the name in the error
it throws.

| Error                            | Cause                                                       |
| -------------------------------- | ----------------------------------------------------------- |
| `MultiVault_AtomExists`          | An atom with this data is already registered                |
| `MultiVault_TripleExists`        | This triple is already registered                           |
| `MultiVault_TermDoesNotExist`    | A triple refers to a term that is not registered            |
| `MultiVault_InsufficientBalance` | The transaction value does not equal the sum of the amounts |
| `MultiVault_InsufficientAssets`  | An amount is below the atom cost or the triple cost         |
| `MultiVault_ArraysNotSameLength` | The arrays have different lengths                           |
| `MultiVault_AtomDataTooLong`     | The atom data exceeds `atomDataMaxLength`                   |

## Confirm the result

After the transaction is mined, `isTermCreated` returns `true` for each new
term. A node that indexes the chain records the new terms as it processes the
block. See [Index the chain](../node/index-the-chain.md).

## Related

- [Deposit and redeem](./deposit-and-redeem.md)
- [Read the chain](./read-the-chain.md)
- [Networks and contracts](./networks-and-contracts.md)
- [Agent skills](../agents/agent-skills.md), for agents that prepare these
  transactions

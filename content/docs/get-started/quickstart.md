---
title: Quickstart
description: Derive an atom identifier, link three atoms into a triple, and check onchain whether a term is registered.
---

In this quickstart, you derive identifiers on your own machine and then ask
the Intuition mainnet whether one of them is registered. You need no wallet,
no API key, and no account. It takes about five minutes.

## Before you begin

You need:

- Node.js 22.18 or later. These versions run TypeScript files directly.
- pnpm. Any package manager works, but the commands below use pnpm.

## Set up a project

1. Create a folder for the project and open it:

   ```bash
   mkdir intuition-quickstart
   cd intuition-quickstart
   ```

2. Create a file named `package.json` with this content. The `@0xintuition`
   packages are ESM-only, so the project must use ES modules.

   ```json
   {
     "type": "module"
   }
   ```

3. Install the packages:

   ```bash
   pnpm add @0xintuition/ids@alpha @0xintuition/deployments@alpha @0xintuition/protocol@3.0.0 viem
   ```

| Package                    | Purpose in this guide                                |
| -------------------------- | ---------------------------------------------------- |
| `@0xintuition/ids`         | Derives atom and triple identifiers                  |
| `@0xintuition/deployments` | Supplies the chain definition and contract addresses |
| `@0xintuition/protocol`    | Supplies the `MultiVault` contract's ABI             |
| `viem`                     | Reads from the chain                                 |

## Derive an atom identifier

An [atom](../concepts/atoms.md) identifies one thing. It is defined by its
data, such as a URL, a word, or a JSON document, and its identifier is a hash
of that data.

1. Create a file named `quickstart.ts` with this code:

   ```ts
   import { calculateAtomId } from '@0xintuition/ids';

   const atomId = calculateAtomId('hello');
   console.log(atomId);
   ```

2. Run it:

   ```bash
   node quickstart.ts
   ```

   The script prints the atom's identifier:

   ```text
   0xa0e157e5fa1b17d3b54ec73622ce3317296920a06502661617613d59f58e947e
   ```

   If Node.js also prints a warning that type stripping is experimental, you
   can ignore it.

The result depends only on the input. Run the script again, on any machine,
and you get the same value. Change one character of the input, and the whole
identifier changes.

## Link atoms into a triple

A [triple](../concepts/triples.md) is a claim that links a subject, a
predicate, and an object. Here all three are atoms, and the triple's
identifier is derived from their three identifiers.

1. Replace the contents of `quickstart.ts` with this code:

   ```ts
   import { calculateAtomId, calculateTripleId } from '@0xintuition/ids';

   const subjectId = calculateAtomId('hello');
   const predicateId = calculateAtomId('is a');
   const objectId = calculateAtomId('greeting');

   const tripleId = calculateTripleId(subjectId, predicateId, objectId);
   console.log(tripleId);
   ```

2. Run `node quickstart.ts` again. The script prints the triple's identifier:

   ```text
   0xb9efcf81eb4858599ed97a6f69a30462f0720a210e9e4947fe4793d3545dc43c
   ```

> [!NOTE]
> This example uses a plain string as the predicate to keep it short.
> Applications use the canonical predicates, which have fixed identifiers. See
> [Predicates](../concepts/predicates.md).

## Check whether a term is registered

Atoms and triples are both called **terms**. The `MultiVault` contract
registers terms onchain and reports whether a given term exists.

1. Replace the contents of `quickstart.ts` with this code:

   ```ts
   import {
     getMultiVaultAddressFromChainId,
     intuitionMainnet,
   } from '@0xintuition/deployments';
   import { calculateAtomId } from '@0xintuition/ids';
   import { MultiVaultAbi } from '@0xintuition/protocol';
   import { createPublicClient, http } from 'viem';

   const client = createPublicClient({
     chain: intuitionMainnet,
     transport: http(),
   });

   const isCreated = await client.readContract({
     address: getMultiVaultAddressFromChainId(intuitionMainnet.id),
     abi: MultiVaultAbi,
     functionName: 'isTermCreated',
     args: [calculateAtomId('hello')],
   });

   console.log(isCreated);
   ```

   `http()` with no argument uses the public RPC endpoint from the chain
   definition, so you need no API key.

2. Run `node quickstart.ts` again. The script prints:

   ```text
   true
   ```

The atom for `hello` is already registered on mainnet. Someone else created
it. You derived the same identifier without contacting them or any server,
which is the property the rest of Intuition is built on.

## What you learned

- An identifier is a pure function of content, so you can derive it offline.
- The identifier you derive is the identifier the protocol uses onchain.
- Reading the chain needs only the public RPC endpoint.

## Next steps

- [How Intuition works](./how-it-works.md) explains the parts of the system.
- [Identifiers](../concepts/identifiers.md) describes the derivation in detail.
- [Run a node](../node/run-a-node.md) gives you a queryable graph of your own.
- [Publish onchain](../build/publish-onchain.md) registers terms with the
  protocol.

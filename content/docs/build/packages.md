---
title: Packages
description: Install the @0xintuition packages, set up viem clients for the Intuition network, and find the package for each task.
---

The `@0xintuition` packages are TypeScript libraries for building on
Intuition. They derive identifiers, describe the networks and their
contracts, and wrap the protocol's contract calls. Install only the ones you
need.

The packages are ESM-only: they have no CommonJS entry points. The packages
that work with identifiers or the chain declare
[viem](https://viem.sh) 2 as a peer dependency.

## Install

For an application that reads from and writes to the protocol, install these
four packages:

```bash
pnpm add @0xintuition/protocol@3.0.0 @0xintuition/deployments@alpha @0xintuition/ids@alpha viem
```

| Package                    | What it gives you                                                      |
| -------------------------- | ---------------------------------------------------------------------- |
| `@0xintuition/protocol`    | Contract ABIs, with typed helpers for their functions                  |
| `@0xintuition/deployments` | Chain definitions for viem, and contract addresses for each network    |
| `@0xintuition/ids`         | Identifier derivation for atoms, triples, and counter-triples, offline |
| `viem`                     | The client that reads from the chain and sends transactions            |

### Versions and tags

Most packages are on the `0.1.0-alpha` line, published under the `alpha`
distribution tag.

`@0xintuition/protocol` is the exception. Version 3 is published under the
`alpha` tag, and the `latest` tag still points at the earlier `2.x` line,
which has a different API. Always request version 3 explicitly. Version 3 does
not include addresses or chain definitions: import those from
`@0xintuition/deployments`.

> [!NOTE]
> These are alpha releases. Pin exact versions in production, and read the
> release notes before you upgrade.

## Set up the clients

The pages that read from and write to the chain share this setup: a public
client to read, a wallet client to send transactions, and the `MultiVault`
contract address.

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

const address = getMultiVaultAddressFromChainId(intuitionTestnet.id);
```

- `PRIVATE_KEY` is the private key of an account that holds testnet TRUST.
  Keep it in an environment variable, never in source code.
- `http()` with no argument uses the chain's public RPC endpoint.
- Replace `intuitionTestnet` with `intuitionMainnet` to use mainnet.

The protocol helpers take a configuration object as their first argument. A
read helper needs `address` and `publicClient`. A write helper also needs
`walletClient`:

```ts
const config = { address, publicClient, walletClient };
```

### Use a browser wallet

In a web application, the user's wallet signs instead of a private key:

```ts
import 'viem/window';
import { intuitionTestnet } from '@0xintuition/deployments';
import { createWalletClient, custom } from 'viem';

const [account] = await window.ethereum!.request({
  method: 'eth_requestAccounts',
});

const walletClient = createWalletClient({
  account,
  chain: intuitionTestnet,
  transport: custom(window.ethereum!),
});
```

The `viem/window` import declares the type of `window.ethereum`, which the
wallet extension injects.

### Use the React hooks

`@0xintuition/react` wraps the same contract calls in hooks for applications
built with [wagmi](https://wagmi.sh) and TanStack Query. Install it with its
peer dependencies:

```bash
pnpm add @0xintuition/react@alpha @0xintuition/protocol@3.0.0 @0xintuition/deployments@alpha wagmi viem @tanstack/react-query
```

Configure wagmi with the chain definitions from `@0xintuition/deployments`.
Then wrap your application in `IntuitionProvider`, inside the wagmi and
TanStack Query providers, and choose a network:

```tsx
import { IntuitionProvider, useAtomCost } from '@0xintuition/react';

export function App() {
  return (
    <IntuitionProvider network="testnet">
      <AtomCost />
    </IntuitionProvider>
  );
}

function AtomCost() {
  const { data: atomCost } = useAtomCost();
  return <p>{atomCost?.toString()} wei</p>;
}
```

`network` is `mainnet` or `testnet`. The provider resolves the `MultiVault`
address from `@0xintuition/deployments`.

## All packages

| Package                                                                                      | Purpose                                                                       |
| -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| [`@0xintuition/ids`](https://www.npmjs.com/package/@0xintuition/ids)                         | Derives identifiers for atoms, triples, counter-triples, and predicates       |
| [`@0xintuition/predicates`](https://www.npmjs.com/package/@0xintuition/predicates)           | The canonical predicate registry, with fixed identifiers                      |
| [`@0xintuition/classifications`](https://www.npmjs.com/package/@0xintuition/classifications) | Classification specifications, and builders that produce consistent atom data |
| [`@0xintuition/schema-org`](https://www.npmjs.com/package/@0xintuition/schema-org)           | A pinned schema.org vocabulary                                                |
| [`@0xintuition/primitives`](https://www.npmjs.com/package/@0xintuition/primitives)           | Higher-level builders and validators for atoms and triples                    |
| [`@0xintuition/protocol`](https://www.npmjs.com/package/@0xintuition/protocol)               | Contract ABIs, contract helpers, and event parsers                            |
| [`@0xintuition/deployments`](https://www.npmjs.com/package/@0xintuition/deployments)         | Chain definitions and contract addresses                                      |
| [`@0xintuition/curves`](https://www.npmjs.com/package/@0xintuition/curves)                   | Bonding curve mathematics, for previews without a network call                |
| [`@0xintuition/periphery`](https://www.npmjs.com/package/@0xintuition/periphery)             | Helpers for the bridge and router contracts                                   |
| [`@0xintuition/react`](https://www.npmjs.com/package/@0xintuition/react)                     | React hooks for protocol reads and writes                                     |

## What the packages do not cover

The packages talk to the chain, one term at a time. They do not search,
filter, or list the graph, and they do not pin files to IPFS. To search atoms,
list the triples around an atom, or list an account's positions, query an
Intuition Core node through its [REST API](./rest-api.md) or
[with SQL](./query-with-sql.md).

## Related

- [Quickstart](../get-started/quickstart.md)
- [Read the chain](./read-the-chain.md)
- [Publish onchain](./publish-onchain.md)
- [Deposit and redeem](./deposit-and-redeem.md)

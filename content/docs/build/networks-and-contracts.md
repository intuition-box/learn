---
title: Networks and contracts
description: Chain identifiers, RPC endpoints, explorers, and contract addresses for the Intuition mainnet and testnet.
---

This page lists the Intuition networks and the addresses of the protocol
contracts on each. It is written from `@0xintuition/deployments`. In code,
import the values from that package instead of copying them:

```ts
import {
  getContractAddressFromChainId,
  getMultiVaultAddressFromChainId,
  intuitionMainnet,
  intuitionTestnet,
} from '@0xintuition/deployments';

const multiVault = getMultiVaultAddressFromChainId(intuitionMainnet.id);
const registry = getContractAddressFromChainId(
  'BondingCurveRegistry',
  intuitionMainnet.id,
);
```

`intuitionMainnet` and `intuitionTestnet` are viem chain definitions. Pass
them to `createPublicClient` and `createWalletClient`, or to wagmi.

## Networks

|                 | Mainnet                                                          | Testnet                                                                          |
| --------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Name            | Intuition                                                        | Intuition Testnet                                                                |
| Chain ID        | `1155`                                                           | `13579`                                                                          |
| Native currency | TRUST, 18 decimals                                               | tTRUST, 18 decimals                                                              |
| RPC (HTTP)      | `https://rpc.intuition.systems/http`                             | `https://testnet.rpc.intuition.systems/http`                                     |
| RPC (WebSocket) | `wss://rpc.intuition.systems/ws`                                 | `wss://testnet.rpc.intuition.systems/ws`                                         |
| Explorer        | [explorer.intuition.systems](https://explorer.intuition.systems) | [testnet.explorer.intuition.systems](https://testnet.explorer.intuition.systems) |

The RPC endpoints are public and need no key. Testnet TRUST is available from
the faucet at
[testnet.hub.intuition.systems](https://testnet.hub.intuition.systems).

On mainnet, TRUST is also an ERC-20 token on Base, and it moves between Base
and Intuition through the bridge at
[bridge.intuition.systems](https://bridge.intuition.systems).
`@0xintuition/periphery` has helpers for the bridge contracts.

## Protocol contracts

| Contract               | Role                                         | Mainnet                                      | Testnet                                      |
| ---------------------- | -------------------------------------------- | -------------------------------------------- | -------------------------------------------- |
| `MultiVault`           | Registers terms and holds their vaults       | `0x6E35cF57A41fA15eA0EaE9C33e751b01A784Fe7e` | `0xeBc49d356B7f64D888130D85CC6D17114a6843ec` |
| `WrappedTrust`         | Wraps native TRUST as an ERC-20 token        | `0x81cFb09cb44f7184Ad934C09F82000701A4bF672` | `0xDE80b6EE63f7D809427CA350e30093F436A0fe35` |
| `TrustBonding`         | Locks TRUST and distributes rewards          | `0x635bBD1367B66E7B16a21D6E5A63C812fFC00617` | `0xfa1bF01055239C674845aAEe5A5416f98f801BE3` |
| `BondingCurveRegistry` | Lists the bonding curves by curve identifier | `0xd0E488Fb32130232527eedEB72f8cE2BFC0F9930` | `0xbFE8068d5C5117c57d37464e33c937bC08317F88` |
| `Multicall3`           | Batches several reads into one request       | `0xcA11bde05977b3631167028862bE2a173976CA11` | `0xcA11bde05977b3631167028862bE2a173976CA11` |

The TRUST token contract is deployed on Base, at
`0x6cd905dF2Ed214b22e0d48FF17CD4200C1C6d8A3`, and on Base Sepolia, at
`0xA54b4E6e356b963Ee00d1C947f478d9194a1a210`.

`@0xintuition/deployments` also has the addresses of the emissions
controllers, the individual bonding curves, and the atom wallet contracts.
Look them up by name with `getContractAddressFromChainId`.

## Contract source and ABIs

The contracts' Solidity source, ABIs, and bytecode are published as
[`@0xintuition/contracts-v2`](https://www.npmjs.com/package/@0xintuition/contracts-v2).
For application code, use `@0xintuition/protocol`, which exports the ABIs,
such as `MultiVaultAbi`, with typed helpers for their functions.

## Local development

A local devnet uses chain ID `31337`. `@0xintuition/deployments` does not
include it, because its addresses change with each deployment. The deployer
writes them to `devnet/deployments-devnet.json`. See
[Local devnet](../node/local-devnet.md).

To use the devnet from an application, use viem's `anvil` chain and read the
`MultiVault` address from that file:

```ts
import { createPublicClient, http } from 'viem';
import { anvil } from 'viem/chains';

const publicClient = createPublicClient({ chain: anvil, transport: http() });
const address = '0x...'; // MultiVault, from devnet/deployments-devnet.json
```

## Related

- [Read the chain](./read-the-chain.md)
- [Index the chain](../node/index-the-chain.md)

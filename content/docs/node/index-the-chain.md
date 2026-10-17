---
title: Index the chain
description: Point the indexer at a MultiVault deployment and rebuild the knowledge graph from its events.
---

Indexing fills your node with the atoms and triples registered onchain. It
uses the `indexing` Compose profile, a group of services that starts only when
you name it. The profile adds two services:

- The **indexer** reads `MultiVault` events from the chain and writes them to
  the [event store](../reference/glossary.md).
- The **projections** turn those events into read models, and write the
  resulting atoms and triples into the knowledge graph.

The Intuition testnet's RPC endpoint is public and needs no key.

## Before you begin

- A running node. See [Run a node](./run-a-node.md).
- Local ports 9091 and 9092 free. The indexer and the projections publish
  their metrics and health checks on them.

## Configure the chain

Set the following in `.env`. These values index a 500-block window of the
Intuition testnet, which is a quick way to confirm your setup works.

```bash
INTUITION_RPC_URL=https://testnet.rpc.intuition.systems/http
CHAIN_ID=13579
MULTIVAULT_CONTRACT_ADDRESS=0xeBc49d356B7f64D888130D85CC6D17114a6843ec
MULTIVAULT_START_BLOCK=9030416
MULTIVAULT_END_BLOCK=9030916
```

| Variable                      | Required | Meaning                                                                    |
| ----------------------------- | -------- | -------------------------------------------------------------------------- |
| `INTUITION_RPC_URL`           | Yes      | The chain's RPC endpoint                                                   |
| `CHAIN_ID`                    | Yes      | The chain's identifier                                                     |
| `MULTIVAULT_CONTRACT_ADDRESS` | Yes      | The `MultiVault` deployment to index                                       |
| `MULTIVAULT_START_BLOCK`      | Yes      | The first block to index. Use the block in which `MultiVault` was deployed |
| `MULTIVAULT_END_BLOCK`        | No       | The last block to index. Leave it empty to follow the chain continuously   |

To index another deployment, such as mainnet, take its chain ID, RPC endpoint,
and `MultiVault` address from
[Networks and contracts](../build/networks-and-contracts.md).

## Start indexing

1. Start the node with the indexing profile:

   ```bash
   docker compose --profile indexing up -d
   ```

   `make index` runs the same command. On a machine where the node is not set
   up yet, `scripts/bootstrap.sh --indexing` (or `make bootstrap-index`) sets
   it up and starts indexing in one step.

2. Watch the indexer:

   ```bash
   docker compose --profile indexing logs -f indexer
   ```

3. When the range is indexed, the indexer exits with code 0. Confirm it:

   ```bash
   docker compose --profile indexing ps -a indexer
   ```

   The status reads `Exited (0)`. Exiting at the end of a bounded range is
   expected. Any other exit code is a failure.

4. Check that the atoms reached the knowledge graph:

   ```bash
   curl http://localhost:3000/api/stats
   ```

   On a new node, the 500-block window above produces 201 events and 50
   atoms. The projections can take a few seconds to catch up after the
   indexer exits.

## Follow the chain

To index the full history and keep up with new blocks:

1. In `.env`, leave the end block empty:

   ```bash
   MULTIVAULT_END_BLOCK=
   ```

2. Start the profile again:

   ```bash
   docker compose --profile indexing up -d
   ```

The indexer then syncs to the head of the chain and keeps running. Before a
full sync, make sure you have enough disk space and RPC capacity for the
chain's complete history. Both grow with the chain, so there is no fixed
figure.

## What happens to the data

1. The indexer writes each event to the `event_store` table and to a typed
   table for its event type.
2. Projections read the event store and maintain read models for vaults,
   positions, share prices, and signals.
3. The `core_entities` projection writes atoms and triples into the knowledge
   graph.
4. The same workers that process API writes parse, classify, and enrich the
   indexed atoms.

Indexed terms and terms written through the API share one graph. A term you
created locally and that is later registered onchain is recognized as the same
term, because its identifier is the same.

## Reliability

- Each projection records a checkpoint. After a restart, it resumes where it
  stopped.
- The event store ignores an event it already holds, identified by its
  transaction hash and log index, so indexing a block again does not
  duplicate data.
- The indexer stays 10 blocks behind the head of the chain, so a chain
  reorganization shallower than 10 blocks does not reach the event store.

## Monitor progress

```bash
curl -s http://localhost:9091/metrics | grep intuition_sync_progress_percent
curl http://localhost:9092/health/ready
curl http://localhost:3000/api/stats
```

The first command shows the indexer's progress, from 0 to 100, for each event
type. The second returns `OK` once the projections are processing events, and
`503` before then. The third shows the counts in the knowledge graph.

## Related

- [Local devnet](./local-devnet.md) runs a chain of your own.
- [Indexing scope](../extend/indexing-scope.md) limits what a node ingests
  and processes.
- [Configuration](./configuration.md) lists every setting.

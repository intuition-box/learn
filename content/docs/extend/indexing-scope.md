---
title: Indexing scope
description: Choose what a node ingests, projects, processes, and serves, and check a configuration before you start indexing.
---

A node does not have to index and process everything. Indexing scope is the
set of choices that decide what a node handles. The choices apply at four
separate layers, and they differ in whether you can undo them.

## The four layers

| Layer      | Chooses                                                              | Set with                                                                               | Discards source data                                 |
| ---------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Ingestion  | The chain, contract, block range, and event types the indexer stores | `CHAIN_ID`, the `MULTIVAULT_*` variables, and the event list in the indexer's manifest | Yes. Events outside the scope are never stored       |
| Projection | Which read models are built from the stored events                   | `ENABLED_PROJECTIONS` or `DISABLED_PROJECTIONS`                                        | No. The event store remains complete                 |
| Processing | Which atoms are enriched                                             | `WORKERS_PROCESSING_SCOPE` and the provider keys                                       | No. Atoms remain, but their artifacts may be partial |
| Read       | What an API or application exposes                                   | Request filters and application logic                                                  | No                                                   |

Keep the layers distinct. A node that serves only music data still needs the
chain events that establish atom identities, while it can skip market
projections and unrelated enrichment providers.

> [!IMPORTANT]
> Only ingestion scope is irreversible without re-indexing. Narrow it only
> when you are certain the node will never need the excluded events. Use the
> other layers to reduce cost while keeping the option to widen later.

## Ingestion

The chain variables set the network, the `MultiVault` contract, and the block
range. See [Index the chain](../node/index-the-chain.md). The event types are
listed in the indexer's manifest, `crates/rindexer-ingestion/rindexer.yaml`.
By default, it ingests every `MultiVault` event that Core uses.

## Projections

Projections run by name. Set one of these variables, as a comma-separated
list, to choose which ones run:

- `ENABLED_PROJECTIONS` runs only the projections it lists.
- `DISABLED_PROJECTIONS` runs every projection except the ones it lists. It
  is ignored when `ENABLED_PROJECTIONS` is set.

By default, Docker Compose disables `funnel_tracker`, `user_activity_batch`,
`vault_state:dual`, and `vault_holders_index:dual`.

If you use `ENABLED_PROJECTIONS`, include `atom_context:dual` to keep
recording the context URIs that atoms register onchain.

Each projection needs certain events. For example, `vault_state` needs
`Deposited`, `Redeemed`, and `SharePriceChanged`, and `core_entities` needs
`AtomCreated` and `TripleCreated`. The dry run below checks these
requirements for you.

## Processing

Set `WORKERS_PROCESSING_SCOPE` to `full` (the default), `music`, `podcasts`,
or `music-and-podcasts`.

- Parsing and classification still run for every atom, so atom identity and
  classification evidence are preserved.
- Enrichment runs only for atoms in the selected domains, and only with the
  providers for those domains. The worker marks every other atom's
  enrichment as `skipped`.
- Changing the scope does not re-enrich atoms that were skipped earlier, and
  does not delete artifacts that are outside the new scope.

Domain filters such as music apply only at the processing layer. They cannot
be applied at ingestion, because a term's domain is known only after its atom
has been parsed and classified.

## Financial events

Deposits, redemptions, and share price changes drive the market read models:
vaults, positions, signals, and leaderboards. If a node does not ingest these
events, those read models are incomplete. Treat their values as unavailable,
not as zero balances. The dry run reports which read models a configuration
can build, and rejects a configuration that selects a market projection
without the events it needs.

## Validate a configuration

Describe a scope in a JSON file, and check it before you start indexing. The
check prints what the configuration would do. It does not change any service.

### Prerequisites

- A clone of the Intuition Core repository, with its dependencies installed
  (`bun install`).

### Steps

1. Create a scope file, such as `my-scope.json`:

   ```json
   {
     "scope": {
       "preset": "music-and-podcasts",
       "ingestion": {
         "chain_id": 13579,
         "rpc_url": "https://testnet.rpc.intuition.systems/http",
         "contract": "0xeBc49d356B7f64D888130D85CC6D17114a6843ec",
         "start_block": 9030416,
         "end_block": 9030916
       },
       "projections": {
         "exclude": []
       },
       "processing": {
         "providers": {
           "include": ["opengraph", "jsonld", "spotify", "podcast-index"],
           "require_keys": false
         }
       }
     }
   }
   ```

2. Run the dry run from the root of the repository:

   ```bash
   make scope-dry-run SCOPE_CONFIG=./my-scope.json
   ```

   Without `SCOPE_CONFIG`, the command checks the bundled example,
   `docs/indexing-scope.example.json`.

The command prints JSON that contains the equivalent chain variables, the
events and projections the scope selects, each projection's status
(`available` or `unavailable`) with the events it requires, and a preview of
the indexer's manifest. It redacts credentials in the RPC URL.

To apply the scope, set the printed chain variables, set
`ENABLED_PROJECTIONS` to the selected projections, and set
`WORKERS_PROCESSING_SCOPE`. If you narrowed the events, edit the manifest's
event list to match.

### Fields

| Field                                                  | Meaning                                                                                                                                          |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `preset`                                               | A preset from the table below. It fills in any layer that you do not list explicitly. Default `full`                                             |
| `ingestion.chain_id`                                   | The chain identifier. A positive integer                                                                                                         |
| `ingestion.rpc_url`                                    | The chain's RPC endpoint                                                                                                                         |
| `ingestion.contract`                                   | The `MultiVault` address                                                                                                                         |
| `ingestion.start_block`, `ingestion.end_block`         | The block range. `end_block` is optional and must not be lower than `start_block`                                                                |
| `ingestion.events.include`, `ingestion.events.exclude` | Event names: `AtomCreated`, `TripleCreated`, `Deposited`, `Redeemed`, `SharePriceChanged`, or `ProtocolFeeAccrued`. The two lists cannot overlap |
| `projections.bundle`                                   | A preset whose projections to use. Defaults to `preset`                                                                                          |
| `projections.include`, `projections.exclude`           | Projection names, such as `core_entities` or `vault_state`                                                                                       |
| `processing.classifications.include`                   | Domains to process: `music` or `podcast`                                                                                                         |
| `processing.providers.include`                         | Providers for those domains: `opengraph`, `jsonld`, `spotify`, `podcast-index`, `wikipedia`, `wikidata`, `musicbrainz`, or `apple-music`         |
| `processing.providers.require_keys`                    | Whether the selected providers must have their keys. Default `false`, so a provider without its key degrades gracefully                          |

## Presets

A preset is a named combination of choices across the layers.

| Preset                                    | Events                                                             | Projections                                                      | Processing                      |
| ----------------------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------- | ------------------------------- |
| `full`                                    | All                                                                | All, except the `:dual` variants                                 | Every atom                      |
| `kg-only`                                 | `AtomCreated`, `TripleCreated`                                     | `event_log`, `account_registry`, and `core_entities`             | Every atom                      |
| `market-only`                             | `Deposited`, `Redeemed`, `SharePriceChanged`, `ProtocolFeeAccrued` | Vault, position, holder, signal, and leaderboard projections     | Every atom                      |
| `no-analytics`                            | All                                                                | All except signal analytics, leaderboards, and product analytics | Every atom                      |
| `music`, `podcasts`, `music-and-podcasts` | `AtomCreated`, `TripleCreated`                                     | As `kg-only`                                                     | Only atoms in the named domains |

## Related

- [Index the chain](../node/index-the-chain.md)
- [Configuration](../node/configuration.md)
- [Enrichment providers](./enrichment-providers.md)

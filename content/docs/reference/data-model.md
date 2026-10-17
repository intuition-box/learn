---
title: Data model
description: The tables of the knowledge graph and the event store, and how the two databases relate.
---

An Intuition Core node has two PostgreSQL databases. To connect to them, see
[Query with SQL](../build/query-with-sql.md).

| Database        | Name                  | Holds                                                                                              |
| --------------- | --------------------- | -------------------------------------------------------------------------------------------------- |
| Knowledge graph | `intuition_kg`        | Atoms, triples, accounts, predicates, artifacts, API keys, and an activity log, in the `kg` schema |
| Event store     | `intuition_timescale` | Chain events and the read models built from them                                                   |

The two are intentionally separate. You can use the knowledge graph without
indexing the chain. When you do index the chain, projections replay its
events and write the resulting atoms and triples into the knowledge graph.

## Knowledge graph tables

### `kg.nodes`

Atoms. The table is named `nodes` for historical reasons; each row is one
atom.

| Column                                                       | Meaning                                                                                          |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| `id`                                                         | The atom's identifier                                                                            |
| `raw_type`                                                   | The form of the atom data: `string`, `json`, `http_uri`, `ipfs_uri`, or `iid`                    |
| `data`, `data_hex`                                           | The atom data as text and as hexadecimal bytes                                                   |
| `data_resolved`                                              | Content resolved during processing                                                               |
| `status`                                                     | `active` or `draft`                                                                              |
| `visibility`                                                 | `public` or `unlisted`. The API serves only records that are `active` and `public`               |
| `created_by`                                                 | The account that created the atom, when known                                                    |
| `is_onchain`                                                 | Whether the atom has been observed onchain                                                       |
| `parse_status`, `classification_status`, `enrichment_status` | The state of each processing stage: `pending`, `processing`, `completed`, `failed`, or `skipped` |
| `parse_result`, `classification_result`                      | The output of the parse and classify stages                                                      |
| `classification_type`                                        | The atom's normalized type, such as `Person`, used for filtering. `Unknown` until classified     |
| `iid`                                                        | The atom's Intuition Identifier, set only when IID processing is enabled                         |
| `search_text`                                                | Text the API's search matches against                                                            |

Each stage also has columns for its attempt count, error, lease expiry, and
timestamps, such as `parse_attempts`, `parse_error`, and
`parse_lease_expires_at`.

### `kg.triples`

Claims between terms.

| Column                                             | Meaning                                                             |
| -------------------------------------------------- | ------------------------------------------------------------------- |
| `id`                                               | The triple's identifier                                             |
| `subject_id`, `predicate_id`, `object_id`          | The identifiers of the three terms                                  |
| `subject_type`, `predicate_type`, `object_type`    | `node` if the position holds an atom, `triple` if it holds a triple |
| `is_counter_triple`, `sibling_triple_id`           | The link between a triple and its counter-triple                    |
| `status`, `visibility`, `created_by`, `is_onchain` | As for atoms                                                        |
| `edge_kind`                                        | The kind of edge. `claim` by default                                |
| `source`, `source_uri`, `confidence`, `inferred`   | Provenance. `confidence` is between 0 and 1                         |
| `provenance`, `metadata`                           | JSON fields for further provenance and metadata                     |

The table has an index for each of the six orderings of subject, predicate,
and object, so you can find every triple that mentions a term in any
position.

### Other tables

| Table                 | Holds                                                                                                                                                                                                                   |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `kg.accounts`         | Accounts, keyed by wallet address                                                                                                                                                                                       |
| `kg.predicates`       | The predicate registry: `slug`, `label`, `description`, `inverse_predicate_id`, and the flags `is_transitive`, `is_symmetric`, `is_hierarchical`, `is_social`, and `is_market`. A new node is seeded with 14 predicates |
| `kg.artifacts`        | Enrichment output, one row per artifact: `node_id`, `artifact_kind` (the artifact type), `artifact_version`, `status`, `source_uri`, `data`, `extracted`, and `error`                                                   |
| `kg.node_contexts`    | Context URIs registered onchain for an atom through `AtomContextRegistered` events. `uri_hex` holds the exact bytes. `uri_text` is a readable copy when the bytes are valid UTF-8                                       |
| `kg.node_identifiers` | Additional Intuition Identifiers for an atom, written only when IID processing is enabled                                                                                                                               |
| `kg.events`           | An append-only log of activity in the graph: `event_time`, `actor_id`, `entity_kind`, `entity_id`, `event_type`, and a JSON `payload`. `kg.events_hourly` rolls it up by hour                                           |
| `kg.api_keys`         | API keys: `id` (such as `key_...`), `key_hash` (the SHA-256 hash of the key), `name`, `account_id`, `can_write`, `rate_limit_rpm`, `revoked_at`, and `last_used_at`                                                     |

The schema also defines `kg.adjacency`, `kg.node_urls`, `kg.node_stats`,
`kg.account_stats`, `kg.predicate_stats`, and `kg.triple_pattern_stats`. No Core
service writes to these tables yet, so they are empty on a standard node.
For traversal, query `kg.triples`.

## Event store tables

### `event_store`

The canonical log of chain events.

| Column                                          | Meaning                                                                                 |
| ----------------------------------------------- | --------------------------------------------------------------------------------------- |
| `sequence_number`                               | The order in which the event was ingested                                               |
| `block_number`, `block_timestamp`, `block_hash` | The block                                                                               |
| `transaction_hash`, `log_index`                 | The event's position in the chain                                                       |
| `event_type`, `event_data`                      | The event's name, such as `Deposited`, and its decoded fields                           |
| `term_id`                                       | The term the event concerns, when it has one                                            |
| `entity_id`                                     | The account the event concerns: the receiver of a deposit or the sender of a redemption |
| `is_canonical`                                  | Whether the event is on the canonical chain                                             |

> [!NOTE]
> `sequence_number` follows ingestion order, which is not strictly chain
> order across event types. To reconstruct chain order, sort by
> `block_number` and `log_index`.

### Typed event tables

One table for each event type the indexer ingests: `atom_created_events`,
`triple_created_events`, `deposited_events`, `redeemed_events`,
`share_price_changed_events`, `protocol_fee_accrued_events`, and
`atom_context_registered_events`. In these tables, `term_id` is a number.
The `term_id_hex` column holds the same identifier in the hexadecimal form
that the read models and the knowledge graph use.

### Read models

| Table                                                                                              | Holds                                                                                                        |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `term`                                                                                             | Terms registered onchain. `term_type` is `atom` or `triple`                                                  |
| `term_summary`, `term_market_cap_history`, `predicate_object_summary`, `subject_predicate_summary` | Market totals for each term, and rollups by relationship                                                     |
| `vault`                                                                                            | One row per term and curve ID: total shares, total assets, current share price, market cap, and holder count |
| `share_price_history`                                                                              | Share prices over time                                                                                       |
| `position`, `position_change`                                                                      | Each account's shares by term and curve ID, and every change to them                                         |
| `active_vault_position`                                                                            | The accounts that currently hold shares in each vault                                                        |
| `signal`                                                                                           | Each deposit or redemption as a change in signal, by account, term, and curve ID                             |
| `event`, `deposit_fact`, `redemption_fact`, `fee_transfer_fact`                                    | Normalized facts for analytics                                                                               |
| `account`, `account_pnl_state`, `account_pnl_snapshot`                                             | Accounts, and their profit and loss over time                                                                |
| `leaderboard_cache`, `leaderboard_cache_version`                                                   | Versioned leaderboards                                                                                       |
| `stats`, `stats_history`                                                                           | Protocol totals and their history                                                                            |
| `projection_checkpoints`                                                                           | The last event each projection processed                                                                     |
| `projection_dead_letter`                                                                           | Events a projection could not process, held for an operator to inspect                                       |

The event store also contains tables for product analytics. A standard node
does not fill them.

## How the databases relate

The databases are linked by identifier, not by foreign key.

- An atom's `kg.nodes.id` equals its `term_id` in the read models.
- A triple's `kg.triples.id` equals its `term_id` in the read models.

To combine data from both, query each database and join on the identifier in
your application.

## Notes

- The query API's `GET /api/schema` returns the knowledge graph's tables,
  columns, keys, and indexes as JSON.
- Some event store objects, including continuous aggregates, views, and
  compression policies, are defined only in SQL migrations, in
  `migrations/timescale/`. Read the migration before you depend on one.

## Related

- [Query with SQL](../build/query-with-sql.md)
- [Architecture](./architecture.md)
- [Glossary](./glossary.md)

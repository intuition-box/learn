---
title: Architecture
description: The components of Intuition Core, how data flows between them, and how the system stays consistent.
---

Intuition Core turns `MultiVault` events and submitted input into a knowledge
graph you can query. It has one pipeline, two databases, and one rule that
holds throughout: a term's identifier depends only on its content.

## Components

| Component     | Implementation          | Responsibility                                                                                             |
| ------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------- |
| Indexer       | Rust, built on rindexer | Decodes `MultiVault` events and stores them in the event store                                             |
| Projections   | Rust                    | Build read models from stored events, and write onchain atoms and triples into the knowledge graph         |
| Workers       | TypeScript on Bun       | Parse, classify, and enrich each atom. Three workers, one per stage                                        |
| Query API     | TypeScript, Hono        | Serves the knowledge graph over REST and accepts attributed writes. See [REST API](../build/rest-api.md)   |
| Atom services | TypeScript, Hono        | Classifies and enriches input over HTTP without storing it. See [Atom services](../build/atom-services.md) |
| Explorer      | TypeScript, React       | A dashboard that reads the query API. See [Explorer](../node/explorer.md)                                  |

## Data flow

```diagram
Chain events
  │
  ▼
Indexer
  │
  ▼
Event store
  │
  ▼
Projections ─────────▶ Market read models
  │
  ▼
Knowledge graph ◀───── Query API writes
  │
  ▼
Workers: parse ▶ classify ▶ enrich
  │
  ▼
Query API reads
```

Atoms enter the knowledge graph by two routes: from the chain, through the
indexer and the `core_entities` projection, and from clients, through the
query API. Both routes use the same identifiers, so a term that arrives by
both routes is one record.

Each new atom then passes through the three workers. They read the atom from
the knowledge graph and write their results back to it, and the query API
serves the result.

## The two databases

**The knowledge graph** (`intuition_kg`) holds atoms, triples, accounts,
predicates, enrichment artifacts, API keys, and an activity log. Triples are
indexed by all six orderings of subject, predicate, and object, so a query can
traverse a triple from any position. Graph reads are served from PostgreSQL.
Core does not depend on a separate graph database.

**The event store** (`intuition_timescale`) holds an append-only log of chain
events, a typed table for each event type, and the read models that
projections maintain: terms, vaults, positions, share prices, signals,
leaderboards, and protocol totals.

Both databases run on PostgreSQL with the TimescaleDB extension. They share no
foreign keys and are linked by identifier. See the
[Data model](./data-model.md).

## Deterministic identity

An atom's identifier is `keccak256(ATOM_SALT, keccak256(data))`. A triple's
is `keccak256(TRIPLE_SALT, subjectId, predicateId, objectId)`. Core derives
identifiers with `@0xintuition/ids` and tests the results against known
values. The `MultiVault` contract uses the same derivation, so a term's
identifier in a node is its identifier onchain. See
[Identifiers](../concepts/identifiers.md).

## Reliability

| Component   | Mechanism                                                                                                                                                                                                                                    |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Indexer     | Indexes a fixed distance behind the head of the chain to limit exposure to reorganizations. Accepts a bounded block range for test runs                                                                                                      |
| Projections | A checkpoint per projection, so a restart resumes exactly where it stopped. Retries with backoff and circuit breakers. An event that fails permanently is recorded in `projection_dead_letter` and holds the checkpoint until you resolve it |
| Workers     | Each stage claims an atom under a lease. If a worker stops, the lease expires and another worker claims the atom. Attempts per stage are capped                                                                                              |
| Migrations  | Two one-shot jobs, one per database, run before the services start. Both are safe to run again                                                                                                                                               |

## Authentication

API keys are infrastructure credentials, not user accounts. Each key is bound
to an account, and every write made with it is attributed to that account.
The database stores only the SHA-256 hash of each key.

The `API_AUTH` setting decides whether reads, writes, or both require a key.
See [Write data](../node/write-data.md).

User authentication, billing, and product features are outside Core. Core is
the open backend. You supply the application.

## Related

- [How Intuition works](../get-started/how-it-works.md)
- [Run a node](../node/run-a-node.md)
- [Indexing scope](../extend/indexing-scope.md)

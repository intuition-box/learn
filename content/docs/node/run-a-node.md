---
title: Run a node
description: Go from a clone of Intuition Core to a knowledge graph you can query, with no paid accounts.
---

A [node](../reference/glossary.md) is Intuition Core running on your own
machine: two databases, a query API, and workers that parse, classify, and
enrich every atom. You start it with Docker Compose. It needs no paid account
and no API key, and there is no chain to sync before you can use it.

## Requirements

- [Docker](https://docs.docker.com/get-docker/) with Docker Compose v2
- [Bun](https://bun.sh) 1.3 or later
- Git and curl
- At least 5 GiB of free disk space
- These local ports free: 3000, 4010, 4110, 4111, 4112, 5432, 5433, and 6379

Make is optional. Each `make` command in this section is a shortcut for a
`docker compose` or `bun` command defined in the repository's `Makefile`.

## Start the node

1. Clone the repository:

   ```bash
   git clone https://github.com/0xIntuition/intuition-core
   cd intuition-core
   ```

2. Run the bootstrap script:

   ```bash
   scripts/bootstrap.sh
   ```

   The script checks for Docker, Bun, and free disk space. It then creates
   `.env` from `example.env`, installs dependencies, builds and starts the
   services in the background, and waits up to two minutes for the API to
   respond. `make bootstrap` runs the same script.

   The first run builds every service image from source, so it takes longer
   than later runs. When the node is ready, the script prints:

   ```text
   OK API is healthy
   ```

## Verify the node

1. Check that the API is healthy:

   ```bash
   curl http://localhost:3000/health
   ```

   ```json
   { "status": "ok" }
   ```

2. Check the contents of the knowledge graph:

   ```bash
   curl http://localhost:3000/api/stats
   ```

   ```json
   { "data": { "atoms": 0, "triples": 0, "accounts": 0, "predicates": 14 } }
   ```

   A new node has no atoms. The 14 predicates are the baseline set that the
   database migration adds. See [Predicates](../concepts/predicates.md).

To test the whole stack end to end, run the built-in smoke tests:

```bash
make smoke        # Mints an API key, creates atoms and a triple, waits for the workers
make smoke-index  # Indexes a 500-block window of the public testnet
```

Each smoke test starts its own temporary Compose project on random ports and
removes it when it finishes, so it can run alongside your node.

## What is running

| Service                  | Host port | Role                                                                                     |
| ------------------------ | --------- | ---------------------------------------------------------------------------------------- |
| `postgres-kg`            | 5432      | The knowledge graph database: atoms, triples, accounts, predicates, and API keys         |
| `timescale`              | 5433      | The event store database: chain events and the read models built from them               |
| `redis`                  | 6379      | Redis, reserved for coordinating indexer instances                                       |
| `migrate`                | None      | A one-time job that applies the knowledge graph schema and seeds the baseline predicates |
| `timescale-migrate`      | None      | A one-time job that applies the event store schema                                       |
| `api`                    | 3000      | The query API. Reads are open and writes require an API key                              |
| `atom-services`          | 4010      | Classification and enrichment over HTTP, without a database                              |
| `workers-parse`          | 4110      | Parses new atoms                                                                         |
| `workers-enrichment`     | 4111      | Enriches classified atoms with metadata                                                  |
| `workers-classification` | 4112      | Classifies parsed atoms                                                                  |

The two migration jobs exit when they finish. That is expected. The workers
have no API of their own; their ports serve health checks. Indexing adds two
more services, described in [Index the chain](./index-the-chain.md).

## Start without the bootstrap script

```bash
cp example.env .env
bun install --frozen-lockfile
docker compose up -d
```

## Stop the node

```bash
make down
```

This stops every container and keeps your data. To start the node again, run
`make up`. [Operate a node](./operate-a-node.md) covers logs, health checks,
upgrades, and backups.

## Next steps

- [Write data](./write-data.md) creates your first atoms and triples.
- [Index the chain](./index-the-chain.md) builds the graph from onchain events.
- [Explorer](./explorer.md) shows your node's health and data in a browser.
- [Troubleshooting](./troubleshooting.md) covers known failure modes.

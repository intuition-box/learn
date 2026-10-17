---
title: Configuration
description: The environment variables that configure each service of an Intuition Core node.
---

Intuition Core reads its settings from environment variables. When you run
your node with Docker Compose, you set them in `.env` at the root of the
repository. The bootstrap script creates `.env` from `example.env`, which holds
the defaults for local use.

## How Compose uses `.env`

Docker Compose reads `.env` and passes a defined set of variables to each
container. It sets the database connection strings and the ports inside the
containers itself. Under Compose, a variable takes effect only if it appears
in [Settings in `.env`](#settings-in-env).

After you change `.env`, apply the change:

```bash
docker compose up -d
```

Add `--profile indexing` if your node indexes the chain. Compose recreates
only the containers whose settings changed.

> [!IMPORTANT]
> `.env` holds your provider keys. Keep it out of version control, and
> restrict who can read it with `chmod 600 .env`.

## Settings in `.env`

### Query API

| Variable              | Default                          | Purpose                                                                                              |
| --------------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `API_AUTH`            | `public-read`                    | `open`, `public-read`, or `gated`. See [Write data](./write-data.md#authentication-modes)            |
| `API_ALLOWED_ORIGINS` | Empty, which allows every origin | Comma-separated origins allowed by CORS                                                              |
| `API_RATE_LIMIT_RPM`  | `120`                            | Requests per minute for each API key, or for each IP address when no key is sent. `0` means no limit |

### Chain and indexer

These apply when you run the `indexing` profile. See
[Index the chain](./index-the-chain.md).

| Variable                      | Required | Purpose                                                           |
| ----------------------------- | -------- | ----------------------------------------------------------------- |
| `INTUITION_RPC_URL`           | Yes      | The chain's RPC endpoint                                          |
| `CHAIN_ID`                    | Yes      | The chain's identifier                                            |
| `MULTIVAULT_CONTRACT_ADDRESS` | Yes      | The `MultiVault` deployment to index                              |
| `MULTIVAULT_START_BLOCK`      | Yes      | The first block to index                                          |
| `MULTIVAULT_END_BLOCK`        | No       | The last block to index. Empty means follow the head of the chain |

### Projections

| Variable               | Default                                                                        | Purpose                                                 |
| ---------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------- |
| `USE_TYPED_READER`     | `true`                                                                         | Read events from the typed event tables. Keep it `true` |
| `DISABLED_PROJECTIONS` | `funnel_tracker,user_activity_batch,vault_state:dual,vault_holders_index:dual` | Comma-separated projections to skip                     |

### Workers

| Variable                   | Default | Purpose                                                                                                 |
| -------------------------- | ------- | ------------------------------------------------------------------------------------------------------- |
| `WORKERS_PROCESSING_SCOPE` | `full`  | `full`, `music`, `podcasts`, or `music-and-podcasts`. See [Indexing scope](../extend/indexing-scope.md) |

### Host ports

These set the ports on your machine. The ports inside the containers do not
change.

| Variable                  | Default | Service         |
| ------------------------- | ------- | --------------- |
| `API_HOST_PORT`           | `3000`  | `api`           |
| `ATOM_SERVICES_HOST_PORT` | `4010`  | `atom-services` |
| `POSTGRES_KG_HOST_PORT`   | `5432`  | `postgres-kg`   |
| `TIMESCALE_HOST_PORT`     | `5433`  | `timescale`     |
| `REDIS_HOST_PORT`         | `6379`  | `redis`         |

The worker ports (4110 to 4112), the indexer's port (9091), the projections'
port (9092), and Anvil's port (8545) are fixed in `docker-compose.yml`.

If you change `API_HOST_PORT`, point your clients and the
[explorer](./explorer.md#configuration) at the new port. If you change
`POSTGRES_KG_HOST_PORT`, `make keys` no longer reaches the database; use the
key script with your own connection string, as described in
[Manage keys](./write-data.md#manage-keys).

### Provider keys

Every provider key is optional. Without a key, the corresponding plugin is
skipped and the rest of the pipeline continues. See
[Enrichment providers](../extend/enrichment-providers.md) for the full list
and for how to obtain each key.

Compose also passes the Upstash credentials, `UPSTASH_REDIS_REST_URL` and
`UPSTASH_REDIS_REST_TOKEN`. They take effect only when you also set the cache
provider to `upstash`, which needs an override file, as described in
[Settings for running a service yourself](#settings-for-running-a-service-yourself).

> [!NOTE]
> `example.env` also contains rollout switches that are off by default:
> `API_ATOM_SEMANTIC_READS_ENABLED`, `VITE_ATOM_SEMANTIC_READS_ENABLED`,
> `WORKERS_IID_READ_ENABLED`, and `WORKERS_IID_RESOLUTION_ENABLED`. Leave
> them set to `false`.

## Settings for running a service yourself

When you run a service image directly, or a service from source, set its
variables yourself. Under Compose, these variables keep the values that
`docker-compose.yml` sets, or their defaults, whatever `.env` contains.

To change one of them under Compose, add it to the service's `environment` in
a `docker-compose.override.yml` file at the root of the repository. Compose
reads that file automatically. For example:

```yaml
services:
  workers-enrichment:
    environment:
      WORKERS_CONCURRENCY: '8'
```

If you set `COMPOSE_FILE`, as the [published-image mode](./container-images.md)
does, add the override file to it:
`COMPOSE_FILE=docker-compose.yml:docker-compose.published.yml:docker-compose.override.yml`.

### Datastores

| Variable          | Used by                                     | Purpose                                                                                         |
| ----------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `DATABASE_KG_URL` | API, workers, KG migration, projections     | The knowledge graph. Locally: `postgresql://intuition:intuition@localhost:5432/intuition_kg`    |
| `DATABASE_URL`    | Indexer, projections, event store migration | The event store. Locally: `postgresql://intuition:intuition@localhost:5433/intuition_timescale` |

### Query API

| Variable          | Default | Purpose                                                                                                                                  |
| ----------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `API_PORT`        | `3000`  | Listening port                                                                                                                           |
| `API_TRUST_PROXY` | Empty   | Set to `1` only behind a reverse proxy that overwrites `X-Forwarded-For`. The API then rate-limits requests without a key by that header |

### Workers

| Variable                              | Default   | Purpose                                                                                                                                |
| ------------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `WORKERS_PORT`                        | `4110`    | The parse worker's health port. The enrichment worker uses it plus 1, classification plus 2                                            |
| `WORKERS_CONCURRENCY`                 | `4`       | Atoms each worker processes at once                                                                                                    |
| `WORKERS_LEASE_MS`                    | `60000`   | How long a worker holds an atom. An expired lease is reclaimed                                                                         |
| `WORKERS_MAX_ATTEMPTS`                | `5`       | Attempts per stage                                                                                                                     |
| `WORKERS_PARSE_REMOTE_FETCH`          | `true`    | Fetch remote content while parsing                                                                                                     |
| `WORKERS_PARSE_ALLOW_HTTP`            | `false`   | Allow unencrypted HTTP fetches                                                                                                         |
| `WORKERS_PARSE_IPFS_GATEWAY_BASE_URL` | Unset     | An IPFS gateway for resolving IPFS URIs                                                                                                |
| `WORKERS_DEFAULT_PRESET`              | `default` | The enrichment preset. See [Presets](../extend/enrichment-providers.md#presets)                                                        |
| `WORKERS_CACHE_PROVIDER`              | `memory`  | `memory`, `none`, or `upstash`. See [Share a cache between replicas](../extend/enrichment-providers.md#share-a-cache-between-replicas) |

### Atom services

| Variable                       | Default   | Purpose                                                                                                                                |
| ------------------------------ | --------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `ATOM_SERVICES_PORT`           | `4010`    | Listening port                                                                                                                         |
| `ATOM_SERVICES_AUTH_TOKEN`     | Unset     | When set, requests must present this bearer token                                                                                      |
| `ATOM_SERVICES_DEFAULT_PRESET` | `default` | The enrichment preset. See [Presets](../extend/enrichment-providers.md#presets)                                                        |
| `ATOM_SERVICES_CACHE_PROVIDER` | `memory`  | `memory`, `none`, or `upstash`. See [Share a cache between replicas](../extend/enrichment-providers.md#share-a-cache-between-replicas) |

### Indexer and projections

| Variable                       | Default               | Purpose                                                                                                                               |
| ------------------------------ | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `METRICS_PORT`                 | `9091`                | The indexer's metrics and health port                                                                                                 |
| `PROJECTIONS_METRICS_PORT`     | `9092`                | The projections' metrics and health port                                                                                              |
| `SURREAL_DB_URL`               | `ws://localhost:8000` | Set it to an empty value. Core keeps graph data in PostgreSQL only. With the default, the projections try to reach SurrealDB and fail |
| `USE_TYPED_READER`             | `false`               | Set it to `true`, as Compose does                                                                                                     |
| `ENABLED_PROJECTIONS`          | Empty                 | Comma-separated projections to run. When set, only these run                                                                          |
| `DISABLED_PROJECTIONS`         | Empty                 | Comma-separated projections to skip. Use the Compose default shown in [Projections](#projections)                                     |
| `PROJECTIONS_BATCH_SIZE`       | `500`                 | Events per batch                                                                                                                      |
| `PROJECTIONS_POLL_INTERVAL_MS` | `1000`                | Polling interval                                                                                                                      |

## Related

- [Index the chain](./index-the-chain.md)
- [Operate a node](./operate-a-node.md)
- [Troubleshooting](./troubleshooting.md)

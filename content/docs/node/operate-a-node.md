---
title: Operate a node
description: Check health, read logs, stop and restart, back up, upgrade, and secure an Intuition Core node.
---

This page covers the day-to-day tasks of running a node with Docker Compose.
Run every command from the root of the repository. If your node indexes the
chain, add `--profile indexing` to each `docker compose` command so that it
includes the indexer and the projections.

## Check status

```bash
make status
```

This runs `docker compose --profile indexing ps` and lists every service with
its state. Long-running services show `running`. The two migration jobs exit
when they finish, so `docker compose ps -a` shows them as `Exited (0)`. After a
bounded indexing run, the indexer shows `Exited (0)` too.

## Check health

Each service answers on its own port.

| Service                  | Endpoint                                                                  | Healthy response  |
| ------------------------ | ------------------------------------------------------------------------- | ----------------- |
| `api`                    | `http://localhost:3000/health`                                            | `{"status":"ok"}` |
| `atom-services`          | `http://localhost:4010/health`, `http://localhost:4010/ready`             | `200`             |
| `workers-parse`          | `http://localhost:4110/healthz`, `http://localhost:4110/readyz`           | `200`             |
| `workers-enrichment`     | `http://localhost:4111/healthz`, `http://localhost:4111/readyz`           | `200`             |
| `workers-classification` | `http://localhost:4112/healthz`, `http://localhost:4112/readyz`           | `200`             |
| `indexer`                | `http://localhost:9091/health`                                            | `OK`              |
| `projections`            | `http://localhost:9092/health/live`, `http://localhost:9092/health/ready` | `OK`              |

A `health` or `healthz` endpoint reports that the process is up. A `ready` or
`readyz` endpoint reports that it can do work, and returns `503` until then.
When the API cannot reach its database, `/health` returns `503` with
`{"status":"degraded","database":"unreachable"}`.

To see how many atoms are in each stage of the pipeline:

```bash
curl http://localhost:3000/api/stats/pipeline
```

The indexer and the projections also publish Prometheus metrics at
`http://localhost:9091/metrics` and `http://localhost:9092/metrics`.

## Read logs

```bash
make logs SERVICE=api
```

This follows the logs of one service. Leave out `SERVICE` to follow every
service. The equivalent Compose commands are:

```bash
docker compose logs -f api
docker compose --profile indexing logs -f --tail=100 indexer projections
```

## Stop and restart

| Task                                  | Command      |
| ------------------------------------- | ------------ |
| Stop every service and keep your data | `make down`  |
| Start the node again                  | `make up`    |
| Start the node with indexing          | `make index` |

Restarting is safe. The migration jobs run again and skip the migrations
already applied, the projections resume from their checkpoints, and the event
store never stores the same event twice.

## Data

Compose stores data in named volumes. Each name starts with the Compose
project name, `intuition-core`.

| Volume                            | Contents                                                     |
| --------------------------------- | ------------------------------------------------------------ |
| `intuition-core_postgres_kg_data` | The knowledge graph: atoms, triples, artifacts, and API keys |
| `intuition-core_timescale_data`   | The event store and its read models                          |
| `intuition-core_redis_data`       | Redis data                                                   |
| `intuition-core_anvil_data`       | The local devnet chain, when you use it                      |

The event store and the indexed part of the knowledge graph can be rebuilt by
indexing the chain again. Atoms and triples written through the API, and your
API keys, exist only in your knowledge graph.

To delete every volume and start from an empty node:

```bash
make reset
```

> [!CAUTION]
> `make reset` runs `docker compose down -v`, which permanently deletes the
> knowledge graph, the event store, and every other volume. Back up first.

## Back up

Back up both databases with `pg_dump` while the node is running:

```bash
docker compose exec -T postgres-kg pg_dump -U intuition -d intuition_kg -Fc > intuition_kg.dump
docker compose exec -T timescale pg_dump -U intuition -d intuition_timescale -Fc > intuition_timescale.dump
```

Each command writes a compressed dump file to the current directory. Store
the files somewhere other than the machine that runs the node.

Both databases use the TimescaleDB extension. To restore a dump, restore it
into the same TimescaleDB version, and follow TimescaleDB's restore procedure:
run `SELECT timescaledb_pre_restore();` before `pg_restore`, and
`SELECT timescaledb_post_restore();` after it.

## Upgrade the node

Back up both databases before every upgrade, and read the release notes in
the repository's `docs/releases` folder for changes to configuration or
schema. The migration jobs apply new schema changes automatically when the
node starts.

### From source

```bash
git pull
bun install --frozen-lockfile
docker compose up -d --build
```

`--build` rebuilds the service images from the new source. Without it,
Compose keeps running the images it built before.

### From published images

Change the tag or the digests to the new release, then start the node again.
Compose pulls the new images before it starts them.

```bash
make up-published IMAGE_TAG=vX.Y.Z
```

For digest pins, update every `INTUITION_CORE_*_IMAGE` variable and run
`docker compose up -d`. See [Container images](./container-images.md).

### Roll back

To roll back, pin all six images to the digests of the previous release.
Changing images does not undo database migrations. If the release you are
leaving changed the schema, restore the backup you took before the upgrade.

## Secure the node

- Compose publishes every service port on all of the host's network
  interfaces, and the databases use the default credentials
  `intuition`/`intuition`. On a machine reachable from a network, block ports
  5432, 5433, 6379, 4110 to 4112, 9091, and 9092 from outside access, for
  example with your cloud provider's firewall.
- The worker ports also serve internal debugging state. Never expose them
  publicly.
- Keep `API_AUTH` set to `public-read` or `gated`. Never use `open` on a
  reachable host.
- Keep `.env` out of version control, and restrict it with `chmod 600 .env`.

## Related

- [Configuration](./configuration.md)
- [Container images](./container-images.md)
- [Troubleshooting](./troubleshooting.md)

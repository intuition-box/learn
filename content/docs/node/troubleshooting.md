---
title: Troubleshooting
description: Known failure modes of an Intuition Core node, with their causes and fixes.
---

## First checks

1. `curl http://localhost:3000/health` returns `{"status":"ok"}`.
2. `make status` shows every long-running service as `running`.
3. The logs of the failing service show no errors: `make logs SERVICE=<name>`,
   where `<name>` is a service such as `api` or `indexer`.

[Operate a node](./operate-a-node.md) lists every health endpoint.

## The bootstrap script reports that the API did not become healthy

The script waits two minutes for the API. If the API is not healthy by then,
inspect the services it depends on:

```bash
docker compose logs api migrate postgres-kg
```

A failed `migrate` job stops the API from starting. Fix the error in its log,
then run `docker compose up -d`.

## A port is already in use

Another process holds the port. The bootstrap script warns about this before
it starts the node. Stop the other process, or move the node's service to
another host port in `.env`:

| Port | Variable                  |
| ---- | ------------------------- |
| 3000 | `API_HOST_PORT`           |
| 4010 | `ATOM_SERVICES_HOST_PORT` |
| 5432 | `POSTGRES_KG_HOST_PORT`   |
| 5433 | `TIMESCALE_HOST_PORT`     |
| 6379 | `REDIS_HOST_PORT`         |

Ports 4110 to 4112, 9091, 9092, and 8545 are fixed in Compose. If one of them
is taken, stop the process that holds it.

## The API rejects a request

| Status | Error                  | Cause and fix                                                                                                                                    |
| ------ | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `401`  | `api_key_required`     | The default mode, `public-read`, requires a key for writes. [Mint one](./write-data.md#mint-an-api-key)                                          |
| `401`  | `invalid_api_key`      | The key is mistyped or revoked. List keys with `bun run keys:list`, as described in [Manage keys](./write-data.md#manage-keys)                   |
| `403`  | `api_key_not_writable` | The key is read-only. Create a key without `--read-only`                                                                                         |
| `429`  | `rate_limited`         | The caller exceeded `API_RATE_LIMIT_RPM`. Wait for the time in the `Retry-After` header, raise the limit, or give the key its own `--rate-limit` |

## Postgres rejects the `TimeZone` parameter

**Symptom.** The indexer and the projections fail immediately with
`invalid value for parameter "TimeZone": "UTC"`. The API and the workers are
unaffected.

**Cause.** A corrupted Docker image layer. If the disk fills while Docker
extracts the `timescaledb-ha` image, its time zone files can be written as
zeros. Docker caches the damaged layer, so restarting does not help.

**Fix.** Free disk space, then make Docker extract the image again:

```bash
docker compose down
docker rmi timescale/timescaledb-ha:pg17
docker pull timescale/timescaledb-ha:pg17
docker compose up -d
```

`docker compose down` keeps your data volumes.

## The indexer reports that `CHAIN_ID` must be set

The indexer reads `CHAIN_ID` and the `MULTIVAULT_*` variables from its runtime
environment. Set all four required chain variables in `.env`, then start the
profile with `docker compose --profile indexing up -d`, which passes them to
the container. If you run the indexer image yourself, set them on the
container. See [Index the chain](./index-the-chain.md#configure-the-chain).

## Nothing is indexed

- Confirm that the block range contains `MultiVault` events. The block in
  which the contract was deployed is the right value for
  `MULTIVAULT_START_BLOCK`.
- Check the indexer's progress for each event type:
  `curl -s http://localhost:9091/metrics | grep intuition_sync_progress_percent`.
- If `MULTIVAULT_END_BLOCK` is set, the indexer stops at that block and exits
  with `Exited (0)`. This is expected. Only a nonzero exit code is a failure.

## Indexed atoms appear slowly

The projections write atoms into the knowledge graph after the indexer stores
the events. If they lag, check
`curl http://localhost:9092/health/ready` and the projections' logs:

```bash
docker compose --profile indexing logs --tail=100 projections
```

The projections resume from their checkpoints after a restart.

## Published images do not start

- **Compose rejects `!reset`, or ignores the published images.** Update to a
  current Docker Compose v2. The legacy `docker-compose` v1 command does not
  support the published-image configuration.
- **Compose reports that `INTUITION_CORE_IMAGE_TAG` is required.** Set a
  release version, as in `make up-published IMAGE_TAG=vX.Y.Z`, or set all six
  `INTUITION_CORE_*_IMAGE` variables. There is no `latest` fallback.

See [Container images](./container-images.md).

## Every container exits at once on macOS

If every container shows `Exited (255)` at the same time, Docker Desktop
stopped. Your data volumes are intact. Restart Docker Desktop, then run
`docker compose up -d`. The migration jobs are safe to run again, and the
projections resume from their checkpoints.

## Enrichment reports `skipped`

This is correct for an atom that has nothing to enrich, such as a plain
string. Enrichment produces artifacts for atoms that refer to a URL. A
provider whose API key is not set is skipped rather than failed. See
[Enrichment providers](../extend/enrichment-providers.md).

## Related

- [Configuration](./configuration.md)
- [Operate a node](./operate-a-node.md)
- [Index the chain](./index-the-chain.md)

---
title: Container images
description: Run Intuition Core from published images instead of building it, and pin those images for production.
---

By default, Docker Compose builds each service from the repository. You can
instead run the images published to the GitHub Container Registry (GHCR),
which skips the build.

## Published images

| Image                                                     | Role                                                                  |
| --------------------------------------------------------- | --------------------------------------------------------------------- |
| `ghcr.io/0xintuition/intuition-core-api`                  | The query API. Compose also uses it for the knowledge graph migration |
| `ghcr.io/0xintuition/intuition-core-atom-services`        | Classification and enrichment over HTTP                               |
| `ghcr.io/0xintuition/intuition-core-workers`              | The parse, classification, and enrichment workers                     |
| `ghcr.io/0xintuition/intuition-core-rindexer-ingestion`   | The indexer                                                           |
| `ghcr.io/0xintuition/intuition-core-projections`          | The projections                                                       |
| `ghcr.io/0xintuition/intuition-core-timescale-migrations` | The event store migration                                             |

Each image is built for `linux/amd64` and `linux/arm64`. The stack also uses
`timescale/timescaledb-ha:pg17` for both databases and `redis:7-alpine`. The
devnet deployer is not published; Compose always builds it from source.

## Choose a release

Images are tagged with release versions, such as `v0.1.0-rc.2`. Each
published build also has an immutable `sha-` tag followed by the first 12
characters of its commit hash. Release candidates never receive the `latest`
tag, and Compose has no fallback to it, so always name a version.

Each release's notes, in the repository's `docs/releases` folder, list the
version and the digest of every image.

At the time of writing, the current release is the release candidate
`v0.1.0-rc.2`. It is intended for trials, not production.

## Run a tagged release

Published-image mode requires a current version of Docker Compose v2. The
legacy `docker-compose` v1 command does not work.

1. Create `.env`, if you have not already:

   ```bash
   cp example.env .env
   ```

2. Start the node from the published images. Replace `vX.Y.Z` with a release
   version:

   ```bash
   make up-published IMAGE_TAG=vX.Y.Z
   ```

   To index the chain as well, run `make index-published IMAGE_TAG=vX.Y.Z`.

3. Optionally, run the smoke test against the same images:

   ```bash
   make smoke-published IMAGE_TAG=vX.Y.Z
   ```

The equivalent Compose command is:

```bash
COMPOSE_FILE=docker-compose.yml:docker-compose.published.yml \
  INTUITION_CORE_IMAGE_TAG=vX.Y.Z \
  docker compose up -d
```

## Pin by digest in production

A tag can be moved. A digest cannot. For production, and when you reproduce
an incident, pin every service to a digest. Replace each `sha256:...` with
the digest from the release notes:

```bash
export INTUITION_CORE_API_IMAGE=ghcr.io/0xintuition/intuition-core-api@sha256:...
export INTUITION_CORE_ATOM_SERVICES_IMAGE=ghcr.io/0xintuition/intuition-core-atom-services@sha256:...
export INTUITION_CORE_WORKERS_IMAGE=ghcr.io/0xintuition/intuition-core-workers@sha256:...
export INTUITION_CORE_RINDEXER_INGESTION_IMAGE=ghcr.io/0xintuition/intuition-core-rindexer-ingestion@sha256:...
export INTUITION_CORE_PROJECTIONS_IMAGE=ghcr.io/0xintuition/intuition-core-projections@sha256:...
export INTUITION_CORE_TIMESCALE_MIGRATIONS_IMAGE=ghcr.io/0xintuition/intuition-core-timescale-migrations@sha256:...
export COMPOSE_FILE=docker-compose.yml:docker-compose.published.yml

docker compose config -q
docker compose up -d
```

`docker compose config -q` checks the configuration and prints nothing when
it is valid. Pin all six images from the same release together.

## Verify an image's provenance

Each published image carries a software bill of materials and a build
provenance attestation. Before you deploy an image to an environment that
matters, verify it with the [GitHub CLI](https://cli.github.com):

```bash
gh attestation verify \
  oci://ghcr.io/0xintuition/intuition-core-api@sha256:... \
  --bundle-from-oci \
  --repo 0xIntuition/intuition-core \
  --signer-workflow github.com/0xIntuition/intuition-core/.github/workflows/publish-images.yml
```

Repeat the command for each image you deploy.

## Run an image directly

Compose supplies every setting below. They matter when you run an image by
itself, for example on Kubernetes. [Configuration](./configuration.md#settings-for-running-a-service-yourself)
describes each variable.

| Image                 | Required settings                                                                                                                 |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| API                   | `DATABASE_KG_URL`                                                                                                                 |
| Workers               | `DATABASE_KG_URL`, and the worker to run as the command: `kg-parse-worker`, `kg-classification-worker`, or `kg-enrichment-worker` |
| Atom services         | None                                                                                                                              |
| Indexer               | `DATABASE_URL`, `INTUITION_RPC_URL`, `CHAIN_ID`, `MULTIVAULT_CONTRACT_ADDRESS`, `MULTIVAULT_START_BLOCK`                          |
| Projections           | `DATABASE_URL`, `DATABASE_KG_URL` to write atoms and triples, an empty `SURREAL_DB_URL`, and `USE_TYPED_READER=true`              |
| Event store migration | `DATABASE_URL`                                                                                                                    |

Run both migrations to completion before you start the other services, as
Compose does. The knowledge graph migration runs from the API image, in
`/repo/packages/database-kg`, with the command `bun src/migrate.ts`.

## Related

- [Configuration](./configuration.md)
- [Operate a node](./operate-a-node.md#upgrade-the-node)
- [Run a node](./run-a-node.md)

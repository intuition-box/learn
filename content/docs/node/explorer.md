---
title: Explorer
description: The dashboard that ships with Intuition Core shows service health, pipeline progress, and every atom and triple in your node.
---

Intuition Core includes a web application for inspecting a node. It reads
everything through the same REST API that your own application would use.

## Before you begin

- A running node. See [Run a node](./run-a-node.md).
- The repository's dependencies installed. The bootstrap script does this. If
  you skipped it, run `bun install --frozen-lockfile` from the repository root.

## Start the explorer

```bash
cd apps/explorer
bun run dev
```

Open [http://localhost:3100](http://localhost:3100) in your browser. The
explorer expects the query API at `http://localhost:3000`.

## What it shows

| View       | Contents                                                                                                          |
| ---------- | ----------------------------------------------------------------------------------------------------------------- |
| Dashboard  | Counts of atoms, triples, predicates, and accounts, pipeline status by stage, service health, and recent activity |
| Atoms      | A searchable table. Each atom's page shows its data, classification, enrichment artifacts, triples, and events    |
| Triples    | Triples shown as subject, predicate, and object, with readable labels                                             |
| Predicates | The node's predicate registry                                                                                     |
| Events     | The append-only activity log                                                                                      |
| Schema     | The live table definitions from `GET /api/schema`                                                                 |
| Playground | Forms that create atoms and triples, each showing the equivalent `curl` command                                   |

The dashboard's service health grid checks the API, atom services, the three
workers, the indexer, and the projections. The indexer and the projections
show as down unless the [indexing profile](./index-the-chain.md) is running.

## Configuration

| Variable                  | Default                                 | Purpose                                                                |
| ------------------------- | --------------------------------------- | ---------------------------------------------------------------------- |
| `VITE_API_URL`            | `http://localhost:3000`                 | The query API to read from                                             |
| `EXPLORER_STATUS_TARGETS` | The health endpoints on the local ports | The services the dashboard checks, as comma-separated `name=url` pairs |

Set these when you start the explorer. For example, if your API listens on
port 3001:

```bash
VITE_API_URL=http://localhost:3001 bun run dev
```

The explorer checks service health from its own server, not from your
browser, so the health endpoints need no CORS configuration.

If you restrict `API_ALLOWED_ORIGINS` on the API, include
`http://localhost:3100`, or the explorer cannot read from it.

## Use it as a reference

The explorer's API client, `apps/explorer/src/lib/api.ts`, is a single file
of small typed functions over `fetch`. It is a practical starting point for
your own client.

## Related

- [REST API](../build/rest-api.md)
- [Write data](./write-data.md)
- [Operate a node](./operate-a-node.md#check-health)

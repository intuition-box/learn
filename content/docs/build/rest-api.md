---
title: REST API
description: The endpoints of an Intuition Core node's query API, with authentication, pagination, errors, and request and response formats.
---

Every Intuition Core node serves a query API over its knowledge graph, on
port 3000 by default. Use it to look up and search atoms and triples, follow
the node's activity, and, with an API key, add atoms and triples to the node.
An OpenAPI 3.1 description is in the Intuition Core repository, at
`docs/openapi.yaml`.

The API serves atoms, triples, predicates, and artifacts. It does not serve
vaults, share prices, or positions. Read those
[from the chain](./read-the-chain.md) or [with SQL](./query-with-sql.md).

## Conventions

- The examples use a local node at `http://localhost:3000`.
- Responses are JSON. A successful response has a `data` member. A list
  response also has a `pagination` member.
- Identifiers are 32-byte values, written as `0x` followed by 64 hexadecimal
  digits. Send them in lowercase, the form the node stores.
- Only records that are active and public are returned.
- Lists are ordered newest first.

## Pagination

List endpoints accept two query parameters:

| Parameter | Default | Meaning                                                        |
| --------- | ------- | -------------------------------------------------------------- |
| `limit`   | `25`    | Rows per page, from 1 to 100. Larger values are clamped to 100 |
| `offset`  | `0`     | Rows to skip                                                   |

The `pagination` member repeats `limit` and `offset`, and `count` is the
number of rows in this response, not the total. To read every page, increase
`offset` by `limit` until `count` is less than `limit`.

```bash
curl "http://localhost:3000/api/atoms?limit=100&offset=100"
```

## Authentication

Reads are open by default. Writes require an API key, sent as a bearer token:

```http
Authorization: Bearer ik_...
```

The node's operator mints keys and chooses the authentication mode. In
`gated` mode, every endpoint except `/health` and `/api/schema` requires a
key. See [Write data](../node/write-data.md) for keys and modes.

A key sent with any request is checked, including a read. An unknown or
revoked key returns `401`, even where a key is optional.

## Errors

An error response has an `error` member with a code, and sometimes a
`message` member with details:

```json
{ "error": "invalid_input", "message": "body must be { \"input\": string }" }
```

| Status | Code                   | Meaning                                            |
| ------ | ---------------------- | -------------------------------------------------- |
| 400    | `invalid_json`         | The request body is not valid JSON                 |
| 400    | `invalid_input`        | A required member is missing or empty              |
| 400    | `invalid_term_id`      | An identifier is not a 32-byte protocol identifier |
| 401    | `api_key_required`     | The endpoint requires a key and none was sent      |
| 401    | `invalid_api_key`      | The key is unknown or revoked                      |
| 403    | `api_key_not_writable` | The key is read-only and the request is a write    |
| 404    | `not_found`            | The record is absent or not public                 |
| 413    | `input_too_large`      | The atom input exceeds 64,000 characters           |
| 429    | `rate_limited`         | The rate limit is exceeded                         |
| 500    | `internal_error`       | An unexpected server error                         |

## Rate limits

Requests are limited per API key, or per client IP address when no key is
sent. The default is 120 requests per minute, and an operator can set a
different limit for each key. Each response reports the current window:

| Header                  | Meaning                                                  |
| ----------------------- | -------------------------------------------------------- |
| `x-ratelimit-limit`     | Requests allowed per minute                              |
| `x-ratelimit-remaining` | Requests left in the current window                      |
| `x-ratelimit-reset`     | When the window resets, in milliseconds since Unix epoch |

Over the limit, the API returns `429` with a `retry-after` header, in
seconds. `/health` is not rate limited.

## Atoms

### `POST /api/atoms`

Creates an atom in the node from a URL, a string, or a JSON document. Requires
a key.

```bash
curl -X POST http://localhost:3000/api/atoms \
  -H "Authorization: Bearer ik_..." \
  -H 'Content-Type: application/json' \
  -d '{"input":"https://github.com/oven-sh/bun"}'
```

```json
{
  "data": {
    "id": "0x951d18ba45fdf5ef5c3304ea3ae46a45e00b68464e2b1561cce4b48ffa1c09d3",
    "created": true,
    "createdBy": "0x1111111111111111111111111111111111111111"
  }
}
```

- `input` is a string of up to 64,000 characters. The node records its raw
  type: `http_uri` for an `http` or `https` URL, `ipfs_uri` for an `ipfs://`
  URI, `json` for a JSON object or array, and `string` otherwise.
- The identifier is derived from `input` exactly as sent, the same way
  `calculateAtomId` derives it. The request is idempotent: it returns `201`
  when the atom is created and `200` with the same identifier afterwards.
- `createdBy` is the account the key belongs to.
- The node's workers parse, classify, and enrich the atom within seconds.

The request stores the atom in the node. It does not send a transaction. To
register the atom with the protocol, see [Publish onchain](./publish-onchain.md).

Errors: `400 invalid_json`, `400 invalid_input`, `413 input_too_large`.

### `GET /api/atoms`

Lists atoms.

| Parameter             | Meaning                                                       |
| --------------------- | ------------------------------------------------------------- |
| `limit`, `offset`     | Pagination                                                    |
| `classification_type` | Returns atoms of one classification type only                 |
| `q`                   | Case-insensitive substring search over the atom's search text |

```bash
curl "http://localhost:3000/api/atoms?q=joji&limit=1"
```

```json
{
  "data": [
    {
      "id": "0x49ed8bdcd1954e1de3af8bb5fca0f0377ebe598de5dd82ab5b4a45a82d53a53f",
      "rawType": "string",
      "data": "joji",
      "isOnchain": true,
      "classificationType": "Unknown",
      "parseStatus": "completed",
      "classificationStatus": "completed",
      "enrichmentStatus": "skipped"
    }
  ],
  "pagination": { "limit": 1, "offset": 0, "count": 1 }
}
```

The example is shortened. Each atom has these members:

| Member                                                    | Meaning                                                         |
| --------------------------------------------------------- | --------------------------------------------------------------- |
| `id`                                                      | The atom's identifier                                           |
| `createdAt`                                               | When the node stored the atom                                   |
| `isOnchain`                                               | Whether the node recorded the atom from the chain               |
| `rawType`                                                 | `string`, `json`, `http_uri`, or `ipfs_uri`                     |
| `data`                                                    | The atom data as text, or `null`                                |
| `dataResolved`                                            | Structured data the workers extracted                           |
| `classificationType`                                      | What the atom refers to, or `Unknown` before classification     |
| `parseStatus`, `classificationStatus`, `enrichmentStatus` | Each processing stage's state, such as `pending` or `completed` |

A new atom matches `q` only after a worker has processed it.

### `GET /api/atoms/:id`

Returns one atom with all its members, including the results of each
processing stage, and a `stats` member that describes its place in the graph:
`inDegree`, `outDegree`, `neighborKindCounts`, and `predicateCounts`. `stats`
is `null` until the atom takes part in a triple. Returns `404 not_found` if
the atom is absent or not public.

### `GET /api/atoms/:id/artifacts`

Returns the enrichment artifacts attached to the atom, newest first, one per
provider output. Each artifact has `artifactKind`, such as `opengraph` or
`github-repo`, `artifactVersion`, `status`, `sourceUri`, the provider's raw
`data`, normalized `extracted` fields, and `error` when the provider failed.
Accepts pagination. Returns `404 not_found` if the atom is absent or not
public.

### `GET /api/atoms/:id/triples`

Returns every triple in which the atom is the subject, the predicate, or the
object. Accepts pagination and `expand=terms`, described under
[`GET /api/triples`](#get-apitriples).

## Triples

### `POST /api/triples`

Creates a triple in the node from three term identifiers. Requires a key.

```bash
curl -X POST http://localhost:3000/api/triples \
  -H "Authorization: Bearer ik_..." \
  -H 'Content-Type: application/json' \
  -d '{
    "subject_id": "0x951d18ba45fdf5ef5c3304ea3ae46a45e00b68464e2b1561cce4b48ffa1c09d3",
    "predicate_id": "0x0840db4575bf6bdb49b66c21dc40cb4cbb5e1b26bd239d7f56b126c14e452c07",
    "object_id": "0x49ed8bdcd1954e1de3af8bb5fca0f0377ebe598de5dd82ab5b4a45a82d53a53f"
  }'
```

```json
{
  "data": {
    "id": "0x9aaea0e8bbda670c2a1c120dfb4633f974c9ac572ec3e3890331c9e56148e58a",
    "created": true,
    "createdBy": "0x1111111111111111111111111111111111111111"
  }
}
```

- The identifier is derived the same way `calculateTripleId` derives it. The
  request is idempotent, like `POST /api/atoms`.
- The node does not check that the three terms exist. Create the atoms
  first, so that the triple's terms resolve.
- The node records all three terms as atoms.

Errors: `400 invalid_json`, `400 invalid_input`, `400 invalid_term_id`.

### `GET /api/triples`

Lists triples. Filter with `subject_id`, `predicate_id`, and `object_id`, in
any combination, and page with `limit` and `offset`.

Add `expand=terms` to include a summary of each term in members named
`subject`, `predicate`, and `object`. Each summary has `id`, `data`,
`classificationType`, and `rawType`. A summary is `null` when its atom is not
in the node or not public.

Each triple has these main members:

| Member                                       | Meaning                                             |
| -------------------------------------------- | --------------------------------------------------- |
| `id`                                         | The triple's identifier                             |
| `subjectId`, `predicateId`, `objectId`       | The identifiers of its terms                        |
| `subjectType`, `predicateType`, `objectType` | `node` for an atom, `triple` for a triple           |
| `isOnchain`                                  | Whether the node recorded the triple from the chain |
| `createdBy`                                  | The account that created it, or `null`              |
| `createdAt`, `updatedAt`                     | When the node stored and last updated it            |

### `GET /api/triples/:id`

Returns one triple. Accepts `expand=terms`. Returns `404 not_found` if the
triple is absent or not public.

## Activity, registry, and metadata

| Endpoint                  | Returns                                                                                              |
| ------------------------- | ---------------------------------------------------------------------------------------------------- |
| `GET /api/events`         | The append-only activity log, newest first. Filter with `entity_kind`, `event_type`, and `entity_id` |
| `GET /api/predicates`     | The node's predicate registry, ordered by slug                                                       |
| `GET /api/stats`          | Counts of public atoms and triples, and of all accounts and predicates                               |
| `GET /api/stats/pipeline` | Counts by status for each processing stage                                                           |
| `GET /api/schema`         | Table, column, key, and index metadata for the knowledge graph schema                                |
| `GET /health`             | `{"status":"ok"}`, or `503` when the database is unreachable                                         |

`entity_kind` is `node`, `triple`, `predicate`, or `artifact`. Each event has
`eventTime`, `eventType`, `entityKind`, `entityId`, `actorId`, `isOnchain`,
`blockNumber`, `txHash`, and a `payload`. `GET /api/events` accepts
pagination.

`GET /api/schema` is available without a key in every authentication mode,
so that tools can discover the schema.

## Common tasks

| Task                                    | Request                                               |
| --------------------------------------- | ----------------------------------------------------- |
| Search atoms by text                    | `GET /api/atoms?q=bun`                                |
| List the claims about an atom, readably | `GET /api/atoms/:id/triples?expand=terms`             |
| List the claims that use one predicate  | `GET /api/triples?predicate_id=0x...&expand=terms`    |
| Find who made a claim about an object   | `GET /api/triples?predicate_id=0x...&object_id=0x...` |
| Read an atom's metadata from the web    | `GET /api/atoms/:id/artifacts`                        |
| Follow what the node records            | `GET /api/events`                                     |

## Related

- [Query with SQL](./query-with-sql.md)
- [Atom services](./atom-services.md)
- [Data model](../reference/data-model.md)

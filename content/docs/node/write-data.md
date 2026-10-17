---
title: Write data
description: Mint an API key, create atoms and triples through the query API, and read them back.
---

The query API accepts atoms and triples and stores them in your node's
knowledge graph. Each write is attributed to the account that owns the API key
used to make it.

> [!IMPORTANT]
> Writing through the API stores data in your node only. It does not send a
> transaction. To register a term with the protocol, see
> [Publish onchain](../build/publish-onchain.md).

## Before you begin

- A running node. See [Run a node](./run-a-node.md).
- A wallet address to own your API key. Any address works for local testing.

## Authentication modes

The `API_AUTH` setting controls which requests need a key.

| `API_AUTH`              | Reads         | Writes                |
| ----------------------- | ------------- | --------------------- |
| `public-read` (default) | Open          | Require a key         |
| `gated`                 | Require a key | Require a key         |
| `open`                  | Open          | Open and unattributed |

To change the mode, set `API_AUTH` in `.env`, then run `docker compose up -d`
to apply it.

> [!WARNING]
> Use `open` only for disposable experiments on your own machine. Never use it
> on a shared, remote, or tunneled host.

## Mint an API key

A key is bound to an account, identified by a wallet address. Replace the
address below with your own.

```bash
make keys ACCOUNT=0x0000000000000000000000000000000000000001 KEY_NAME=me
```

The command prints a key that begins with `ik_`. Copy it now: it is shown only
once and cannot be recovered, because the node stores only its SHA-256 hash.

Store the key in a shell variable for the commands on this page:

```bash
API_KEY=ik_...
```

### Manage keys

To create, list, and revoke keys directly, run the key script from
`services/api`. It needs the knowledge graph's connection string, which
`make keys` otherwise supplies for you.

```bash
cd services/api
export DATABASE_KG_URL=postgresql://intuition:intuition@localhost:5432/intuition_kg

bun run keys:create -- --name partner --account 0x0000000000000000000000000000000000000002
bun run keys:list
bun run keys:revoke -- --id key_...
```

| Option for `keys:create` | Effect                                                                                |
| ------------------------ | ------------------------------------------------------------------------------------- |
| `--read-only`            | The key can read but not write. Useful when `API_AUTH` is `gated`                     |
| `--rate-limit <rpm>`     | Requests per minute for this key, overriding `API_RATE_LIMIT_RPM`. `0` means no limit |

`keys:list` prints each key's identifier (`key_...`), which `keys:revoke`
takes.

## Create an atom

Send a URL, a string, or a JSON document of up to 64 KB as `input`:

```bash
curl -X POST http://localhost:3000/api/atoms \
  -H "Authorization: Bearer $API_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"input":"https://github.com/oven-sh/bun"}'
```

```json
{
  "data": {
    "id": "0x951d18ba45fdf5ef5c3304ea3ae46a45e00b68464e2b1561cce4b48ffa1c09d3",
    "created": true,
    "createdBy": "0x0000000000000000000000000000000000000001"
  }
}
```

The atom's [identifier](../concepts/identifiers.md) is derived from its data,
so it is the same identifier the protocol uses onchain. The request is
idempotent: the first call returns `201`, and sending the same input again
returns `200` with the same identifier.

## Watch the pipeline

Within seconds, the workers parse, classify, and enrich the new atom. Fetch it
to see each stage's status:

```bash
curl http://localhost:3000/api/atoms/0x951d18ba45fdf5ef5c3304ea3ae46a45e00b68464e2b1561cce4b48ffa1c09d3
```

```json
{
  "data": {
    "id": "0x951d18ba45fdf5ef5c3304ea3ae46a45e00b68464e2b1561cce4b48ffa1c09d3",
    "rawType": "http_uri",
    "classificationType": "SoftwareSourceCode",
    "parseStatus": "completed",
    "classificationStatus": "completed",
    "enrichmentStatus": "completed"
  }
}
```

A stage can report `pending` briefly before it reports `completed`. The
response contains more fields than shown here.

## Create a triple

A [triple](../concepts/triples.md) links a subject, a predicate, and an object
by their identifiers. Each must be a 32-byte identifier: `0x` followed by 64
hexadecimal digits.

1. Create two more atoms, `is a` and `JavaScript runtime`, the same way you
   created the first. Their identifiers are:

   | Atom                 | Identifier                                                           |
   | -------------------- | -------------------------------------------------------------------- |
   | `is a`               | `0xeab711d77f94dc65d29e0ffaadacb229b55773e317bd4401ef7b01662f75c0c6` |
   | `JavaScript runtime` | `0x4d838c07c7eba82f48f58fa11a611937850769a6b3954b3fc49a6d9cf60aad74` |

2. Create the triple:

   ```bash
   curl -X POST http://localhost:3000/api/triples \
     -H "Authorization: Bearer $API_KEY" \
     -H 'Content-Type: application/json' \
     -d '{
       "subject_id": "0x951d18ba45fdf5ef5c3304ea3ae46a45e00b68464e2b1561cce4b48ffa1c09d3",
       "predicate_id": "0xeab711d77f94dc65d29e0ffaadacb229b55773e317bd4401ef7b01662f75c0c6",
       "object_id": "0x4d838c07c7eba82f48f58fa11a611937850769a6b3954b3fc49a6d9cf60aad74"
     }'
   ```

   ```json
   {
     "data": {
       "id": "0xbc5250230227e7762a141c41c55aced479175a155fbd89f9778997c1e15d9df6",
       "created": true,
       "createdBy": "0x0000000000000000000000000000000000000001"
     }
   }
   ```

Like an atom, a triple's identifier is derived from its content, and the
request is idempotent.

> [!NOTE]
> This example uses a plain string as the predicate to keep it short.
> Applications use the canonical predicates, which have fixed identifiers. See
> [Predicates](../concepts/predicates.md).

## Read data back

```bash
curl "http://localhost:3000/api/atoms?limit=5"
curl http://localhost:3000/api/atoms/0x951d18ba45fdf5ef5c3304ea3ae46a45e00b68464e2b1561cce4b48ffa1c09d3/triples
curl http://localhost:3000/api/atoms/0x951d18ba45fdf5ef5c3304ea3ae46a45e00b68464e2b1561cce4b48ffa1c09d3/artifacts
```

The first request lists recent atoms. The second returns every triple that
uses the atom as its subject, predicate, or object. The third returns the
artifacts that enrichment attached to the atom.

## Related

- [REST API](../build/rest-api.md) documents every endpoint and error.
- [Atom services](../build/atom-services.md) classifies and enriches input
  without storing anything.

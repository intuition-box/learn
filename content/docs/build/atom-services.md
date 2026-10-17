---
title: Atom services
description: A stateless HTTP service that classifies and enriches any input without storing it.
---

Atom services exposes the classification and enrichment engines of
Intuition Core over HTTP. It has no database: send an input and receive what
the pipeline knows about it. It listens on port 4010 by default.

Use it when you want classification or metadata for an input without
creating an atom, for example to preview a URL before a user confirms it.

## Authentication

The service is open by default. When the operator sets
`ATOM_SERVICES_AUTH_TOKEN`, every endpoint except `/health`, `/ready`, and
`/metrics` requires that token:

```http
Authorization: Bearer <token>
```

`<token>` is the value of `ATOM_SERVICES_AUTH_TOKEN`. Requests are also rate
limited, by default to 120 a minute. Over the limit, the service returns
`429`.

## Classify

`POST /v1/classify` identifies what an input refers to. The request member is
`input`, a string of up to 10,000 characters.

```bash
curl -X POST http://localhost:4010/v1/classify \
  -H 'Content-Type: application/json' \
  -d '{"input":"https://github.com/vercel/next.js"}'
```

```json
{
  "ok": true,
  "status": "complete",
  "message": "Resolved by github-resolver with 1 candidate atom.",
  "classification": {
    "type": "url",
    "domain": "github",
    "subtype": "repo",
    "confidence": 0.97
  }
}
```

The example is shortened. `status` is `complete`, `partial`, or
`placeholder`, and `classification` gives the input's type, its domain and
subtype, and a confidence between 0 and 1.

## Process

`POST /v1/process` classifies and enriches in one request. The request member
is `rawInput`, a string of up to 10,000 characters.

```bash
curl -X POST http://localhost:4010/v1/process \
  -H 'Content-Type: application/json' \
  -d '{"rawInput":"https://en.wikipedia.org/wiki/Ethereum"}'
```

The response has these main members:

| Member           | Meaning                                                                         |
| ---------------- | ------------------------------------------------------------------------------- |
| `status`         | `success`, `partial`, or `failed`                                               |
| `classification` | The classification, in the same form as `POST /v1/classify` returns             |
| `enrichment`     | The enrichment run: its `artifacts`, `errors`, and `skipped` plugins, or `null` |
| `timings`        | How long each phase took, in milliseconds                                       |

For this URL, with no provider keys configured, the artifacts include
OpenGraph data, JSON-LD, icons, the Wikipedia extract, and the Wikidata entity.
A plugin that does not apply to the input is reported as skipped. A source
that fails is reported as an error, and the request still succeeds with the
other artifacts.

To choose which plugins run, add an `enrichment` member with a `preset`:
`default`, `company`, `music`, `crypto`, `academic`, or `custom`.

## Process in batches

`POST /v1/process/batch` accepts several inputs as one job and returns at
once, with status `202`:

```bash
curl -X POST http://localhost:4010/v1/process/batch \
  -H 'Content-Type: application/json' \
  -d '{"jobs":[{"rawInput":"https://github.com/oven-sh/bun"},{"rawInput":"https://en.wikipedia.org/wiki/Ethereum"}]}'
```

```json
{
  "jobId": "...",
  "status": "accepted",
  "submittedAt": "...",
  "total": 2
}
```

Each entry in `jobs` takes the same members as `POST /v1/process`. A batch
holds up to 25 jobs by default. Poll `GET /v1/process/batch/:jobId` with the
returned `jobId` until its `status` is `complete`, `partial`, or `failed`. The
service keeps finished jobs for one hour by default.

## Enrich

`POST /v1/enrich` runs enrichment only, on an input that is already
classified. Its request member is `input`, a classified atom with its
`atomType`, `jsonLd`, and `source`, rather than raw text. For raw text, use
`POST /v1/process`.

## Errors

An error response has this form:

```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request payload validation failed.",
    "requestId": "..."
  }
}
```

| Status | Code                   | Meaning                                                |
| ------ | ---------------------- | ------------------------------------------------------ |
| 400    | `INVALID_JSON`         | The request body is not valid JSON                     |
| 400    | `VALIDATION_ERROR`     | The body does not match the schema. `details` explains |
| 400    | `BATCH_LIMIT_EXCEEDED` | The batch has more jobs than the service allows        |
| 401    | `UNAUTHORIZED`         | The token is missing or wrong                          |
| 404    | `BATCH_JOB_NOT_FOUND`  | No batch job has this identifier                       |
| 429    | `RATE_LIMITED`         | The rate limit is exceeded. See `retry-after`          |
| 500    | `INTERNAL_ERROR`       | An unexpected service error                            |

## Health and metrics

| Endpoint       | Purpose                                      |
| -------------- | -------------------------------------------- |
| `GET /health`  | Liveness                                     |
| `GET /ready`   | Readiness, with the state of each dependency |
| `GET /metrics` | Prometheus metrics                           |

## Related

- [Classification and enrichment](../concepts/classification-and-enrichment.md)
- [Enrichment providers](../extend/enrichment-providers.md)

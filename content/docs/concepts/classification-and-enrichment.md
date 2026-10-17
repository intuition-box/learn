---
title: Classification and enrichment
description: How a node works out what an atom refers to and gathers metadata about it, and why the process is deterministic.
---

Atom data is a sequence of bytes. To be useful in an application, an atom
needs to be understood: this URL is a GitHub repository, this string is an
ENS name, this JSON document describes a song. Intuition Core does this in
three stages.

| Stage    | Question it answers           | Output                                            |
| -------- | ----------------------------- | ------------------------------------------------- |
| Parse    | What form does the data take? | A kind, such as `url`, `json`, or `ens_name`      |
| Classify | What does it refer to?        | A domain and subtype, such as `github` and `repo` |
| Enrich   | What is known about it?       | Artifacts, such as titles, images, and metadata   |

Each atom moves through the stages in order. The state of each stage is
recorded on the atom as `pending`, `processing`, `completed`, `failed`, or
`skipped`.

## Parse

The parser examines the raw input and assigns one kind, in this order of
precedence: IPFS URI, Ethereum address, ENS name, JSON, URL, ISBN, and plain
string. For URLs and IPFS URIs, it can also inspect the remote content to
determine whether it is a web page, an image, a JSON document, and so on.

## Classify

Plugins perform classification. Each plugin recognizes one domain, such as
GitHub, Spotify, Wikipedia, or X. A plugin's classifier decides whether the
input belongs to its domain. Its resolver then produces a canonical
description of the thing: a schema.org type, a canonical identifier, and
`sameAs` links.

Classification must be **deterministic**. The same input always produces the
same result, with no dependence on time, randomness, or an unpinned model.
This is what lets two applications that describe the same thing arrive at the
same atom.

## Enrich

Enrichment plugins each fetch metadata from one source and return typed
artifacts. Many sources work without credentials, including OpenGraph,
Wikipedia, Wikidata, npm, and public GitHub data. Others need an API key.
Without its key, a provider either runs a reduced keyless lookup, as Spotify
does, or records an error for itself, as TMDB, YouTube, and X do.
In either case, the run continues and the other providers' artifacts are
stored. [Enrichment providers](../extend/enrichment-providers.md) lists which
providers work without a key.

Core stores artifacts with the atom and returns them from the REST API.

## Using the pipeline without a database

The same engines are available as a stateless HTTP service, atom services.
Send an input and receive its classification, with nothing stored:

```bash
curl -X POST http://localhost:4010/v1/classify \
  -H 'Content-Type: application/json' \
  -d '{"input":"https://github.com/vercel/next.js"}'
```

The response includes these fields, among others:

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

To classify and enrich in one call, use `/v1/process`. See
[Atom services](../build/atom-services.md).

## Adding coverage for a new domain

Classification and enrichment are both plugin systems. The built-in plugins
use the same interface that is available to you. See
[Classification plugins](../extend/classification-plugins.md) and
[Enrichment plugins](../extend/enrichment-plugins.md).

## Related

- [Atoms](./atoms.md)
- [Architecture](../reference/architecture.md)

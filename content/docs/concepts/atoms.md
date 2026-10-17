---
title: Atoms
description: An atom identifies one thing. Its data can be a URL, a string, a JSON document, or raw bytes.
---

An atom is the basic unit of Intuition data. It identifies one thing, such as
a person, a repository, a song, a concept, or an address. Triples are built
from atoms, and every atom registered onchain has a vault.

## Atom data

An atom is defined by its data, a sequence of bytes. The protocol places no
requirement on what the bytes mean. In practice, atom data takes one of four
forms. The last column shows the `raw_type` that Intuition Core records for
each form.

| Form          | Example                                                           | Stored in Core as |
| ------------- | ----------------------------------------------------------------- | ----------------- |
| URL           | `https://github.com/oven-sh/bun`                                  | `http_uri`        |
| IPFS URI      | `ipfs://bafybei...`                                               | `ipfs_uri`        |
| JSON document | `{"@context":"https://schema.org/","@type":"Book","name":"Dune"}` | `json`            |
| Plain string  | `hello`                                                           | `string`          |

A value that begins with `0x` and contains only hexadecimal digits is read as
raw bytes rather than as text. See
[Identifiers](./identifiers.md#text-and-bytes).

## Size limit

The `MultiVault` contract rejects empty atom data and atom data longer than a
configured maximum. At the time of writing, the maximum on mainnet is 1,000
bytes. Read the current value from `atomDataMaxLength` in the contract's
`getGeneralConfig` result.

To refer to a larger document, store the document elsewhere, for example on
IPFS, and use its URI as the atom data.

## Identity

An atom's identifier is derived from its data and nothing else. Two atoms with
the same data are the same atom. This has three consequences:

- An atom cannot be registered twice. The second attempt fails.
- Anyone who knows the data can derive the identifier without asking anyone.
- Data that differs by a single byte produces an unrelated identifier.

The third point matters when you choose atom data. `https://example.com` and
`https://example.com/` are different atoms. To converge on the same atom as
other applications, use the canonical forms described in
[Classification and enrichment](./classification-and-enrichment.md).

## Choosing atom data

Use the most stable and most widely recognized reference to the thing you
mean:

- For something with a canonical URL, use that URL.
- For something with a standard identifier, such as an ISBN or an ISRC, use
  the identifier.
- For structured data, use a schema.org JSON document. The `buildAtomData`
  function in `@0xintuition/classifications` produces the same document for
  the same input.
- For a concept that has no better reference, such as a tag, use a plain
  string.

## Atoms in Intuition Core

Core stores atoms in the `kg.nodes` table. Each row holds the atom's
identifier, its original data, whether the atom has been observed onchain, and
the state of the parse, classify, and enrich stages. See the
[Data model](../reference/data-model.md).

## Related

- [Triples](./triples.md) link atoms into claims.
- [Identifiers](./identifiers.md) describes the derivation.

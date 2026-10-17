---
title: Triples
description: A triple is a claim that links a subject, a predicate, and an object. Each of the three is a term.
---

A triple states a relationship between three terms: a **subject**, a
**predicate**, and an **object**.

| Subject                          | Predicate | Object            |
| -------------------------------- | --------- | ----------------- |
| `https://github.com/oven-sh/bun` | `has tag` | `runtime`         |
| `vitalik.eth`                    | `same as` | `Vitalik Buterin` |
| `ETHGlobal`                      | `has tag` | `hackathon`       |

The subject and object are usually atoms. The predicate is also an atom, drawn
from a shared vocabulary. See [Predicates](./predicates.md).

## Identity

A triple's identifier is derived from the identifiers of its three terms, in
order. Like an atom, a triple cannot be registered twice, and anyone can
derive its identifier from its parts.

Order is significant. `A follows B` and `B follows A` are different triples
with different identifiers.

## Registration order

The `MultiVault` contract registers a triple only if its subject, predicate,
and object are already registered. To publish a triple, register any of its
terms that are missing first, then the triple. See
[Publish onchain](../build/publish-onchain.md).

## Triples about triples

A triple is a term, so it can be the subject or object of another triple.
This lets you make a claim about a claim, for example to attach a source or a
qualification. Core records, for each position of a triple, whether it refers
to an atom or to another triple.

## Counter-triples

Every triple has a counter-triple, which represents disagreement with it. The
counter-triple is created together with the triple. It has its own
identifier, derived from the triple's identifier, and its own vault.
Depositing on a triple expresses support for the claim. Depositing on its
counter-triple expresses opposition.

```ts
import { calculateCounterTripleId } from '@0xintuition/ids';

// tripleId is the identifier of an existing triple.
const counterTripleId = calculateCounterTripleId(tripleId);
```

## A triple is a claim, not a fact

Registering a triple records that someone made the claim. It does not make
the claim true. Whether a claim is credible is expressed by who backs it and
by how much. See [Vaults and signals](./vaults-and-signals.md).

## Reading triples

Core indexes every triple by all six orderings of subject, predicate, and
object. As a result, one request returns every triple that mentions a given
atom in any position. Replace `<atom-id>` with the atom's identifier:

```bash
curl http://localhost:3000/api/atoms/<atom-id>/triples
```

See the [REST API](../build/rest-api.md).

## Related

- [Identifiers](./identifiers.md)
- [Predicates](./predicates.md)

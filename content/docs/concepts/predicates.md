---
title: Predicates
description: Predicates are the shared vocabulary of relationships. Each one is an atom with a fixed identifier.
---

A predicate names the relationship a triple expresses, such as `has tag`,
`same as`, or `created by`. A predicate is an atom. What makes it useful is
that everyone uses the same one.

## Canonical predicates

If two applications express the same relationship with different predicate
atoms, their triples do not line up. To prevent this, Intuition publishes a
canonical predicate registry in `@0xintuition/predicates`. Each canonical
predicate has:

- a **name**, such as `has tag`,
- a **description** that fixes its meaning,
- **atom data**, a small schema.org `DefinedTerm` document built from the name
  and description, and
- an **identifier**, derived from that atom data.

Because the atom data is fixed, the identifier is fixed. Every application
that imports the predicate uses the same identifier.

```ts
import { atomData, id, predicate } from '@0xintuition/predicates/hasTag';

predicate.name; // 'has tag'
id; // The predicate's atom identifier
atomData; // The JSON document the identifier is derived from
```

Import a single predicate from its own entry point, as above, to keep
application bundles small.

Like any atom, a canonical predicate must be registered onchain before an
onchain triple can use it. Check whether it is registered, and create it if
it is not. See [Publish onchain](../build/publish-onchain.md).

## The launch set

The registry marks a launch set of predicates intended for general use:

| Area           | Predicates                                                                 |
| -------------- | -------------------------------------------------------------------------- |
| Classification | `has tag`, `has type`, `has category`, `has description`                   |
| Identity       | `same as`, `linked account`, `url`, `imgUrl`                               |
| Lists          | `contain`, `listed in`, `curated by`                                       |
| Social         | `follow`, `like`, `trust`, `distrust`, `endorse`, `recommend`, `vouch for` |
| Opinion        | `agree with`, `disagree with`, `bullish on`, `bearish on`                  |
| Comparison     | `better than`, `alternative to`                                            |
| Authorship     | `created by`                                                               |

The registry contains many more predicates than the launch set. Each record
also carries semantic flags, such as whether the predicate is symmetric or
transitive, and its inverse where one exists.

## Choosing a predicate

- Prefer a canonical predicate. Introduce a new one only when none fits.
- Read the description, not only the name. `has tag` is for informal
  keywords. `has type` and `has category` are for structured classification.
- Check the direction. In `A created by B`, the subject is the thing that was
  created.

## Predicates in Intuition Core

A node keeps its own predicate registry, with a label and semantic flags for
each entry. It seeds 14 baseline predicates, such as `references`, `follows`,
and `has-tag`, when its database is first migrated. Each entry is identified
by a slug, and not every entry corresponds to a canonical predicate atom. A
triple's predicate is always a term identifier.

To list the registry:

```bash
curl http://localhost:3000/api/predicates
```

## Related

- [Triples](./triples.md)
- [Packages](../build/packages.md)

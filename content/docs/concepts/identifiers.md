---
title: Identifiers
description: How atom and triple identifiers are derived, why they are the same everywhere, and the rules that keep them so.
---

Every term in Intuition has a 32-byte identifier, written as `0x` followed by
64 hexadecimal digits. Identifiers are derived from content. No server,
counter, or contract assigns them.

## Derivation

Each identifier is a keccak256 hash of packed values (`abi.encodePacked`):

| Term           | Identifier                                                 |
| -------------- | ---------------------------------------------------------- |
| Atom           | `keccak256(ATOM_SALT, keccak256(data))`                    |
| Triple         | `keccak256(TRIPLE_SALT, subjectId, predicateId, objectId)` |
| Counter-triple | `keccak256(COUNTER_SALT, tripleId)`                        |

The salts are protocol constants. Each one is the keccak256 hash of its own
name, for example `keccak256("ATOM_SALT")`. The `MultiVault` contract uses the
same derivation, so an identifier computed in an application is the
identifier the contract registers.

## Deriving identifiers in code

Use `@0xintuition/ids`. Do not reimplement the derivation.

```ts
import {
  calculateAtomId,
  calculateCounterTripleId,
  calculateTripleId,
} from '@0xintuition/ids';

const atomId = calculateAtomId('hello');
// 0xa0e157e5fa1b17d3b54ec73622ce3317296920a06502661617613d59f58e947e

const tripleId = calculateTripleId(
  calculateAtomId('hello'),
  calculateAtomId('is a'),
  calculateAtomId('greeting'),
);
const counterTripleId = calculateCounterTripleId(tripleId);
```

The package also exports the salts (`ATOM_SALT`, `TRIPLE_SALT`, and
`COUNTER_SALT`), validators such as `isValidAtomId` and `isValidTripleId`, and
the display helper `shortenHex`. The validators check only that a value is a
well-formed 32-byte identifier. They do not check how it was derived.

## Text and bytes

`calculateAtomId` accepts a string. How the string is interpreted depends on
its form.

| Input                                                 | Interpreted as |
| ----------------------------------------------------- | -------------- |
| A string that is valid hexadecimal with a `0x` prefix | Raw bytes      |
| Any other string                                      | UTF-8 text     |

The two inputs below are therefore the same atom, because `0x68656c6c6f` is
the UTF-8 encoding of `hello`:

```ts
calculateAtomId('hello');
calculateAtomId('0x68656c6c6f');
// Both: 0xa0e157e5fa1b17d3b54ec73622ce3317296920a06502661617613d59f58e947e
```

> [!WARNING]
> Do not pass hexadecimal input with an odd number of digits, such as `0xabc`.
> `@0xintuition/ids` reads it as `0x0abc`, but the transaction builder in
> `@0xintuition/protocol` encodes it as `0xabc0`. The identifier you derive
> would not match the one created onchain. Use an even number of digits.

## Whitespace and normalization

The derivation hashes exactly the bytes it is given. Leading and trailing
whitespace, letter case, Unicode normalization form, and, in a JSON document,
key order and spacing all change the result. Normalize input before you
derive an identifier, and apply the same normalization everywhere.

## Why identifiers do not change

Because an identifier depends only on content:

- Publishing a term onchain does not change its identifier.
- Two parties who describe the same thing with the same data produce the same
  identifier without coordinating.
- A node can store a term before it is registered onchain. When the
  registration is indexed, it carries the same identifier, so the node keeps
  one record for the term.

The derivation is fixed. Changing it would give every term a new identifier,
which would split the graph. Treat the functions in `@0xintuition/ids` as the
definition.

## Related

- [Atoms](./atoms.md) and [Triples](./triples.md)
- [Read the chain](../build/read-the-chain.md)

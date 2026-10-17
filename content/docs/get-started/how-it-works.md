---
title: How Intuition works
description: The three layers of Intuition (the protocol, the packages, and Intuition Core) and how data moves between them.
---

Intuition has three layers. You can use each one on its own.

| Layer          | What it is                                                                 | Where it runs         |
| -------------- | -------------------------------------------------------------------------- | --------------------- |
| Protocol       | Smart contracts that register atoms and triples and hold a vault for each  | The Intuition network |
| Packages       | TypeScript libraries for identifiers, vocabulary, and contract interaction | Your application      |
| Intuition Core | An indexer, a processing pipeline, and a query API                         | Your infrastructure   |

## The protocol

The protocol's central contract is `MultiVault`. It does two things.

It **registers terms**. A term is an atom or a triple. Registration records
that the term exists and who created it. A term can be registered only once,
because its identifier is derived from its content.

It **holds a vault for every term**. Anyone can deposit TRUST, the network's
native currency, into a term's vault and receive shares. The amount deposited
on a term is a public measure of how much its supporters stand behind it. See
[Vaults and signals](../concepts/vaults-and-signals.md).

The protocol runs on the Intuition network, which has a mainnet and a testnet.
Chain IDs, RPC endpoints, and contract addresses are listed in
[Networks and contracts](../build/networks-and-contracts.md).

## The packages

The `@0xintuition` packages are ESM-only TypeScript libraries published on
npm. They let an application work with Intuition data without running any
service:

- `@0xintuition/ids` derives identifiers.
- `@0xintuition/predicates` and `@0xintuition/classifications` supply the
  shared vocabulary, so that applications describe the same things in the same
  way.
- `@0xintuition/protocol` and `@0xintuition/deployments` supply contract ABIs,
  interaction helpers, chain definitions, and addresses.

See [Packages](../build/packages.md) for the full list.

## Intuition Core

You can read individual terms directly from the chain. Answering questions
such as "which triples mention this atom" or "what is this URL" needs an
index. Intuition Core is that index, and it is open source. It contains:

- an **indexer** that decodes `MultiVault` events into an event store,
- **projections** that turn those events into read models and a knowledge
  graph,
- **workers** that parse, classify, and enrich every atom,
- a **REST API** that serves the result,
- **atom services**, a stateless API that classifies and enriches any input
  without storing it, and
- an **explorer**, a web dashboard for inspecting your node.

Anyone can run Core and rebuild the graph from chain events. You do not need
anyone's hosted service to read Intuition data. See
[Run a node](../node/run-a-node.md).

## Local first, onchain when it matters

An identifier depends only on content, so a term does not have to be
registered to be useful. A typical application works like this:

1. It derives identifiers locally and stores atoms and triples in its own
   node. This costs nothing and needs no transaction.
2. It reads the chain to learn which of those terms are already registered.
3. It registers the terms that should be public and permanent. A triple can
   be registered only after its subject, predicate, and object are.

Registering a term does not rename it. The identifier is the same before and
after, so data that different people create locally converges on the same
records once it is published.

## Next steps

- [Atoms](../concepts/atoms.md) and [Triples](../concepts/triples.md) define
  the data model.
- [Architecture](../reference/architecture.md) describes Core's pipeline in
  detail.

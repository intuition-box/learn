---
title: Documentation
label: Overview
description: Build on Intuition, the knowledge graph where every atom and every triple has one identifier, the same on your machine and onchain.
# An action's href is rendered as written, so it is the route, not the file.
actions:
  - label: Quickstart
    href: /docs/get-started/quickstart
  - label: Run a node
    href: /docs/node/run-a-node
---

Intuition is an open knowledge graph. Its data is made of **atoms**, which
identify things, and **triples**, which make claims about them. Every atom and
every triple has an identifier derived from its content, so the identifier you
compute on your own machine is the identifier the protocol registers onchain.

Once an atom or a triple is registered, anyone can deposit into its **vault**.
Deposits are public signals of how much people stand behind it.

This documentation covers the protocol, the packages you build with, and
Intuition Core, the open backend you can run yourself.

## Where to start

| If you want to                               | Read                                                                                    |
| -------------------------------------------- | --------------------------------------------------------------------------------------- |
| Derive an identifier and check it onchain    | [Quickstart](./get-started/quickstart.md)                                               |
| Understand how the parts fit together        | [How Intuition works](./get-started/how-it-works.md)                                    |
| Learn the data model                         | [Atoms](./concepts/atoms.md) and [Triples](./concepts/triples.md)                       |
| See how identifiers are derived              | [Identifiers](./concepts/identifiers.md)                                                |
| Understand vaults, deposits, and fees        | [Vaults and signals](./concepts/vaults-and-signals.md)                                  |
| Stand up your own backend                    | [Run a node](./node/run-a-node.md)                                                      |
| Rebuild the graph from chain events          | [Index the chain](./node/index-the-chain.md)                                            |
| Read and write the graph from an application | [Packages](./build/packages.md) and the [REST API](./build/rest-api.md)                 |
| Register atoms and triples onchain           | [Publish onchain](./build/publish-onchain.md)                                           |
| Give an AI agent accurate protocol knowledge | [Agent skills](./agents/agent-skills.md)                                                |
| Add coverage for a new domain                | [Classification plugins](./extend/classification-plugins.md)                            |
| See how the system is built                  | [Architecture](./reference/architecture.md) and [Data model](./reference/data-model.md) |
| Look up a term                               | [Glossary](./reference/glossary.md)                                                     |

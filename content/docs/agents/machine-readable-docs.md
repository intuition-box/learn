---
title: Machine-readable documentation
description: This documentation is published as plain text for agents and language models, in two files.
---

You can give an agent or a language model this documentation as plain text.
It is published in two files that follow the
[llms.txt](https://llmstxt.org) convention.

| File                                         | Contents                                                              |
| -------------------------------------------- | --------------------------------------------------------------------- |
| [`/docs/llms.txt`](/docs/llms.txt)           | An index: one line per page, with its title, address, and description |
| [`/docs/llms-full.txt`](/docs/llms-full.txt) | Every page in full, as Markdown, in one file                          |

The index is also served at `/llms.txt`, the site's root, where agents look
for it first.

Both files are generated from the same source as the pages you are reading,
so they always match the site.

## Give the documentation to an agent

To give an agent the whole documentation, supply `llms-full.txt`. It is plain
Markdown with no navigation or styling, and a comment before each page
records the page's address.

To let an agent choose what to read, supply `llms.txt`. The agent can then
fetch only the pages it needs.

## Copy a single page

Each page has a **Copy page** control that copies the page as Markdown, ready
to paste into a conversation with a model.

## Combine with agent skills

The two serve different purposes:

- This documentation explains the system: concepts, guides, and reference.
- The [agent skills](./agent-skills.md) give an agent verified protocol
  details for producing transactions.

An agent that writes code against Intuition benefits from both.

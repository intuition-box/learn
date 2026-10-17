---
title: Classification plugins
description: Write a plugin that teaches a node to recognize a new kind of input and resolve it to a canonical atom, then add it to your node.
---

The classification engine is built from plugins. The built-in plugins, for
GitHub, Spotify, Wikipedia, and others, use the same interface that is
available to you. A plugin adds coverage for a domain, such as scientific
papers or an internal system, and produces the same canonical atoms for the
same input on every node.

## Before you begin

- A clone of the [Intuition Core repository](https://github.com/0xIntuition/intuition-core),
  with its dependencies installed (`bun install`). The plugin packages are
  workspace packages of that repository. They are not published to npm.
- Familiarity with [Classification and enrichment](../concepts/classification-and-enrichment.md).

The repository includes a complete example at
`packages/atom-classification-example-plugin`. Copy it to start a new plugin
package in `packages/`. The example below also uses `zod`, so add
`"zod": "catalog:"` to your package's dependencies, as the other Core packages
do.

## Structure

A plugin is an object with a manifest, classifiers, and resolvers. This
plugin recognizes inputs such as `doi:10.1000/182` and resolves each one to a
canonical scholarly article.

```ts
import type { AtomClassificationPlugin } from '@0xintuition/atom-classification';
import { z } from 'zod/v4';

const PLUGIN_ID = 'example-doi';

// DOIs are case-insensitive, so lowercase them to get one canonical form.
function parseDoi(input: string): string | null {
  const value = input.trim();
  if (!value.toLowerCase().startsWith('doi:')) return null;
  const doi = value.slice('doi:'.length).trim().toLowerCase();
  return doi.length > 0 ? doi : null;
}

export function createDoiPlugin(): AtomClassificationPlugin {
  return {
    manifest: {
      id: PLUGIN_ID,
      version: '1.0.0',
      engineRange: '^0.1.0',
      runtime: 'universal',
      capabilities: ['classifier:text:paper', 'resolver:research:paper'],
      permissions: [],
      dependsOn: ['type-profiles'],
      provides: ['research:paper'],
      priority: 30,
    },

    // Register any schema.org type that the built-in profiles do not cover.
    registerTypes(registry) {
      registry.register({
        type: 'ScholarlyArticle',
        category: 'thing',
        schema: z.object({ name: z.string().min(1) }).passthrough(),
        requiredFields: ['name'],
        recommendedFields: ['sameAs'],
        identityFields: ['sameAs'],
      });
    },

    classifiers: [
      {
        id: `${PLUGIN_ID}-classifier`,
        priority: 30,
        classify: (input) => {
          const doi = parseDoi(input);
          if (!doi) return null;
          return {
            type: 'text',
            domain: 'research',
            subtype: 'paper',
            confidence: 0.9,
            meta: { plugin: PLUGIN_ID, doi },
          };
        },
      },
    ],

    resolvers: [
      {
        id: `${PLUGIN_ID}-resolver`,
        priority: 30,
        canResolve: (classification) =>
          classification.domain === 'research' &&
          classification.subtype === 'paper',
        resolve: ({ request }) => {
          const doi = parseDoi(request.input);
          if (!doi) return null;
          return {
            atoms: [
              {
                schemaType: 'ScholarlyArticle',
                category: 'thing',
                title: `DOI ${doi}`,
                canonicalId: `doi:${doi}`,
                sameAs: [`https://doi.org/${doi}`],
                source: PLUGIN_ID,
              },
            ],
            fallbackUsed: false,
          };
        },
      },
    ],
  };
}
```

### Manifest

| Field          | Meaning                                                                                                    |
| -------------- | ---------------------------------------------------------------------------------------------------------- |
| `id`           | A unique, lowercase, hyphenated identifier                                                                 |
| `version`      | The plugin's semantic version                                                                              |
| `engineRange`  | The engine versions the plugin supports. The current engine version is `0.1.0`                             |
| `runtime`      | Where the plugin can run: `server`, `client`, or `universal`, which covers both                            |
| `capabilities` | Free-form labels for what the plugin does                                                                  |
| `permissions`  | `network` if the plugin makes network requests, `ai` if it calls a model. A client runtime cannot use `ai` |
| `dependsOn`    | Plugins that must be registered first. The engine fails if one is missing                                  |
| `provides`     | Free-form labels for what the plugin produces                                                              |
| `priority`     | Lower values run earlier. Built-in plugins mostly use values from 10 to 50                                 |

### Classifiers

A classifier receives the trimmed input and returns a classification, or
`null` to decline. A classification has a `type` (such as `url` or `text`), a
`domain`, a `subtype`, a `confidence` between 0 and 1, and `meta`.

Every classifier sees the input. The engine keeps the classification with the
highest `confidence`. When two are equal, the classifier with the lower
`priority` wins. A classifier that throws is ignored.

### Resolvers

A resolver turns a classification into candidate atoms. The engine calls
`resolve` only when `canResolve` returns `true`. The context passed to
`resolve` contains the original `request`, the `classification`, and the time
as `now`.

Each candidate atom has a schema.org `schemaType`, a `category`, and a
`title`. Give it a `canonicalId` and `sameAs` links too. These are what make
two applications that describe the same thing converge on one atom.

The `schemaType` must be registered with the engine. The built-in
`type-profiles` plugin registers common types such as `Person`,
`MusicRecording`, `Book`, and `WebSite`. Register any other type in your
plugin's `registerTypes`, as the example does. A resolver that returns an
unregistered type fails.

## Test the plugin

Create an engine with the default plugins and yours, and classify an input:

```ts
import {
  createClassificationEngine,
  defaultClassificationPreset,
} from '@0xintuition/atom-classification';

import { createDoiPlugin } from './index';

const engine = createClassificationEngine({
  runtime: 'server',
  plugins: [...defaultClassificationPreset(), createDoiPlugin()],
});

const result = await engine.classify({ input: 'doi:10.1000/182' });

console.log(result.classification); // domain 'research', subtype 'paper'
console.log(result.resolved); // the ScholarlyArticle candidate
```

Write tests with `bun:test` and run them with `bun test`. The example plugin
and the built-in plugins show the conventions.

## Add the plugin to your node

Atom services and the classification worker build their engine in the same
file, `services/atom-services/src/service/runtime.ts`. A plugin you add there
classifies both direct requests and every atom that passes through the node.

1. Add your package to the dependencies in
   `services/atom-services/package.json`, for example
   `"@0xintuition/example-doi": "workspace:*"`, and run `bun install` from
   the repository root.
2. In `runtime.ts`, find `createClassificationRuntime` and append your plugin
   to the plugin list:

   ```ts
   plugins: [
     ...defaultClassificationPreset({
       // The existing options stay as they are.
     }),
     createDoiPlugin(),
   ],
   ```

3. Rebuild and restart the services:

   ```bash
   docker compose up -d --build atom-services workers-classification
   ```

4. Classify an input through atom services:

   ```bash
   curl -X POST http://localhost:4010/v1/classify \
     -H 'Content-Type: application/json' \
     -d '{"input":"doi:10.1000/182"}'
   ```

   The response's `classification` has the domain `research` and the subtype
   `paper`.

## Requirements

- **Be deterministic.** Classification feeds identity. The same input must
  always produce the same output. Do not use randomness, the current time, or
  an unpinned model in the classification path.
- **Degrade gracefully.** If the plugin needs a credential or the network
  and it is unavailable, return `null`. Do not throw for a missing
  credential.
- **Declare dependencies.** If the plugin builds on another plugin's output
  or types, name that plugin in `dependsOn`.

## Contribute a plugin

A plugin that is useful beyond your node can become part of Intuition Core.
Classification output is identity-sensitive, so open an issue in the Core
repository and agree on the scope before you open a pull request. See the
repository's `CONTRIBUTING.md`.

## Related

- [Enrichment plugins](./enrichment-plugins.md)
- [Classification and enrichment](../concepts/classification-and-enrichment.md)
- [Atom services](../build/atom-services.md)

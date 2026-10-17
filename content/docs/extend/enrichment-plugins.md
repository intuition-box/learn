---
title: Enrichment plugins
description: Write a plugin that fetches metadata for classified atoms from one source and returns it as typed artifacts, then add it to your node.
---

An enrichment plugin reads one source and returns **artifacts**, typed
records that are attached to an atom. The built-in providers, such as
OpenGraph, Wikipedia, and npm, use the interface described here.

## Before you begin

- A clone of the [Intuition Core repository](https://github.com/0xIntuition/intuition-core),
  with its dependencies installed (`bun install`). Write the plugin as a
  workspace package in `packages/`, with `@0xintuition/atom-enrichment` and
  `zod` as dependencies. The enrichment packages are not published to npm.
- An understanding of how classification feeds enrichment. See
  [Classification and enrichment](../concepts/classification-and-enrichment.md).

The npm provider, at `packages/atom-enrichment/src/plugins/providers/npm`, is
a compact, complete example that needs no API key.

## Structure

This plugin enriches atoms whose URL points at a record on a fictional
service, `example.org`. It needs an API key, and declines when the key is
absent.

```ts
import {
  type ClassificationDefinition,
  defineEnrichmentPlugin,
  type EnrichmentPlugin,
  type EnrichmentRequest,
} from '@0xintuition/atom-enrichment';
import { z } from 'zod/v4';

const PLUGIN_ID = 'example-records';
const ARTIFACT_TYPE = 'example-record';

const recordSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
});

// The artifact type, registered with the engine when you add the plugin.
export const exampleRecordArtifactType: ClassificationDefinition = {
  slug: ARTIFACT_TYPE,
  displayName: 'Example record',
  category: 'knowledge',
  dataSchema: recordSchema,
};

function parseRecordId(request: EnrichmentRequest): string | undefined {
  const url = request.input.hints?.url;
  const match = url?.match(/^https:\/\/example\.org\/records\/([a-z0-9-]+)$/);
  return match?.[1];
}

export function createExampleRecordsPlugin(
  options: { apiKey?: string } = {},
): EnrichmentPlugin {
  return defineEnrichmentPlugin({
    id: PLUGIN_ID,
    version: '1.0.0',
    runtime: 'universal',
    artifactTypes: [ARTIFACT_TYPE],
    priority: 40,
    TTL: 3_600,

    supports(request) {
      return Boolean(options.apiKey) && parseRecordId(request) !== undefined;
    },

    async enrich(request, ctx) {
      const id = parseRecordId(request);
      if (!id || !options.apiKey) return [];

      const response = await fetch(`https://api.example.org/records/${id}`, {
        headers: { authorization: `Bearer ${options.apiKey}` },
        signal: ctx.signal,
      });
      if (response.status === 404) return [];
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} from api.example.org`);
      }

      const record = recordSchema.parse(await response.json());

      return [
        {
          artifact_type: ARTIFACT_TYPE,
          data: record,
          meta: {
            pluginId: PLUGIN_ID,
            provider: PLUGIN_ID,
            identityStrength: 'identifier',
            fetchedAt: ctx.now(),
            sourceUrl: `https://example.org/records/${id}`,
          },
        },
      ];
    },
  });
}
```

### Plugin fields

| Field           | Meaning                                                                                                   |
| --------------- | --------------------------------------------------------------------------------------------------------- |
| `id`            | A unique identifier: 2 to 40 lowercase letters, digits, and hyphens, starting with a letter               |
| `version`       | The plugin's semantic version                                                                             |
| `runtime`       | `server`, `client`, or `universal`, which covers both                                                     |
| `artifactTypes` | The artifact types the plugin can return. Each follows the same naming rule as `id`                       |
| `priority`      | Lower values run earlier. The default is `100`                                                            |
| `TTL`           | How long, in seconds, the engine caches the plugin's artifacts. Omit it to disable caching for the plugin |
| `supports`      | A fast check of whether the plugin applies to the request. It must not make network requests              |
| `enrich`        | Fetches the data and returns artifacts. Return an empty array when there is nothing to return             |

### The request

`supports` and `enrich` receive the classified atom in `request.input`:

| Field      | Contents                                                                       |
| ---------- | ------------------------------------------------------------------------------ |
| `atomType` | The atom's category, such as `person`, `song`, or `software`                   |
| `jsonLd`   | The schema.org document that classification produced                           |
| `hints`    | Optional `name`, `description`, `url`, `identifiers`, and `locale`             |
| `targets`  | Parsed targets for some platforms, such as a GitHub repository or an X profile |

### The context

`enrich` also receives a context:

| Member    | Purpose                                                                        |
| --------- | ------------------------------------------------------------------------------ |
| `now()`   | The current time as an ISO 8601 string. Use it for `meta.fetchedAt`            |
| `signal`  | An abort signal. Enrichment runs under a deadline, so pass it to every request |
| `logger`  | An optional logger with `debug`, `warn`, and `error`                           |
| `secrets` | Optional secrets supplied by the host                                          |

### Artifacts

Each artifact has an `artifact_type`, its `data`, and a `meta` object.
`meta.pluginId`, `meta.provider`, and `meta.fetchedAt` are required.
`meta.sourceUrl`, `meta.confidence`, and `meta.identityStrength` are optional.

The engine validates `data` against the schema registered for the artifact
type. An artifact whose type is not registered, or whose data does not match,
is dropped and reported as a `validation_error`. Register your artifact type
when you add the plugin to your node.

## Requirements

1. **Validate output with a schema.** Parse the source's response before
   returning it. Unvalidated data from a third party should not enter the
   graph.
2. **Treat credentials as optional.** Accept keys as options. If a key is
   absent, return `false` from `supports`. Never throw for a missing
   credential. This is what allows a node to run without paid accounts.
3. **Honor `ctx.signal`.** Pass the abort signal to every request.
4. **Fail softly.** Treat a 404 as an empty result. Throw for an unexpected
   failure. The engine records the error for your plugin alone and still
   stores the other plugins' artifacts. It classifies the error by its
   message: timeouts, rate limits (`429`), and upstream errors (a message
   that mentions `HTTP`) are marked retriable.
5. **Set an accurate `TTL`.** Use a short value for volatile data, such as
   prices, and a long one for stable data, such as publication metadata.
6. **Read one source per plugin.** Combine sources in a preset, not inside a
   plugin.

## Identity strength

Set `meta.identityStrength` to describe how the plugin found the resource.

| Value        | Use when the resource was found by |
| ------------ | ---------------------------------- |
| `identifier` | An external identifier             |
| `url`        | A direct URL to the resource       |
| `title`      | A search by name                   |

A search by name is the weakest of the three, because a name can match the
wrong thing. An artifact found by name can contribute only descriptive
fields, such as names, descriptions, images, and dates. The full list is
exported as `TITLE_STRENGTH_DESCRIPTIVE_FIELDS` from
`@0xintuition/atom-enrichment/extraction`. Every other field, such as an ISBN
or a repository URL, is treated as identity-bearing, and a search by name cannot supply it. An
artifact without `identityStrength` is treated as `identifier`.

## Add the plugin to your node

Atom services and the enrichment worker build their engine in the same file,
`services/atom-services/src/service/runtime.ts`. A plugin you add there
serves both `POST /v1/enrich` and every atom that passes through the node.

1. Add your package to the dependencies in
   `services/atom-services/package.json` and run `bun install` from the
   repository root.
2. In `runtime.ts`, add the plugin to the default preset. Find
   `createPresetFactories` and extend `allProviders`:

   ```ts
   const allProviders = () => [
     ...serverDefaultPreset(serverDefaultPresetOptions),
     createExampleRecordsPlugin({ apiKey: env.EXAMPLE_RECORDS_API_KEY }),
   ];
   ```

3. In the same file, register the artifact type. Create a registry that
   contains the built-in types and yours, and pass it to
   `createEnrichmentEngine` in `createEnrichmentRuntime`:

   ```ts
   import { createDefaultClassificationRegistry } from '@0xintuition/atom-enrichment';

   const artifactTypes = createDefaultClassificationRegistry();
   artifactTypes.register(exampleRecordArtifactType);

   // In createEnrichmentRuntime, inside createEngine:
   createEnrichmentEngine({
     plugins: presetFactories[preset](),
     cache: cacheRuntime.enrichmentCache,
     classifications: artifactTypes,
     // The existing identity option stays as it is.
   });
   ```

4. Add `EXAMPLE_RECORDS_API_KEY` to `.env`. Docker Compose passes only the
   variables listed in `docker-compose.yml`, so also add it to the
   `environment` of `atom-services` and of the workers.
5. Rebuild and restart the services:

   ```bash
   docker compose up -d --build atom-services workers-enrichment
   ```

6. Process an input your plugin supports:

   ```bash
   curl -X POST http://localhost:4010/v1/process \
     -H 'Content-Type: application/json' \
     -d '{"rawInput":"https://example.org/records/123"}'
   ```

   The artifact appears in the response's `enrichment.artifacts`. If it
   does not, look for your plugin in `enrichment.skipped` and
   `enrichment.errors`.

For atoms processed by the workers, artifacts are stored in `kg.artifacts`,
with the artifact type in `artifact_kind`.

> [!IMPORTANT]
> The enrichment worker keeps only OpenGraph, favicon, and brand artifacts for
> an atom classified as a generic `WebSite`, which is the fallback for any URL
> that no classifier recognizes. Atom services do not apply this rule, so a
> plugin can work in `/v1/process` and still produce nothing in the workers.
> If your source's URLs fall back to `WebSite`, write a
> [classification plugin](./classification-plugins.md) that gives them a
> specific type.

## Related

- [Classification plugins](./classification-plugins.md), for sources that
  imply a type as well as metadata
- [Enrichment providers](./enrichment-providers.md)
- [Atom services](../build/atom-services.md)

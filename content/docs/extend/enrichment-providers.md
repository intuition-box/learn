---
title: Enrichment providers
description: The data sources a node enriches atoms from, which ones need no credentials, and how to enable the rest.
---

A node enriches atoms from the providers on this page. All of them are in the
default preset. Some work without configuration, and the rest need an API
key. Every key is optional.

## Available without a key

| Provider                                 | Plugin IDs                         | What it provides                                                 |
| ---------------------------------------- | ---------------------------------- | ---------------------------------------------------------------- |
| OpenGraph, microdata and JSON-LD, oEmbed | `opengraph`, `microdata`, `oembed` | Titles, descriptions, images, and embeddable media for web pages |
| Favicons                                 | `favicon`                          | Site icons                                                       |
| Wikipedia and Wikidata                   | `wikipedia`, `wikidata`            | Article extracts, canonical entities, and `sameAs` links         |
| GitHub                                   | `github`                           | Repositories and profiles, at unauthenticated rate limits        |
| npm                                      | `npm`                              | Package metadata and weekly downloads                            |
| Crossref                                 | `crossref`                         | Scholarly works, by DOI                                          |
| MusicBrainz and Apple Music              | `musicbrainz`, `apple-music`       | Artists, releases, and recordings                                |
| Open Library                             | `openlibrary`                      | Books                                                            |
| CoinGecko                                | `coingecko`                        | Token prices and market data, at public rate limits              |
| Spotify                                  | `spotify`                          | Titles and artwork from Spotify's public oEmbed                  |

## Enabled by a key

| Variables                                                                     | Provider        | Enables                                                  | Get a key from                                                                                                     |
| ----------------------------------------------------------------------------- | --------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `GITHUB_TOKEN`                                                                | GitHub          | Higher rate limits: 5,000 requests an hour instead of 60 | GitHub, under **Settings > Developer settings > Personal access tokens**. A read-only fine-grained token is enough |
| `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, and optionally `SPOTIFY_MARKET` | Spotify         | Full track, album, artist, and playlist metadata         | [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard)                                         |
| `ETHERSCAN_API_KEY`                                                           | Etherscan       | Contract names, token metadata, and verified source      | [etherscan.io/apis](https://etherscan.io/apis)                                                                     |
| `TMDB_API_KEY`                                                                | TMDB            | Films, television series, and credits                    | [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api)                                             |
| `COINGECKO_API_KEY`                                                           | CoinGecko       | The rate limits of a CoinGecko Demo plan                 | [coingecko.com/en/api](https://www.coingecko.com/en/api)                                                           |
| `YOUTUBE_API_KEY`                                                             | YouTube         | Video metadata                                           | [Google Cloud Console](https://console.cloud.google.com), with the YouTube Data API v3 enabled                     |
| `GOOGLE_PLACES_API_KEY`                                                       | Places          | Businesses and places                                    | [Google Cloud Console](https://console.cloud.google.com), with the Places API enabled                              |
| `X_BEARER_TOKEN`                                                              | X               | X profiles                                               | [developer.x.com](https://developer.x.com)                                                                         |
| `BRANDFETCH_API_KEY`                                                          | Brand           | Logos and brand assets from Brandfetch                   | [brandfetch.com/developers](https://brandfetch.com/developers)                                                     |
| `PODCAST_INDEX_API_KEY`, `PODCAST_INDEX_API_SECRET`                           | Podcast Index   | Podcasts and episodes                                    | [api.podcastindex.org](https://api.podcastindex.org)                                                               |
| `CANOPY_API_KEY`                                                              | Product listing | Amazon product listings                                  | [canopyapi.co](https://www.canopyapi.co)                                                                           |

The Spotify, X, Etherscan, and Canopy credentials also enable the matching
classification plugins.

Without its key, a provider runs a reduced keyless lookup, skips the atom, or
records an error for itself. In every case, the run continues and the other
providers' artifacts are stored.

`example.env` also lists `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, and
`GOOGLE_GENERATIVE_AI_API_KEY`. Classification and enrichment do not use them.

## Enable a provider

1. Add the key to `.env` in the root of the repository.
2. Restart the services that read it. Docker Compose recreates any container
   whose configuration changed.

   ```bash
   docker compose up -d atom-services workers-classification workers-enrichment
   ```

3. Send atom services an input from the provider's domain:

   ```bash
   curl -X POST http://localhost:4010/v1/process \
     -H 'Content-Type: application/json' \
     -d '{"rawInput":"https://open.spotify.com/track/<track-id>"}'
   ```

   Replace `<track-id>` with the identifier from any Spotify track URL.

The provider's artifact appears in the response's `enrichment.artifacts`. If
the key is missing or rejected, the provider appears in `enrichment.skipped`
or `enrichment.errors` instead.

## Presets

A preset is a named set of enrichment plugins. The workers use
`WORKERS_DEFAULT_PRESET` and atom services use `ATOM_SERVICES_DEFAULT_PRESET`.
Both default to `default`. A request to atom services can also choose a
preset in its `enrichment.preset` field.

| Preset     | Plugins                                          |
| ---------- | ------------------------------------------------ |
| `default`  | Every provider on this page                      |
| `company`  | OpenGraph, Brand, and Favicon                    |
| `music`    | OpenGraph, Spotify, MusicBrainz, and Apple Music |
| `crypto`   | Etherscan and CoinGecko                          |
| `academic` | Crossref and Wikipedia                           |
| `custom`   | The same plugins as `default`                    |

## Share a cache between replicas

Each worker and atom services instance caches enrichment results in memory.
To share one cache between replicas, use Upstash Redis:

```bash
WORKERS_CACHE_PROVIDER=upstash
ATOM_SERVICES_CACHE_PROVIDER=upstash
UPSTASH_REDIS_REST_URL=<url>
UPSTASH_REDIS_REST_TOKEN=<token>
```

Replace `<url>` and `<token>` with the REST credentials of an Upstash Redis
database. If the URL or the token is missing, the service falls back to the
in-memory cache and logs a warning. Set a cache provider to `none` to disable
caching.

> [!NOTE]
> The stock `docker-compose.yml` passes the Upstash credentials to the
> services, but not the `*_CACHE_PROVIDER` or `*_DEFAULT_PRESET` variables.
> To set those under Docker Compose, add them to the services' `environment`
> in a `docker-compose.override.yml` file, which Docker Compose reads
> automatically.

## Add a source

See [Enrichment plugins](./enrichment-plugins.md).

## Related

- [Configuration](../node/configuration.md)
- [Atom services](../build/atom-services.md)
- [Indexing scope](./indexing-scope.md)

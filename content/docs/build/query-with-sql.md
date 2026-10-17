---
title: Query with SQL
description: Connect to a node's databases directly and run analytical queries over the graph and the chain event store.
---

The REST API covers lookups and traversal. For analysis, and for vaults and
positions, which the REST API does not serve, connect to the node's
databases. Both are PostgreSQL.

## Connect

With the default Docker Compose stack, the databases listen on local ports
5432 and 5433:

```bash
# The knowledge graph
psql postgresql://intuition:intuition@localhost:5432/intuition_kg

# The chain event store and market read models
psql postgresql://intuition:intuition@localhost:5433/intuition_timescale
```

`make explore` prints a guided summary of the knowledge graph: table counts,
recent atoms, pipeline status, predicates, and artifacts.

> [!NOTE]
> The two databases are separate. There are no foreign keys between them.
> They are related by identifier: an atom's identifier in the knowledge graph
> is its term identifier in the event store.

## Graph queries

### Counts of public records

```sql
SELECT 'nodes' AS table_name, count(*)::bigint AS rows
FROM kg.nodes
WHERE status = 'active' AND visibility = 'public'
UNION ALL
SELECT 'triples', count(*)::bigint
FROM kg.triples
WHERE status = 'active' AND visibility = 'public'
UNION ALL
SELECT 'predicates', count(*)::bigint FROM kg.predicates
UNION ALL
SELECT 'accounts', count(*)::bigint FROM kg.accounts
ORDER BY table_name;
```

### Recent atoms and their pipeline state

```sql
SELECT
  created_at,
  id,
  raw_type,
  classification_type,
  parse_status,
  classification_status,
  enrichment_status,
  left(coalesce(nullif(data, ''), data_hex, ''), 120) AS data_preview
FROM kg.nodes
WHERE status = 'active' AND visibility = 'public'
ORDER BY created_at DESC, id DESC
LIMIT 25;
```

### Most used predicates

```sql
SELECT
  t.predicate_type,
  t.predicate_id,
  p.slug,
  p.label,
  count(*)::bigint AS triple_count
FROM kg.triples t
LEFT JOIN kg.predicates p ON t.predicate_type = 'node' AND t.predicate_id = p.id
WHERE t.status = 'active' AND t.visibility = 'public'
GROUP BY t.predicate_type, t.predicate_id, p.slug, p.label
ORDER BY triple_count DESC
LIMIT 25;
```

## Indexing and market queries

These queries need data from the indexing profile. See
[Index the chain](../node/index-the-chain.md).

### Projection lag

Shows how far each projection is behind the event store.

```sql
WITH maxes AS (
  SELECT
    coalesce(max(sequence_number), 0) AS max_sequence_number,
    coalesce(max(block_number), 0) AS max_block_number
  FROM public.event_store
  WHERE is_canonical = true
)
SELECT
  pc.projection_name,
  pc.sink_name,
  pc.last_sequence_number,
  maxes.max_sequence_number,
  maxes.max_sequence_number - pc.last_sequence_number AS sequence_lag,
  pc.last_block_number,
  maxes.max_block_number - pc.last_block_number AS block_lag,
  pc.last_updated_at
FROM public.projection_checkpoints pc
CROSS JOIN maxes
ORDER BY sequence_lag DESC, block_lag DESC;
```

### Terms with the largest market capitalization

```sql
SELECT
  ts.term_id,
  t.term_type,
  t.creator,
  left(coalesce(t.atom_data, t.atom_data_hex, ''), 100) AS term_preview,
  ts.total_assets,
  ts.total_market_cap,
  ts.total_holder_count,
  ts.updated_at
FROM public.term_summary ts
LEFT JOIN public.term t ON t.term_id = ts.term_id
ORDER BY ts.total_market_cap DESC
LIMIT 25;
```

### Positions of an account

Lists the vaults an account holds shares in. Replace the address with the
account's address.

```sql
SELECT
  p.term_id,
  p.curve_id,
  p.shares,
  p.total_deposits,
  left(coalesce(t.atom_data, t.atom_data_hex, ''), 80) AS term_preview,
  p.updated_at
FROM public.position p
LEFT JOIN public.term t ON t.term_id = p.term_id
WHERE lower(p.account_id) = lower('0x0000000000000000000000000000000000000001')
  AND p.shares > 0
ORDER BY p.shares DESC;
```

`shares` and `total_deposits` are in wei. `term_preview` is empty for a
triple, whose terms are in the `subject_id`, `predicate_id`, and `object_id`
columns of `term`.

### Vaults of a term

Shows the current state of a term's vaults, one row per bonding curve.

```sql
SELECT
  curve_id,
  total_shares,
  current_share_price,
  total_assets,
  market_cap,
  holder_count,
  updated_at
FROM public.vault
WHERE lower(term_id) = lower('0x49ed8bdcd1954e1de3af8bb5fca0f0377ebe598de5dd82ab5b4a45a82d53a53f');
```

## More queries

The Intuition Core repository includes a cookbook of queries in
`docs/example-queries.md`. It covers the graph, the worker pipeline,
artifacts, indexing, market data, checks across the two databases, and API
key administration.

## Related

- [Data model](../reference/data-model.md)
- [REST API](./rest-api.md)

# tier1-features/database/get-schema

## Target

`db-get-schema` — all three `schemaTarget` modes against the live dev SQL
Server (`SGT_DEV_DB_CONNECTION`, FP-3 gated).

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | target=tables with LIKE `schemaFilter` | this triple | tables-filter-count |
| 2 | tables target's extra `tableNames` listOfTexts output | this triple | tables-names-list |
| 3 | target=columns on a schema-qualified, token-composed table name | this triple | columns-count |
| 4 | target=databases (server catalog) | this triple | databases-nonempty (count is server state → asserted `> 0`, not exact) |
| 5 | columns without tableName → runtime error | this triple | buried step 5 + smoke expectErrorCount=0 |
| 6 | tables without filter (full listing) | deferred: result set is shared-server state, nondeterministic; filter path pins the same query shape | — |
| 7 | PG / MySQL dialects | deferred: `getTables`/`getColumns` per-dialect SQL is pinned by the live-* cross-dialect triples' pipeline; a cross-dialect schema matrix can extend `_generate-live-matrix.mts` later | — |

## Witnesses

- In-bot: none beyond the action's own outputs — `db-get-schema` is itself a
  reader; the CREATE TABLE arrange step (db-sql-query, a different action) is
  what plants the ground truth it must report.
- Out-of-band: the *shape* witness is inverted here: the harness created
  nothing, the bot created the table via db-sql-query and db-get-schema must
  see exactly it (`itemCount=1` under a session-scoped filter, 3 columns).

## Envelope / cleanup

Table `[sgtester].[{var:_sgtSessionId}_sch]` is session-unique (no
cross-run collisions) and registered in `envelope.ephemeralDbTables` — the
harness reaper drops it AFTER predictions evaluate. No in-bot DROP by design.

## Expected values derived from

Runner source (`db-get-schema.runner.ts`): tables → `dialect.getTables`
(INFORMATION_SCHEMA.TABLES, LIKE filter) + `tableNames` output only for this
target; columns → `dialect.getColumns` with `splitQualifiedTableName`;
databases → `dialect.getDatabases`. Probe reproduced itemCount 1/3/2 and the
"Table name is required when target is 'columns'" runtime error.

## Known gaps / notes

- `tableNames` equality is asserted via `ends_with` ("_sch") because the name
  carries the session UUID and the DSL cannot compose strings.
- `databases` returned 2 catalogs (DevData, TestDB) on the dev VM at probe
  time — that's server state, so only `> 0` is pinned.

- 2026-07-13 svar conversion: infra references now flow through `{svar:sgt…}` shared variables (customer-configurable; harness seeds the same names from SGT_* env) with a require-shared-vars preflight gate. Witnesses and prediction values unchanged.

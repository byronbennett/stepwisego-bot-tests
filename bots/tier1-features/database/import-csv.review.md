# tier1-features/database/import-csv

## Target

`import-to-database` — delimited-file bulk import into the live dev SQL
Server (`SGT_DEV_DB_CONNECTION`, FP-3 gated).

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | headers row + comma delimiter | this triple | rows-read (3 data rows, header excluded) |
| 2 | mapTo kind=sourceField (3 columns: int, nvarchar, decimal) | this triple | oob-cell-customer, rows-imported |
| 3 | mapTo kind=literal (constant fills every row) | this triple | oob-cell-literal-map |
| 4 | pre-flight schema validation failure (mapped column absent from live table) | this triple | buried step 4 + oob-row-count (nothing imported) |
| 5 | mapTo kind=token / unmapped | deferred: same `buildResolver` dispatch as literal/sourceField; token needs a runtime variable — candidate for a follow-up permutation | — |
| 6 | fixed-width / custom delimiter / no-headers | deferred: `openSourceFile` reader options, one representative (comma+headers) pinned here | — |
| 7 | NOT NULL adjustment paths (dropped column / "" fill) | deferred: needs a table with NOT NULL non-text no-default columns — edge-path candidate | — |
| 8 | batch isolation / timeout paths | deferred: needs a big file or a hostile server; not reachable deterministically at 3 rows | — |
| 9 | PG / MySQL dialects | deferred: bulkInsert per dialect pinned by live-* loop-insert triples | — |

## Witnesses

- In-bot: `db-sql-query` raw SELECT (different Database action) proves row
  id=2 is queryable (`rowCount=1`).
- Out-of-band: harness `read_cell` reads `customer` (sourceField map) and
  `source` (literal map) straight off the table; `count_rows_in` pins the
  exact row count at 3 — also proving the buried schema-validation failure
  imported nothing.

## Envelope / cleanup

- Source csv lives in `{var:_sgtScratchDir}` (FP-8, harness-reaped).
- Table `[sgtester].[{var:_sgtSessionId}_imp]` is session-unique and
  registered in `envelope.ephemeralDbTables`; the reaper drops it after
  predictions evaluate (the table must outlive the run for `read_cell`).

## Expected values derived from

Runner source (`import-to-database.runner.ts`): hasHeaders offsets the data
row numbering; importMap fields of kind unmapped/identity are skipped;
literal maps resolve per row. Schema validation message text confirmed by
probe ("Column \"no_such_column\" is mapped in the import but does not
exist..."). Probe reproduced rowsRead=3 / rowsImported=3 and the in-bot
SELECT returning [["Bob","csv-import"]].

## Known gaps / notes

- `amount` (decimal) is deliberately NOT asserted via read_cell — mssql
  DECIMAL comes back as a JS number and exact-float comparison is the
  numerics track's territory, not this fixture's.
- **Engine split found by this fixture:** the agent loads bots with
  `parseAndValidateBot({migrate: true})`, whose
  `migrateImportSourceFieldMappings` rewrites sourceField-kind maps to
  `{<stepPrefix>-sourceFields:<key>}` tokens; the in-process engine runs the
  bot unmigrated. The token resolver only recognizes step prefixes matching
  `^s[a-z]+…` — with the original prefix "imp" the migrated token stayed
  unresolved and every row failed coercion ON THE AGENT ONLY. Prefix renamed
  to "simp"; the internal product backlog carries the product note (editor doesn't constrain
  user-chosen prefixes to the resolvable pattern).

- 2026-07-13 svar conversion: infra references now flow through `{svar:sgt…}` shared variables (customer-configurable; harness seeds the same names from SGT_* env) with a require-shared-vars preflight gate. Witnesses and prediction values unchanged.

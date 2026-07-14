# tier1-features/database/import-json

## Target

`import-json-to-database` — JSON-variable bulk import with
`createTableIfMissing` auto-create, against the live dev SQL Server
(`SGT_DEV_DB_CONNECTION`, FP-3 gated).

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | json array-of-objects source parm (dataType json) | this triple | rows-read |
| 2 | createTableIfMissing=true auto-creates the target table (nvarchar/int/nvarchar families) | this triple | oob-cell-qty (int round-trip through the auto-created column) |
| 3 | mapTo kind=sourceField via fieldAlias dot-path lookup | this triple | oob-cell-qty |
| 4 | mapTo kind=literal | this triple | oob-cell-literal-map |
| 5 | qty=0 item imports (falsy-value guard) | this triple | rows-imported=3 + oob-row-count |
| 6 | schema validation failure on existing table (createTableIfMissing=false) | this triple | buried step 2 + oob-row-count |
| 7 | single-object (non-array) source, nested dot-paths | deferred: `normalizeJsonSourceData` wraps and `flattenJsonObject` flattens — unit-tested in shared; a nested-path permutation is a cheap follow-up | — |
| 8 | dialects without CREATE TABLE support | deferred: `supportsCreateTable` guard needs a dialect that lacks it | — |

## Witnesses

- In-bot: `db-sql-query` raw SELECT proves sku C-3 is queryable
  (`rowCount=1`).
- Out-of-band: harness `read_cell` reads `qty` (typed int 12) and `origin`
  (literal map) off the auto-created table; `count_rows_in` pins 3 rows.

## Envelope / cleanup

Table `[sgtester].[{var:_sgtSessionId}_impj]` is session-unique, created BY
THE ACTION (auto-create is the arrange), registered in
`envelope.ephemeralDbTables` for the post-prediction reaper.

## Expected values derived from

Runner source (`import-json-to-database.runner.ts` +
`json-source-reader.ts`): fieldAlias is the flatten lookup key
(fieldName is the synthetic [field_NNN] id); `typeFamily` maps int → INT
column in `buildCreateTableDdl`. Probe reproduced rowsRead/rowsImported=3,
the auto-created table, in-bot [["12"]], and the "Column \"ghost_col\" is
mapped..." validation error.

## Known gaps / notes

- Step prefix is "simpj" (not "impj") — the agent-side
  `migrateImportSourceFieldMappings` rewrite emits
  `{<stepPrefix>-sourceFields:<key>}` tokens and the token resolver only
  recognizes `^s[a-z]+…` step prefixes. See import-csv.review.md for the
  full engine-split writeup.

- Auto-create maps the int family to BIGINT (`buildCreateTableDdl`), and the
  mssql driver returns BIGINT values as STRINGS ("12"). The oob-cell-qty
  check therefore compares numerically via `between [x, 12, 12]` (cmpNum
  coerces exactly) instead of `equals 12` — pinning the value without
  pinning the driver's string rendering.

- 2026-07-13 svar conversion: infra references now flow through `{svar:sgt…}` shared variables (customer-configurable; harness seeds the same names from SGT_* env) with a require-shared-vars preflight gate. Witnesses and prediction values unchanged.

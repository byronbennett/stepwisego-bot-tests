# INT-03 — rest-json-to-db-roundtrip

**Catalog:** `docs/testing/regression-suite/integration-scenarios.md` § INT-03
**Chain (6 data-flow actions):** loopback listener serves fixture JSON →
`rest-call` GET → `json-parse` (lossless) → `json-get-property` (meta +
orders) → `json-to-datatable` (DT seam witness) →
`import-json-to-database` → in-bot `db-sql-query` SELECT back.
**Needs:** `SGT_DEV_DB_CONNECTION` (SQL Server dev DB, `sgtester` schema).

## Architecture

- The Track 6 detached-listener pattern (`run-script` → `node -e` server,
  port-file handshake, `/shutdown`), serving one route: `/orders.json`.
- The fixture JSON is embedded in the server as a **base64 constant** and
  served as decoded bytes. This guarantees exact bytes across the four
  string-escaping layers (sgbot JSON → launcher JS → server-code JS →
  HTTP), keeps unicode safe, and — critically — hides `{var:leak}` from
  `run-script`'s own `resolveTokens(scriptText)` pass, so the token-literal
  trap tests the *downstream* seams, not the launcher.
- All target columns are NVARCHAR: this scenario asserts the **transport
  layer** (HTTP → parse → import) is string-exact; SQL numeric-type
  semantics are Tier 1 territory (database playbook) and would only obscure
  which seam coerced.

## Fixture corpus (per catalog check table)

| ref | field | value | probes |
|-----|-------|-------|--------|
| R1 | bigid | `9007199254740993` (2^53+1, JSON number) | lossless revival → string-exact in DB (naive JSON.parse yields …96, warmly wrong) |
| R3 | bigid | `42` | double-safe path still lands canonical "42" |
| R1 | amount | `"1234.5600"` (JSON string) | trailing-zero scale survives — strings are the exactness carrier |
| R2 | amount | `"-0.10"` | negative + trailing zero |
| R1 | unit | `123.4500` (JSON number) | PINNED: revives as native 123.45 — VALUE-exact, scale-lossy (documented lossless-json contract) |
| R2 | unit | `0.1000000000000000055511` (22-sig-digit number) | not double-representable → revives as exact string, lands verbatim |
| R3 | unit/note | `null` | JSON null → DB NULL in-process; see engine split below |
| R1 | note | `"{var:leak}"` | double-resolution trap (bot defines `leak="LEAKED"`) |
| R1 | customer | `Müller & Söhne 漢字` | umlaut + CJK + ampersand |
| R2 | customer | `""` | blank ≠ NULL trichotomy |
| R3 | customer | `O'Hara "Q"` | apostrophe + escaped quotes (injection-adjacent punctuation) |
| meta.batch | `β-42` | nested dot-path navigation + Greek |
| R1 | ship.city | `Köln` | nested-object flattening → `ship_city` column via dot-path source alias |

## Check table → predictions

- big int >2^53 string-exact end-to-end → `oob-bigid-r1-string-exact` (+
  DT seam witness `dt-bigid-revived-string` on R2's …95)
- trailing-zero decimal string-exact → `oob-amount-r1-trailing-zeros`,
  `oob-amount-r2-negative` (+ DT seam witness `dt-amount-string-decimal`);
  number-literal scale loss pinned separately
  (`oob-unit-r1-number-literal-scale`) and the not-double-representable
  literal proves the exact-string revival arm
  (`oob-unit-r2-long-decimal-exact`)
- nested JSON flattening pinned → `oob-ship-city-nested` (import) +
  `meta-nested-unicode` (json-get-property dot path)
- row count exact via out-of-band `count_rows_in` → `oob-row-count`
- `{var:x}` as a JSON value lands literally → `oob-note-token-literal`

## Dual witness

- **In-bot:** `dt-get-value` cells (DT seam), `simpr` rowsRead/rowsImported
  step outputs, `schk` SELECT rowCount.
- **Out-of-band:** harness `read_cell`/`count_rows_in` on the session table
  over its own connection; the reaper drops
  `sgtester.{sessionId}_int03` after predictions evaluate.

## Engine-split gotchas encountered

1. **Step prefix on the import step** is `simpr` (matches `^s[a-z]+`) — the
   Track 5 import-csv lesson. The importMap has a literal-kind entry, so
   `mayUseSourceFieldsToken` publishes per-row sourceFields step variables;
   under agent-load migration the sourceField maps become
   `{simpr-sourceFields:<key>}` tokens which silently break with a
   non-conforming prefix.
2. **JSON null → DB engine split (found by this test, first agent run):**
   - in-process: `buildResolver` sourceField kind does `row[idx] ?? null` →
     `coerceForSqlType(null)` → DB **NULL**.
   - agent: `parseAndValidateBot({migrate:true})` →
     `migrateImportSourceFieldMappings` rewrites the map to token kind →
     `context.resolveTokens("{simpr-sourceFields:note}")` → token-resolver
     line "baseValue === null → return ''" → DB **empty string**.
   - Pinned with a `human-approve` `any_of` (NULL or "") in
     `oob-note-null`; either way it must not be the string `'null'` or a
     leaked token. Filed in the internal product backlog — the product needs a null-vs-blank
     decision at the import-migration seam (fix would be a null-preserving
     sourceFields token path or skipping stringification for import
     resolvers).
3. `sanitizeKey` maps the dot-path alias `ship.city` → sourceFields key
   `ship_city`, so the migrated token stays resolvable on the agent.

## Deliberate scope cuts

- `import-to-database` (file-based) not used — it reads delimited files,
  not variables; `import-json-to-database` is the JSON-source member of the
  same import pipeline (shared map-resolver/value-coercion/row-publisher).
- The DT leg is witness-only (no dt→db import exists); the import consumes
  the parsed `orders` array directly, per the runner contract.

- 2026-07-13 svar conversion: infra references now flow through `{svar:sgt…}` shared variables (customer-configurable; harness seeds the same names from SGT_* env) with a require-shared-vars preflight gate. Witnesses and prediction values unchanged.

# INT-05 — excel-loop-db-post (the ERP-posting shape)

**Catalog:** `docs/testing/regression-suite/integration-scenarios.md` § INT-05
**Chain:** bundled invoice `.xlsx` → `save-bundled-file` →
`xl-open-existing-workbook` → `xl-get-range-as-datatable` → `loop` rows →
per-row builder INSERT (inside an `error-handler`) → `SELECT SUM` aggregate
→ posting-summary CSV (`csv-write-line`).
**Needs:** `SGT_DEV_DB_CONNECTION` (SQL Server dev DB, `sgtester` schema).

## Fixture

`invoice.xlsx` is committed **inside the .sgbot** as a `Bot.files` bundled
entry (base64, sha256-stamped) and materialized with `save-bundled-file` —
the same hermetic mechanism as tier1 `excel/formulas`. Sheet `Invoice`,
header row + 6 line items:

| item | descr | qty | amount |
|------|-------|-----|--------|
| L1 | Widget Ω | 2 | 19.99 |
| L2 | Gizmo – deluxe | 1 | 1234.56 |
| L3 | Bracket | 10 | 0.1 |
| L4 | シールド | 3 | 45 |
| L5 | O'Ring | 4 | 7.25 |
| L6 | Mystery fee | 1 | `"N/A"` (text — the malformed row) |

Hand-computed good-row total: **1306.90**.

Fixture generated with a throwaway exceljs script (deleted per playbook);
regenerate by rebuilding those rows if the corpus ever changes.

## Check table → predictions

- per-iteration column sub-variables (Excel-sourced) →
  `posted-amounts-token-strings` (`{spost-currentDataRow:amount}` strings)
- amounts survive Excel→DT→SQL per row (out-of-band) → `oob-amount-l2`,
  `oob-amount-l3-small`, `oob-qty-l3` (numeric `between` — the mssql
  driver's DECIMAL return type varies); unicode/punctuation corpus →
  `oob-descr-unicode`, `oob-descr-punctuation`
- sum matches hand-computed constant (**human-approve**) →
  `sum-hand-computed` (`sum_of` over the posted list, exact accumulation)
  cross-checked by the DB-side `db-sum-scale-exact` (`SELECT SUM` CAST to
  NVARCHAR = `"1306.90"` — DECIMAL(18,2) keeps the .90 scale)
- DB row count equals spreadsheet good-line count → `oob-row-count` (5)
- malformed row pinned: `failed-items` == `["L6"]`, posting **skips** the
  row and continues (loop finishes, run completes), summary CSV records it
  → `oob-summary-csv-exact`; `smoke.expectErrorCount: 1` (the caught INSERT
  failure increments the run's error count — INT-06 precedent)

## Value-fidelity notes

- **Excel scale is formatting, not value:** the DT cell for 0.10 is the
  double `0.1`, for 45.00 it's `45` — the token string forms are pinned in
  `posted-amounts-token-strings`. Exact scale re-enters at the SQL DECIMAL
  column (`db-sum-scale-exact`), which is where a real ERP posting would
  enforce it.
- The malformed row fails **at runtime at the INSERT contract** (text into
  DECIMAL NOT NULL), not structurally — pre-run validation passes.

## Dual witness

- **In-bot:** loop crumb lists (`postedAmounts`/`failedItems`), `srange`
  rowCount step output, `sagg` SELECT SUM via `dt-get-value`.
- **Out-of-band:** harness `read_cell`/`count_rows_in` on the posting
  table + `read_value` byte-exact on the summary CSV in scratch.

## Gotchas encountered

1. **Builder-INSERT table names do not resolve tokens** (unlike rawSql):
   `queryTables[].name` with `{var:_sgtSessionId}` reached SQL Server as
   the literal token — `Invalid object name`. The builder's table names
   come from schema introspection in the editor, so tokens were never
   expected there. Followed the tier1 `live-mssql-loop-insert` precedent:
   fixed table name `sgtester.sgt_int05_post` with `IF OBJECT_ID … DROP`
   first in ARRANGE for rerun idempotence (the reaper also drops it via
   `ephemeralDbTables`). Consequence: this test is not safe under
   concurrent same-DB runs — same as the tier1 live-* DB triples; noted
   for FP-6 (`envelope.exclusive`).
2. `error-handler` re-initializes its `statusVariable` to `false` on every
   execution, so the per-iteration `rowFailed` flag needs no manual reset.
3. `csv-write-line` separates records with a **leading** newline (legacy
   behavior) — the summary file has no trailing newline; the byte-exact
   prediction depends on it.

- 2026-07-13 svar conversion: infra references now flow through `{svar:sgt…}` shared variables (customer-configurable; harness seeds the same names from SGT_* env) with a require-shared-vars preflight gate. Witnesses and prediction values unchanged.

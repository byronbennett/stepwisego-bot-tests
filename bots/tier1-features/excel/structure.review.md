# tier1-features/excel/structure

## Target

`xl-insert-row`, `xl-delete-row`, `xl-insert-column`, `xl-delete-column`,
`xl-copy-down` — structural splices and the Excel fill-down idiom.

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | copy-down formula source: row refs incremented per row | this triple | copy-down-formula-adjusts-rows |
| 2 | copy-down literal source: verbatim replication | this triple | copy-down-literal-replicates |
| 3 | copy-down fill extent = adjacent column's contiguous data (left preferred) | this triple | both copy-down checks (B drives C, C drives D) |
| 4 | copy-down right-neighbor fallback (left column empty) | deferred: same scan with the other operand; left-preference pinned by #3 | — |
| 5 | copy-down no adjacent data → soft no-op (passes, 0 rows) | this triple | copy-down-nothing-adjacent-is-noop |
| 6 | copy-down empty source cell → hard error, buried | this triple | smoke expectErrorCount=0 |
| 7 | copy-down absolute row refs ($1) preserved | deferred: adjustFormulaRow regex is unit-testable; relative-ref rewrite pinned by #1 | — |
| 8 | insert-row with count>1 | this triple | insert-delete-row-inverse-pair |
| 9 | delete-row with count>1 (exact inverse) | this triple | insert-delete-row-inverse-pair |
| 10 | insert-column single | this triple | insert-delete-column-inverse-pair |
| 11 | delete-column single (exact inverse) | this triple | insert-delete-column-inverse-pair |
| 12 | delete-column letter-range form 'B:C' | this triple | delete-column-range-form |
| 13 | insert-row rowNumber<1 → error, buried | this triple | smoke |
| 14 | delete-column non-letter input → error, buried | this triple | smoke |
| 15 | splice interaction with formulas (refs NOT adjusted by splices) | deferred: ExcelJS spliceRows/Columns move cells without rewriting refs — a sharp-edge pin needs its own fixture; noted below | — |
| 16 | Full (COM) branches | deferred: FP-7 Tier 3 hosted (xlcom-*) | — |

## Witnesses

- In-bot: every splice is witnessed by positional reads with
  skipEmptyValues=false (gaps visible at exact indices) and each
  insert/delete pair must be an EXACT inverse — the restored array equals
  the original authored list. Copy-down witnessed three ways: computed
  values (engine), formula text (get-formula), and literal replication.
- Out-of-band: in-variable only; all expectations are literal arrays in the
  DSL. SENTINEL defaults prove each read ran. Three buried failures +
  expectErrorCount=0.

## Envelope / cleanup

No files. Sheet1 hosts copy-down; Sheet2 hosts splices (kept formula-free so
splice semantics are pinned without ExcelJS's no-ref-rewrite footgun).

## Expected values derived from

Runner sources: spliceRows/spliceColumns semantics; copy-down's
adjacent-column scan (left preferred, fallback right), formula row-offset
rewrite (adjustFormulaRow), soft no-op vs empty-source hard error;
delete-column's LETTERS_ONLY + colon-range parsing. Probe reproduced every
array.

## Known gaps / notes

- Deliberate design: splices tested on a literal-only sheet. ExcelJS
  spliceRows/spliceColumns move cell contents WITHOUT adjusting formula
  references (unlike real Excel) — bots mixing splices and formulas will see
  stale refs. Recorded here as the category's sharpest known edge (matrix
  #15) pending its own pin.
- Pinned: copy-down's fill extent tracks the ADJACENT column, not the
  source column — the Excel double-click-fill-handle idiom.

- 2026-07-13 standalone bootstrap: added a session-bootstrap preflight (require-shared-vars, bootstrap-only mode) + create-folder ahead of the original steps, so this bot is runnable standalone (not only via RunAllRegressionTests). Witnesses and prediction values unchanged.

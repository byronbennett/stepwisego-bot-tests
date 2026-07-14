# tier1-features/excel/workbook-lifecycle

## Target

`xl-create-new-workbook`, `xl-open-existing-workbook`, `xl-save`,
`xl-save-as-xlsx`, `xl-close-workbook` — the Fast-mode workbook lifecycle.
Establishes the canonical Excel dual-witness roundtrip every other Excel
triple leans on: build in a variable → save-as to scratch → independent
re-open into a SECOND variable → read back with `xl-get-value`.

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | xl-create-new-workbook numberOfSheets=2 → Sheet1/Sheet2 default names | this triple | fresh-workbook-default-sheets |
| 2 | xl-create-new-workbook default (1 sheet) | deferred: numberOfSheets=2 exercises the same loop; count pinned by sheet-names array length | — |
| 3 | xl-set-value to default (first) sheet vs explicit sheetName=Sheet2 | this triple | in-bot-crumbs-all-ok, xlsx-roundtrip-second-sheet |
| 4 | xl-save on a never-saved workbook (no filePath) → error, buried | this triple | smoke expectErrorCount=0 |
| 5 | xl-save-as-xlsx to new path (replaceExisting default false, target absent) | this triple | save-as-exists-calibrated |
| 6 | xl-save-as-xlsx onto existing path, replaceExisting=false → error, buried | this triple | smoke expectErrorCount=0 + xl-save-writes-through-to-disk (file not clobbered mid-flow) |
| 7 | xl-save-as-xlsx onto existing path, replaceExisting=true → overwrites | this triple | replace-existing-overwrites |
| 8 | xl-open-existing-workbook on .xlsx | this triple | in-bot-crumbs-all-ok, xlsx-roundtrip-second-sheet |
| 9 | xl-open-existing-workbook on .csv (ExcelJS csv reader branch) | this triple | csv-open-branch |
| 10 | xl-open-existing-workbook on .xls/.xlsb → unsupported-format error, buried | this triple | smoke expectErrorCount=0 |
| 11 | xl-open-existing-workbook on missing path | deferred: same catch-all error path as #10's guard-adjacent branch; .xls guard is the sharper pin | — |
| 12 | xl-save after open (filePath inherited) writes through to disk | this triple | xl-save-writes-through-to-disk |
| 13 | xl-close-workbook clears the variable (subsequent read errors, buried) | this triple | buried-errors-left-sentinel-untouched |
| 14 | xl-close-workbook saveBeforeClose=true | deferred to a later Excel triple if needed; the runner path is xl-save's write with the same helpers | — |
| 15 | Full (COM) mode branches in these runners | deferred: FP-7 Tier 3 hosted Windows runs (xlcom-* manifest entries) | — |

## Witnesses

- In-bot: every save is witnessed by an INDEPENDENT `xl-open-existing-workbook`
  into a fresh variable + `xl-get-value` readback (wb → wb2 → wb3 lineage);
  the session-token cell value (which the DSL cannot express) is checked by
  in-bot If/equalsExact → crumbs.
- Out-of-band: `file_exists({file})` on the binary xlsx (read_value is not
  applicable to binary artifacts per the Track 5 handoff); `file-exists`
  in-bot probe calibrated false→true across the save on the same path.
- Buried errors: 4 fired (no-path save, exists-collision save-as, .xls open,
  closed-workbook read), proven by smoke expectErrorCount=0 + the UNTOUCHED
  readClosed sentinel.

## Envelope / cleanup

All artifacts live under `{var:_sgtScratchDir}/life` (FP-8) — the harness
reaps the scratch dir after predictions evaluate. book.xlsx is deliberately
left for the out-of-band `file_exists`. Note: `xl-save-as-xlsx` does NOT
create parent directories (unlike `write-to-file`), hence the explicit
`create-folder` arrange step.

## Expected values derived from

First principles + runner source: ExcelJS default sheet naming is `Sheet{n}`
(xl-create-new-workbook.runner.ts); save-as collision and no-path save error
messages from xl-save*.runner.ts; the .xls guard from
xl-open-existing-workbook.runner.ts; close-then-read error from
workbook-helpers.getWorkbookRef ("does not contain a workbook").

## Known gaps / notes

- Pinned: a never-saved workbook has no filePath → xl-save errors (use
  save-as first).
- Pinned: xl-open-existing-workbook sets the handle's filePath, so a
  subsequent xl-save writes in place with no further props.
- Pinned: xl-close-workbook sets the variable to undefined; the only reliable
  witness is that the next action on it errors (DSL null checks can't see
  undefined parms).
- Numbers read into a text parm surface as strings ("42") — cell typing
  itself is pinned in the cell-io triple.

- 2026-07-13 standalone bootstrap: added a session-bootstrap preflight (require-shared-vars, bootstrap-only mode) + create-folder ahead of the original steps, so this bot is runnable standalone (not only via RunAllRegressionTests). Witnesses and prediction values unchanged.

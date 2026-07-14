# Review — tier1-features/excel/data-exchange

## What this triple covers

The seven data-exchange actions that bridge Excel grids with other variable
types: `xl-get-range-as-datatable`, `xl-write-data-table`,
`xl-get-sheet-as-jsonl`, `xl-get-workbook-as-json`, `xl-copy-range-to-range`,
`xl-copy-to-clipboard`, `xl-paste-from-clipboard`. The DataTable side of the
bridge is witnessed by the DataTable plugin's own readers (`dt-get-value`,
`dt-get-column-names`, `dt-get-row-count`) and produced by `csv-read` — every
conversion is checked by an action from a *different* plugin.

## Permutation matrix

| Action | Permutation | Where | Witness |
| --- | --- | --- | --- |
| xl-write-data-table | headers on (default), csv-typed number column | step "write-data-table at A1" | `written` exact array via xl-get-values |
| xl-get-range-as-datatable | includeHeaders default (true) | dt2 | dt-get-column-names/-row-count/-value |
| xl-get-range-as-datatable | includeHeaders=false → positional column names | dtNoHdr | `noHdrCols` = ["0","1"], header row demoted to data |
| xl-get-range-as-datatable | expandToRegion=true from single anchor cell | dtRegion | row count matches explicit-range read |
| xl-get-range-as-datatable | missing sheet → runtime error | last step | buried (`ignoreErrors`), expectErrorCount 0, `dtBad` stays null |
| xl-get-sheet-as-jsonl | headers default, default sheet | `jsonl` | exact string (newline-joined, no trailing NL) |
| xl-get-workbook-as-json | multi-sheet incl. EMPTY sheet | `wbJson` | exact pretty-printed string, Sheet2 = [] |
| xl-copy-range-to-range | same workbook, cross-sheet, explicit targetSheetName | Sheet2!C5 | `copiedSameWb` exact array |
| xl-copy-range-to-range | cross-WORKBOOK via targetWorkbookVariable | wbTarget!A1 | `copiedCrossWb` exact array |
| xl-copy-to-clipboard / xl-paste-from-clipboard | 2x2 block, cross-sheet paste | Sheet2!A10 | `pasted` exact array + `pasteTypeCheck` |

## Dual witnessing

- Every grid mutation is read back by `xl-get-values` (a reader that shares no
  code path with the writer under test); every DataTable produced from a grid
  is interrogated by the DataTable plugin's own accessors.
- The out-of-band harness witness for this triple is structural: this bot
  never touches disk (no scratch files), so all predictions are `$var`
  equality over values that crossed at least one serialization boundary
  (workbook parm → deserialize → mutate → reserialize per action).
- The buried failure (`sheetName: "Missing"`) is proven harmless by
  `expectErrorCount: 0` plus `dtBad` remaining at its null default.

## Deliberate design notes

- **`csv-read` as the DataTable producer** — dynamic typing makes `qty` a real
  number, so `xl-write-data-table` exercises its numeric `scalarToCellValue`
  path, later confirmed by `xl-get-formula` returning `"2"` for the pasted
  copy (a value cell, not text).
- **Workbook-as-json snapshot ordering** — taken *before* any Sheet2 writes so
  the empty-sheet representation (`"Sheet2": []`) is pinned.
- **Clipboard is bot-scoped** — `xl-copy-to-clipboard` writes the internal
  `__xl_clipboard` parm (`utils/com-clipboard.ts`), never the OS clipboard, so
  the test is deterministic and side-effect free. The paste-with-empty-
  clipboard error path is NOT tested: in Fast mode an empty `__xl_clipboard`
  falls back to reading the real OS clipboard (pbpaste), which would be
  non-deterministic on a developer machine.
- **JSONL/JSON stringification** — both exporters stringify all cell values
  (`String(v)`), so numbers appear as `"2"` / `"10"` in the exact-string pins.

## Known gaps

- `xl-paste-from-clipboard`'s system-clipboard-text fallback path (untestable
  deterministically, see above).
- `xl-copy-range-to-range` `includeFormatting` (style copy) — Fast mode style
  round-trip has no reader action to witness it; formatting is covered
  behaviorally in the search-and-format triple via clear-formats.
- `xl-get-range-as-datatable` `appendToExisting` permutation not exercised
  (additive convenience over the same extraction core already pinned).

- 2026-07-13 standalone bootstrap: added a session-bootstrap preflight (require-shared-vars, bootstrap-only mode) + create-folder ahead of the original steps, so this bot is runnable standalone (not only via RunAllRegressionTests). Witnesses and prediction values unchanged.

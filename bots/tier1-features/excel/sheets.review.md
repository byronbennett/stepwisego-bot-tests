# tier1-features/excel/sheets

## Target

`xl-add-sheet`, `xl-delete-sheet`, `xl-rename-sheet`, `xl-copy-sheet`,
`xl-move-sheet`, `xl-activate-sheet`, `xl-get-sheet-names`,
`xl-get-sheet-name-at-index` — the sheet-collection surface.

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | add-sheet default position (end) | this triple | add-positions |
| 2 | add-sheet position=start | this triple | add-positions |
| 3 | add-sheet position=<number> | deferred: move-sheet numeric positioning pins the same orderNo arithmetic | — |
| 4 | add-sheet duplicate name → error, buried | this triple | smoke expectErrorCount=0 |
| 5 | get-sheet-names ordering | this triple | add-positions, move-reorders-and-redirects-default, delete-and-last-sheet-guard |
| 6 | sheet-name-at-index 1-based happy path (1, 3) | this triple | name-at-index-one-based |
| 7 | sheet-name-at-index out of range → error, buried | this triple | name-at-index-one-based |
| 8 | rename preserves content | this triple | rename-keeps-content |
| 9 | rename missing sheet → error, buried | this triple | smoke |
| 10 | copy duplicates cells | this triple | copy-is-deep |
| 11 | copy is deep (mutating copy leaves source) | this triple | copy-is-deep |
| 12 | copy to an existing name → error, buried | this triple | smoke |
| 13 | move to position 1 reorders + redirects default reads | this triple | move-reorders-and-redirects-default |
| 14 | move to middle/end positions | deferred: same orderNo midpoint arithmetic; position-1 + add-start pin both edges | — |
| 15 | activate sets views.activeTab; does NOT redirect Fast default reads | this triple | activate-does-not-redirect-fast-reads |
| 16 | activate missing sheet → error, buried | this triple | smoke |
| 17 | delete removes the named sheet | this triple | delete-and-last-sheet-guard |
| 18 | delete missing sheet → error, buried | this triple | smoke |
| 19 | delete the last remaining sheet → guard refuses, buried | this triple | delete-and-last-sheet-guard |
| 20 | copy-sheet style/merge fidelity (formats, merged cells) | deferred: xl-format-range pins styles; merge fidelity needs a styled fixture — candidate follow-up | — |
| 21 | Full (COM) branches | deferred: FP-7 Tier 3 hosted (xlcom-*) | — |

## Witnesses

- In-bot: sheet order witnessed by TWO readers (get-sheet-names array vs
  name-at-index element probes); content behaviors (rename/copy/move)
  witnessed by xl-get-value reads addressed by NAME and by DEFAULT position;
  the delete-last guard witnessed by the surviving names list.
- Out-of-band: pure in-variable mutation; all expected values are literals
  asserted directly in the DSL. Seven buried failures + expectErrorCount=0
  pin every error path.
- Order effects rely on the serialize→deserialize round-trip every action
  performs (orderNo only manifests through xlsx write/read) — inherently
  exercised by the ExcelWorkbook variable contract.

## Envelope / cleanup

No files. Workbook lives in its variable.

## Expected values derived from

Runner sources: add-sheet orderNo start-placement; move-sheet orderNo
midpoint arithmetic; delete guard (`worksheets.length <= 1`); copy-sheet
cell-by-cell duplication; sheet-utils getWorksheet (default = worksheets[0],
NOT the active tab). Probe reproduced every array and scalar.

## Known gaps / notes

- Pinned quirk: activation is metadata-only in Fast mode — default reads
  keep following position. Real Excel (Full mode) honors the active sheet;
  bots that rely on activation semantics need Full mode.
- Pinned: 'default sheet' = first by ORDER (post-move, the moved sheet
  captures default reads) — order mutations change what unqualified
  reads/writes hit.

- 2026-07-13 standalone bootstrap: added a session-bootstrap preflight (require-shared-vars, bootstrap-only mode) + create-folder ahead of the original steps, so this bot is runnable standalone (not only via RunAllRegressionTests). Witnesses and prediction values unchanged.

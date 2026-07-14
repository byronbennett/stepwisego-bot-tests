# tier1-features/excel/cell-io

## Target

`xl-set-value`, `xl-get-value`, `xl-set-values`, `xl-get-values`,
`xl-clear-values`, `xl-get-values-for-row`, `xl-get-values-for-column` —
the scalar/block cell IO surface, including the Excel-faithful typing
matrix (`cell-coerce.ts`) and read/write offsets.

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | auto: numeric-looking text → number ('007'→7) | this triple | excel-faithful-auto-typing |
| 2 | auto: currency+thousands ('$1,234.50'→1234.5) | this triple | excel-faithful-auto-typing |
| 3 | auto: percent ('50%'→0.5) | this triple | excel-faithful-auto-typing |
| 4 | auto: accounting negative ('(123)'→-123) | this triple | excel-faithful-auto-typing |
| 5 | auto: boolean literal ('true') | this triple | excel-faithful-auto-typing |
| 6 | valueType=text locks '007' verbatim (control pair vs #1) | this triple | text-lock-preserves-zeros |
| 7 | valueType=date ISO date-only → Date cell at bot-TZ midnight | this triple | date-cell-bot-tz-wall-clock |
| 8 | valueType=number unparseable → auto fallback + warning, step passes | this triple | forced-type-fallback-is-soft |
| 9 | preventFormulas=true escapes leading '=' with apostrophe | this triple | prevent-formulas-apostrophe |
| 10 | empty value write (routed via variable) → empty string, not null | this triple | empty-write-is-a-value |
| 11 | write-side rowOffset/columnOffset | this triple | offsets-both-directions |
| 12 | read-side rowOffset/columnOffset | this triple | offsets-both-directions |
| 13 | set-values semicolon string, direction=down (default) | this triple | set-values-both-shapes-and-directions |
| 14 | set-values array literal, direction=right | this triple | set-values-both-shapes-and-directions |
| 15 | get-values block, skipEmptyValues default (true) drops gaps | this triple | set-values-both-shapes-and-directions |
| 16 | get-values skipEmptyValues=false preserves positional gaps | this triple | skip-empty-false-keeps-gaps |
| 17 | get-values expandToRegion | range-geometry triple (xl-get-region-for-range is the sharper witness) | — |
| 18 | get-values-for-row | this triple | row-and-column-readers |
| 19 | get-values-for-column includeHeaders true/false | this triple | row-and-column-readers |
| 20 | clear-values with range | this triple | clear-values-ranged-then-whole-sheet |
| 21 | clear-values without range (whole sheet) | this triple | clear-values-ranged-then-whole-sheet |
| 22 | get-value on missing sheet → error, buried | this triple | buried-missing-sheet-left-sentinel |
| 23 | >2^53 exact-numeric text-cell storage | deferred: pinned by the exact-numerics campaign + unit tests (cell-coerce writeNumber) | — |
| 24 | Full (COM) branches | deferred: FP-7 Tier 3 hosted (xlcom-*) | — |

## Witnesses

- In-bot: every write is read back by a DIFFERENT reader where possible —
  scalar writes by xl-get-value, the block by xl-get-values AND
  get-values-for-row AND get-values-for-column (three readers over one grid).
- Out-of-band: this triple's grid never leaves the workbook variable, so the
  file-level out-of-band witness for cell IO is carried by the
  workbook-lifecycle and save-as-text triples (same write path:
  coerceCellInput). All expected values here are literals asserted directly
  in the DSL.
- SENTINEL defaults on every result variable prove each read executed (the
  [] after full clear is meaningful only against the ["SENTINEL"] default).

## Envelope / cleanup

No files touched — the workbook lives and dies in its variable. Nothing to
reap beyond the harness's scratch dir (unused here).

## Expected values derived from

cell-coerce.ts (parseExcelNumber: leading-zero strip, currency/percent/
thousands/accounting; parseBoolean strictness; text lock numFmt '@'; forced-
type fallback-with-warning), cell-utils applyCellOffset, xl-set-values
direction/semicolon-split semantics, xl-get-values row-major iteration and
skipEmpty, clear-values null vs empty-string distinction. Probe reproduced
every value before predictions were written.

## Known gaps / notes

- Pinned: readback of a preventFormulas write INCLUDES the apostrophe
  ("'=SUM(1,2)") — Fast mode stores the marker literally (real Excel would
  hide it); consumers comparing cell text should know.
- Pinned: empty-string write ≠ cleared cell; both read as '' under
  skipEmptyValues=false but the empty string occupies the used range.
- Date readback is offset-bearing ISO; only the wall-clock prefix is pinned.
  The bot pins its zone to UTC up front (set-time-zone, step 1): the write
  leg (`scalarToCellValue`) stores the bot-TZ wall clock as the Date's UTC
  components, but the read leg (`cellValueToScalar` → `toBotZoneIso`)
  PROJECTS the stored instant back into the bot TZ — the round trip
  preserves wall clock only when the zone is UTC. The two engines default
  differently (in-process RunState defaults to UTC; the Agent seeds
  `detectMachineTimeZone()`), which surfaced as a wall-clock shift under
  `--engine agent` before the pin. The write/read asymmetry for non-UTC
  zones is a Fast-mode quirk worth a future look, not a test problem.
- The '(123)' accounting-negative and '%'/currency formats also set numFmt;
  number formats are pinned in the search-and-format triple (xl-format-range).

- 2026-07-13 standalone bootstrap: added a session-bootstrap preflight (require-shared-vars, bootstrap-only mode) + create-folder ahead of the original steps, so this bot is runnable standalone (not only via RunAllRegressionTests). Witnesses and prediction values unchanged.

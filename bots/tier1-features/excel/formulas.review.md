# tier1-features/excel/formulas

## Target

`xl-set-formula`, `xl-get-formula` + the Fast-mode formula read path
(`_engine-read.ts` → formualizer WASM engine, registered in the sgtester
verifier since v0.2.150). The load-bearing pin is cached-result-first
resolution (H-1).

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | set-formula with leading '=' | this triple | formualizer-proven-set + get-formula-normalizes-equals |
| 2 | set-formula without leading '=' | this triple | get-formula-normalizes-equals |
| 3 | engine computes SUM / IF / UPPER / VLOOKUP (the live-Agent-proven set, 2026-07-05) | this triple | formualizer-proven-set |
| 4 | scalar reader (xl-get-value) and block reader (xl-get-values) agree on computed values | this triple | two-readers-agree |
| 5 | set-formula + get-value rowOffset | this triple | formula-offsets |
| 6 | cached result present → cached beats engine EVEN WHEN WRONG | this triple | cached-result-always-wins (fixture A1: =1+1 cached 99 → reads 99) |
| 7 | no cached result → engine computes | this triple | cached-result-always-wins (fixture A2: =10*2 uncached → 20) + all of #3 (fresh set-formula cells are always uncached in ExcelJS) |
| 8 | get-formula on a formula cell → '=' prepended | this triple | get-formula-normalizes-equals |
| 9 | get-formula on a non-formula cell → raw value as string | this triple | get-formula-non-formula-cells |
| 10 | get-formula on an empty cell → '' | this triple | get-formula-non-formula-cells |
| 11 | set-formula with empty formula (via variable) → runtime error, buried | this triple | smoke expectErrorCount=0 |
| 12 | date-valued formulas (serial → bot-TZ ISO conversion in _engine-read) | deferred: needs a date-numFmt formula fixture; candidate for a dates-times pass | — |
| 13 | error-valued formulas (#DIV/0! etc.) | deferred: engine error-surface shape not pinned by spec yet | — |
| 14 | shared/array formulas | deferred: not producible via xl-set-formula (writes simple formulas only) | — |
| 15 | Full (COM) mode (real Excel always computes) | deferred: FP-7 Tier 3 hosted (xlcom-*) | — |

## Witnesses

- In-bot: computed values read through TWO different readers (xl-get-value,
  xl-get-values); formula text read back via xl-get-formula (a third reader,
  different concern).
- Out-of-band: the cached-first fixture enters as a BUNDLED file
  (base64 + sha256 in the bot's `files[]`), is physically unpacked by
  save-bundled-file (file_exists), and re-enters through a genuine
  xl-open-existing-workbook — the workbook bytes, not bot state, carry the
  wrong-cached-99 evidence.
- Calibration of both engine branches: A1 (cached, wrong on purpose → 99
  proves the engine was NOT consulted) vs A2 (uncached → 20 proves the
  engine WAS consulted). A correct cached value could never distinguish the
  two paths — the deliberate 99 mismatch is what makes the pin sharp.

## Envelope / cleanup

fx/cached.xlsx under `{var:_sgtScratchDir}` (FP-8, harness-reaped). The
fixture was authored with ExcelJS (formula+result / formula-only cell
values) — regeneration recipe lives in this review file's git history.

## Expected values derived from

_engine-read.ts (cellValueToScalar first; engine only when the cell is a
formula AND resolves null; engine failures swallowed), xl-set-formula
(strips leading '='), xl-get-formula (prepends '=', returns raw value for
non-formula cells), the fixture's authored contents. Probe reproduced every
value before predictions were written.

## Known gaps / notes

- Pinned: fresh xl-set-formula cells are ALWAYS uncomputed in Fast mode
  (ExcelJS never calculates) — every fresh-formula read exercises the engine.
- Pinned quirk: xl-get-formula on a plain cell returns the value, not an
  error — callers can't use it to test formulaness.
- The empty-formula failure had to be routed through a variable: pre-run
  validation would reject a literal empty required prop before runtime.

- 2026-07-13 standalone bootstrap: added a session-bootstrap preflight (require-shared-vars, bootstrap-only mode) + create-folder ahead of the original steps, so this bot is runnable standalone (not only via RunAllRegressionTests). Witnesses and prediction values unchanged.

# tier3-hosted/excel-com/recalculate-formulas

xlcom-recalculate — real Excel computes a formula the cross-platform engine
saved; CalculateFull→SaveCopyAs and dirty-only→in-place-Save paths.

**Run protocol:** vm-agent-shim over SSH (see save-as-roundtrip.review.md).
First witnessed green 2026-07-12.

| # | permutation | covered by | prediction |
|---|-------------|------------|------------|
| 1 | full=true, outputPath (SaveCopyAs artifact) | this triple | com-computed-value / recalc-artifact-exists |
| 2 | full=false, in-place (wb.Save persists computed cache) | this triple | in-place-computed-value |
| 3 | harness-origin witness | this triple | csv-harness-witness (recalculated column → csv → harness read) |
| 4 | FULL-session variable input | deferred: a live session auto-calculates on entry, so recalculate-on-session cannot be distinguished from ambient recalc in a black-box triple |
| 5 | volatile-function delta (full vs dirty producing different results) | deferred: needs NOW()/RAND() fixtures with tolerance predictions — flake-prone, low value |

Notes:
- Seed formula `=A1+A2` is written by `xl-set-formula` (Fast) and saved
  without a computed cache; the value 5 read back after the COM pass is
  therefore unambiguously real Excel's computation.

- 2026-07-13 standalone bootstrap: added a session-bootstrap preflight (require-shared-vars, bootstrap-only mode) + create-folder ahead of the original steps, so this bot is runnable standalone (not only via RunAllRegressionTests). Witnesses and prediction values unchanged.

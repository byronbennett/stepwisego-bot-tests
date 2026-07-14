# tier2-shapes/int-01-sp-to-excel-report

## Target
The flagship Tier 2 scenario (Byron's canonical chain): session SharePoint
list seeded with typed + null-state rows → `sp-select-items` resultDT →
`loop` with column sub-variables → per-cell `xl-set-value` report build →
`xl-get-values` re-read → `xl-save-as-xlsx` + `xl-save-as-csv` →
independent raw readback. Session list `sgt-{var:_sgtSessionId}-rpt`
(harness-reaped); files live in `{var:_sgtScratchDir}`.

## Checks vs the scenario catalog (11)
| Catalog check | Status |
|---|---|
| 1 clean slate | implicit — per-test scratch dir is created fresh |
| 2 select rowCount = seeded | pred-source-rowcount ($stepOut + Graph count) |
| 3 per-iteration column sub-vars accumulate + change each iteration | pred-per-iteration-freshness (full 3-crumb sequence) |
| 4 null/missing rendering in loop vars | same — missing SgtAmt renders `""` in the breadcrumb (live-pinned) |
| 5 Excel rows equal the SharePoint seed cell-by-cell | pred-excel-reread (A1:C3 re-read; trailing empty cells omitted from the flat array — pinned) |
| 6 dates survive | DateTime column pinned as re-zoned ISO `2026-06-01T00:00:00.000+00:00`; **date-only display column deferred** — sp-create-list cannot set DateOnly format (standing-types follow-up), so the midnight-shift leg lives with the dates work |
| 7 decimals string-exact | `1234.56` / `0.1` exact through crumbs, re-read, and CSV |
| 8 format-as-table region | deferred — xl-format-range readback surface TBD; noted gap |
| 9 XLSX exists + nonzero | pred-artifacts-exist (file_exists; content sanity via re-read pre-save) |
| 10 CSV raw equals known vector | pred-csv-known-vector — in-bot get-file-contents AND harness read_value both equal the byte vector (nulls → empty cells `,,`) |
| 11 cleanup verified | session list reaped by the harness after predictions; scratch reaped by the framework |

## Notes
- The report is built per-cell (`xl-set-value` with a `{srpt:loopCount}`-
  composed range) rather than `xl-write-data-table`, because the select's
  resultDT carries the nondeterministic ID column — per-cell writes keep the
  CSV vector deterministic and exercise the sub-variable chain the scenario
  is really about.
- DateTime cells render in the engine's bot timezone (UTC default →
  `+00:00`). If a gate host ever runs with a non-UTC default the CSV/reread
  pins will flag it — that is the date-shift trap surfacing, not test flake.

- 2026-07-13 svar conversion: infra references now flow through `{svar:sgt…}` shared variables (customer-configurable; harness seeds the same names from SGT_* env) with a require-shared-vars preflight gate. Witnesses and prediction values unchanged.

# tier2-shapes/int-08-sp-write-back

## Target
Bidirectional SharePoint (scenario catalog INT-08): `sp-select-items`
captures a snapshot DataTable → `loop` over the CAPTURED DT (the classic
modify-while-iterating trap avoided by design) → per-row computed
`sp-update-item` (`{swb-currentDataRow:SgtAmt|add:0.25}` — exact-decimal
pipe arithmetic) matched by Title → re-select → breadcrumb sequence →
raw Graph confirmation. Session list `sgt-{var:_sgtSessionId}-wb`
(harness-reaped).

## Checks
| Catalog concern | Covered by |
|---|---|
| update-inside-loop-over-same-list semantics (iterate a captured DT) | the whole shape; pred-snapshot-rowcounts pins both reads at 3 |
| per-row computed write-back lands exactly (10.5→10.75, 20.25→20.5, 0→0.25) | pred-writeback-sequence (in-bot re-select) + pred-raw-fees (raw Graph) |
| partial update leaves other fields byte-identical | pred-untouched-fields-intact (SgtNote + SgtAmt raw) |
| decimal computations exact | `|add:0.25` on 10.5/20.25/0 — exact strings through DT → filter → Number coercion → raw readback |
| eventual consistency | no wait needed in any live run — SP REST reads its own writes; flag (don't paper over) if this ever flakes |
| per-iteration match exactness | pred-last-update-exact (affectedRows=1, failedCount=0 on the final iteration; earlier iterations implied by the sequence pins) |

## Notes / traps encountered
- **Step prefixes used in tokens must match `s[a-z]+`** — a digit-bearing
  prefix (`swb2`) makes `{swb2-currentDataRow:...}` unparseable and the
  token passes through as a literal (three identical breadcrumb strings).
  Renamed to `swbb`/`sela`/`selb`. Logged in the internal product backlog (Plugins — SharePoint
  is not at fault; it's an engine token-grammar constraint the editor
  doesn't enforce).

- 2026-07-13 svar conversion: infra references now flow through `{svar:sgt…}` shared variables (customer-configurable; harness seeds the same names from SGT_* env) with a require-shared-vars preflight gate. Witnesses and prediction values unchanged.

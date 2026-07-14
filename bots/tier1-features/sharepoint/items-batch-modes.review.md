# tier1-features/sharepoint/items-batch-modes

## Target
The three batch modes on a session list (`sgt-{var:_sgtSessionId}-batch`,
harness-reaped): `sp-insert-item` withList (iteration value → Title+SgtKey
via the `"Value"` mapping convention, Graph $batch), `sp-update-item`
withDataTable (per-row values pulled by column name, `matchOnField` +
`dataTableMatchField`), `sp-delete-item` withList (match-based delete of a
single key). Sources built in-bot: `add-to-list` ×4 and
json-parse → json-to-datatable.

## Permutation matrix
| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | withList insert: one row per element, literal + iteration-value mappings, 0 failures | this triple | pred-batch-insert-clean + pred-oob-updated-values (Title=k-1) |
| 2 | withDataTable update: match SgtKey ← column "key", values from column "val", exact decimals land raw (10.5 / 20.25) | this triple | pred-update-matched-two + pred-oob-updated-values |
| 3 | unmatched loop value (k-9): no error, no rows touched | this triple | pred-update-matched-two (affectedRows=2, failedCount=0) |
| 4 | withList delete: exactly the matched key removed, survivors intact | this triple | pred-delete-by-match |
| 5 | per-iteration resultDT statuses (Success / No match) | deferred: resultDT deepEqual pin — add after a stable shape is worth freezing (statuses currently implied by the aggregate counts) |
| 6 | batchSize boundary (>20 items across envelopes) | deferred: needs a larger seed; the $batch path is exercised, the chunking math is unit-tested |
| 7 | withDataTable insert / withDataTable delete | deferred: same code path as their withList twins via the synthetic single-column DataTable wrap; add if the manifest wants explicit per-mode rows |

## Witnesses
$stepOut aggregate counters (failedCount/affectedRows/deletedCount) in-bot;
raw Graph read_cell/read_rows/count_rows_in out-of-band for values, survivor
count, and absence of the deleted key. List reaped by the harness after
predictions.

## Notes
- Update matching goes through SP REST queries — matched immediately after
  Graph $batch inserts in every live run (SP REST is the source of truth;
  no eventual-consistency wait was needed).

- 2026-07-13 svar conversion: infra references now flow through `{svar:sgt…}` shared variables (customer-configurable; harness seeds the same names from SGT_* env) with a require-shared-vars preflight gate. Witnesses and prediction values unchanged.

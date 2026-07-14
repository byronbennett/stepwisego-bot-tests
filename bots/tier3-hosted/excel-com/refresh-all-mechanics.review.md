# tier3-hosted/excel-com/refresh-all-mechanics

xlcom-refresh-all — RefreshAll + CalculateUntilAsyncQueriesDone mechanics on a
connectionless workbook: the pinned no-op-success contract, both output paths.

**Run protocol:** vm-agent-shim over SSH (see save-as-roundtrip.review.md).
First witnessed green 2026-07-12.

| # | permutation | covered by | prediction |
|---|-------------|------------|------------|
| 1 | zero connections/queries → completes without error (pinned) | this triple | refresh-noop-succeeds |
| 2 | outputPath (SaveCopyAs) | this triple | refreshed-artifact-exists |
| 3 | in-place (no outputPath, wb.Save) | this triple | refresh-noop-succeeds (content survival) |
| 4 | harness-origin witness | this triple | csv-harness-witness |
| 5 | REAL data connection / Power Query refresh pulling rows | deferred: needs a hand-built self-referential query fixture (`Workbook.Queries.Add` + Mashup OLEDB ListObject); programmatic authoring is possible but fragile across Office builds — follow-up fixture, category playbook already anticipates it |
| 6 | waitSeconds timeout path (long-running query) | deferred: depends on #5 |

Notes:
- The no-connection contract matters on its own: bots routinely run
  refresh-all defensively on template workbooks; it must never error when
  there is nothing to refresh.

- 2026-07-13 standalone bootstrap: added a session-bootstrap preflight (require-shared-vars, bootstrap-only mode) + create-folder ahead of the original steps, so this bot is runnable standalone (not only via RunAllRegressionTests). Witnesses and prediction values unchanged.

# tier3-hosted/excel-com/run-macro-echo

xlcom-run-macro — Application.Run against a committed macro-enabled fixture:
argument passing, function return value, Sub empty-return contract, and
saveAfter persistence witnessed by an independent engine.

**Run protocol:** vm-agent-shim over SSH (see save-as-roundtrip.review.md).
First witnessed green 2026-07-12.

**Fixture:** `fixtures/macro-echo.xlsm` (13 KB, committed) — built on the VM
via COM + `AccessVBOM` (one-time `HKCU\...\Excel\Security\AccessVBOM=1`).
`SgtModule` contains `Function SgtEcho(a, b)` (writes `SGT-MACRO-RAN:<a>` to
B1, returns `a|b`) and `Sub SgtStamp()` (writes `SGT-SUB-RAN` to C1). Staged
per run via `envelope.fixtureRefs`; scp/tar staging does not add
Mark-of-the-Web, so macros run without Protected View interference.

| # | permutation | covered by | prediction |
|---|-------------|------------|------------|
| 1 | function with 2 args, return value captured (variable + step output) | this triple | macro-return-value |
| 2 | Sub (no return) → pinned empty-string result | this triple | sub-returns-empty |
| 3 | saveAfter=true persists macro cell writes | this triple | save-after-persists-writes (re-read via the CROSS-PLATFORM engine — an independent reader) |
| 4 | harness-origin witness | this triple | macro-return-harness-witness (return value → file → harness read) |
| 5 | missing macro name (error contract), >8 args truncation | deferred: error-path legs, low risk |
| 6 | workbook-VARIABLE input (`preferDiskPath`) | deferred: agent pre-run validation requires Full mode for xlcom variables; the Full path targets the live session (macros already in it) — literal path is the canonical unattended shape |

Notes:
- COM automation defaults to `msoAutomationSecurityLow`, so fixture macros run
  without Trust Center prompts in the sidecar's Excel instance.

- 2026-07-13 standalone bootstrap: added a session-bootstrap preflight (require-shared-vars, bootstrap-only mode) + create-folder ahead of the original steps, so this bot is runnable standalone (not only via RunAllRegressionTests). Witnesses and prediction values unchanged.

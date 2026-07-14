# tier3-hosted/excel-com/save-as-roundtrip

xlcom-save-as — format conversion via real Excel COM (Windows VM), from both a
literal path and a live Full-mode session variable, witnessed by a csv byte
read and a legacy-.xls COM re-open round-trip.

**Run protocol:** trampoline-free remote agent over SSH via
`SGT_AGENT_ENTRY=apps/sgtester/src/hosted/vm-agent-shim.mjs`
(`sgt verify --engine agent --include-hosted`). Excel COM needs no interactive
desktop. First witnessed green 2026-07-12 (v0.2.182 base, Win11 ARM64 VM,
Office16 ClickToRun).

| # | permutation | covered by | prediction |
|---|-------------|------------|------------|
| 1 | format=csv from a literal on-disk path | this triple | csv-known-vector-harness / csv-known-vector-in-bot |
| 2 | format=xls from a live FULL-session variable | this triple | xls-roundtrip-com-read / xls-file-exists |
| 3 | .xls re-opened in FULL mode, cells read via session-get-range | this triple | xls-roundtrip-com-read |
| 4 | format=xlsm / xlsb / txt | deferred: same SaveAs code path, format-map only — low marginal value per run cost |
| 5 | Fast-mode ENVELOPE variable input (temp materialization) | deferred: agent pre-run validation requires Full mode for xlcom workbook variables, so the envelope path is unreachable from a bot (see note) |

Notes:
- **Sidecar collision trap (FIXED v0.2.184):** a whole-file xlcom op on a
  path that is ALSO open as a live Full-mode session in the same agent run
  used to get the session's own COM object from `Workbooks.Open`, and the
  owned-close at op end killed the session (`RPC_E_DISCONNECTED` on the next
  session op). `Resolve-TargetWorkbook` now reuses the session un-owned;
  the contract is pinned by `session-path-collision` in this directory. This
  triple keeps its Fast-engine seed shape (authored pre-fix; still valid).
- `session-save-as` re-homes the live workbook (real SaveAs semantics,
  documented in the sidecar) — that is what turns an innocent-looking
  "save then convert the file" sequence into the collision above.
- csv rendering by real Excel (xlCSV): ASCII values chosen deliberately —
  xlCSV writes the ANSI codepage, so unicode fidelity is NOT asserted here
  (the Fast-mode save-as-text triple owns text-encoding contracts).

- 2026-07-13 standalone bootstrap: added a session-bootstrap preflight (require-shared-vars, bootstrap-only mode) + create-folder ahead of the original steps, so this bot is runnable standalone (not only via RunAllRegressionTests). Witnesses and prediction values unchanged.

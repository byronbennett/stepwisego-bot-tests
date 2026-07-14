# tier3-hosted/excel-com/session-path-collision

Regression guard for the Track 17 P2: a whole-file xlcom op (recalculate /
save-as / print / …) given a LITERAL path that the same bot ALSO holds open as
a live Full-mode session. Pre-fix, `Resolve-TargetWorkbook`'s filePath branch
called `Workbooks.Open`, which returns the session's own COM object for an
already-open file; the op marked it `owned` and the op-end close killed the
live session — the next session op died with `RPC_E_DISCONNECTED`, far from
the cause. Fixed in v0.2.184: the filePath branch compares the resolved path
against open session workbooks' `FullName` (case-insensitive) and reuses the
session un-owned.

**Run protocol:** trampoline-free remote agent over SSH via
`SGT_AGENT_ENTRY=apps/sgtester/src/hosted/vm-agent-shim.mjs`
(`sgt verify --engine agent --include-hosted`).

| # | permutation | covered by | prediction |
|---|-------------|------------|------------|
| 1 | live session re-homed by session-save-as, then xlcom-recalculate on the same literal path | this triple | session-survives-collision-write / live-formula-computed |
| 2 | session write + read AFTER the collision op | this triple | session-survives-collision-write |
| 3 | other whole-file ops (save-as/print/refresh-all) on a session-open path | deferred: all six callers share Resolve-TargetWorkbook, so the reuse branch is op-independent; recalculate chosen because it is in-place (no re-home, no spool) |
| 4 | two sessions on two paths, op targets one | deferred: same FullName comparison, low marginal value per run cost |

Notes:

- The bot shape here ("save the session to X, then run a whole-file op on
  file X") is the NATURAL way users hit this — `session-save-as` re-homes the
  live workbook (real SaveAs semantics), so the literal path and the live
  session silently alias the same workbook.
- Post-fix semantics are REAL-EXCEL semantics: the whole-file op acts on the
  live workbook (a SaveAs would re-home it, exactly like session-save-as).
  The in-place recalculate leg also `Save()`s the live workbook — that flush
  is the documented behavior for session-targeted recalculate too.
- Path comparison is `GetFullPath` + OrdinalIgnoreCase against each live
  session's `FullName`; dead COM refs (FullName throws) are skipped and fall
  through to a fresh open.
- `save-as-roundtrip` deliberately authors AROUND this collision (Fast-engine
  seed file); this triple is the one that points AT it. Its review's
  "sidecar collision trap" note refers here now that the fix is in.

- 2026-07-13 standalone bootstrap: added a session-bootstrap preflight (require-shared-vars, bootstrap-only mode) + create-folder ahead of the original steps, so this bot is runnable standalone (not only via RunAllRegressionTests). Witnesses and prediction values unchanged.

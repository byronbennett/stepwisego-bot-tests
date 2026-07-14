# tier2-shapes/int-07-run-bot-as-function-pipeline/pipeline

## Target

Catalog §INT-07 — `run-bot-as-function` as a pipeline: parent seeds inputs →
child #1 transforms a list → outputs mapped back → child #2 writes a CSV →
parent verifies file + values. First consumer of the Track 8 multi-bot
convention (`envelope.fixtureRefs` staged into the scratch dir; children live
in the test's `fixtures/` subdir, which the loader skips).

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | statusVariable captures child pass | this triple | both-children-passed |
| 2 | LIST parm mapped in (full fidelity array) and out (bothWays) | this triple | list-mapped-in-and-out-exact |
| 3 | exact decimal (>2^53 int part + fraction) round-trips parent→child→parent | this triple | decimal-exact-round-trip |
| 4 | non-bare-token mapping source (scratch-path expression) resolves as string | this triple (auditPath/outPath rows) | shared-audit-trail-exact |
| 5 | {gbl-var:} visibility across the boundary | this triple | gbl-var-visibility-pinned |
| 6 | child audit rows land in the SAME audit CSV (path passed as inbound parm) | this triple | shared-audit-trail-exact |
| 7 | child failure propagation (endOnFail × ignoreErrors) | sibling triple `failprop` | status-false-both-variants, propagation-crumbs |
| 8 | isolateProcess=true (forked child) | deferred — inline is the default path customers hit; the fork is exercised by the run-bot Tier 1 triple |
| 9 | botSource=database | deferred — not implemented in the Agent (runner returns an explanatory error) |

## Witnesses

- In-bot: mapped-back parms (`resultList`, `amountBack`, `gblSeen`) whose
  parent defaults are sentinels — a mapping no-op cannot fake a pass.
- Out-of-band: the harness reads `pipeline-out.csv` and `audit.csv` directly
  (`read_value` file refs) and pins EXACT full-file content, including
  cross-bot row order: parent,start → child1 → child2 → parent,end.

## Expected values derived from

`apps/agent/src/engine/runners/run-bot-as-function.runner.ts` +
`child-bot-vars.ts` (mapping semantics: bare-token source = full-fidelity
copy + bothWays return; expression source = resolved string, no return) and
`run-child-bot-inline.ts` (inline child on the shared engine;
`mergeGlobalVariables` merges only the agent's FETCHED globals snapshot —
empty in standalone harness runs — never the parent bot's own gbl-var parms).

## Known gaps / notes

- **Agent-only** (`envelope.engines`): the shared in-process runner for
  `run-bot-as-function` is a stub ("requires desktop/agent runtime") — the
  real implementation lives in the Agent app and executes the child INLINE
  on a second StepExecutor (fire-and-forget `run-bot` still forks). The
  in-process engine skip is by design, same as INT-14.
- gbl-var pin is a CHARACTERIZATION of standalone-agent behavior: the child
  sees its own gbl-var defaults ('child-default'), not the parent's declared
  value. Cloud runs with fetched globals would overlay BOTH bots' declared
  defaults with the fetched snapshot (skipping names each bot already
  declares — so in this fixture's shape the values would still differ).
- Children must NOT reference `{var:_sgtScratchDir}`/`{var:_sgtSessionId}` —
  staging copies them verbatim with no parm injection (the asymmetry this
  triple asserts); paths cross only as mapped parms.
- csv-write-line writes no trailing newline (first line bare, then
  "\n"+line) — the exact-content pins encode that.

- 2026-07-13 standalone bootstrap: added a session-bootstrap preflight (require-shared-vars, bootstrap-only mode) + create-folder ahead of the original steps, so this bot is runnable standalone (not only via RunAllRegressionTests). Witnesses and prediction values unchanged.

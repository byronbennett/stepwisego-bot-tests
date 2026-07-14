# Review — tier1-features/bot/run-bot

## Target

`run-bot` (Bot plugin): spawn a separate child Agent process from a `.sgbot`
file. Three contract points in one parent run:

1. `waitForCompletion=true` + child exits 0 → parent step PASSES.
2. `waitForCompletion=true` + child exits nonzero → parent step FAILS
   (proven by an error handler catching it, `caught == true`, and the
   handler body aborting before `in-handler-after`).
3. `waitForCompletion=false` (fire-and-forget) → parent step passes
   immediately and the run reaches `done`.

Agent engine only — the shared in-process runner is a stub that always fails,
so `envelope.engines: ["agent"]`.

## Fixtures

- `fixtures/child-echo.sgbot` — trivially succeeding child (set-variable).
- `fixtures/child-fail.sgbot` — fails at runtime (reads a nonexistent file);
  same fixture the INT-07 `failprop` triple uses.

Both staged via `envelope.fixtureRefs`, referenced as
`{var:_sgtScratchDir}/<name>.sgbot`.

## Witness design

- `run-bot` maps no variables, so the observable surface is the parent step's
  pass/fail plus control flow. The `crumbs` list pins the whole path:
  `["start","after-wait-success","after-handler","done"]`.
- `expectErrorCount: 1` — the handler-caught child failure counts (same
  contract error-machinery and INT-06 pinned); the handler step itself is
  `ignoreErrors` so the run still completes.

## Known gaps / notes

- Agent-only (shared runner stub); in-process reports `engine-gated` skips.
- Fire-and-forget is pinned only up to "the step passes and the run moves on".
  The detached child's own outcome is deliberately unasserted — it has no
  parent-visible channel (no mappings, no exit code) and may still be running
  when the harness reaps the run; it also writes its own CSV into the same
  `<dataDir>/logs`, so the report's `eventCsvPath` pick can vary. The child
  env scrub of `STEPWISE_FINAL_STATE_FILE` (spawn-child-agent.ts) keeps a
  late detached child from corrupting the harness's final-state dump.
- `botSource: "database"` is not implemented in the Agent and not covered.

- 2026-07-13 standalone bootstrap: added a session-bootstrap preflight (require-shared-vars, bootstrap-only mode) + create-folder ahead of the original steps, so this bot is runnable standalone (not only via RunAllRegressionTests). Witnesses and prediction values unchanged.

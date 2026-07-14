# tier1-features/engine-patterns/error-machinery

## Target

Error dispositions of the engine (`error-handler` manifest pattern):
`ignoreErrors` (Continue on Error), the `error-handler` protected block with
its `statusVariable` contract and `errorMessage`/`errorStepName` outputs, and
post-catch control flow.

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | ignoreErrors=true on failing step → run continues, run completes | this triple | control-flow-order + smoke |
| 2 | failure inside handler → remaining handler children skipped | this triple | control-flow-order |
| 3 | execution resumes at handler's first sibling | this triple | control-flow-order |
| 4 | statusVariable set true on caught error | this triple | status-var-caught |
| 5 | statusVariable initialized false on entry (pre-set true flips) | this triple | status-var-clean-initialized |
| 6 | errorMessage / errorStepName step outputs | this triple | handler-error-message / -step-name |
| 7 | nested handlers (inner catches before outer) | deferred: follow-up engine-patterns triple | — |
| 8 | text-typed statusVariable ("true"/"false" strings) | deferred: logic-variables Tier 1 campaign | — |
| 9 | end-bot-run inside handler; unhandled failure stops run | deferred (unhandled-fail needs an expected-fail smoke mode) | — |

## Witnesses

- In-bot: crumb order distinguishes "continued after buried error" from
  "skipped rest of handler block" from "resumed after handler" in one list;
  the clean handler's statusVariable is pre-set TRUE so initialization is
  proven by a flip, not a default.
- Out-of-band: `$stepOut` reads the handler's output variables straight from
  the trace (via the handler's explicit `stepPrefix: seh`).

## Expected values derived from

`error-handler` action definition (statusVariable contract: "Set to false on
entry; set to true if a step inside the block fails AND its 'Continue on
Error' is off") and output-variable docs. The failing step is `add-to-list`
naming a nonexistent variable — a runtime failure, deliberately NOT a
structurally-invalid step (an empty required prop fails pre-run validation
and the bot never starts; discovered by probe and avoided).

## Known gaps / notes

- Pinned: `errorCount` in run stats counts handler-CAUGHT errors (1 here)
  but not ignoreErrors-buried ones (tracked separately as ignoredErrorCount);
  run status is still `complete`/pass.
- Pinned: pre-run validation rejects steps with empty required props before
  execution — test bots that need a failing step must fail at runtime
  (missing variable), not at validation.
- The handler step itself carries `ignoreErrors: true` matching the action's
  `defaultIgnoreErrors` (editor parity).

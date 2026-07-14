# tier1-features/variables/counters-and-reset

## Target

`add-to-pass-count`, `add-to-fail-count`, `add-to-transaction-count`,
`reset-to-default` — run-level counter actions plus the default-restoring
reset. One triple because the counters share one observation mechanism (the
`passCount`/`failCount`/`transactionCount` pipe functions) and reset needs
only two small cases.

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | add-to-pass-count with default amount (1) | this triple | pass-count-explicit-plus-engine-auto |
| 2 | add-to-pass-count with explicit amount (+2) | this triple | pass-count-explicit-plus-engine-auto |
| 3 | engine auto-increments passCount per passing step | this triple (pinned coupling) | pass-count-explicit-plus-engine-auto |
| 4 | add-to-fail-count (+1), no engine contribution when no step fails | this triple | fail-count-explicit-only |
| 5 | add-to-transaction-count (+5), never auto-incremented | this triple | transaction-count-explicit-only |
| 6 | reset-to-default restores a changed text variable | this triple | reset-text-to-default |
| 7 | reset-to-default restores a mutated list variable | this triple | reset-list-to-default |
| 8 | reset-to-default on undeclared variable — runtime error, buried | this triple | smoke (expectErrorCount=0 proves burial) |
| 9 | negative counter amounts | deferred: no legacy contract to pin; would need a product decision first | — |
| 10 | counters observed at end-of-run (final totals) | deferred: totals depend on total step count, so the mid-run snapshot is the stable observation point | — |

## Witnesses

- In-bot: counter values are snapshotted mid-run into text variables via the
  `passCount`/`failCount`/`transactionCount` pipe functions (counters live on
  RunState, invisible to `$var` otherwise); `snapChanged` captures the
  pre-reset value so the reset check cannot pass vacuously.
- Out-of-band: predictions compare against hand-computed constants — 7/1/5 —
  derived from the engine's per-step counting rule plus the explicit
  amounts; reset checks compare against the declared `defaultValue` constants
  in the bot file.

## Expected values derived from

Engine source: `step-executor.ts` increments `runState.passCount` once per
passing step (and `failCount` only at the single unhandled-error site), and
`add-to-*-count` runners add their amount on top. At snapshot time exactly
steps 1–4 have completed, all passing: passCount = 4 auto + 1 + 2 explicit
= 7; failCount = 1 explicit; transactionCount = 5 explicit.

## Known gaps / notes

- Pinned (load-bearing): passCount conflates engine per-step auto-increments
  with explicit `add-to-pass-count` amounts. If the engine ever stops
  auto-counting steps (or the snapshot moves), check
  pass-count-explicit-plus-engine-auto recalculates.
- Pinned: the snapshot step itself is not yet counted when its pipe evaluates
  (pass is recorded after the runner returns).
- Counter pipe functions require some input value; the session-id variable is
  used as a throwaway pipe input.

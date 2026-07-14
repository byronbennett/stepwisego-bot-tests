# tier1-features/logic/structural-logging-delay

## Target

`section`, `comment`, `write-to-log`, `delay` — the four structural/logging
Logic actions with no data outputs. One triple because each action's whole
observable contract is "passes, logs, and does not disturb control flow".

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | section with children executes them once, in order | this triple | crumb-order |
| 2 | comment with token-bearing multi-line text passes, no side effects | this triple | crumb-order |
| 3 | write-to-log logLevel=info with token in message | this triple | crumb-order |
| 4 | write-to-log logLevel=error — severity only, NOT a run error | this triple | crumb-order + smoke expectErrorCount=0 |
| 5 | write-to-log empty message, logLevel=debug (allowed, logs empty line) | this triple | crumb-order |
| 6 | delay delayType=milliseconds duration=150 passes and continues | this triple | crumb-order |
| 7 | delay non-numeric duration (token → "not-a-number") fails loudly, buried by ignoreErrors | this triple | crumb-order + smoke |
| 8 | delay delayType=seconds / minutes happy path | deferred: same code path × unit multiplier; minutes would slow the suite | — |
| 9 | delay actual wall-clock duration ≥ requested | deferred: step durations are not exposed to the Prediction DSL; sub-second timing not measurable via second-precision date pipes | — |
| 10 | write-to-log logLevel=warning | deferred: same runner path as info/debug (level string passthrough) | — |

## Witnesses

- In-bot: breadcrumb list (`add-to-list`, calibrated by
  `engine-patterns/list-ops-calibration`) records the exact execution path.
- Out-of-band: prediction compares the full final crumbs array against the
  hand-derived expected order; the smoke layer independently asserts
  `errorCount=0` and `status=complete`, which is the load-bearing check for
  permutations 4 and 7.
- Probe calibration: breadcrumb mechanism calibrated in
  `engine-patterns/list-ops-calibration` (cited, not repeated).

## Expected values derived from

First principles: a structural container must run children exactly once in
document order; documentation/logging steps must be side-effect-free for
control flow; ENG-09 site 10 (recorded in the delay runner's contract — a
non-numeric duration must fail loudly, never silently zero-wait) gives
permutation 7 its expected failure.

## Known gaps / notes

- Pinned: `ignoreErrors`-buried failures do NOT increment the run's
  `errorCount` (probe-observed, consistent with `engine-patterns/error-machinery`
  where only the handler-caught failure counted).
- Pinned: the invalid-duration failure message quotes the raw token
  (`"Duration" must be a number — got "{var:badDuration}"`) — the numeric-prop
  resolver rejects it before the runner runs.
- Wall-clock delay length is not asserted (no DSL access to step durations) —
  see permutation 9.

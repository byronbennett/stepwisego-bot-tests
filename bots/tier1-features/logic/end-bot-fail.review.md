# tier1-features/logic/end-bot-fail

## Target

`end-bot` (Logic) — the `endWithFail=true` flavor: early termination that
marks the run failed.

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | endWithFail=true stops execution after the current step | this triple | stops-and-fails |
| 2 | run classifies FAILED (pass=false) with errorCount 0 | this triple | smoke layer (expectComplete=false, expectErrorCount=0) |
| 3 | endWithFail=false | logic/end-bot-pass | — |

## Witnesses

- In-bot: breadcrumb list — absence of 'after-end' proves the halt.
- Out-of-band: smoke layer asserts the run-level failure classification;
  prediction pins the exact crumb trail.

## Expected values derived from

Action definition contract: "Mark the bot run as failed instead of completed
successfully". A deliberate fail-exit is a status decision, not an error —
hence errorCount stays 0.

## Known gaps / notes

- Pinned (probe-observed 2026-07-09): run status is `failed` with
  `passedSteps=2, failedSteps=0, errorCount=0` — the end-bot STEP passes;
  only the run classification flips.

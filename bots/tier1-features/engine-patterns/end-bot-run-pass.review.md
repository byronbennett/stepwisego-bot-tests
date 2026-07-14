# tier1-features/engine-patterns/end-bot-run-pass

## Target

`end-bot-run` with `endStatus: pass` — early termination that still counts
as a successful run.

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | endStatus=pass stops execution, run completes | this triple | stops-at-end-bot + smoke |
| 2 | logMessage emitted | this triple (not asserted — log layer only) | — |
| 3 | endStatus=fail (run must classify failed) | deferred: needs expected-fail smoke semantics (FP work or a dedicated smoke mode) | — |
| 4 | end-bot-run inside a loop / handler | deferred: follow-up engine-patterns triple | — |

## Witnesses

- In-bot: the step after end-bot-run appends a crumb — its absence in the
  final list is the proof of termination (positive "before-end" crumb guards
  against the bot not running at all).
- Out-of-band: smoke expects `complete` + 0 errors, pinning that a pass-end
  is not a failure.

## Expected values derived from

`end-bot-run` action definition ("Terminate bot execution with a status").

## Known gaps / notes

- The Bot category is sandbox-"unsafe" for ad-hoc probes (`sgt probe` needs
  `--allow Bot`); committed verify runs execute the full runner set, so this
  triple runs under `sgt verify` without special flags.
- endStatus=fail deliberately not covered: the smoke layer currently equates
  "failed" with "regression"; needs an expected-outcome knob first.

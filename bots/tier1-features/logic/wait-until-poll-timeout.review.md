# tier1-features/logic/wait-until-poll-timeout

## Target

`wait-until` — condition polling: the immediate-true path and the timeout
path, including the "timeout is not a failure" contract and both output
variables (`timedOut`, `elapsedSeconds`).

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | condition true at first evaluation (no wait) | this triple | immediate-not-timed-out, immediate-elapsed-near-zero |
| 2 | condition never true → timeout (timeout=1, checkInterval=0.3) | this triple | timeout-flag-true, timeout-elapsed-at-least-timeout |
| 3 | step passes (not fails) on timeout | this triple | timeout-flag-true + smoke expectErrorCount=0 |
| 4 | execution continues after both shapes | this triple | flow-continues-after-both |
| 5 | condition becomes true mid-poll | deferred: bot execution is single-threaded — no second actor can flip the variable while wait-until is polling. Needs an external-state condition (file appearing) → Files & Folders campaign integration chain | — |
| 6 | multiple conditions (and/or rows) | deferred: condition-row evaluation semantics are owned by engine-patterns/if-else-comparators (same evaluateConditions code path) | — |
| 7 | token-fed timeout/checkInterval | deferred: numeric token resolution owned by the numeric-props engine pattern; delay covers the invalid-numeric error shape | — |

## Witnesses

- In-bot: breadcrumbs prove control flow continued; the two wait-until steps
  carry `stepPrefix` so their output variables are addressable.
- Out-of-band: `$stepOut` predictions on `timedOut` (exact booleans) and
  `elapsedSeconds` (bounded: `<1` for immediate, `between 1 and 5` for
  timeout). Timing bounds are the only tolerance in this triple — genuinely
  nondeterministic surface per master spec §3.3.

## Expected values derived from

First principles: a poll whose condition is already true must return without
waiting; a 1-second timeout must take at least 1 second and report it; the
action definition documents "Step passes with timedOut=true if exceeded" —
that documented contract (not the runner code) is what the predictions pin.

## Known gaps / notes

- Pinned: timeout does NOT fail the step or the run (`expectErrorCount: 0`).
- elapsedSeconds is a float (e.g. 0.001 / 1.005) — compared with bounds only,
  never exact equality.

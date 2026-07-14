# tier1-features/logic/end-bot-pass

## Target

`end-bot` (Logic) — the `endWithFail=false` flavor: clean early termination.
Distinct from `end-bot-run` (Bot category, covered by
`engine-patterns/end-bot-run-pass`) — different action, same family.

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | endWithFail=false stops execution after the current step | this triple | stops-at-end-bot |
| 2 | run classifies complete, errorCount 0 | this triple | smoke layer |
| 3 | endWithFail=true | logic/end-bot-fail | — |

## Witnesses

- In-bot: breadcrumb list — the step after end-bot would append 'after-end';
  its absence is the termination proof.
- Out-of-band: prediction compares the exact final crumbs array; smoke layer
  independently asserts complete/0-errors.

## Expected values derived from

Action definition contract: "End the bot run after the current step" with
endWithFail=false meaning a successful completion.

## Known gaps / notes

- Mirrors `engine-patterns/end-bot-run-pass` deliberately — the two actions
  promise the same halt semantics and both must keep it.

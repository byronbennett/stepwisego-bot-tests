# tier1-features/engine-patterns/unknown-comparator-fails-loudly

## Target

The condition-evaluator's contract for a comparator it does not implement: it
must FAIL the step, not answer `false`. Guards the silent-wrong-branch class of
bug (v0.2.193).

## Why this triple exists

Through v0.2.192, `isBlank`, `isNotBlank`, `isNull`, and `isNotNull` were
declared in the `Comparator` union but implemented nowhere. They fell through
`compare()`'s `default: return false`, so an If row using one always took the
**else** branch with no warning, and the steps it guarded simply never ran.

v0.2.193 implemented `isBlank`/`isNotBlank`, removed `isNull`/`isNotNull`, and
made any unrecognized comparator throw. This triple pins the *throw* half of
that fix; the comparator semantics themselves are pinned by
`if-else-comparators`.

## Permutation matrix

| # | Permutation | Covered by | Check id (crumb) |
|---|---|---|---|
| 1 | If with an unimplemented comparator (`isNull`) does not run its THEN branch | this triple | (absence of `then-ran`) |
| 2 | ...and does not run its ELSE branch either — it errors | this triple | (absence of `else-ran`) |
| 3 | The failure is a real step error: enclosing error-handler's statusVariable flips true | this triple | errHappened |
| 4 | The error message names the offending comparator | this triple | errorMessage |
| 5 | Run still completes (handler catches; execution resumes at the handler's sibling) | this triple | after-handler |

## Witnesses

- In-bot: `then-ran` / `else-ran` crumbs. **The absent `else-ran` is the load-
  bearing one** — a comparator that evaluated `false` would have produced it, so
  its absence is what distinguishes "throws" from "silently false". The exact
  crumb list (`["start", "after-handler"]`) also proves the handler abandoned
  its remaining children.
- Out-of-band: the handler's `errorMessage` step output must contain
  `Unknown comparator 'isNull'`, pinning that the diagnostic names the
  comparator rather than failing anonymously.

## Expected values derived from

The comparator contract in `packages/shared/src/types/condition.ts` (the
`Comparator` union is derived from the runtime `COMPARATORS` list, and
`isComparator()` gates the evaluator) and `assertKnownComparator` in
`engine/condition-evaluator.ts`. Error-handler control flow (catch → abandon
remaining children → resume at sibling; statusVariable initialized false on
entry) is pinned independently by `error-machinery`.

## Known gaps / notes

- `isNull` is used here **because** it is not a comparator — it is the exact
  string a bot author (or an LLM) is most likely to reach for, and it is what
  the old union advertised. If a future change ever implements a null test,
  this bot must switch to a nonsense comparator (e.g. `isNullish`) rather than
  loosening the prediction.
- The `error-handler` wrapper is scaffolding, not the subject: without it the
  run would abort at the bad If and there would be no completed run to assert
  crumbs against. `smoke.expectErrorCount: 1` counts that caught failure.
- Non-goal: unit-level coverage of the message text and the
  every-declared-comparator-is-implemented exhaustiveness check lives in
  `packages/shared/src/engine/__tests__/condition-evaluator.test.ts` — a bot
  triple can't witness a comparator that no bot can legally contain.

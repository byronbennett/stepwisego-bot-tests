# tier1-features/engine-patterns/loop-basics

## Target

`loop` action — the non-signal loop types runnable with zero environment:
count, fromTo (negative increment), list, empty-source (0 iterations),
nesting, and the `maxIterations` safety cap. Step-output tokens
(`{prefix:loopCount}` etc.) are exercised on every crumb, covering the
`token:sa` pattern (explicit `stepPrefix` per loop).

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | loopType=count, output vars loopCount/loopIndex/loopItem | this triple | count-loop |
| 2 | loopType=fromTo, negative incrementBy, inclusive bounds | this triple | fromto-negative-increment |
| 3 | loopType=list over listOfTexts, order + loopItem | this triple | list-loop |
| 4 | 0-iteration loop (empty list) — children never run | this triple | zero-iteration-loop |
| 5 | nested count loops, per-prefix output vars don't collide | this triple | nested-loops |
| 6 | maxIterations caps iteration count | this triple | max-iterations-cap |
| 7 | loopType=while / exit-loop / continue-loop | sibling triple loop-signals | — |
| 8 | loopType=dataTable / csv (+ column sub-vars) | sibling triple loop-datatable-subvars | — |
| 9 | loopType=dictionary / textFile / rowsInText / emailAttachments | deferred: logic-variables Tier 1 campaign | — |

## Witnesses

- In-bot: breadcrumbs appended by `add-to-list` inside each loop body encode
  loopCount/loopIndex/loopItem per iteration (calibrated by
  list-ops-calibration).
- Out-of-band: predictions deep-equal the entire final crumb arrays — count,
  order, and content in one check.

## Expected values derived from

Action definition (`loop.action.ts`): loopCount documented 1-based, loopIndex
0-based, fromTo bounds inclusive, maxIterations as safety limit. The one
non-obvious value — count-loop `loopItem` = 0-based index rendered as a
string — was pinned from a probe run and is deliberately asserted as the
current engine contract.

## Known gaps / notes

- Pinned quirk: count-loop `loopItem` equals `loopIndex` (stringified),
  NOT `loopCount`. If this ever changes, the count-loop check fails — that
  is intentional (legacy-compat surface).
- Empty-list loop relies on the runner's `skipChildren()` up-front call;
  check 4 is the regression guard for the "auto-run unhandled children"
  fallback bug class.

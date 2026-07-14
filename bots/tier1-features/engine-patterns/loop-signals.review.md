# tier1-features/engine-patterns/loop-signals

## Target

Loop control signals: `while` loop type, `exit-loop`, `continue-loop`, and
signal scoping (a signal must affect only its own loop frame and iteration).

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | while loop: condition re-evaluated per iteration, ends on 'false' | this triple | while-loop-flips-off, keepgoing-final |
| 2 | exit-loop nested in If: skips remaining siblings mid-iteration + ends loop | this triple | exit-loop-mid-iteration |
| 3 | continue-loop nested in If: skips remaining siblings for that iteration only | this triple | continue-loop-skips-rest |
| 4 | signals don't leak past the loop (top-level continues) | this triple | execution-continues-after-loops |
| 5 | exit/continue inside NESTED loops (inner signal must not touch outer) | deferred: follow-up engine-patterns triple | — |
| 6 | while condition falsy variants ("", "0") | deferred: logic-variables Tier 1 campaign | — |

## Witnesses

- In-bot: breadcrumb lists record which iterations reached which sibling
  steps — the mid-iteration skip is visible as a missing "after-if-3" /
  missing "3" crumb, not just a shorter list.
- Out-of-band: deep-equal on full crumb arrays; `afterAll` sentinel proves
  the run continued past all three loops.

## Expected values derived from

Action definitions (exit-loop / continue-loop / loop while semantics:
"Continue looping while this evaluates to true"). The mid-iteration
sibling-skip on exit-loop matches the engine's documented signal handling
(signals checked after each child step); pinned by probe before commit.

## Known gaps / notes

- Pinned: exit-loop is IMMEDIATE within the iteration — siblings after the
  signaling subtree do not run on the final iteration.
- Pinned: while loop treats "false" (string) as stop; also "" and "0" stop
  (not asserted here — see deferral #6).

# tier1-features/logic/require-shared-vars-skip

## Target

`require-shared-vars` (Logic) — the skip flavor: a listed shared variable is
missing (never created) or declared-but-empty, `behavior=skip` (the default)
ends the run cleanly as Complete with an amber warning. This is the
"warn but skip" contract the public regression suite relies on: an
unconfigured resource must never read as a failure.

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | absent svar (no file/seed at all) gates the bot | this triple (sgtGateMissing) | skips-before-test-body |
| 2 | declared-but-EMPTY svar gates the bot | this triple (sgtGateEmpty, seeded "") | skips-before-test-body |
| 3 | run classifies complete, errorCount 0 despite the skip | this triple | smoke layer |
| 4 | status records skipped:&lt;names&gt; in listed order, pipe-separated | this triple | status-names-the-gaps |
| 5 | comma-separated name list | this triple | skips-before-test-body |
| 6 | extra `message` appended to the warning | unit test (log content isn't in the trace's final state) | — |
| 7 | all-present pass-through | logic/require-shared-vars-pass | — |
| 8 | behavior=fail | logic/require-shared-vars-fail | — |

## Witnesses

- In-bot: breadcrumb list — 'before-gate' recorded before the gate,
  'after-gate' would be recorded after it; final list ["before-gate"] proves
  execution ended exactly at the gate.
- Out-of-band: predictions pin the crumbs array and the status string; smoke
  layer independently asserts the run still classifies complete/0-errors
  (the heart of the skip contract).

## Expected values derived from

Action contract: missing = no shared parm OR null/blank value; skip ⇒
log(warning) + status `skipped:<missing.join("|")>` + requestEndBot(false),
same halt semantics end-bot promises ("End the bot run after the current
step"). Missing-name order = listed order.

## Witnessed

- 2026-07-13 in-process: pass (first run).
- 2026-07-13 agent engine: pass (first run).

## Known gaps / notes

- The amber warning's text is asserted in the runner unit tests, not here —
  log lines aren't part of the final-state trace the DSL reads.
- sgtGateMissing must never be added to envelope seeds or the customer
  inventory — its absence IS the fixture.

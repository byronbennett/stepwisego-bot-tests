# tier1-features/logic/require-shared-vars-fail

## Target

`require-shared-vars` (Logic) — the `behavior=fail` flavor: a missing shared
variable fails the step (and therefore the run) instead of skipping. For
bots where running without the resource must be loud.

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | behavior=fail on a missing svar fails step + run | this triple | smoke layer (expectComplete false, errorCount 1) |
| 2 | following step never runs | this triple | fail-mode-stops-run |
| 3 | status records missing:&lt;names&gt; (set before the step fails) | this triple | status-missing |
| 4 | `{svar:...}`-wrapped spelling of a name is accepted | this triple | status-missing |
| 5 | skip flavor | logic/require-shared-vars-skip | — |
| 6 | all-present pass-through | logic/require-shared-vars-pass | — |

## Witnesses

- In-bot: breadcrumb list — the step after the gate would append
  'after-gate'; the empty final list proves the failure stopped execution.
- Out-of-band: predictions pin crumbs=[] and the status string; smoke layer
  independently asserts failed-run classification with exactly one error.

## Expected values derived from

Action contract: behavior=fail ⇒ `{ pass:false }` (no requestEndBot), which
the engine surfaces as one step error and a failed run — mirror of
logic/end-bot-fail's expectComplete:false, plus errorCount 1 because unlike
end-bot(fail) this is a genuine step failure.

## Witnessed

- 2026-07-13 in-process: pass (first run).
- 2026-07-13 agent engine: pass (first run).

## Known gaps / notes

- No envelope seeds at all — sgtGateMissing's absence is the fixture.

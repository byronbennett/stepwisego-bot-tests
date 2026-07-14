# tier1-features/logic/require-shared-vars-pass

## Target

`require-shared-vars` (Logic) — the all-present flavor: every listed shared
variable is configured, the gate passes and execution continues. This is the
preflight action the public regression suite (stepwisego-bot-tests) puts at
the top of every infrastructure-dependent bot.

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | all listed svars present with non-empty values → continues | this triple | gate-passes-and-continues |
| 2 | statusVariable records "ok" | this triple | status-ok |
| 3 | newline-separated name list | this triple | gate-passes-and-continues |
| 4 | missing / declared-but-empty svar → skip | logic/require-shared-vars-skip | — |
| 5 | behavior=fail | logic/require-shared-vars-fail | — |
| 6 | initializeSessionVars bootstrap | unit tests (packages/shared logic __tests__) — harness always injects non-empty session vars, so the bootstrap no-ops here by design | — |

## Witnesses

- In-bot: breadcrumb list — the step after the gate appends 'after-gate';
  its presence proves the gate did not end the run.
- Out-of-band: predictions compare the exact final crumbs array AND the
  status variable; smoke layer independently asserts complete/0-errors.

## Expected values derived from

Action contract: all names present ⇒ pass-through, status "ok". Seeds
supplied via envelope.sharedVarSeeds (dual-engine: in-process sharedParms;
agent engine encrypted .svar.json files + harness password).

## Witnessed

- 2026-07-13 in-process: pass (first run).
- 2026-07-13 agent engine: pass (first run) — proves the encrypted
  shared-var file path end-to-end for the new action.

## Known gaps / notes

- The two seeded gate variables (sgtGateAlpha/sgtGateBeta) are synthetic —
  deliberately NOT part of the "Regression Tests" customer inventory, so
  developer SGT_* env can never satisfy or collide with this triple.

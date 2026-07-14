# tier1-features/user-interactions/input-dialog-headless

## Target

`input-dialog` — the HEADLESS CONTRACT half: an unanswerable prompt fails
its step at the harness's bounded deadline (5s) instead of hanging.

## Manifest honesty

Flipped to `pass` on the strength of the headless contract alone —
**the interactive exact-value leg (a human typing an answer that lands in
the variable) is Tier 3 manual-assisted, not yet witnessed.** Same honesty
convention as the ftp protocol split.

## Contract wiring (Track 10 harness change)

Both sgtester engines now arm the engine's `timeouts.promptMs` deadline
(ruling #18): the in-process verifier passes
`timeouts: { promptMs: PROMPT_TIMEOUT_MS = 5000 }` (executor-wrapper.ts);
the agent engine exports `STEPWISE_PROMPT_TIMEOUT_SECONDS=5`
(agent-runner.ts), a new Agent env override that arms promptMs WITHOUT
`STEPWISEGO_HEADLESS` (which would make the Agent's pre-run capability gate
abort the bot instead of failing the step — a different contract).

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | prompt times out → step FAILS (not a hang, not an abort) | baseline | step 1 pinned failed |
| 2 | store-to variable untouched on timeout (SENTINEL) | this triple | prompt-timed-out-not-hung |
| 3 | run continues past the buried dialog | this triple | run-continued |
| 4 | interactive exact-value entry | Tier 3 manual-assisted (deferred) | — |
| 5 | validation modes / default values | Tier 3 manual-assisted (deferred) | — |

## Expected values derived from

`input-dialog.runner.ts` (`context.promptUser` → store), `step-executor.ts`
promptUser deadline (rejects `"User prompt timed out after Ns with no
response"` — plain Error, ordinary step failure).

- 2026-07-13 standalone bootstrap: added a session-bootstrap preflight (require-shared-vars, bootstrap-only mode) + create-folder ahead of the original steps, so this bot is runnable standalone (not only via RunAllRegressionTests). Witnesses and prediction values unchanged.

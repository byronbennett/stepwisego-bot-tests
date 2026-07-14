# tier1-features/user-interactions/confirm-dialog-headless

## Target

`confirm-dialog` — headless contract: unanswerable prompt fails its step at
the harness's 5s deadline instead of hanging.

## Manifest honesty

Flipped to `pass` on the headless contract alone — **the interactive
exact-value legs (button choice landing in the variable, Yes/No vs
OK/Cancel sets) are Tier 3 manual-assisted, not yet witnessed.** Same
convention as the ftp protocol split. Harness wiring details in
`input-dialog-headless.review.md`.

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | prompt times out → step FAILS (not a hang) | baseline | step 1 pinned failed |
| 2 | store-to variable untouched (SENTINEL) | this triple | prompt-timed-out-not-hung |
| 3 | run continues past the buried dialog | this triple | run-continued |
| 4 | interactive button-choice legs (Yes/No/OK/Cancel values) | Tier 3 manual-assisted (deferred) | — |

## Expected values derived from

`confirm-dialog.runner.ts` (`context.promptUser` with buttons),
`step-executor.ts` promptUser deadline.

- 2026-07-13 standalone bootstrap: added a session-bootstrap preflight (require-shared-vars, bootstrap-only mode) + create-folder ahead of the original steps, so this bot is runnable standalone (not only via RunAllRegressionTests). Witnesses and prediction values unchanged.

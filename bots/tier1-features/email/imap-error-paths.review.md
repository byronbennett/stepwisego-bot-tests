# tier1-features/email/imap-error-paths

## Target

Error paths across the Email (IMAP/SMTP) family — wrong password, unreachable
SMTP endpoint, non-existent IMAP folder — all as BURIED failures
(`ignoreErrors: true`) with the run continuing to completion. Live Gmail test
mailbox (the dedicated `{svar:sgtMail*}` test account — internally seeded from `SGT_MAIL_*` env).

## Permutation matrix

| # | Permutation | Covered by | Check id / prediction id |
|---|---|---|---|
| 1 | wrong password (authored bad literal, never the real password mangled) → clean auth failure, no hang | this triple | baseline step `…0004` pinned `passed: false` |
| 2 | unreachable SMTP endpoint (127.0.0.1:1 → connection refused, fast) | this triple | baseline step `…0005` pinned `passed: false` |
| 3 | non-existent IMAP folder name (correct credentials) | this triple | baseline step `…0007` pinned `passed: false` |
| 4 | failed fetches never store a partial result (SENTINEL survives) | this triple | pred-failed-fetches-left-vars-untouched |
| 5 | failed send never writes its step outputs (`messageId`/`sentAt`) | this triple | pred-send-produced-no-outputs + baseline `outputVarKeys: []` |
| 6 | run continues past all three buried failures | this triple | pred-run-continued |
| 7 | probe calibration: same fetch config, right password, real folder → succeeds | this triple | pred-calibration |
| 8 | plain (non-buried) failure — bot aborts, `expectComplete: false` | deferred: the engine-patterns category owns the error-machinery matrix; each action needs only one representative error permutation (playbook §3.4) | — |
| 9 | Error-Handler-caught email failure | deferred: same reason as #8 | — |
| 10 | invalid recipient-address syntax (send-time reject vs accept) | deferred: the only permitted recipient is the live test mailbox; a syntactically invalid address would still be handed to Gmail's MTA, and its accept/reject policy is a Gmail property, not a StepwiseGO one | — |
| 11 | dead IMAP host (unroutable, not refused) | deferred: wall-clock/timeout dependent → flake risk; connection-refused (leg B) covers the transport-error class deterministically | — |

## Witnesses

- **Smoke:** `errorCount` stays 0 and `status == complete` — `ignoreErrors`
  buries the failure (`StepExecutor` increments an *ignored*-error counter and
  calls `setBuriedError`; `runState.setError()`, the only thing that bumps
  `errorCount`, is reached solely on the unhandled path). This is exactly the
  `ftp/failure-modes` convention: **`expectErrorCount: 0` is correct for buried
  legs** — a non-zero expectation would never be met and the smoke layer would
  not be pinning what it looks like it pins.
- **Baseline (`.baseline.json`) is therefore load-bearing, not optional:** it is
  the only layer that pins *which* steps failed. Without it a regression that
  made all three legs silently PASS would still be green on smoke. It pins
  `wasExecuted: true` + `passed: false` on each leg and `outputVarKeys: []` on
  the send.
- **In-bot:** SENTINEL discipline on both fetch result variables (a successful
  fetch overwrites them with an array; a failed one must not touch them), and
  the unresolved `{ssnd:messageId}` token proving the send step never wrote its
  outputs.
- **Out-of-band:** the crumb file (`read_value` on
  `{var:_sgtScratchDir}/crumb.txt`, read directly by the harness) proves the run
  reached the end.
- **Probe calibration:** ARRANGE runs the *identical* fetch configuration with
  the right password against a real folder and asserts `{scal:emailCount} > 0`.
  Without it, "leg A failed" could just mean "the fetcher is broken".

## Expected values derived from

First principles:

- A failed fetch must leave its result variable untouched — a runner that
  returns `{ pass: false }` before `context.setVariable` cannot have written it.
  SENTINEL is an authored literal, not a runner-derived value.
- `127.0.0.1:1` is un-listenable without root on macOS/Linux → the OS refuses
  the connection immediately (`ECONNREFUSED`), so leg B is deterministic and
  fast, not a timeout.
- An unresolved token substitutes to itself (the engine leaves unknown tokens
  literal). Pinned as an OBSERVED contract, confirmed by probe.
- Step counts in the baseline come from the bot's own tree (9 executed steps, 6
  passing), not from the runner.

## Known gaps / notes

- **FINDING — the IMAP runner flattens every server-side error to the same
  string.** Leg A (bad password) and leg C (non-existent folder) both surface as
  `Failed to get emails: Command failed`. imapflow's richer error detail
  (`responseText` / `serverResponseCode` — `AUTHENTICATIONFAILED` vs
  `NONEXISTENT`) is swallowed by `get-emails-imap.runner.ts`'s
  `error instanceof Error ? error.message : String(error)` catch. Two very
  different operator problems ("your password is wrong" vs "you typed the folder
  name wrong") are indistinguishable in the run log. Not a test failure — the
  step correctly fails — but a real diagnosability defect. The triple pins the
  failures via the baseline (which is message-agnostic) so it stays green if the
  message is improved; it is worth a TODOS item.
- Leg B sends to an unreachable endpoint, so **no message is ever delivered** —
  the bot needs no mailbox CLEANUP and the mailbox is never mutated. The only
  artifact is the scratch-dir crumb file, which the harness reaps.
- `serialGroup: "mail-gmail"` shares the Gmail rate-limit budget with the other
  email triples; the wrong-password leg hits the real Gmail IMAP endpoint, which
  is the point (a fixture would not exercise the real auth rejection).
- Audit-CSV pattern intentionally omitted, matching the lean convention of the
  other live triples (`ftp/failure-modes`, `email/imap-roundtrip`); predictions
  plus the baseline carry all the checks.

- 2026-07-13 svar conversion: infra references now flow through `{svar:sgt…}` shared variables (customer-configurable; harness seeds the same names from SGT_* env) with a require-shared-vars preflight gate. Witnesses and prediction values unchanged.

# tier2-shapes/int-07-run-bot-as-function-pipeline/failprop

## Target

Catalog §INT-07 failure-propagation variant: a child bot that fails at
runtime (`fixtures/child-fail.sgbot` reads a nonexistent file), called twice —
`endOnFail=false` (absorbed) and `endOnFail=true` + `ignoreErrors` (step
fails, buried).

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | endOnFail=false → parent step passes, run continues | this triple | propagation-crumbs |
| 2 | endOnFail=true → parent step fails | this triple (buried; after-endonfail crumb proves continuation, not absence of failure) | propagation-crumbs |
| 3 | statusVariable false on child failure (both variants) | this triple | status-false-both-variants |
| 4 | buried step failures don't count toward errorCount | this triple | smoke (expectErrorCount=0) |
| 5 | endOnFail=true WITHOUT ignoreErrors → bot fails | deferred — needs an expectComplete=false failure fixture; the endOnFail contract is already pinned by the step-level fail + burial here |

## Witnesses

In-bot only (engine-boundary semantics): status parms default TRUE so a
skipped write reads as a failed pin, and the crumbs list pins the exact
continuation path start → after-nofail → after-endonfail.

## Expected values derived from

`run-bot-as-function.runner.ts`: `endOnFail=false` → runner returns
pass:true with a warning log; `endOnFail=true` → pass:false; `setStatus`
writes the child's pass either way. Burial contract (ignoreErrors keeps
errorCount at 0) matches INT-06's pins.

## Known gaps / notes

- Agent-only (`envelope.engines`), same reason as the sibling pipeline triple.
- child-fail.sgbot uses a fixed absolute bogus path (`/nonexistent/…`) — the
  child has no `_sgtScratchDir` (staging injects nothing into children), so a
  runtime failure needs a path that exists nowhere. Pre-run validation
  accepts it (non-empty prop); the failure is a runtime one, per the
  Tracks 1–7 gotcha.

- 2026-07-13 standalone bootstrap: added a session-bootstrap preflight (require-shared-vars, bootstrap-only mode) + create-folder ahead of the original steps, so this bot is runnable standalone (not only via RunAllRegressionTests). Witnesses and prediction values unchanged.

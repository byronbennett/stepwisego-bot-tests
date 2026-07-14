# tier2-shapes/int-06-error-handler-retry-chain/retry

## Target

**INT-06 — error-handler-retry-chain** (integration catalog): `rest-call`
failures inside `error-handler` frames drive a real retry against a
call-counting route on a hermetic loopback listener; the breadcrumb
sequence pins the exact control flow.

## Architecture

Track 6's detached-listener pattern (`tier1-features/apis/rest-call-localhost`)
extended with the routes this scenario needs:

- `GET /status/<code>` → responds `<code>` with body `code-<code>`
- `GET /flaky` → per-process call counter: call #1 → 500 `flaky-fail-1`,
  call #N≥2 → 200 `flaky-ok-N`
- `GET /shutdown` → 200 `bye` then exit (25s self-exit backstop)

Same port-file handshake: the `run-script` launcher blocks until the
detached child writes its ephemeral port.

## Scenario check table → prediction map

| Catalog check | Prediction id(s) |
|---|---|
| Breadcrumb sequence exact (fail → caught → handler ran → retry → success → post-chain) | breadcrumb-sequence-exact, handler1/2-status-flipped, flaky-retry-succeeded |
| `ignoreErrors` variant of the same chain | buried-503-code, buried-503-body (+ `done` crumb after it) |
| Run status complete with pinned error counts | smoke: expectComplete=true, expectErrorCount=2 (two caught; the buried 503 does NOT count) |
| Tier-1 4xx/5xx contract honored inside handler frames | contract-500-code-inside-handler, contract-500-body-inside-handler, handler1-error-message |

## Retry semantics proven

The retry is against the SAME url (`/flaky`), and the response body is
generated from the server's own call counter — `flaky-ok-2` can only be
produced if the wire really carried two requests. This makes the "the
handler flipped a variable and the bot retried" story falsifiable: a bot
that never actually re-called the route cannot fake the body.

## Witnesses

- In-bot: the listener (second process, real TCP) is the independent
  witness for every HTTP assertion; `error-handler` status variables +
  step outputs (`errorMessage`, `errorStepName`) witness the engine's
  catch machinery; breadcrumbs witness ordering/skipping.
- Out-of-band: no persistent artifact — the call-counter body and the
  orderly `/shutdown` ack (as in the Track 6 listener triple) carry the
  external evidence.

## Expected values derived from

Handler semantics from the engine contract already pinned by
`tier1-features/engine-patterns/error-machinery` (children run in one
protected frame; siblings after the failure are skipped; status variable
written; handler surfaces `errorMessage`/`errorStepName`; a caught error
increments errorCount once, a buried one does not). rest-call non-2xx
message ("HTTP 500") and the store-before-ok-check behavior from the
Tier-1 rest-call triple. Server bodies are hand-specified in the fixture
script.

## Known gaps / notes

- `expectErrorCount: 2` = one per caught frame (`RunState.setError` in the
  handler path); the `ignoreErrors` burial increments only the ignored
  counter. This is the same accounting error-machinery pinned at 1.
- A wait/backoff between retry attempts is deliberately omitted —
  determinism beats realism here; `wait` mechanics are Tier 1
  (`logic/structural-logging-delay`).
- Timeout/abort and 3xx routes remain deferred with the Tier-1 triple's
  matrix (rest-call-localhost.review.md items 9–10).

- 2026-07-13 standalone bootstrap: added a session-bootstrap preflight (require-shared-vars, bootstrap-only mode) + create-folder ahead of the original steps, so this bot is runnable standalone (not only via RunAllRegressionTests). Witnesses and prediction values unchanged.

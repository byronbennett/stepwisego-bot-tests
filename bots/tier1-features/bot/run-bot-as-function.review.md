# Review — tier1-features/bot/run-bot-as-function

## Target

`run-bot-as-function` (Bot plugin), both execution shapes: the default inline
in-process fast path and `isolateProcess=true` (forked child Agent with the
temp-file inbound/outbound variable channel). Agent engine only — the shared
in-process runner is a stub that always fails (needs the desktop/agent
runtime), so `envelope.engines: ["agent"]`.

## Fixture

`fixtures/child-echo.sgbot` — one-step child: `msgOut = upper(msgIn)`. Staged
into the scratch dir via `envelope.fixtureRefs` and referenced as
`{var:_sgtScratchDir}/child-echo.sgbot`.

## Permutation matrix

| Case | Props | Pin |
|---|---|---|
| inline call | `isolateProcess=false`, mapping in (`msgIn←greeting`) + bothWays out (`msgOut→echoInline`), `statusVariable` | `echoInline == "HÉLLO WÖRLD ≤42"`, `statusInline == true` |
| forked call | `isolateProcess=true`, same mapping into `echoForked` | `echoForked == "HÉLLO WÖRLD ≤42"`, `statusForked == true` |

## Witness design

- `greeting` carries non-ASCII (`é ö ≤`) so the round-trip also pins UTF-8
  integrity across the process-boundary temp-file channel.
- `echoInline`/`echoForked` default to `SENTINEL` and the status parms default
  to `false`, so a silent no-write can never read as a pass.
- Failure propagation (`endOnFail` variants) is NOT re-covered here — that's
  INT-07 `failprop` (tier2-shapes/int-07-run-bot-as-function-pipeline).

## Known gaps / notes

- Agent-only (shared runner stub). The in-process engine reports the pair as
  `engine-gated` skips.
- `botSource: "database"` is not implemented in the Agent and not covered.

- 2026-07-13 standalone bootstrap: added a session-bootstrap preflight (require-shared-vars, bootstrap-only mode) + create-folder ahead of the original steps, so this bot is runnable standalone (not only via RunAllRegressionTests). Witnesses and prediction values unchanged.

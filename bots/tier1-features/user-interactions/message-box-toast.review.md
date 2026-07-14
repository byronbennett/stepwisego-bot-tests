# tier1-features/user-interactions/message-box-toast

## Target

`message-box` in toast mode (`autoCloseSeconds > 0`) — the headless-safe,
non-blocking half of the action (modal mode with autoCloseSeconds=0 is
interactive-host gated).

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | toast never blocks: the next step runs immediately | this triple | run-continues-past-toast |
| 2 | out-of-band continuation witness (crumb file) | this triple | crumb-file-witness |
| 3 | unicode title/message + token substitution in the message | this triple | (exercised in the props; no render channel to read back) |
| 4 | no step outputs | baseline | outputVarKeys [] |
| 5 | modal mode (autoCloseSeconds=0, blocks for a click) | deferred: requiresInteractiveHost — Tier 3 / desktop-host shape, unreachable headlessly | — |
| 6 | headless-node skip branch (no display) | deferred: on this dev host hasDisplay=true so notifyUser emits; the skip branch needs a runner-service-like host — Tier 3 candidate | — |

## Witnesses

The action has no observable outputs by design (notifyUser just emits a
`user-message` event). The testable contract is NON-BLOCKING-NESS: a
set-variable and a write-to-file after the toast, plus maxDurationMs 30s,
prove the run sailed through. The crumb file is the out-of-band witness.

## Envelope / cleanup

No fixtures, no serialGroup — pure engine + file write into scratch.

## Expected values derived from

`message-box.runner.ts`: autoCloseSeconds>0 → toast, notifyUser is
fire-and-forget, pass:true unconditionally on a display host; headless
nodes log-and-skip (also pass:true) — so this triple passes on BOTH kinds
of host, asserting only the continuation contract.

## Known gaps / notes

- `notifyUser` renders in the editor/desktop as an actual toast; under
  sgtester engines the event is emitted and dropped. Rendering is a UI
  concern outside the harness's reach.

- 2026-07-13 standalone bootstrap: added a session-bootstrap preflight (require-shared-vars, bootstrap-only mode) + create-folder ahead of the original steps, so this bot is runnable standalone (not only via RunAllRegressionTests). Witnesses and prediction values unchanged.

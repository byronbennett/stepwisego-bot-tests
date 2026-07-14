# tier1-features/user-interactions/speak-text-mechanics

## Target

`speak-text` — mechanics only: a volume-0 utterance and an INVALID VOICE
both complete, because the speech host never rejects (speech is
non-critical by contract). Audio output itself is unverifiable by a
harness.

## Manifest honesty

Flipped to `pass` for the mechanics contract (the playbook blesses
mechanics-only for speech) — **audible output and voice selection are only
verifiable by a human ear; anything beyond "the step completes and never
blocks the run" is out of harness reach by design.**

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | volume-0 utterance completes (silent on the gate host) | baseline | step 1 pinned passed |
| 2 | invalid voice ALSO completes (never-rejects contract) | baseline | step 2 pinned passed |
| 3 | run reaches its end past both | this triple | run-completed-past-speech |
| 4 | audible output / correct voice | unverifiable (human ear only) | — |

## Expected values derived from

`speak-text.runner.ts` + the speech-host contract (agent's
`createAgentSpeechHost`: say-command errors are swallowed — speech never
fails a step; the in-process verifier host has no speak, same non-critical
path). `drainSpeech` at run end is bounded (10s) so wait:true can't hang
the run either.

## Known gaps / notes

- Both steps use `volume: 0` deliberately: the suite must not make the
  gate host talk.

- 2026-07-13 standalone bootstrap: added a session-bootstrap preflight (require-shared-vars, bootstrap-only mode) + create-folder ahead of the original steps, so this bot is runnable standalone (not only via RunAllRegressionTests). Witnesses and prediction values unchanged.

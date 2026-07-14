# tier1-features/engine-patterns/token-gbl-var

## Target

The `token:gbl-var` pattern — `{gbl-var:name}` tokens end to end: inline
substitution, pipe functions, and set-variable writing INTO a gbl-var
target. Complements `token-substitution` (which covers `{var:}` only).

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | inline read: "got:{gbl-var:gShared}" | this triple | gbl-var-reads-inline |
| 2 | pipe chain on a gbl-var token ({gbl-var:x\|upper\|left:4}) | this triple | gbl-var-pipe-functions |
| 3 | set-variable variableToken targeting {gbl-var:} + value composed from another gbl-var | this triple | set-variable-writes-gbl-var-target |
| 4 | write isolation: source gbl-var untouched | this triple | source-gbl-var-untouched |
| 5 | {var:x} vs {gbl-var:x} same-name disambiguation | deferred: the executor's prefix-scoped lookup (findParmByToken tokenPrefix match) — worth a micro-triple with a deliberately shadowed name | — |
| 6 | compound prefixes ({gbl-var-suffix:}) | deferred: separate pattern family (dictionary/table-scoped) | — |
| 7 | cross-bot global semantics (run-bot child sees parent gbl-vars) | deferred: belongs to the bot/run-bot family; engine-gated | — |

## Witnesses

Final-parm equality on both the derived vars AND the gbl-var parms
themselves (`gShared` unchanged, `gShared2` written) — the write-back is
verified in the parm store, not just through a re-read.

## Envelope / cleanup

Pure engine; no fixtures, no envelope needs.

## Expected values derived from

`token-resolver.ts` (PREFIX_RE includes gbl-var; plain gbl-var resolves
from parms with tokenPrefix match), set-variable's variableToken handling
(token form disambiguates scope).

## Known gaps / notes

- In the current engine gbl-vars behave as bot-scoped parms with a
  distinct token prefix (cloud-shared global stores are a Control-side
  concern); this triple pins the ENGINE contract.

- 2026-07-13 standalone bootstrap: added a session-bootstrap preflight (require-shared-vars, bootstrap-only mode) + create-folder ahead of the original steps, so this bot is runnable standalone (not only via RunAllRegressionTests). Witnesses and prediction values unchanged.

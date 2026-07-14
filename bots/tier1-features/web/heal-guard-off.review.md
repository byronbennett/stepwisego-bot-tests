# tier1-features/web/heal-guard-off

## Target

The heal ladder's OFF guard: `resilienceMode: "exactOnly"` on
`click-element`, `send-keys-browser`, and `wait-for-element` steps whose
Token (webElement) selectors are deliberately stale (`#old-submit-id` /
`#old-name-field` vs the live `#new-*` ids). This is the guard half of the
category playbook's guard-pair rule: the same drift that heals in
`heal-guard-on` must FAIL here — proving healing is opt-out-able and never
silent under exactOnly.

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | click + exactOnly → fails, success=false | this triple | click-fails-exact-only |
| 2 | send-keys + exactOnly → fails | this triple | send-keys-fails-exact-only |
| 3 | wait-for-element + exactOnly → fails | this triple | wait-fails-exact-only |
| 4 | page state untouched (no click, no keys) | this triple | no-click-landed, no-keys-landed |
| 5 | requireApproval gate (heals diagnosed, filed, step still fails) | deferred: needs fix-event/ledger assertions the harness can't read yet; the gate's file-and-fail branch is unit-tested in runner-resolve | — |

## Witnesses

- Step outputs (`success: "false"`) on all three actions.
- Independent page-state reads: the live button's click counter stays "0"
  and the live input's value stays empty — the failures really did leave
  the page alone.
- Baseline pins all three buried steps failed.

## Envelope / cleanup

`serialGroup: "web-browser"`; fixture `heal.html` (shared with
heal-guard-on). Click/wait carry 2s budgets; send-keys has a fixed 10s
resolution budget (no timeout param on the action today) — the bot burns
~14s of deliberate timeouts.

## Expected values derived from

`resolve-target.ts` (mode !== "full" → " (self-healing disabled:
exactOnly)" note, no heal pass), `runner-resolve.ts` (stepResilience from
the step's resilienceMode field), the runners' catch-path outputs.

## Known gaps / notes

- The webElement parms are hand-authored (capturedBy: "manual") with
  fingerprints mirroring the recorder's format — see heal-guard-on's
  review for the score math that makes the SAME values heal there.

- 2026-07-13 standalone bootstrap: added a session-bootstrap preflight (require-shared-vars, bootstrap-only mode) + create-folder ahead of the original steps, so this bot is runnable standalone (not only via RunAllRegressionTests). Witnesses and prediction values unchanged.

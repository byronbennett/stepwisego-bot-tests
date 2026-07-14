# tier3-hosted/canary/hosted-canary

## Target

Not an action — the FP-7 **plumbing** itself: `tier3-hosted/` loading,
tier-3 inference, the default `hosted` skip, and the `--include-hosted`
opt-in. The bot body is a deliberately trivial set-variable so a hosted
run witnesses the trampoline transport, not any action semantics.

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | tier3-hosted/ triple loads and infers tier 3 | this triple existing (loader would throw on unknown prefix) | — |
| 2 | default verify run → skipped with a `hosted` reason, quiet in the summary | every gate run, both engines | — |
| 3 | `--include-hosted` → actually executes and passes | manual opt-in run (works on any host — no real desktop dependency, by design) | canary-ran |
| 4 | real hosted execution over the VM trampoline | deferred: exercised the first time a real Tier 3 triple (Excel COM / INT-12 / interactive-desktop) rides the documented procedure | — |

## Witnesses

`canaryOut` stamped with the injected session id (starts_with — the id is
per-run). Deliberately host-independent: the canary must pass anywhere
`--include-hosted` is passed, so a broken skip-gate is distinguishable
from a broken host.

## Envelope / cleanup

`envelope.exclusive: true` — the tier-3 convention (hosted tests own the
machine desktop). No fixtures, no cleanup.

## Run protocol

Automated internally on a Windows VM via a trampoline script — though this
canary specifically may also be run locally with `--include-hosted` to
smoke-test the flag.

## Expected values derived from

Tier-3 design: tier widening, skip-by-default with a `hosted` reason,
`--include-hosted` opt-in.

## Known gaps / notes

- The real Tier 3 consumers (6 Excel COM entries, INT-12, the
  interactive-desktop category) land as their own triples; this canary
  exists so the plumbing has coverage before any of them do.

- 2026-07-13 standalone bootstrap: added a session-bootstrap preflight (require-shared-vars, bootstrap-only mode) + create-folder ahead of the original steps, so this bot is runnable standalone (not only via RunAllRegressionTests). Witnesses and prediction values unchanged.

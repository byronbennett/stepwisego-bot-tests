# tier1-features/web/waits

## Target

`wait-for-element` — all five states (Visible, Hidden, Attached, Detached,
Enabled), success and timeout paths, and the outputs-on-failure contract.

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | Visible on an element inserted ~400ms after load | this triple | visible-appears-late |
| 2 | Hidden satisfied by REMOVAL (absence satisfies negative states; no healing) | this triple | hidden-satisfied-by-removal |
| 3 | Enabled after the disabled attribute is removed | this triple | enabled-unlocks |
| 4 | Attached immediate on an always-present element | this triple | attached-immediate |
| 5 | Detached timeout on a persistent element → success=false + waitedMs ≈ budget | this triple (buried) + baseline | detached-times-out-with-outputs |
| 6 | Visible timeout on a never-existing selector → same output contract | this triple (buried) + baseline | missing-visible-times-out-with-outputs |
| 7 | Hidden via display:none (vs removal) | deferred: same Playwright "hidden" state; removal is the stricter probe | — |
| 8 | Detached success (element actually removed mid-wait) | deferred: needs a third timer; cheap follow-up | — |

## Witnesses

`success`/`waitedMs` step outputs — the runner sets them on BOTH paths
(including the catch), which checks 5–6 pin. `waitedMs > 1500` bounds the
2s-budget timeouts without pinning exact timing.

## Envelope / cleanup

`serialGroup: "web-browser"`; fixture `waits.html` (three 400ms timers:
insert #appears, remove #vanishes, enable #locked).

## Expected values derived from

`wait-for-element.runner.ts`: negative states take the tryResolveOnce
no-heal path (absent → immediate success), Enabled = visible + isEnabled
poll, outputs written in the catch too.

## Known gaps / notes

- The Detached-timeout case exercises the locator.waitFor(detached) branch
  after tryResolveOnce found the element — the "waiting for disappearance
  that never comes" shape.

- 2026-07-13 standalone bootstrap: added a session-bootstrap preflight (require-shared-vars, bootstrap-only mode) + create-folder ahead of the original steps, so this bot is runnable standalone (not only via RunAllRegressionTests). Witnesses and prediction values unchanged.

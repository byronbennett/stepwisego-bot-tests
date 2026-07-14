# tier1-features/web/heal-guard-token-actions

## Target

Token (webElement) selector support through `perform-browser-action` and
`move-mouse-browser` — the Track 10 product fix for the Track 9 gap
("stringify webElement selectors, healing inert"). Both runners previously
passed `props.selectorValue` through `resolveTokens`, which stringified the
webElement parm to `[object Object]` before `buildTargetSpecWithMeta` could
look it up; they now keep `selectorType === "Token"` values RAW (the same
guard `click-element` and every other element-taking runner uses).

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | perform-browser-action Focus via FRESH Token → resolves + acts (activeElement witness) | this triple | pba-fresh-token-works |
| 2 | move-mouse-browser Element via FRESH Token → resolves + moves (page mouseenter counter witness) | this triple | mouse-fresh-token-works |
| 3 | guard parity: STALE Token + exactOnly fails through perform-browser-action | this triple + baseline | pba-stale-fails-exact-only |
| 4 | guard parity: STALE Token + exactOnly fails through move-mouse-browser | this triple + baseline | mouse-stale-fails-exact-only |
| 5 | healing ON through these runners (heal event witnessed) | deferred: the heal-guard-on pattern already witnesses the ladder through resolveRunnerTarget, which is the SAME choke point these runners now enter; a dedicated on-pair is a cheap follow-up | — |

## Witnesses

Fresh-token effects are read through independent channels
(`execute-javascript` activeElement for Focus, the fixture's `#mouse-log`
mouseenter counter for the mouse move) — never the acting runner's own
report. Stale legs assert the `success=false` step output and are pinned
in the baseline.

## Envelope / cleanup

`serialGroup: "web-browser"`; shares `fixtures/heal.html` with the
heal-guard pair (the `#mouse-log` div + mouseenter listener were added for
this triple — additive, the pair never reads them).

## Expected values derived from

`perform-browser-action.runner.ts` / `move-mouse-browser.runner.ts` (the
new raw-Token guard), `runner-resolve.ts` `buildTargetSpecWithMeta`
(Token → `context.getParm` → webElement spec), `resolve-target.ts`
exactOnly semantics.

## Known gaps / notes

- Permutation 5: healing-on THROUGH these two runners specifically is not
  separately witnessed; the ladder mechanism itself is (heal-guard-on).

- 2026-07-13 standalone bootstrap: added a session-bootstrap preflight (require-shared-vars, bootstrap-only mode) + create-folder ahead of the original steps, so this bot is runnable standalone (not only via RunAllRegressionTests). Witnesses and prediction values unchanged.

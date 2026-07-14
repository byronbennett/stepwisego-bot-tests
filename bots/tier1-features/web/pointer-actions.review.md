# tier1-features/web/pointer-actions

## Target

`perform-browser-action` pointer verbs (Focus, Hover) and
`move-mouse-browser` (Coordinates + Element target types).

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | Focus fires the focus listener | this triple | focus-fires-listener |
| 2 | Hover fires mouseenter → hidden element revealed | this triple | hover-reveals-element |
| 3 | move-mouse Coordinates (absolute page px) | this triple | move-mouse-element-reenters (the move-away leg) |
| 4 | move-mouse Element (center of bounding box) | this triple | move-mouse-element-reenters |
| 5 | success outputs for both target types | this triple | move-mouse-success-outputs |
| 6 | move-mouse steps > 1 (interpolated movement) | deferred: intermediate positions have no DOM-observable effect on this fixture | — |
| 7 | move-mouse to a hidden element (boundingBox null path) | deferred: cheap buried follow-up | — |

## Witnesses

The mouse-log is RESET in-bot (execute-javascript) after Hover already
triggered mouseenter, then the pointer is physically moved away to (5,5)
via Coordinates and back onto the zone via Element — so the final
`entered` marker can only come from the move-mouse re-entry, not the
earlier Hover.

## Envelope / cleanup

`serialGroup: "web-browser"`; fixture `action-matrix.html`.

## Expected values derived from

`move-mouse-browser.runner.ts` (mouse.move to boundingBox center),
`perform-browser-action.runner.ts` (locator.focus/hover), DOM mouseenter
semantics (fires on entry only).

## Known gaps / notes

- ~~Both `move-mouse-browser` and `perform-browser-action` stringify Token
  selector params through resolveTokens → "[object Object]", so webElement
  Tokens (and thus healing) are unreachable for them~~ — **FIXED (Track 10,
  Item 4):** both runners now keep `selectorType === "Token"` values RAW
  (the click-element guard) so `buildTargetSpecWithMeta` sees the webElement
  parm and the heal ladder works. Witnessed by
  `web/heal-guard-token-actions` (heal-off pinned failures through both
  runners' resolveRunnerTarget path).

- 2026-07-13 standalone bootstrap: added a session-bootstrap preflight (require-shared-vars, bootstrap-only mode) + create-folder ahead of the original steps, so this bot is runnable standalone (not only via RunAllRegressionTests). Witnesses and prediction values unchanged.

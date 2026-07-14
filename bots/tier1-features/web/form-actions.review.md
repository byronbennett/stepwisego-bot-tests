# tier1-features/web/form-actions

## Target

`perform-browser-action` form verbs: Check, Uncheck, SelectOption,
ClearField (element-scoped half of the action's 9-verb enum), with
`execute-javascript` as the independent read channel.

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | Check → checked=true | this triple | check-sets-checked |
| 2 | Uncheck → checked=false | this triple | uncheck-clears-checked |
| 3 | SelectOption by option VALUE | this triple | select-option-by-value |
| 4 | ClearField empties a pre-filled input (empty string, not null) | this triple | clear-field-empties-value |
| 5 | success step outputs on every verb | this triple | form-verbs-report-success |
| 6 | SelectOption by label / index | deferred: runner passes the raw string to locator.selectOption(value) — label selection isn't reachable through the current props | — |
| 7 | Check on a non-checkbox (error path) | deferred: Playwright throws "not a checkbox" — cheap buried follow-up | — |

## Witnesses

Every verb is verified through the page's own DOM state via
execute-javascript, not the action's return — `'[' + value + ']'` sentinel
wrapping distinguishes empty-string from null/undefined for ClearField.

## Envelope / cleanup

`serialGroup: "web-browser"`; fixture `action-matrix.html` (shared with
pointer-actions and nav-history — distinct facets of the same page).

## Expected values derived from

`perform-browser-action.runner.ts` verb switch (locator.check/uncheck/
selectOption/fill("")).

## Known gaps / notes

- Focus/Hover live in `pointer-actions`; Reload/GoBack/GoForward live in
  `nav-history` — split to keep each bot within the size guideline.
- Token (webElement) selectors through `perform-browser-action` were
  broken (stringified by resolveTokens) until the Track 10 fix — now
  witnessed by `web/heal-guard-token-actions`; this triple stays
  CSS-selector-based on purpose.

- 2026-07-13 standalone bootstrap: added a session-bootstrap preflight (require-shared-vars, bootstrap-only mode) + create-folder ahead of the original steps, so this bot is runnable standalone (not only via RunAllRegressionTests). Witnesses and prediction values unchanged.

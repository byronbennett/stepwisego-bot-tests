# tier1-features/web/nav-history

## Target

`perform-browser-action` navigation verbs: Reload, GoBack, GoForward
(the selector-less half of the verb enum).

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | Reload discards in-page DOM state | this triple | reload-resets-dom-state |
| 2 | GoBack returns to the previous history entry | this triple | goback-returns-to-first-page |
| 3 | GoForward re-advances | this triple | goforward-returns-to-second-page |
| 4 | success outputs on all three verbs | this triple | nav-verbs-report-success |
| 5 | GoBack with no history (goBack resolves null) | deferred: Playwright resolves null without throwing — worth a micro-triple only if the runner ever surfaces it | — |

## Witnesses

- Reload: a checkbox checked BEFORE the reload reads unchecked AFTER —
  DOM state, not URL, proves the document was reconstructed.
- GoBack/GoForward: `get-page-data PageTitle` reads pin which history entry
  is live.

## Envelope / cleanup

`serialGroup: "web-browser"`; fixtures `action-matrix.html` +
`nav-second.html`.

## Expected values derived from

`perform-browser-action.runner.ts` navigation switch (page.reload/goBack/
goForward), fixture titles.

## Known gaps / notes

- file:// URLs participate in session history normally in Chromium, which
  is what makes GoBack/GoForward deterministic here.

- 2026-07-13 standalone bootstrap: added a session-bootstrap preflight (require-shared-vars, bootstrap-only mode) + create-folder ahead of the original steps, so this bot is runnable standalone (not only via RunAllRegressionTests). Witnesses and prediction values unchanged.

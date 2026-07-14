# tier1-features/web/dialogs

## Target

`handle-dialog` — all four modes (AcceptAll, DismissAll, AcceptWithText,
Off) against real alert()/confirm()/prompt() dialogs, plus the
`lastDialogMessage` output.

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | AcceptAll: alert returns, handler continues | this triple | acceptall-alert |
| 2 | AcceptAll: confirm → true | this triple | acceptall-confirm-true |
| 3 | DismissAll: confirm → false | this triple | dismissall-confirm-false |
| 4 | AcceptWithText: prompt → armed text (beats the page default) | this triple | acceptwithtext-prompt |
| 5 | Off: dismisses (prompt → null) — behavior-identical to no listener | this triple | off-dismisses-prompt |
| 6 | lastDialogMessage reflects the most recent dialog at arm time | this triple | last-dialog-message-output, first-arm-no-dialog-yet |
| 7 | beforeunload dialogs | deferred: needs a navigation-under-dirty-state fixture; separate shape | — |

## Witnesses

The page writes each dialog's RETURN VALUE into #dialog-result
(`confirm:true`, `prompt:sgt-typed-answer`, `prompt:<null>`), so the
assertion sees what the page's own script observed — the full arm → trigger
→ observe loop, not just the runner's bookkeeping.

## Envelope / cleanup

`serialGroup: "web-browser"`; fixture `dialogs.html`.

## Expected values derived from

`session-page-hooks.ts` (dialog listener: Off dismisses explicitly since a
registered listener disables Playwright's auto-dismiss; lastDialogMessage
recorded before handling), `handle-dialog.runner.ts` (mode/promptText on
the session; lastDialogMessage output at arm time).

## Known gaps / notes

- Dialogs fire synchronously inside the click dispatch, so the click step
  only resolves after the dialog is handled — no explicit waits needed.

- 2026-07-13 standalone bootstrap: added a session-bootstrap preflight (require-shared-vars, bootstrap-only mode) + create-folder ahead of the original steps, so this bot is runnable standalone (not only via RunAllRegressionTests). Witnesses and prediction values unchanged.

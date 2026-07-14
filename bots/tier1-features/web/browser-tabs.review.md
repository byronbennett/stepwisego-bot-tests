# tier1-features/web/browser-tabs

## Target

`browser-tabs` — all five operations: Open (with URL), Count, SwitchByIndex,
SwitchByTitle, SwitchByUrl, Close, plus the out-of-range failure path.

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | Open with url → new tab navigated + activated | this triple | open-activates-new-tab |
| 2 | Count is side-effect-free | this triple | count-is-side-effect-free |
| 3 | SwitchByIndex is 1-based | this triple | switch-by-index-is-1-based |
| 4 | SwitchByTitle case-insensitive substring | this triple | switch-by-title-case-insensitive-substring |
| 5 | SwitchByUrl substring | this triple | switch-by-url-substring |
| 6 | Close activates the LAST remaining tab | this triple | close-activates-last-remaining |
| 7 | SwitchByIndex out of range → clean failure | this triple (buried) + baseline | baseline pins step 9 failed |
| 8 | Open without url (blank tab) | deferred: cheap follow-up; activeTitle/activeUrl are empty-string on about:blank | — |
| 9 | Close the LAST tab (session left tab-less) | deferred: leaves the session unusable for the close step; needs its own micro-triple | — |

## Witnesses

Every operation's own step outputs (`tabCount`, `activeIndex`, `activeUrl`,
`activeTitle`) — set unconditionally by the runner after each op, so each
switch is directly observable without extra reads.

## Envelope / cleanup

`serialGroup: "web-browser"`; fixtures `tab-a.html` / `tab-b.html`; session
closed in-bot.

## Expected values derived from

`browser-tabs.runner.ts`: 1-based indexing (`idx < 1 || idx > pages.length`),
`toLowerCase().includes` for title/url matching, Close activates
`remaining[remaining.length - 1]`.

## Known gaps / notes

- `context.pages()` order is creation order, which is what makes index
  switching deterministic here.

- 2026-07-13 standalone bootstrap: added a session-bootstrap preflight (require-shared-vars, bootstrap-only mode) + create-folder ahead of the original steps, so this bot is runnable standalone (not only via RunAllRegressionTests). Witnesses and prediction values unchanged.

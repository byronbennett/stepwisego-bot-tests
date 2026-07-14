# tier1-features/web/session-lifecycle

## Target

`open-browser-session` / `close-browser-session` (+ `navigate-to-url`,
`get-page-data` as witnesses) — the Web plugin's session lifecycle in
headless Chromium.

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | open headless chromium → UUID session id | this triple | session-id-is-uuid, session-id-step-output |
| 2 | navigate to a staged file:// fixture (fixtureRefs) | this triple | navigate-title-output, navigate-url-output |
| 3 | PageTitle read round-trips into a bot parm | this triple | page-title-roundtrip |
| 4 | close then double-close → second close fails cleanly | this triple + baseline | baseline pins step 5 failed |
| 5 | operation on a dead session fails, does NOT clobber vars | this triple | dead-session-does-not-clobber |
| 6 | firefox / webkit engines | deferred: only Chromium is provisioned in the harness cache; add engine permutations when the ship-gate env installs them | — |
| 7 | headless=false, window sizing, userAgent | deferred: headful needs a display (Tier 3) — sizing/UA are cheap follow-ups via execute-javascript reads | — |

## Witnesses

- In-bot: navigate + get-page-data prove the session actually drives a real
  browser; the UUID regex pins the session-id contract.
- The two buried failures pin the "dead session" error path without failing
  the run (`ignoreErrors`), and the baseline pins their pass/fail shape.

## Envelope / cleanup

- `serialGroup: "web-browser"` — all web triples share one group so browser
  launches never stack up under `--parallel`.
- The session is explicitly closed in-bot; the manager's `closeAll()` is the
  agent-exit backstop.

## Expected values derived from

`browser-session-manager.ts` (crypto.randomUUID id, close deletes the map
entry → second close "Session not found"), `get-page-data.runner.ts` (result
var written only on success), fixture `session-page.html`.

## Known gaps / notes

- `web-recorder` (the 20th web action) is desktop-only (edit-desktop tray) —
  out of headless harness scope, tracked as untestable-in-Tier-1.

- 2026-07-13 standalone bootstrap: added a session-bootstrap preflight (require-shared-vars, bootstrap-only mode) + create-folder ahead of the original steps, so this bot is runnable standalone (not only via RunAllRegressionTests). Witnesses and prediction values unchanged.

# tier1-features/web/click-and-keys

## Target

`click-element` (Single / Double / Right) and `send-keys-browser`
(Fill / Type / Press modes).

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | Single → one click event | this triple | click-event-sequence |
| 2 | Double → TWO click events + dblclick (DOM spec) | this triple | click-event-sequence |
| 3 | Right → contextmenu only, no click | this triple | click-event-sequence |
| 4 | Fill sets the value atomically (unicode + emoji) | this triple | fill-unicode-roundtrip |
| 5 | Type keystrokes text (unicode via insertText) | this triple | type-unicode-roundtrip |
| 6 | Press named key routes to the FOCUSED element (no selector) | this triple | press-named-key-to-focused |
| 7 | waitAfterClick delay | deferred: pure setTimeout, no observable page effect worth a triple | — |
| 8 | Type with non-zero delayMs | deferred: timing-only behavior | — |
| 9 | Type with no selector (keyboard to page) | deferred: same keyboard.type path as Press; cheap follow-up | — |

## Witnesses

- The fixture's click log accumulates `single;`/`double;`/`right;` markers,
  making the exact event sequence `single;single;single;double;right;` the
  pin for all three click types at once.
- Fill/Type read back via execute-javascript `.value` (independent channel).
- The Enter counter only increments on keydown of Enter in the focused
  input, proving Press targets focus rather than a selector.

## Envelope / cleanup

`serialGroup: "web-browser"`; fixture `interact.html`.

## Expected values derived from

`click-element.runner.ts` (dblclick / button:right dispatch),
`send-keys-browser.runner.ts` (fill vs type vs keyboard.press), DOM UI
Events spec (dblclick implies two clicks; contextmenu suppresses click).

## Known gaps / notes

- Emoji is kept OUT of the Type-mode string: Playwright types surrogate
  pairs via insertText, which works, but the click-log pin already carries
  the risk budget for this triple; Fill covers emoji.

- 2026-07-13 standalone bootstrap: added a session-bootstrap preflight (require-shared-vars, bootstrap-only mode) + create-folder ahead of the original steps, so this bot is runnable standalone (not only via RunAllRegressionTests). Witnesses and prediction values unchanged.

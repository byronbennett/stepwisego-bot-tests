# tier1-features/web/screenshots

## Target

`take-screenshot` — Page, FullPage, and Element capture types, png and jpeg
formats (with quality).

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | Page png | this triple | png-magic-bytes, file-path-outputs |
| 2 | FullPage png (2000px filler forces beyond-viewport capture) | this triple | png-magic-bytes |
| 3 | Element png (#box) | this triple | png-magic-bytes |
| 4 | Page jpeg + quality | this triple | jpeg-magic-bytes |
| 5 | files exist on disk (out-of-band) | this triple | files-exist-on-disk |
| 6 | parent-directory auto-creation (savePath into a new dir) | deferred: fs.mkdir recursive is exercised by downloads' saved/ dir already | — |
| 7 | Element screenshot of a hidden element (timeout path) | deferred: cheap buried follow-up | — |

## Witnesses

Format verification via magic bytes read back through get-file-contents
with base64 encoding (`iVBOR` = PNG signature, `/9j/` = JPEG FFD8) — proves
real image bytes of the requested format landed, without any pixel or
geometry assertions (playbook rule: never assert pixels).

## Envelope / cleanup

`serialGroup: "web-browser"`; fixture `screenshot.html` (gradient box +
tall filler). Captures land in scratch.

## Expected values derived from

`take-screenshot.runner.ts` (fullPage flag, element locator screenshot,
jpeg quality passthrough), PNG/JPEG file signatures.

## Known gaps / notes

- FullPage vs Page size ordering is NOT asserted — it's a pixel-adjacent
  property the playbook forbids pinning.

- 2026-07-13 standalone bootstrap: added a session-bootstrap preflight (require-shared-vars, bootstrap-only mode) + create-folder ahead of the original steps, so this bot is runnable standalone (not only via RunAllRegressionTests). Witnesses and prediction values unchanged.

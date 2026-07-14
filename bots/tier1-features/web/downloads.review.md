# tier1-features/web/downloads

## Target

`download-file` (direct HTTP fetch to disk: 200, overwrite=false skip, 404
failure) and `save-download` (browser-triggered attachment buffered by the
session's download hook, directory-mode save, empty-queue timeout).

## Architecture

Reuses the REST triple's local-listener pattern: a `run-script` node
launcher spawns a DETACHED `node -e` http server on `127.0.0.1:0` which
writes its port to `{scratch}/port.txt`. Routes: `GET /dl.txt` → 200 with
`Content-Disposition: attachment; filename=dl.txt` (unicode body with a
real newline via String.fromCharCode(10) — keeps the nested quoting flat),
`GET /shutdown` → "bye" + exit, else 404. 45s self-exit backstop; the bot
shuts it down deterministically and asserts the goodbye body.

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | direct download 200 → exact bytes on disk + statusCode/filePath/fileSize outputs | this triple | direct-download-content, direct-download-outputs |
| 2 | overwrite=false + existing file → skip, statusCode 0 sentinel, size untouched | this triple | overwrite-false-skips |
| 3 | 404 → step fails (buried) | this triple + baseline | baseline pins step 6 failed |
| 4 | browser-triggered attachment → save-download directory mode uses the server filename | this triple | save-download-uses-server-filename |
| 5 | saved bytes ≡ direct bytes (cross-witness) + on-disk read | this triple | browser-saved-content-matches-direct, saved-file-on-disk |
| 6 | save-download with empty queue times out (buried) | this triple + baseline | baseline pins step 12 failed |
| 7 | save-download explicit-file savePath (rename) | deferred: same saveAs path with isDir=false; cheap follow-up | — |
| 8 | custom headers on download-file | deferred: needs a header-echo route; pairs with the REST follow-ups | — |
| 9 | filename sanitization (../ traversal) | deferred: server-controlled suggestedFilename attack shape — unit-tested in save-download's sanitize, a triple would need a hostile listener | — |

## Witnesses

- Dual witness on content: in-bot get-file-contents reads AND the
  evaluator's own `{ file: ... }` read of `saved/dl.txt` (external-write).
- Cross-witness on size: `save-download.fileSize` must equal
  `download-file.fileSize` — two independent code paths measuring the same
  server bytes.

## Envelope / cleanup

`serialGroup: "web-browser"`; fixture `download-page.html` (link href built
from `?port=` query). Port file + downloads live in scratch (FP-8);
listener ends via `/shutdown` (asserted) with the 45s backstop.

## Expected values derived from

`download-file.runner.ts` (statusCode 0 sentinel on skip, fail on !ok),
`save-download.runner.ts` (pendingDownloads FIFO, trailing-slash directory
mode, suggestedFilename sanitize), `session-page-hooks.ts` (download
buffering on every page).

## Known gaps / notes

- Playwright buffers the download because the link click has a
  Content-Disposition: attachment response — no acceptDownloads opt-in
  needed on default contexts.

- 2026-07-13 standalone bootstrap: added a session-bootstrap preflight (require-shared-vars, bootstrap-only mode) + create-folder ahead of the original steps, so this bot is runnable standalone (not only via RunAllRegressionTests). Witnesses and prediction values unchanged.

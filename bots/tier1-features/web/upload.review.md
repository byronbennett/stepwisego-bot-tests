# tier1-features/web/upload

## Target

`upload-file` — setInputFiles into an `<input type=file>`, verified through
the page's own File API, plus the missing-file precheck failure.

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | single file upload → success + fileCount outputs | this triple | upload-outputs |
| 2 | page sees the original basename | this triple | page-sees-file-name |
| 3 | page sees the exact utf-8 BYTE size (63 — multibyte ≠ chars) | this triple | page-sees-exact-byte-size |
| 4 | page reads the content via file.text() | this triple | page-reads-content |
| 5 | FileList length | this triple | filelist-has-one-entry |
| 6 | nonexistent path fails in the fs precheck (no step outputs) | this triple (buried) + baseline | baseline pins step 8 failed, outputVarKeys [] |
| 7 | multiple files (semicolon list) | deferred: input is `multiple` in the fixture already — cheap follow-up with a second payload | — |
| 8 | listOfTexts variable as filePaths | deferred: SINGLE_TOKEN_RE + list expansion branch; pairs with 7 | — |
| 9 | hidden file input (attached-not-visible wait) | deferred: the runner waits for "attached" specifically for this; needs a styled-button fixture | — |

## Witnesses

All verification happens INSIDE the page (change-event handler + FileList
read) — the payload's 63-byte size pins that the File object carries bytes,
not characters (the payload is 57 chars / 63 bytes). The #upload-content
innerText read collapses the payload's newline to a space; the expectation
accounts for that (rendered-text channel, not byte channel).

## Envelope / cleanup

`serialGroup: "web-browser"`; fixtures `upload.html` +
`upload-payload.txt` (both staged via fixtureRefs).

## Expected values derived from

`upload-file.runner.ts` (fs.access precheck returns BEFORE any step vars
are set; setInputFiles; success/fileCount on the acted path), payload file
byte count (`wc -c` = 63, no trailing newline).

## Known gaps / notes

- The buried failure deliberately has NO step outputs — pinned via the
  baseline's `outputVarKeys: []`, documenting the precheck-vs-action
  asymmetry.

- 2026-07-13 standalone bootstrap: added a session-bootstrap preflight (require-shared-vars, bootstrap-only mode) + create-folder ahead of the original steps, so this bot is runnable standalone (not only via RunAllRegressionTests). Witnesses and prediction values unchanged.

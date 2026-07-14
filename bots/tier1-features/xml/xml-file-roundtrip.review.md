# tier1-features/xml/xml-file-roundtrip

## Target

`xml-save-document`, `xml-open-document` — the two file-backed XML actions.
Separate triple because these are the only Track-3 XML actions with
filesystem side effects.

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | save to a new path (replaceExisting=false, parent dir auto-created) | this triple | reopened-msg-value |
| 2 | save onto existing file with replaceExisting=false → error, buried | this triple | smoke (expectErrorCount=0 proves burial) |
| 3 | save onto existing file with replaceExisting=true → overwrite | this triple | byte-for-byte-roundtrip (reopen happens after the overwrite) |
| 4 | open a saved document and read from it | this triple | reopened-msg-value |
| 5 | save → open → stringify is byte-for-byte | this triple | byte-for-byte-roundtrip |
| 6 | open a missing path → error, buried, result variable untouched | this triple | reopened-doc-intact-after-failed-open + smoke |
| 7 | open a file with invalid XML | deferred: parse-error path is xml-parse's contract; open's distinct contract is the fs read | — |

## Witnesses

- In-bot: the reopened document is interrogated (`xml-get-node`,
  `xml-stringify`) — the file's real content is the witness that save wrote
  and open read.
- Out-of-band: the Prediction DSL has no file reader, so the out-of-band leg
  is the constant expected XML string (typed in the bot, compared against
  what physically travelled through the filesystem).

## Envelope / cleanup

- Writes only under `/tmp/sgt-xml-{_sgtSessionId}/` — session-unique, no
  collision between concurrent runs; /tmp is OS-reaped. No Files-category
  actions exist in this track to delete it in-bot (deliberate: keeping the
  triple within local-safe pure categories).

## Expected values derived from

First principles: a UTF-8 write followed by a read of the same path must
reproduce the serialized string exactly.

## Known gaps / notes

- Pinned: replaceExisting=false on an existing file is an error (message
  suggests enabling Replace Existing); =true overwrites silently.
- Pinned: save-document creates missing parent directories (mkdir -p
  semantics).
- Pinned: a failed open leaves the result variable untouched.

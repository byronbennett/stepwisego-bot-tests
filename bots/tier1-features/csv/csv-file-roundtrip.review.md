# tier1-features/csv/csv-file-roundtrip

## Target

`csv-write-line`, `dt-to-csv`, `get-csv-contents` — the file-backed CSV
actions (`csv-read` seeds the in-memory table, asserted in csv-inmemory).
Separate triple because these have filesystem side effects.

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | write-line creates file (parent dir auto-created) | this triple | write-line-accumulates-file |
| 2 | write-line appends to existing file (leading-newline record separator) | this triple | write-line-accumulates-file |
| 3 | write-line quotes a cell embedding the delimiter | this triple | write-line-accumulates-file |
| 4 | write-line from a Values List variable (wins over inline fields) | this triple | write-line-accumulates-file |
| 5 | write-line with no fields → error, buried | deferred: "Missing fields" arrives only when BOTH valuesList and fields are absent; pre-run validation blocks that shape before runtime | — |
| 6 | dt-to-csv new file, includeHeaders=true | this triple | dt-to-csv-file-roundtrip |
| 7 | dt-to-csv onto existing file replaceExisting=false → error, buried, file intact | this triple | dt-to-csv-file-roundtrip + smoke |
| 8 | get-csv-contents returns raw text + sets column metadata | this triple (raw text asserted; columnChildren metadata not DSL-visible) | write-line-accumulates-file |
| 9 | get-csv-contents on missing file → error, buried | this triple | smoke (expectErrorCount=0 proves burial) |
| 10 | dt-to-csv quoteAllFields / delimiter variants | deferred: passthrough to the shared unparseRows already pinned in csv-inmemory | — |

## Witnesses

- In-bot: the file's content is read back with `get-csv-contents` — writer
  and reader witness each other (a byte-equal round trip can only pass if
  both are faithful).
- Out-of-band: the expected file text is a hand-derived constant (three
  records accumulated per the legacy leading-newline append rule).

## Envelope / cleanup

- Writes only under `/tmp/sgt-csv-{_sgtSessionId}/` — session-unique; /tmp is
  OS-reaped. No Files-category delete available inside Track 3 (deliberate).

## Expected values derived from

First principles: append semantics (exists → "\n"+line, else line), Papa
minimal quoting, unparseRows "\n" newline with no trailing newline.

## Known gaps / notes

- Pinned: csv-write-line's record separator is a LEADING newline on
  subsequent writes — the file never ends with a trailing newline.
- Pinned: replaceExisting=false on dt-to-csv is an error when the file
  exists, and the file is left untouched.
- get-csv-contents' `columnChildren`/`csvMeta` parm metadata is not
  observable through the Prediction DSL — raw content equality is the
  contract pinned here.

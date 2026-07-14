# tier1-features/excel/save-as-text

## Target

`xl-save-as-csv`, `xl-save-as-tab-delimited` — the two Fast-mode text
exporters. Text exports are the strongest out-of-band witness in the whole
Excel category: the harness's `read_value({file})` reads the exact bytes.

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | csv default delimiter (comma) | this triple | csv-comma-exact-bytes |
| 2 | csv delimiter=pipe | this triple | csv-pipe-exact-bytes |
| 3 | csv delimiter=semicolon | this triple | csv-semicolon-replace-existing |
| 4 | csv delimiter=tab | deferred: DELIMITER_MAP pinned by 3 of 4 keys; tab output shape pinned by the dedicated tab-delimited action | — |
| 5 | csv quoting: field containing the active delimiter | this triple | csv-comma-exact-bytes (quoted) + csv-pipe-exact-bytes (same field unquoted under pipe) |
| 6 | csv quoting: embedded double quotes doubled | this triple | all three csv checks |
| 7 | csv quoting: embedded newline | this triple | all three csv checks |
| 8 | number cell renders via cell.text (7 not 7.0) | this triple | csv-comma-exact-bytes |
| 9 | empty row inside used range → SKIPPED by eachRow (pinned quirk) | this triple | csv-comma-exact-bytes, tab-sheet1-exact-bytes |
| 10 | short row padded with empty fields to columnCount | this triple | csv-comma-exact-bytes (after-gap,,) |
| 11 | replaceExisting=false collision → error, buried, file untouched | this triple | smoke expectErrorCount=0 + csv-semicolon-replace-existing (comma bytes were still readable in between — csvComma) |
| 12 | replaceExisting=true overwrites | this triple | csv-semicolon-replace-existing |
| 13 | tab-delimited: no quoting; newline → space; tab-in-value → space | this triple | tab-sheet1-exact-bytes, tab-sheet2-routing-and-tab-escape |
| 14 | sheetName routes the export to a non-default sheet | this triple | tab-sheet2-routing-and-tab-escape |
| 15 | sheetName not found → error, buried, no file created | this triple | buried-failures-wrote-nothing |
| 16 | date cells in text exports (bot-TZ ISO rendering) | deferred: date determinism is pinned centrally (cell-tz); a dates-times Excel pass can own it | — |
| 17 | Full (COM) mode export branch | deferred: FP-7 Tier 3 hosted (xlcom-* entries) | — |

## Witnesses

- In-bot: every export is read back with `get-file-contents` (a File-plugin
  reader — different plugin entirely).
- Out-of-band: `read_value({file})` on out-pipe.csv, out.csv (post-overwrite)
  and both .tab files — the harness's own fs reads must byte-equal the bot's
  reads AND the literal expected strings; `file_exists` proves the buried
  sheet-not-found export never created its file.
- All expected values are literals (no session tokens), so everything is
  asserted directly in the DSL — no crumbs needed.

## Envelope / cleanup

All artifacts under `{var:_sgtScratchDir}/txt` (FP-8, harness-reaped).
Explicit `create-folder` arrange step — the xl-save-as-* runners do not
mkdir parents.

## Expected values derived from

First principles + runner source: escapeCsvField quotes on
delimiter/quote/newline and doubles quotes; escapeTabField replaces tabs and
newlines with spaces; rows join with "\n" (no trailing newline); eachRow
(ExcelJS, includeEmpty=false) skips fully-empty rows; each emitted row pads
to worksheet.columnCount. Probe run reproduced every predicted string
byte-for-byte before they were committed here.

## Known gaps / notes

- Pinned quirk: a fully-empty row inside the used range is dropped from text
  exports (eachRow default) — consumers relying on positional row alignment
  should know.
- Pinned: the failed collision save leaves the previous file intact (comma
  bytes were read back between the collision and the overwrite).
- B2/Sheet2!A2 use valueType=text to keep multiline/tab strings out of
  auto-coercion's way (auto would land the same, but text makes intent
  explicit).

- 2026-07-13 standalone bootstrap: added a session-bootstrap preflight (require-shared-vars, bootstrap-only mode) + create-folder ahead of the original steps, so this bot is runnable standalone (not only via RunAllRegressionTests). Witnesses and prediction values unchanged.

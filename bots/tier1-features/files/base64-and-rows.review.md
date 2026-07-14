# tier1-features/files/base64-and-rows

## Target

`get-file-base64`, `create-file-from-base64`, `get-file-rows`,
`write-rows-to-file`, `file-find-replace` — binary encode/decode, line-based
IO, and in-place text surgery.

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | create-file-from-base64 with BINARY bytes (NUL, 0xFF — invalid utf8) | this triple | binary-b64-roundtrip |
| 2 | get-file-base64 re-encodes byte-identically | this triple | binary-b64-roundtrip |
| 3 | get-file-base64 of a utf8 text file → precomputed literal | this triple | text-b64-and-decode |
| 4 | create-file-from-base64 fed from a variable (encode→decode chain) | this triple | text-b64-and-decode |
| 5 | get-file-base64 on missing file → error, buried, sentinel untouched | this triple | buried-b64-left-sentinel |
| 6 | create-file-from-base64 with invalid base64 | deferred: Buffer.from(s,'base64') silently best-effort-decodes rather than throwing — no error surface to pin | — |
| 7 | write-rows-to-file overwrite (join \n, NO trailing newline) | this triple | rows-write-append-read |
| 8 | write-rows-to-file append (single \n glue) | this triple | rows-write-append-read |
| 9 | write-rows-to-file empty list → zero-byte file | this triple | rows-empty-semantics |
| 10 | write-rows-to-file listVariable not a list → error | deferred: needs a non-list parm mis-wired on purpose; validation-adjacent rather than behavior | — |
| 11 | get-file-rows LF file → exact list | this triple | rows-write-append-read |
| 12 | get-file-rows CRLF file → splits clean, no stray \r | this triple | rows-crlf-split |
| 13 | get-file-rows empty file → [""] | this triple | rows-empty-semantics |
| 14 | file-find-replace literal, multiple occurrences | this triple | find-replace-literal |
| 15 | file-find-replace regex mode (global) | this triple | find-replace-regex-and-nohit |
| 16 | file-find-replace zero matches → success, file bit-identical | this triple | find-replace-regex-and-nohit |
| 17 | file-find-replace empty findText → validation error | deferred: pre-run validation rejects empty required props (Tracks 1–3 gotcha) — structural, not runtime | — |

## Witnesses

- Base64 literals are DETERMINISTIC (precomputed with Node's own encoder),
  so the DSL can assert exact values out-of-band while the in-bot
  If/equalsExact provides the second witness on the binary payload.
- The decode side is witnessed physically: the harness reads
  note-decoded.txt as utf8 and must get the pre-encoding original.
- Row IO: exact array equality in the DSL (arrays are expressible) PLUS the
  harness's own byte-level read of rows.txt ("r1\nr2\nr3\nr4\nr5") — pins
  the no-trailing-newline and single-\n-glue contracts.
- Find/replace: read back in-bot after each mutation, final physical bytes
  re-read out-of-band; no-hit invariance via frNoHit == frRegex (var-to-var
  equality).
- rowsEmpty overwrites a ["SENTINEL"] default → action-ran proof for the
  empty-file read.

## Envelope / cleanup

All under `{var:_sgtScratchDir}/b64/` — harness-reaped. Evidence files
left for the out-of-band reads.

## Expected values derived from

Node Buffer base64 (literals generated with the same encoder the runner
uses); runner source for join/append/split semantics
(`write-rows-to-file.runner.ts`: join("\n"), append prefixes "\n";
`get-file-rows.runner.ts`: split(/\r?\n/)).

## Known gaps / notes

- Pinned: append on write-rows-to-file never doubles newlines (glue is
  exactly one \n) and overwrite writes no trailing newline.
- Pinned: get-file-rows on a zero-byte file returns [""] — one empty row,
  not an empty list.
- Pinned: file-find-replace rewrites the file even on zero matches
  (content identical); success is not conditional on hit count.

- 2026-07-13 standalone bootstrap: added a session-bootstrap preflight (require-shared-vars, bootstrap-only mode) + create-folder ahead of the original steps, so this bot is runnable standalone (not only via RunAllRegressionTests). Witnesses and prediction values unchanged.

# tier1-features/files/zip-roundtrip

## Target

`zip-files`, `zip-folder`, `unzip-file` — archive lifecycle. Chained with
get-files (list feed) to exercise the realistic collect→zip flow.

## BUG FOUND & FIXED while authoring

`unzip-file` on a missing archive **crashed the whole Agent/harness process**
(unhandled `error` event → Node fatal): the runner attached error handlers to
the unzipper Extract stream but not to the source `createReadStream`, and
`pipe()` does not forward source errors. Fixed in
`packages/shared/src/plugins/file/runners/unzip-file.runner.ts` by rejecting
on the source stream's error too — a missing archive is now an ordinary step
failure (`Unzip failed: ENOENT …`), which permutation 9 pins forever.

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | zip-files from a list variable (fed by get-files) | this triple | zip-files-roundtrip |
| 2 | zip-files entries stored FLAT (basenames) | this triple | zip-files-roundtrip (out-files/f1.txt at top level) |
| 3 | zip-files onto existing archive, replaceExisting=false → error, buried | this triple | zip-replace-existing-gate + smoke |
| 4 | zip-files replaceExisting=true overwrites; archive still valid | this triple | zip-replace-existing-gate (next unzip works) |
| 5 | zip-files with a non-list variable → error | deferred: mis-typed-parm validation surface, same class as write-rows-to-file's guard | — |
| 6 | zip-folder captures subtree WITHOUT root prefix | this triple | zip-folder-preserves-structure |
| 7 | unzip-file recreates nested structure | this triple | zip-folder-preserves-structure |
| 8 | unzip-file auto-creates the dest folder | this triple | (both extractions land in fresh dests) |
| 9 | unzip-file on missing archive → error, buried, NO process crash | this triple | unzip-missing-archive-buried + smoke |
| 10 | compression is lossless for session-scoped content | this triple | zip-files-roundtrip (in-bot equalsExact crumb) |
| 11 | password-protected / corrupted archives | deferred: no password param on the action; corruption fixtures are Tier-2 material | — |

## Witnesses

- Roundtrip dual witness: bot reads each extracted file via
  get-file-contents; the harness's `read_value({file})` independently reads
  the same extracted artifacts and must agree (and match the original seeds).
- Structure: nested `out-folder/nest/f3.txt` read in-bot + physically
  confirmed out-of-band; flat extraction confirmed by `out-files/f1.txt`
  existing at the top level; recursive get-files counts all 3 extracted.
- Session content pinned in-bot (equalsExact token-built) → crumb, exact
  array.
- Ghost-unzip: dest may exist (mkdir precedes the stream) but must contain
  no extracted file.

## Envelope / cleanup

All under `{var:_sgtScratchDir}/zip/` — harness-reaped. maxDurationMs is
45s (archiver/unzipper stream setup is heavier than plain fs calls).

## Expected values derived from

Runner source: archiver zip level 9, `archive.file(name: basename)` (flat),
`archive.directory(folderPath, false)` (no root prefix); unzipper Extract;
replaceExisting pre-check via fs.access.

## Known gaps / notes

- Pinned: zip-files flattens paths — two input files with the same basename
  would collide (documented behavior, not asserted).
- The buried-error steps prove burial via smoke expectErrorCount=0; the
  ghost dest emptiness stands in for a sentinel.

- 2026-07-13 standalone bootstrap: added a session-bootstrap preflight (require-shared-vars, bootstrap-only mode) + create-folder ahead of the original steps, so this bot is runnable standalone (not only via RunAllRegressionTests). Witnesses and prediction values unchanged.

# tier1-features/files/file-crud-basics

## Target

`create-file`, `write-to-file`, `append-text-to-file`, `get-file-contents`,
`file-exists`, `delete-file` — the core file CRUD surface. This is the
canonical Files-and-Folders dual-witness fixture (master spec §3.1): it
establishes the pattern every other triple in this category follows.

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | file-exists → false on absent path (clean-slate proof) | this triple | exists-probe-calibrated |
| 2 | file-exists → true after create (probe calibrated both polarities) | this triple | exists-probe-calibrated |
| 3 | create-file at new path, parent dir auto-created | this triple | in-bot-crumbs-all-ok (create-content-ok) |
| 4 | create-file onto existing path → error, buried | this triple | smoke expectErrorCount=0 + unicode-overwrite-roundtrip ("must-not-land" absent) |
| 5 | write-to-file append=false overwrites, multi-line unicode + emoji | this triple | unicode-overwrite-roundtrip |
| 6 | write-to-file append=true appends | this triple | oob-final-content (+more suffix) |
| 7 | write-to-file encoding=latin1 round-trip | this triple | latin1-roundtrip |
| 8 | write-to-file encoding=ascii | deferred: ascii is a lossy subset; utf8+latin1 pin the encoding switch works | — |
| 9 | append-text-to-file onto existing file | this triple | in-bot-crumbs-all-ok (append-ok) |
| 10 | append-text-to-file onto MISSING path → creates file + parents | this triple | append-created-missing-file |
| 11 | get-file-contents readAs=text (utf8 + latin1 branches) | this triple | oob-final-content, latin1-roundtrip |
| 12 | get-file-contents readAs=file (FileValue base64) | files/base64-and-rows triple (get-file-base64 is the sharper witness) | — |
| 13 | get-file-contents on missing file → error, buried, result var untouched | this triple | buried-read-left-sentinel-untouched |
| 14 | delete-file removes existing file | this triple | delete-dual-witness |
| 15 | delete-file on missing path, throwIfNotExist=false (default) → success | this triple | smoke (step passes) |
| 16 | delete-file on missing path, throwIfNotExist=true → error, buried | this triple | smoke expectErrorCount=0 |
| 17 | delete-file protected-path guard (home dir, system folders) | deferred: guard paths live outside the scratch jail; unit-tested in path-helpers | — |
| 18 | create-file bare-filename / illegal-char validation errors | deferred: literal non-scratch paths break the FP-8 jail for probe; validateNewFilePath is unit-tested | — |

## Witnesses

- In-bot: every write is read back with `get-file-contents` (different action);
  existence transitions witnessed with `file-exists`; session-dependent exact
  values (which the DSL cannot express) checked by in-bot If/equalsExact →
  crumbs, asserted as an exact ordered array.
- Out-of-band: `read_value({file})` — the harness's own fs read of
  `crud/data.txt` and `crud/deep/appendnew.txt` — plus `file_exists({file})`
  confirming the deleted victim is physically gone. Independent readers must
  agree with the bot's reads.
- Probe calibration: `file-exists` calibrated false→true on data.txt (steps
  1–3) and true→false on victim.txt (steps 20–22) — both polarities, per bot.

## Envelope / cleanup

All artifacts live under `{var:_sgtScratchDir}` (FP-8): the harness creates
the dir per test and reaps it after predictions evaluate. Evidence files
(data.txt, appendnew.txt, latin.txt) are deliberately left in scratch for the
out-of-band reads — the delete actions get their coverage as
actions-under-test on victim.txt, not as cleanup chores.

## Expected values derived from

First principles: a UTF-8 (resp. latin1) write followed by a read of the same
path must reproduce the string exactly; append concatenates; overwrite
replaces. Buried-error semantics: a failed step with ignoreErrors=true leaves
errorCount at 0 and never touches its result variable.

## Known gaps / notes

- Pinned: create-file fails on an existing path (no overwrite mode); the
  failed attempt does not modify the file.
- Pinned: append-text-to-file has mkdir -p semantics (creates parents).
- Pinned: delete-file on a missing path is success by default,
  error only with throwIfNotExist=true.
- file-exists booleans surface as real JSON booleans (not "true"/"false"
  strings) in the final-parm trace under both engines.

- 2026-07-13 standalone bootstrap: added a session-bootstrap preflight (require-shared-vars, bootstrap-only mode) + create-folder ahead of the original steps, so this bot is runnable standalone (not only via RunAllRegressionTests). Witnesses and prediction values unchanged.

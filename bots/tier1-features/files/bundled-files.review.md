# tier1-features/files/bundled-files

## Target

`save-bundled-file`, `use-bundled-file-as-template` — the Bot.files embedded
resources surface. First fixtures in the suite with a populated `files` array
and `file`-typed parms (`fileMeta.botFileId`) — the pattern for future
bundled-input tests (and the Bot Testing System's file overrides).

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | save-bundled-file to an explicit destination path | this triple | save-explicit-path |
| 2 | save-bundled-file with blank destination → per-run temp path | this triple | save-temp-path |
| 3 | captured path variable is readable by later steps | this triple | save-explicit-path (readNote via {var:notePath}) |
| 4 | multi-byte utf8 payload decodes byte-exactly (em dash) | this triple | save-explicit-path |
| 5 | temp path keeps the bundled fileName as leaf | this triple | save-temp-path (ends_with) |
| 6 | sourceFile that is not a file-typed variable → error, buried | this triple | non-file-variable-buried |
| 7 | file parm with no botFileId attached → error | deferred: same guard family as #6, one line above it in the runner | — |
| 8 | use-bundled-file-as-template materializes a working copy | this triple | template-fill-and-independence |
| 9 | two template copies are INDEPENDENT (edit A, B stays pristine) | this triple | template-fill-and-independence |
| 10 | template + file-find-replace placeholder fill (the intended workflow) | this triple | template-fill-and-independence |
| 11 | openAsWorkbook=true (ExcelJS parse into a workbook variable) | deferred: Excel-surface behavior — belongs to Track 5 (Excel Fast mode) where workbook serialization is under test | — |
| 12 | oversized bundle / size-cap enforcement | deferred: editor-side cap, not a runner behavior | — |

## Witnesses

- Physical decode witness: the harness reads the explicitly-saved file and
  both template copies directly and compares against the PRE-ENCODING source
  text (base64 in the fixture was generated from those exact strings — if
  decode were lossy or the wrong botFileId resolved, bytes differ).
- The temp-path copy's location is engine-specific (in-process: scratch
  materialized-files/; real Agent: its own run temp), so it's asserted by
  shape (leaf = fileName, ≠ explicit path) with CONTENT equality checked
  in-bot against the explicit copy → crumb.
- Negative-space: the buried non-file save left its sentinel untouched AND
  no artifact at the destination.

## Envelope / cleanup

Bundled bytes live inside the .sgbot (files[] base64, 31+36 raw bytes).
Materialized copies land under `{var:_sgtScratchDir}` in both engines
(explicit paths always; the in-process default temp is scratch-rooted too);
harness reaps. The agent engine's default temp path lives in the Agent's own
run temp — reaped by the Agent.

## Expected values derived from

Runner source + host contract: `materializeBotFile({botFileId, targetPath?})`
decodes `BotFile.data` (base64) and returns the written path;
`sha256`/`sizeBytes` in the fixture computed from the same source bytes.

## Known gaps / notes

- Pinned: save-bundled-file requires a host with `materializeBotFile` — the
  FP-8 executor-wrapper host provides it for the in-process engine (this
  triple exercises the FP-8 host capability end-to-end).
- Pinned: each use-bundled-file-as-template call writes a fresh copy when
  given an explicit path (no cross-target caching).

- 2026-07-13 standalone bootstrap: added a session-bootstrap preflight (require-shared-vars, bootstrap-only mode) + create-folder ahead of the original steps, so this bot is runnable standalone (not only via RunAllRegressionTests). Witnesses and prediction values unchanged.

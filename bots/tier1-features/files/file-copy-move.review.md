# tier1-features/files/file-copy-move

## Target

`copy-file`, `move-file` — relocation pair. Support cast: create-file,
write-to-file, get-file-contents, file-exists (all covered by
file-crud-basics).

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | copy-file to new path, parents auto-created, overwrite=false | this triple | copy-duplicates-and-preserves-source |
| 2 | copy preserves the source | this triple | copy-duplicates-and-preserves-source |
| 3 | copy-file onto existing dest, overwrite=false → error, buried | this triple | smoke expectErrorCount=0 |
| 4 | copy-file onto existing dest, overwrite=true → replaces | this triple | copy-overwrite-true-replaces |
| 5 | copy-file bare-name dest → lands in source's folder | this triple | copy-bare-name-lands-beside-source |
| 6 | copy-file source onto itself → error, buried | this triple | smoke expectErrorCount=0 |
| 7 | move-file to new folder, parents auto-created | this triple | move-relocates-and-removes-source |
| 8 | move removes the source (the copy/move distinction) | this triple | move-relocates-and-removes-source |
| 9 | move-file bare-name dest → rename in place | this triple | move-bare-name-renames-in-place |
| 10 | move-file onto existing dest, overwrite=false → error, buried, source survives | this triple | failed-move-is-atomic |
| 11 | move-file onto existing dest, overwrite=true → replaces, source consumed | this triple | failed-move-is-atomic |
| 12 | move-file missing source → error, buried | this triple | smoke expectErrorCount=0 |
| 13 | move-file EXDEV cross-device fallback (copy+delete) | deferred: needs two mount points; not reproducible inside one scratch dir | — |
| 14 | move-file of a directory | deferred: runner supports it via the EXDEV branch only; folder relocation is not an advertised param mode | — |

## Witnesses

- In-bot: every landed file read back via get-file-contents; source
  presence/absence via file-exists; session-token content equality via
  If/equalsExact crumbs (`copy-content-ok`, `move-content-ok` exact array).
- Out-of-band: `read_value({file})` re-reads dst.txt, existing.txt,
  renamed.txt, blocker.txt; `file_exists({file})` confirms moveme.txt,
  r1.txt, r2.txt are physically absent after their moves.
- Atomicity of the failed no-overwrite move witnessed three ways: source
  survived (in-bot), blocker content untouched at failure time then replaced
  by the overwrite=true retry ('r1data' both readers).

## Envelope / cleanup

Everything under `{var:_sgtScratchDir}/cm/` — harness-reaped. Note for probe:
the two bare-file-name destPath steps ("sibling.txt", "r2.txt") are not
literally scratch-prefixed, so the FP-8 jail can't statically clear them —
this fixture needs `--allow "Files and Folders"` under `sgt probe` (verify
doesn't sandbox-scan). They still resolve inside scratch at runtime because
their sources are scratch paths (resolveBareNameDest).

## Expected values derived from

Runner source (`copy-file.runner.ts`, `move-file.runner.ts`): COPYFILE_EXCL
without overwrite; explicit pre-check + "Destination already exists" for
move; resolveBareNameDest for bare names; same-path guard returns pass=false.

## Known gaps / notes

- Pinned: move-file's no-overwrite failure happens BEFORE any mutation
  (access pre-check), so a failed move is fully atomic.
- Pinned: both actions mkdir -p the destination's parent.

- 2026-07-13 standalone bootstrap: added a session-bootstrap preflight (require-shared-vars, bootstrap-only mode) + create-folder ahead of the original steps, so this bot is runnable standalone (not only via RunAllRegressionTests). Witnesses and prediction values unchanged.

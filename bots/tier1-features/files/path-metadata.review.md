# tier1-features/files/path-metadata

## Target

`get-filename`, `get-file-extension`, `get-folder-path`,
`get-file-date-created`, `get-file-date-modified`, `get-random-filename` —
the read-only path/metadata surface. The first three plus get-random-filename
are pure string ops (FP-8 SAFE_ACTIONS — no jail needed, literal paths fine);
the two date actions stat a real file, so they run against a scratch file.

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | get-filename with multi-dot base name | this triple | basename-multi-dot |
| 2 | get-file-extension multi-dot → last segment only, dot included | this triple | extension-variants |
| 3 | get-file-extension extensionless → "" (overwrites SENTINEL) | this triple | extension-variants |
| 4 | get-file-extension dotfile (.gitignore) → "" (Node extname semantics) | this triple | extension-variants |
| 5 | get-file-extension .tar.gz → ".gz" | this triple | extension-variants |
| 6 | get-folder-path literal path | this triple | dirname-literal-and-scratch |
| 7 | get-folder-path session-dependent scratch path | this triple | in-bot-crumbs-all-ok (dirname-ok) |
| 8 | get-file-date-created returns ISO-8601 UTC instant | this triple | file-dates-iso-shape |
| 9 | get-file-date-modified returns ISO-8601 UTC instant | this triple | file-dates-iso-shape |
| 10 | mtime advances across a write; birthtime does NOT | this triple | in-bot-crumbs-all-ok (dates-ordered) |
| 11 | date action on missing file → error, buried, sentinel untouched | this triple | buried-date-left-sentinel |
| 12 | get-random-filename ext without dot | this triple | random-filename-shapes |
| 13 | get-random-filename ext with leading dot (no doubling) | this triple | random-filename-shapes |
| 14 | get-random-filename omitted ext → default .tmp | this triple | random-filename-shapes |
| 15 | two draws are distinct | this triple | random-filename-shapes + crumb random-unique |
| 16 | Windows path separators (backslash) in the string ops | deferred: harness runs on POSIX; path.basename/extname behavior is Node's, unit-level concern | — |
| 17 | birthtime on filesystems without creation-time support (Linux ext4 pre-4.11) | deferred: environment-dependent; Node falls back per-platform — noted, not assertable here | — |

## Witnesses

- Out-of-band: exact values for every deterministic string op
  (basename/extname/dirname of literal paths); regex shape for the
  nondeterministic outputs (ISO instants, random names — `^[0-9a-f]{16}\.ext$`
  pins length, alphabet, and single dot).
- In-bot: the session-dependent dirname is checked equalsExact against the
  token-built `{var:_sgtScratchDir}/meta` (DSL cannot build that string);
  date ordering uses the engine's date-aware greaterOrEqual comparators
  (mtime2 ≥ mtime1 ≥ birthtime, birthtime stable equalsExact); random
  uniqueness re-checked in-bot with notEqualsExact. Crumbs asserted as an
  exact ordered array.
- The two "empty result" extension cases overwrite a SENTINEL default, so
  an action that silently skipped would fail the prediction (empty ≠
  sentinel) — action-ran proof without needing a nonempty output.

## Envelope / cleanup

Only `{var:_sgtScratchDir}/meta/stamp.txt` touches disk; harness-reaped.
Pure ops use literal `/data/in/...` paths that are never dereferenced.

## Expected values derived from

Runner source: path.basename/extname/dirname semantics; stat
birthtime/mtime `.toISOString()`; crypto UUID → 16 hex chars +
dot-normalized extension, default "tmp".

## Known gaps / notes

- Pinned: mtime resolution is sub-millisecond-visible in the ISO string
  (observed a 1ms advance without any sleep) — but the in-bot check uses
  ≥, not >, so equal timestamps on coarse filesystems can't flake.
- Pinned: `.gitignore` has NO extension per Node semantics (extname "").
- get-appdata/desktop/documents-folder are covered by the
  well-known-folders triple, not here.

- 2026-07-13 standalone bootstrap: added a session-bootstrap preflight (require-shared-vars, bootstrap-only mode) + create-folder ahead of the original steps, so this bot is runnable standalone (not only via RunAllRegressionTests). Witnesses and prediction values unchanged.

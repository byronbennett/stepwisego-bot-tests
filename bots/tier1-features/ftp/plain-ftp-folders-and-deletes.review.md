# tier1-features/ftp/plain-ftp-folders-and-deletes

## Target

The `protocol: "ftp"` branch (basic-ftp client) of `ftp-create-folder`
(nested MKD walk), `ftp-check-folder-exists` (CWD probe),
`ftp-get-folder-names` (dir-type LIST parse), `ftp-delete-files` (wildcard
DELE), `ftp-delete-folder` (recursive removeDir) — completing the ftp-leg
sweep started by `plain-ftp-roundtrip` (together the two triples cover all
nine actions' ftp branches).

## Architecture

Same loopback `ftp-srv` fixture and handshake as `plain-ftp-roundtrip`
(`fixtures/ftp-server.mjs` — Track 18, approved dev-dep, closed blocker #2).

**Two-tree layout (post-run evaluation trap):** predictions evaluate FINAL
state, so a tree the bot deletes can't also witness its own creation.
`/keep/nested/deep` is created and never touched again — the jail directory
surviving to post-run is the external MKD witness. `/work/a` is the doomed
tree: sentinel uploaded into it, wildcard-deleted, then the folder (still
holding `inner/`) is recursively deleted.

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | nested path in one create call (MKD walk) over ftp | this triple | nested-create-witnessed |
| 2 | CWD-probe folder-exists on present + deleted folder | this triple | nested-create-witnessed, recursive-delete-folder |
| 3 | single-file localPath upload branch over ftp | this triple | single-file-upload |
| 4 | folder listing = exactly the created trees (sorted compare) | this triple | root-folder-listing |
| 5 | wildcard delete-files (DELE) calibrated by uploadedCount | this triple | delete-files-witnessed |
| 6 | delete-folder on a NON-empty folder (recursive) leaves siblings | this triple | recursive-delete-folder |
| 7 | create-existing / delete-missing pins | folder-lifecycle (sftp leg) — protocol-independent runner logic above the client seam | — |

## Witnesses

External (jail reads post-run): `/keep/nested/deep` exists, `/work/a` gone,
`/work` still present. In-bot: CWD probes before/after, `uploadedCount=1`
calibrates the delete (the SIZE probe reporting absent afterwards can't be a
false pass — the file provably existed).

## Envelope / cleanup

`serialGroup: "sftp"`; fixture `fixtures/ftp-server.mjs`; jail in scratch,
reaped by FP-8. Stop-file shutdown + backstop.

## Expected values derived from

`ftp-create-folder.runner.ts` (ftp branch: `ensureDir`),
`ftp-check-folder-exists.runner.ts` (ftp branch: `cd` probe),
`ftp-get-folder-names.runner.ts` (ftp branch: `list` type-2 filter),
`ftp-delete-files.runner.ts` (ftp branch: `list` + `remove`),
`ftp-delete-folder.runner.ts` (ftp branch: `removeDir` — recursive in
basic-ftp), `ftp-connection.ts` (`withFtpClient`).

## Known gaps / notes

- `delete-files` returns its count as the Result `value` (no step output
  var), so the count itself isn't pinnable — the calibrated exists-probe
  stands in.
- Byte fidelity over ftp is `plain-ftp-roundtrip`'s job; the sentinel here
  is deliberately deleted.

- 2026-07-13 standalone bootstrap: added a session-bootstrap preflight (require-shared-vars, bootstrap-only mode) + create-folder ahead of the original steps, so this bot is runnable standalone (not only via RunAllRegressionTests). Witnesses and prediction values unchanged.

# tier1-features/ftp/folder-lifecycle

## Target

`ftp-create-folder`, `ftp-delete-folder`, `ftp-get-folder-names` — the
folder lifecycle over the loopback SFTP server.

## Protocol matrix (honesty note)

**sftp witnessed here; ftp leg witnessed by the plain-ftp triples** —
`plain-ftp-roundtrip` + `plain-ftp-folders-and-deletes` drive the
`protocol: "ftp"` branch (basic-ftp) of every runner against the loopback
`ftp-srv` fixture (`fixtures/ftp-server.mjs`, approved dev-dep — Track 18
closed blocker #2).

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | nested create (`/work/a/inner` in one call) | this triple | backing-shape |
| 2 | create-existing is idempotent (passes) | this triple + baseline | baseline pins step 5 passed |
| 3 | folder listing = exact set (sorted compare) | this triple | folder-listing-sorted |
| 4 | wildcard folder filter `a*` | this triple | folder-filter-wildcard |
| 5 | NON-EMPTY folder delete succeeds (recursive rmdir pinned) | this triple + baseline | nonempty-delete-pinned, baseline step 11 passed |
| 6 | delete a MISSING folder fails (buried) | baseline | baseline pins step 13 failed |
| 7 | protocol: "ftp" leg | witnessed: plain-ftp-folders-and-deletes (create/exists/folder-names/delete legs) | — |

## Witnesses

In-bot check-folder-exists after the delete PLUS the jail read (backing
`/work/b` physically gone, `/work/a/inner` present) — remote effect and
reported effect must agree.

## Envelope / cleanup

`serialGroup: "sftp"`; fixture `fixtures/sftp-server.mjs`; jail in scratch;
stop-file shutdown.

## Expected values derived from

`create-folder.runner.ts` (`mkdir(path, true)` — recursive, idempotent via
the server's SSH_FX_FAILURE-tolerant client), `delete-folder.runner.ts`
(sftp branch calls `rmdir(path, true)` — client-side recursive delete, so
non-empty folders DO delete; a missing path rejects), `get-folder-names.runner.ts`
(type==='d' filter + wildcard-to-regex).

## Known gaps / notes

- Permutation 5 pins CLIENT behavior (`ssh2-sftp-client` walks and deletes
  children itself) — a plain SFTP server would refuse a non-empty RMDIR.

- 2026-07-13 standalone bootstrap: added a session-bootstrap preflight (require-shared-vars, bootstrap-only mode) + create-folder ahead of the original steps, so this bot is runnable standalone (not only via RunAllRegressionTests). Witnesses and prediction values unchanged.

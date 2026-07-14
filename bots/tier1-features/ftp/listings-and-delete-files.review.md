# tier1-features/ftp/listings-and-delete-files

## Target

`ftp-get-file-names` (wildcard filters), `ftp-delete-files` (filtered
delete), `ftp-download-files` (`deleteAfterDownload`) over the loopback
SFTP server.

## Protocol matrix (honesty note)

**sftp witnessed here; ftp leg witnessed by the plain-ftp triples** —
`plain-ftp-roundtrip` + `plain-ftp-folders-and-deletes` drive the
`protocol: "ftp"` branch (basic-ftp) of every runner against the loopback
`ftp-srv` fixture (`fixtures/ftp-server.mjs`, approved dev-dep — Track 18
closed blocker #2).

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | prefix wildcard `report-*` (multiple matches, sorted compare) | this triple | wildcard-listings |
| 2 | extension wildcard `*.txt` (single exact match) | this triple | wildcard-listings |
| 3 | delete-files with a wildcard: exact SURVIVING set pinned by listing + jail | this triple | delete-files-surviving-set, delete-files-backing |
| 4 | deleteAfterDownload=true: local bytes exact AND remote copy gone | this triple | delete-after-download |
| 5 | empty listing after full drain (`[]`, not an error) | this triple | delete-after-download |
| 6 | delete-files matching NOTHING (no-op vs error) | deferred: cheap follow-up permutation | — |
| 7 | protocol: "ftp" leg | witnessed: plain-ftp-roundtrip (file-names) + plain-ftp-folders-and-deletes (delete-files) | — |

## Witnesses

Every destructive step is double-witnessed: the next in-bot listing pins
the exact surviving set, and the jail (`sftp-root/…`) is read directly by
the evaluator for physical presence/absence.

## Envelope / cleanup

`serialGroup: "sftp"`; fixture `fixtures/sftp-server.mjs`; jail in scratch;
stop-file shutdown.

## Expected values derived from

`get-file-names.runner.ts` (type==='-' filter, wildcard→regex, basenames),
`delete-files.runner.ts` (list-then-delete loop, filter applied server-list
side), `download-files.runner.ts` (deleteAfterDownload deletes each remote
file after a successful local write).

## Known gaps / notes

- Listing order is server-dependent; every multi-element compare goes
  through `|sort|join` or a single-element exact list.

- 2026-07-13 standalone bootstrap: added a session-bootstrap preflight (require-shared-vars, bootstrap-only mode) + create-folder ahead of the original steps, so this bot is runnable standalone (not only via RunAllRegressionTests). Witnesses and prediction values unchanged.

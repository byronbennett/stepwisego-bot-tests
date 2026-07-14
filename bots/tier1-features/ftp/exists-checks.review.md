# tier1-features/ftp/exists-checks

## Target

`ftp-check-file-exists`, `ftp-check-folder-exists`, `ftp-create-folder` —
the existence trichotomy over the loopback SFTP server.

## Protocol matrix (honesty note)

**sftp witnessed here; ftp leg witnessed by the plain-ftp triples** —
`plain-ftp-roundtrip` + `plain-ftp-folders-and-deletes` drive the
`protocol: "ftp"` branch (basic-ftp) of every runner against the loopback
`ftp-srv` fixture (`fixtures/ftp-server.mjs`, approved dev-dep — Track 18
closed blocker #2).

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | file-exists CALIBRATED on one path: false before upload, true after | this triple | file-exists-calibrated |
| 2 | folder-exists true for a real directory | this triple | folder-exists-trichotomy |
| 3 | folder-exists false when the path names a FILE | this triple | folder-exists-trichotomy |
| 4 | PINNED QUIRK: file-exists answers TRUE for a directory at the path | this triple | file-check-on-dir-quirk |
| 5 | create-folder materializes a NESTED path in one call | this triple | nested-mkdir-backing |
| 6 | protocol: "ftp" leg | witnessed: plain-ftp-roundtrip (file) + plain-ftp-folders-and-deletes (folder + file-gone) | — |

## Witnesses

The calibration dance (absent → create → present) immunizes against a
runner that constant-answers. Backing-jail reads confirm the mkdir and the
sentinel bytes out-of-band.

## Envelope / cleanup

`serialGroup: "sftp"`; fixture `fixtures/sftp-server.mjs`; jail in scratch;
stop-file shutdown.

## Expected values derived from

`ftp-check-file-exists.runner.ts` — sftp branch uses `client.exists()`
which returns the entry TYPE (`'d'`/`'-'`/false) and the runner only tests
truthiness, hence quirk #4: a directory named like a file answers true.
`ftp-check-folder-exists.runner.ts` DOES compare the type (=== 'd'), hence
the asymmetric trichotomy. `ftp-create-folder.runner.ts` passes
`recursive: true`.

## Known gaps / notes

- Quirk #4 is deliberate documentation-by-test: if someone later makes
  check-file-exists type-strict, this pin flags the behavior change.

- 2026-07-13 standalone bootstrap: added a session-bootstrap preflight (require-shared-vars, bootstrap-only mode) + create-folder ahead of the original steps, so this bot is runnable standalone (not only via RunAllRegressionTests). Witnesses and prediction values unchanged.

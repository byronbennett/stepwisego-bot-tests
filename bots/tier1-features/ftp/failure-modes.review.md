# tier1-features/ftp/failure-modes

## Target

Error paths across the FTP category: wrong credentials, connection refused,
missing remote folder (list + download) — all as BURIED failures with the
run continuing.

## Protocol matrix (honesty note)

**sftp witnessed here; ftp leg witnessed by the plain-ftp triples** —
`plain-ftp-roundtrip` + `plain-ftp-folders-and-deletes` drive the
`protocol: "ftp"` branch (basic-ftp) of every runner against the loopback
`ftp-srv` fixture (`fixtures/ftp-server.mjs`, approved dev-dep — Track 18
closed blocker #2).
Failure-mode permutations (bad credentials, connection-refused) remain
sftp-only — the transport-error class is protocol-independent in the shared
`resolveConnectionProps`/`withFtpClient` split.

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | wrong password → clean auth failure (no hang) | baseline | step 3 pinned failed |
| 2 | connection refused (port 1, nothing listening) | baseline | step 4 pinned failed |
| 3 | listing a missing remote folder fails | baseline | step 5 pinned failed |
| 4 | download from a missing remote folder fails | baseline | step 6 pinned failed |
| 5 | failed steps never store partial results (SENTINEL survives) | this triple | failed-steps-left-vars-untouched |
| 6 | run continues past all four buried failures | this triple | run-continued |
| 7 | timeout-shaped failures (unroutable host) | deferred: wall-clock dependent, flake risk — connection-refused covers the transport-error class deterministically | — |

## Witnesses

`errorCount` stays 0 (ignoreErrors semantics), baseline pins each failed
step, SENTINEL discipline proves no partial writes, crumb variable + crumb
file prove continuation.

## Envelope / cleanup

`serialGroup: "sftp"`; fixture `fixtures/sftp-server.mjs`; the wrong-password
probe hits the REAL listener (which rejects non-matching credentials), the
refused probe needs no listener at all.

## Expected values derived from

`ftp-connection.ts` (`withSftpClient` propagates connect() rejections),
`sftp-server.mjs` fixture (auth check → reject), each runner's catch →
`{ pass: false, message: "FTP … failed: …" }` contract.

## Known gaps / notes

- Port 1 is safely un-listenable on macOS/Linux without root — refused
  fast, no timeout wait.

- 2026-07-13 standalone bootstrap: added a session-bootstrap preflight (require-shared-vars, bootstrap-only mode) + create-folder ahead of the original steps, so this bot is runnable standalone (not only via RunAllRegressionTests). Witnesses and prediction values unchanged.

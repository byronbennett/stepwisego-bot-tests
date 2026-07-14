# tier1-features/ftp/plain-ftp-roundtrip

## Target

The `protocol: "ftp"` branch (basic-ftp client) of `ftp-upload-files`
(directory upload), `ftp-check-file-exists` (SIZE probe),
`ftp-get-file-names` (LIST parse), `ftp-download-files` — the core transfer
round trip that Track 10 could only witness over sftp.

## Architecture

First use of the **hermetic loopback plain-FTP server**
(`fixtures/ftp-server.mjs`, Track 18): `ftp-srv` (approved apps/sgtester
devDependency — MIT, test-only, closed blocker #2) hosted on `127.0.0.1:0`
with `pasv_url` pinned to loopback. Same launch/handshake/shutdown contract
as the sftp fixture: a `run-script` node launcher spawns it DETACHED; it
writes its ephemeral port to `{scratch}/ftp-port.txt` and jails each session
under `{scratch}/ftp-root/`, so every remote effect is a direct `{ file: … }`
DSL witness. Shutdown: the bot writes `{scratch}/ftp-stop.txt` (watched) with
a 45s self-exit backstop.

## Protocol matrix

This triple IS the ftp leg. The sftp leg of the same round-trip shape is
`upload-download-roundtrip`. Interop verbs exercised end-to-end: USER/PASS,
MKD/CWD (upload's auto ensureDir), STOR, SIZE, LIST, RETR, TYPE I, PASV.

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | directory upload (localPath is a dir → every file inside) over ftp | this triple | upload-count |
| 2 | unicode file NAME + unicode CONTENT survive byte-exact (TYPE I — no line-ending translation) | this triple | backing-unicode-exact, download-roundtrip |
| 3 | 0-byte file round trip | this triple | backing-empty-file, downloaded-empty-on-disk |
| 4 | SIZE-probe exists check on a present file | this triple | exists-after-upload |
| 5 | listing = exactly the uploaded set (sorted compare) | this triple | listing-sorted |
| 6 | download with fileFilter `*` to a fresh local dir | this triple | download-roundtrip |
| 7 | folder ops / deletes over ftp | plain-ftp-folders-and-deletes | — |
| 8 | error paths over ftp (bad creds, refused) | deferred: transport-error class is protocol-independent in `withFtpClient`; sftp failure-modes covers it | — |

## Witnesses

Triple-witness on content: the server's backing file (external-write, read
straight out of the jail), the in-bot `get-file-contents` of the download,
and `uploadedCount`/`downloadedCount` step outputs. Listing pinned via
`|sort|join` (server order unspecified).

## Envelope / cleanup

`serialGroup: "sftp"` (all FTP-category triples serialize together); fixture
`fixtures/ftp-server.mjs`; everything (jail included) lives in scratch —
reaped by FP-8. Stop-file shutdown + backstop.

## Expected values derived from

`ftp-upload-files.runner.ts` (ftp branch: `client.ensureDir` + `uploadFrom`,
uploadedCount/uploadedFiles outputs), `ftp-download-files.runner.ts` (ftp
branch: `downloadTo`, downloadedCount), `ftp-get-file-names.runner.ts` (ftp
branch: `list` type-1 filter), `ftp-check-file-exists.runner.ts` (ftp
branch: `size` probe), `ftp-connection.ts` (`withFtpClient`, `secure: false`).
Interop pre-verified with a direct basic-ftp↔ftp-srv smoke covering every
verb the nine runners' ftp legs issue (Track 18).

## Known gaps / notes

- Server auth is fixed user/pass (`sgt` / `sgt-tr18-pass`) — loopback
  fixture credential, not a real secret.
- FTPS (`secure: true`) is not exposed by the runners' connection props, so
  there is no FTPS leg to witness.
- ftp-srv logs to the (ignored) stdio of the detached process; noise-free by
  construction.

- 2026-07-13 standalone bootstrap: added a session-bootstrap preflight (require-shared-vars, bootstrap-only mode) + create-folder ahead of the original steps, so this bot is runnable standalone (not only via RunAllRegressionTests). Witnesses and prediction values unchanged.

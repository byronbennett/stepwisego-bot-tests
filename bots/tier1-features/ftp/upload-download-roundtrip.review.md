# tier1-features/ftp/upload-download-roundtrip

## Target

`ftp-upload-files` (directory upload), `ftp-download-files`,
`ftp-get-file-names` — the core transfer round trip over the loopback SFTP
server.

## Architecture

First use of the **hermetic loopback SFTP server**
(`fixtures/sftp-server.mjs`): a `run-script` node launcher spawns it
DETACHED on `127.0.0.1:0`; it writes its ephemeral port to
`{scratch}/sftp-port.txt` (same handshake as the REST triple) and jails all
remote paths under `{scratch}/sftp-root/`, so every remote effect is a
direct `{ file: … }` DSL witness. Server is `ssh2`'s `Server` class —
already in the tree as `ssh2-sftp-client`'s own dependency, zero new deps.
Shutdown: the bot writes `{scratch}/sftp-stop.txt` (watched) with a 45s
self-exit backstop.

## Protocol matrix (honesty note)

**both protocols witnessed** — every FTP runner is dual-protocol
(`basic-ftp` for ftp, `ssh2-sftp-client` for sftp) behind the shared
`resolveConnectionProps`/`withFtpClient` split. The sftp leg is witnessed
here; the ftp leg is witnessed by `plain-ftp-roundtrip` +
`plain-ftp-folders-and-deletes` against the loopback `ftp-srv` fixture
(`fixtures/ftp-server.mjs`, approved dev-dep — Track 18 closed blocker #2).

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | directory upload (localPath is a dir → every file inside) | this triple | upload-count |
| 2 | unicode file NAME + unicode CONTENT survive byte-exact | this triple | backing-unicode-exact, download-roundtrip |
| 3 | 0-byte file round trip | this triple | backing-empty-file, downloaded-empty-on-disk |
| 4 | listing = exactly the uploaded set (sorted compare) | this triple | listing-sorted |
| 5 | download with fileFilter `*` to a fresh local dir | this triple | download-roundtrip |
| 6 | onFileExists skip/error branches | deferred: overwrite branch exercised here; skip/error need a pre-seeded remote — cheap follow-up | — |
| 7 | protocol: "ftp" leg | witnessed: plain-ftp-roundtrip (same round-trip shape over basic-ftp) | — |

## Witnesses

Triple-witness on content: the server's backing file (external-write, read
straight out of the jail), the in-bot `get-file-contents` of the download,
and `uploadedCount`/`downloadedCount` step outputs. Listing pinned via
`|sort|join` (server order unspecified).

## Envelope / cleanup

`serialGroup: "sftp"` (conservative, like web); fixture
`fixtures/sftp-server.mjs`; everything (jail included) lives in scratch —
reaped by FP-8. Stop-file shutdown + backstop.

## Expected values derived from

`ftp-upload-files.runner.ts` (directory-vs-file localPath, uploadedCount /
uploadedFiles outputs), `ftp-download-files.runner.ts` (downloadedCount),
`ftp-get-file-names.runner.ts` (basenames only), `ftp-connection.ts`
(sftp branch via ssh2-sftp-client).

## Known gaps / notes

- Server auth is fixed user/pass (`sgt` / `sgt-tr10-pass`) — key auth is
  not exercised (the runners don't expose it either).

- 2026-07-13 standalone bootstrap: added a session-bootstrap preflight (require-shared-vars, bootstrap-only mode) + create-folder ahead of the original steps, so this bot is runnable standalone (not only via RunAllRegressionTests). Witnesses and prediction values unchanged.

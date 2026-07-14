# tier2-shapes/int-04-ftp-file-lifecycle/ftp-file-lifecycle

## Scenario (INT-04)

The catalog's ftp-file-lifecycle: a realistic transfer pipeline —
build a fidelity corpus → hash → zip → upload → verify by listing →
download to a second path → unzip → hash/text/parse compare → remote
cleanup → verify-gone by listing.

## Protocol matrix (honesty note)

**sftp witnessed here; ftp leg witnessed by the Tier 1 plain-ftp
triples** (`plain-ftp-roundtrip`, `plain-ftp-folders-and-deletes`) against
the loopback `ftp-srv` fixture — Track 18 closed blocker #2.

## Chain

`write-to-file` (CRLF+unicode+exact-decimal corpus) → `get-file-base64`
(pre-hash) → `zip-folder` → `ftp-upload-files` → `ftp-get-file-names`
(exact `[bundle.zip]`) → `ftp-download-files` → `unzip-file` →
`get-file-base64` (post-hash) + `get-file-contents` + `csv-to-json` →
`ftp-delete-files` → `ftp-get-file-names` (exact `[]`).

## Witnesses

- **Binary fidelity:** base64(original) === base64(after zip → sftp →
  unzip), with a non-empty/non-SENTINEL guard so a both-empty vacuous pass
  is impossible. The zip container makes any single-byte corruption fail
  loudly (CRC).
- **CRLF trap:** the text read-back must be byte-exact INCLUDING `\r\n` —
  the classic ascii-transfer-mode mangling would flip it to `\n`.
- **Structured witness:** `csv-to-json` parses the round-tripped file into
  exactly 2 rows — the file is still usable data, not just equal bytes.
- **Remote lifecycle:** listing pinned exactly `[bundle.zip]` after upload,
  exactly `[]` after cleanup, jail agrees physically.

## Envelope / cleanup

`serialGroup: "sftp"`; fixture `fixtures/sftp-server.mjs` (own copy under
this test's dir — fixtureRefs must live inside the test dir; keep it in
sync with `tier1-features/ftp/fixtures/sftp-server.mjs`). 60s backstop
(longer chain).

## Known gaps / notes

- The catalog's rename/move leg is absent — the FTP plugin has NO
  rename/move action (product surface, not a test gap); delete + re-verify
  covers the mutation-side lifecycle instead.

- 2026-07-13 standalone bootstrap: added a session-bootstrap preflight (require-shared-vars, bootstrap-only mode) + create-folder ahead of the original steps, so this bot is runnable standalone (not only via RunAllRegressionTests). Witnesses and prediction values unchanged.

# tier1-features/email/graph-folders

## Target
`get-email-folders-graph` — the mailbox's folder listing via app-only Graph
auth. Read-only: this triple mutates nothing.

## Permutation matrix
| # | Permutation | Covered by | Check id / prediction id |
|---|---|---|---|
| 1 | folder listing returns the mailbox's folders | this triple | pred-folder-count |
| 2 | the well-known `Inbox` and the standing custom `sgt-bulk` folder both appear | this triple | pred-standing-folders |
| 3 | `emailAccount` blank → connection's `defaultUserUpn` mailbox is listed | this triple | implicit — the listing only resolves because the UPN fallback works |
| 4 | nested/child folder path joining (`name` is the joined display path) | deferred: the test mailbox has no nested folders; add if the hierarchy grows |
| 5 | per-folder `totalMessages` / `unseenMessages` counts | deferred: **not observable from a bot** — see the finding below |

## Witnesses
- In-bot: `json-stringify` (JSON plugin — a different plugin than the one
  under test) serializes the returned list, and the assertions read the folder
  names out of that serialization.
- Out-of-band: none (no harness mail reader by design — see the email
  playbook).
- Probe calibration: pred-folder-count — a non-empty list proves the Graph
  call resolved a real mailbox before any name assertion is made.

## Expected values derived from
The mailbox's known standing folders: `Inbox` is well-known and always
present; `sgt-bulk` was provisioned as the test-mail staging folder (see
`docs/testing/test-resources.md`). Not derived from runner code.

## Known gaps / notes
- **PRODUCT FINDING — FIXED IN TRACK 14 — folder objects were opaque to bot
  logic.** Both `get-email-folders-graph` and `get-email-folders-imap` return
  `EmailFolder[]` objects (`{name, path, totalMessages, unseenMessages}`), and
  **no pipe function could read those fields**: the email pipe functions
  (`|subject`, `|senderEmail`, …) only cover `EmailObject`, `|jsonPath`
  `String()`-ed its input first (so a live object became `[object Object]`),
  and `|key:` only works on dictionary parms. A bot could *list* folders but
  never branch on a folder's name — the result was effectively write-only.
  **Fixed two ways:** `|folderName` / `|folderPath` / `|totalMessages` /
  `|unseenMessages` accessors, and — the general fix — `|jsonPath` (plus
  `|formatJson` / `|minifyJson`) now serializes a live object instead of
  `String()`-ing it, which unblocks *every* object-valued list, not just
  folders. This triple reads the names directly now; the earlier
  `json-stringify` workaround is gone.
- **Folder message counts are real now.** The IMAP folder runner hard-coded
  `totalMessages`/`unseenMessages` to `0` while Graph reported true numbers —
  the two families answered the same question differently. The IMAP runner now
  asks the server (`statusQuery`), and `pred-folder-counts-real` pins a
  non-zero Inbox count.

- 2026-07-13 svar conversion: infra references now flow through `{svar:sgt…}` shared variables (customer-configurable; harness seeds the same names from SGT_* env) with a require-shared-vars preflight gate. Witnesses and prediction values unchanged.

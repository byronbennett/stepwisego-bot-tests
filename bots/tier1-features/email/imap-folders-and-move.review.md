# tier1-features/email/imap-folders-and-move

## Target
`get-email-folders-imap` + `move-single-email-imap` — folder discovery and
targeted single-message relocation between IMAP folders, against the live Gmail
test mailbox (the dedicated `{svar:sgtMail*}` test account — internally seeded from `SGT_MAIL_*` env,
app-password auth). Full arc: list folders → SMTP-send a session-marked message
→ bounded IMAP poll-fetch from INBOX → MOVE INBOX → `sgt-archive` → prove it is
readable in `sgt-archive` and gone from INBOX → targeted delete from
`sgt-archive` → zero-match re-fetch.

## Permutation matrix
| # | Permutation | Covered by | Check id / prediction id |
|---|---|---|---|
| 1 | `get-email-folders-imap` returns a non-empty folder list; `folderCount` step output agrees with `\|count` over the result list | this triple | pred-folders-nonempty / pred-folder-count-agrees |
| 2 | folder-object *contents* (name/path/totalMessages/unseenMessages) observable from a bot | **not possible** — see Known gaps #1 | pred-folder-item-opaque (gap pinned, `human-approve`) |
| 3 | `move-single-email-imap` with an explicit `sourceFolder` (INBOX) and a live `{sfl:loopItem}` step token in `emailVariable` | this triple | pred-move-success |
| 4 | the move's *other* half: message no longer in the source folder | this triple | pred-gone-from-inbox |
| 5 | the moved message is readable in the target folder, subject intact, `parentFolderId` = target | this triple | pred-in-archive |
| 6 | clean-slate protocol + fetcher calibration against the standing `[sgt-calibration]` email | this triple | pred-calibration / pred-clean-slate |
| 7 | targeted `delete-single-email-imap` scoped to a NON-INBOX folder (`sgt-archive`) | this triple | pred-cleanup-deleted / pred-archive-empty-after |
| 8 | `move-single-email-imap` with `sourceFolder` blank (falls back to the email object's `parentFolderId`) | deferred: single-knob variation of #3; the fallback path is exercised implicitly by every fetched email carrying `parentFolderId` (pinned in pred-delivered) | — |
| 9 | move to a *non-existent* target folder / same source+target rejection (`Source and target folders are the same`) | deferred → future `email/imap-error-paths` triple (error-path permutations are batched per the playbook) | — |
| 10 | `get-email-folders-graph` parity | deferred: Graph family blocked on the M365 mailbox blocker | — |
| 11 | move back (`sgt-archive` → INBOX) | deferred: the reverse direction adds no new code path (same `messageMove`), and round-tripping into INBOX risks polluting the standing-mail set | — |

## Witnesses
- **In-bot, cross-protocol:** the message is written by SMTP (nodemailer,
  `send-email`) and read back by IMAP (imapflow, `get-emails-imap`) — two
  independent protocol stacks. Per the category playbook, this cross-protocol
  round trip *is* the sanctioned dual-witness for email (there is no FP-4-style
  harness mail reader).
- **Cross-folder:** the move is witnessed from *both* sides — presence in
  `sgt-archive` (fresh fetch of a different mailbox, `parentFolderId` =
  `sgt-archive`) **and** absence from INBOX (fresh fetch). A copy-instead-of-move
  regression fails pred-gone-from-inbox even though pred-in-archive still passes.
- **Two independent readings of one fetch:** the `folderCount` step output vs
  `{var:folders|count}` (pred-folder-count-agrees).
- **Probe calibration (ARRANGE):** the INBOX fetcher must see the standing
  `[sgt-calibration]` message before any zero-match claim is allowed to mean
  anything (pred-calibration).
- **Exact-value pin:** the session-marked subject is pinned in-bot with
  `equalsExact` (the prediction DSL does not expand `{var:_sgtSessionId}` inside
  comparator literals, so the pin has to happen where tokens resolve).

## Expected values derived from
First principles + the IMAP RFC contract, not the runner source:
- IMAP `MOVE` is atomic copy+delete, so the message must be in exactly one of
  the two folders afterwards — asserted from both ends.
- The subject is an authored literal; the sender/recipient is the known test
  account; `parentFolderId` must name the folder the fetch targeted.
- Folder count: derived from the box's own standing shape (INBOX + `sgt-archive`
  + `sgt-bulk` + the `[Gmail]/*` system set), asserted only as "> 0" plus
  self-agreement, because the exact number is Gmail-account state, not product
  behavior.

## Known gaps / notes

### FIXED IN TRACK 14 — folder objects are readable, and their counts are real
`|folderName` / `|folderPath` / `|totalMessages` / `|unseenMessages` now exist,
and `|jsonPath` accepts a live object instead of `String()`-ing it to
`[object Object]` first (the general fix — it unblocks every object-valued
list, not just folders). The IMAP folder runner also asks the server for the
per-folder counts (`statusQuery`) instead of hard-coding both to `0`.
`pred-folder-names-readable` reads the three standing folders BY NAME and pins
INBOX's real message count; it replaced the `human-approve` pin that asserted
`"[object Object]"` as the observed contract.

1. **PRODUCT GAP — an `EmailFolder` loop item is opaque (pinned, not endorsed).**
   `get-email-folders-imap` stores `EmailFolder` objects
   (`{name, path, totalMessages, unseenMessages}`), but **no pipe function in the
   registry reads `name` or `path`** (`packages/shared/src/engine/pipe-functions/`
   — the Email family only exposes email fields; `jsonPath` `String()`s its input
   first, so it sees `"[object Object]"`). A `{sflp:loopItem}` therefore
   stringifies to the literal `"[object Object]"` and a bot **cannot branch on a
   folder's name** — the folder list is countable, not inspectable. The bot probes
   this directly (`folderItemRaw`, `folderNameVisible`) and pred-folder-item-opaque
   pins the current behavior as `human-approve` so that the day a folder-name
   accessor ships, this triple goes red and the assertions get upgraded to the
   real thing ("the standing folder set contains sgt-archive/sgt-bulk", which is
   what the category playbook asks for).
2. **`totalMessages` / `unseenMessages` are hardcoded to `0`** by the runner —
   they are not read from the server. Not asserted (there is nothing to assert
   yet); flagged here so a future reader does not mistake them for data.
3. `get-emails-imap` fetches `"1:*"` and stops after `maxEmails` (50) — i.e. it
   takes the OLDEST 50, not the newest. The test box holds ~17 INBOX messages, so
   this is currently invisible; once the box grows past 50, every email triple
   will stop seeing freshly delivered mail. Mailbox hygiene (or a `maxEmails`
   bump) is the mitigation — noted for the campaign, not asserted here.
4. Delivery latency budget: 12 × 5 s for the INBOX poll and again for the
   `sgt-archive` poll. A poll timeout is a *finding* (playbook trap #1), not an
   auto-retry. Observed end-to-end: ~17 s.
5. CLEANUP is self-healing (`ignoreErrors: true`; deletes any session-marked
   message left in `sgt-archive`) and the whole category is
   `serialGroup: "mail-gmail"`. Session subject markers isolate concurrent
   sessions; Gmail rate limits do not, hence the serial group.
6. Audit-CSV pattern intentionally omitted, matching the sibling live-service
   triples (ftp/database/imap-roundtrip); the predictions carry all checks.

- 2026-07-13 svar conversion: infra references now flow through `{svar:sgt…}` shared variables (customer-configurable; harness seeds the same names from SGT_* env) with a require-shared-vars preflight gate. Witnesses and prediction values unchanged.

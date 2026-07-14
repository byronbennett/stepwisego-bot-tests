# tier1-features/email/smtp-send-matrix

## Target
`send-email` — the SMTP send matrix in one message: HTML body, `cc` (self),
`bcc` (self), `priority: high`, a subject carrying commas/semicolons/double
quotes plus the session marker, and TWO attachments (a UTF-8 text file with a
unicode filename *and* unicode content, plus a deterministic-byte binary file).
Verified by a bounded IMAP poll-fetch against the live Gmail test mailbox
(the dedicated `{svar:sgtMail*}` test account — internally seeded from `SGT_MAIL_*` env; app-password auth),
then targeted delete + zero-match re-fetch.

## Permutation matrix

| # | Permutation | Covered by | Check id / prediction id |
|---|---|---|---|
| 1 | `isHtml: true` — HTML body accepted and sent (`multipart/mixed` with a `text/html` part) | this triple | pred-delivered (+ structure confirmed out-of-band) |
| 2 | `cc` populated → survives the round trip | this triple | pred-to-and-cc |
| 3 | `bcc` populated → **must not** appear on the delivered copy | this triple | pred-bcc-not-leaked |
| 4 | to + cc + bcc all naming the same mailbox → exactly one delivered copy | this triple | pred-single-copy |
| 5 | subject with `,` `;` `"` + session marker → byte-exact round trip, no RFC-2047 leakage | this triple | pred-subject-exact (in-bot `equalsExact`) |
| 6 | `priority: high` → what the IMAP round trip surfaces | this triple | pred-priority-not-surfaced (**KNOWN-BUG**) |
| 7 | two attachments, `\|`-separated paths, one unicode filename, one binary | this triple | pred-attachments-flagged + pred-attachment-fixtures |
| 8 | `messageId` step output populated on a successful send | this triple | pred-delivered |
| 9 | clean-slate protocol + fetcher calibration against the standing `[sgt-calibration]` email | this triple | pred-calibration / pred-clean-slate |
| 10 | targeted delete via `emailVariable` (live `{sfl:loopItem}` step token) + zero-match re-fetch | this triple | pred-deleted |
| 11 | plain-text body, unicode subject | imap-roundtrip | — |
| 12 | **attachment NAME fidelity** (`{..\|attachmentNames}`) | **deferred: BLOCKED — requires `downloadAttachments: true`, which DEADLOCKS the runner (see Known gaps #1). Pinned as empty instead** | pred-attachment-names-and-paths-empty |
| 13 | **attachment CONTENT round trip** (read the downloaded file back) | **deferred: same deadlock. The bytes handed to SMTP are witnessed out-of-band instead** | pred-attachment-fixtures |
| 14 | **HTML/plain body fidelity** (line-wrap, charset transcoding, QP/base64 decode) | **deferred: `get-emails-imap` returns EMPTY body/bodyText BY DESIGN — it fetches envelope + bodyStructure only and never the body source. Not witnessable through the IMAP family** | pred-body-empty-by-design |
| 15 | `priority: low` / `normal` | deferred: pointless until #6 is fixed — the reader hard-codes `Normal`, so all three send values are indistinguishable after the round trip | — |
| 16 | multiple recipients, long (255+) subject, empty body | deferred: next send-matrix facet; one triple per coherent facet (playbook §3 batching rule) | — |
| 17 | IMAP vs Graph parity for the same corpus | deferred: campaign blocker — the `*-graph` family needs the SGT_SP_* app registration / `SGT_MAIL_GRAPH_UPN` | — |

## Witnesses

- **Cross-protocol (the category's sanctioned dual-witness):** nodemailer (SMTP)
  writes, imapflow (IMAP) reads — two independent protocol stacks. Per the
  category playbook there is no FP-4-style harness mail reader, so cross-protocol
  *is* the out-of-band story for email; deviation noted per playbook
  §Verification patterns.
- **Out-of-band (harness-side):** `file-exists` on both attachments plus a
  `read_value` file read of the text attachment — the harness reads the exact
  bytes that were handed to SMTP, independently of the bot's own claims.
- **In-bot:** the fetch loop pins subject/to/cc/bcc/priority/attachment fields
  via the email pipe functions; the exact-subject pin is an in-bot `equalsExact`
  (the session-id token resolves in-bot — the prediction DSL does not expand
  `{var:}` inside comparator literals).
- **Probe calibration:** the ARRANGE fetch must see the standing
  `[sgt-calibration]` email before "zero session matches" means anything.

## Expected values derived from

First principles plus **direct protocol observation**, never from the runner:

- Subject, body, attachment bytes and recipients are authored literals.
- The bcc, priority and attachment-count contracts were derived by reading the
  **raw RFC-822 source of the delivered message straight off the IMAP server**
  with a standalone imapflow script (not through StepwiseGO):
  - delivered headers = `Return-Path, Received, From, To, Cc, Subject,
    Message-ID, X-Priority: 1 (Highest), X-Msmail-Priority: High,
    Importance: High, Date, MIME-Version, Content-Type: multipart/mixed` —
    **no `Bcc:` header** → the MTA strips bcc; `X-Priority`/`Importance` ARE on
    the wire → the send side is correct.
  - the delivered `bodyStructure` is `multipart/mixed` with THREE children
    (`text/html`, `text/plain`, `application/octet-stream`) → the message has
    exactly TWO attachments; the runner's `"3"` is a MIME-part count, not an
    attachment count.

## Known gaps / notes

1. **BUG FOUND AND FIXED IN THIS TRACK — `get-emails-imap` with
   `downloadAttachments: true` DEADLOCKED (hung forever).**
   `get-emails-imap.runner.ts` called `client.downloadMany(...)` from *inside*
   the open `for await (const msg of client.fetch(...))` async-iterator.
   imapflow serializes commands on a connection: a new command issued while the
   FETCH response stream is still open never runs, so the `await` never
   resolved. Reproduced standalone against Gmail: `downloadMany` **inside** the
   iterator hung indefinitely (killed at 25 s); the identical call **after** the
   iterator drained returned in 169 ms. **The same defect applied to
   `markAsRead: true` and the `unreadOnly` path** (`client.messageFlagsAdd` in
   the same place). The hang was *un-interruptible* — `runState.requestStop()`
   cannot cancel a never-resolving await — so it wedged the gate rather than
   failing a test.
   **Fixed:** the runner now drains the fetch iterator into a list (phase 1) and
   issues the per-message downloads / flag updates afterwards (phase 2).
   Rows 12/13 of the matrix (attachment name + content round trip) remain
   deferred *here* only because this triple was authored against the broken
   runner; that coverage now lives in **INT-02** and **INT-10**, which both
   download attachments and compare bytes base64-exact. `imap-flags-and-bulk-delete`
   guards the `markAsRead` half of the same fix.
2. **BUG FOUND AND FIXED IN THIS TRACK — `attachmentCount` / `hasAttachments`
   counted MIME parts, not attachments.** `countAttachments()` in
   `email-builder.ts` returned `bodyStructure.childNodes.length`. This
   2-attachment HTML message reported `"3"`, and *any* `multipart/alternative`
   message with **zero** attachments reported `hasAttachments: true,
   attachmentCount: "2"` (verified out-of-band against Google's own
   security-alert mails sitting in this mailbox).
   **Fixed:** the pure BODYSTRUCTURE walker moved to
   `utils/imap-body-structure.ts` (it had lived in `attachment-saver.ts`, which
   imports `fs` and so could not be used by the browser-safe builder), and
   `countAttachments()` now counts leaf parts that actually carry a filename.
   `pred-attachments-flagged` pins the correct `"2"` and guards the fix.
3. **BUG — FOUND HERE, FIXED IN TRACK 14 — `priority` never survived the IMAP
   round trip.** The send put `X-Priority: 1 (Highest)` / `Importance: High` on
   the wire, but `buildEmailFromImapMessage` hard-coded `importance: "Normal"`:
   the IMAP ENVELOPE has no priority field and the runner never fetched
   headers. **Fixed:** the fetch now asks for `x-priority` / `importance` /
   `x-msmail-priority` and `parseImportance()` maps them (Importance wins over
   X-Priority when both are present). `pred-priority-roundtrip` pins `"High"`
   and guards it.
4. **BUG — FOUND HERE, FIXED IN TRACK 14 — `body`/`bodyText` were always
   empty** for `get-emails-imap`: it fetched envelope + bodyStructure only and
   never the body source, so `{..|body}` was useless on the IMAP side while the
   Graph family returned real bodies. It was written up as a "contract"; it was
   a gap. **Fixed:** the runner now locates the `text/plain` / `text/html`
   leaves and downloads them (imapflow decodes quoted-printable and base64 and
   transcodes to UTF-8, so no MIME parser was needed).
   `pred-body-roundtrip` guards it.
5. **`pred-single-copy` pins an ENVIRONMENT contract, not a product one.** Gmail
   de-duplicates delivery when to/cc/bcc name the same mailbox (observed 5/5
   runs). If it ever flips to 2, that is an environment finding to triage, not a
   StepwiseGO regression — and CLEANUP still self-heals (it deletes *every*
   session-marked match, not just the first).
6. **Mailbox contention hazard.** Gmail caps simultaneous IMAP connections. This
   category is `serialGroup: "mail-gmail"`, which serializes it *within* a verify
   run — but parallel authoring sessions/agents hitting the same mailbox from
   other processes are outside sgtester's control and will show up as stalled
   fetches. Combined with gap #1, a stalled IMAP command has no timeout, so a
   contended run can hang past `maxDurationMs` rather than fail cleanly.
7. Delivery latency budget: 12 × 5 s poll (observed: delivered and found on the
   first poll iteration; whole bot ≈ 9 s). A poll timeout is a *finding*
   (playbook trap #1), not an auto-retry.
8. CLEANUP is self-healing (`ignoreErrors`, deletes every leftover
   session-marked message). Audit-CSV pattern intentionally omitted, matching the
   lean convention of the other live triples; predictions carry all checks.

- 2026-07-13 svar conversion: infra references now flow through `{svar:sgt…}` shared variables (customer-configurable; harness seeds the same names from SGT_* env) with a require-shared-vars preflight gate. Witnesses and prediction values unchanged.

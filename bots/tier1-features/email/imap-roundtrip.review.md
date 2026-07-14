# tier1-features/email/imap-roundtrip

## Target
`send-email` + `get-emails-imap` + `delete-single-email-imap` — the category's
backbone: SMTP send → bounded IMAP poll-fetch → field pins → targeted delete →
zero-match re-fetch, against the live IMAP test mailbox (configured in `{svar:sgtMailAccount}`,
`SGT_MAIL_*` env → injected parms; app-password auth).

## Permutation matrix
| # | Permutation | Covered by | Check id / prediction id |
|---|---|---|---|
| 1 | plain-text body, unicode subject (`Ünïcødé 漢字`), send → fetch round trip | this triple | pred-delivered / pred-subject-exact |
| 2 | RFC-2047 subject decode (no `=?UTF-8?...?=` leakage to the variable) | this triple | pred-subject-exact (ends_with the raw unicode tail) |
| 3 | sender / recipients envelope fields | this triple | pred-sender / pred-recipients |
| 4 | markAsRead=false leaves the message unread | this triple | pred-unread |
| 5 | targeted delete via `emailVariable` (live `{sfl:loopItem}` step token) | this triple | pred-deleted |
| 6 | clean-slate protocol + fetcher calibration against the standing `[sgt-calibration]` email | this triple | pred-calibration / pred-clean-slate |
| 7 | HTML body, cc/bcc, priority, attachments | smtp-send-matrix | — |
| 8 | folder listing, move to sgt-archive | imap-folders-and-move | — |
| 9 | markAsRead=true flip, unreadOnly filter, bulk delete | imap-flags-and-bulk-delete | — |
| 10 | wrong password / dead endpoint error paths | imap-error-paths | — |

## Witnesses
- In-bot: SMTP (nodemailer) writes; IMAP (imapflow) reads — two independent
  protocol stacks; the fetch loop pins subject/sender/recipients/isRead via
  email pipe functions; the exact-subject pin is in-bot `equalsExact`
  (session-id token resolves in-bot; the DSL does not expand `{var:}` in
  comparator literals).
- Out-of-band: none available — per the category playbook there is no
  FP-4-style harness mail reader; the cross-protocol (SMTP writer ≠ IMAP
  reader) round trip is the sanctioned dual-witness for email. Deviation
  noted per playbook §Verification patterns.
- Probe calibration: ARRANGE fetch must see the standing calibration email
  before the zero-match claim means anything (pred-calibration).

## Expected values derived from
First principles: the subject/body strings are authored literals; sender and
recipients are the known test account; isRead=false is the IMAP contract for
a never-opened message fetched with markAsRead=false. Not derived from
runner code.

## Known gaps / notes
- **IMAP `get-emails-imap` returns empty `body`/`bodyText` by design** (the
  runner fetches envelope+bodyStructure only, never the body source). Body
  fidelity (QP/base64 decode) is therefore only testable via the Graph
  family; the standing `[sgt-fixture-qp]`/`[sgt-fixture-b64]` emails in the
  box serve future coverage if body download ships. Pinned here as product
  behavior, not asserted.
- Delivery latency budget: 12 × 5 s poll; a timeout classifies as a finding
  (playbook trap #1), not an auto-retry.
- CLEANUP is self-healing (`ignoreErrors`, deletes any leftover
  session-marked messages) and the whole category is `serialGroup:
  "mail-gmail"` — subject markers isolate sessions, rate limits don't.
- Audit-CSV pattern intentionally omitted (matches the ftp/database live
  triples' lean convention); predictions carry all checks.

- 2026-07-13 svar conversion: infra references now flow through `{svar:sgt…}` shared variables (customer-configurable; harness seeds the same names from SGT_* env) with a require-shared-vars preflight gate. Witnesses and prediction values unchanged.

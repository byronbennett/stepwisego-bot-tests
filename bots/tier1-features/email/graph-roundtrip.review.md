# tier1-features/email/graph-roundtrip

## Target
`send-email-graph` + `get-emails-graph` + `delete-emails-graph` — the Graph
family's backbone against a live M365 mailbox
(the dedicated M365 test mailbox configured in `{svar:sgtMailGraphUpn}`), app-only client-credentials
auth via the harness-injected `{var:devGraphMail}` connection (built from the
`SGT_SP_*` app registration + `SGT_MAIL_GRAPH_UPN`).

## ⚠️ Safety design — this runs against a REAL, in-use mailbox
Every Inbox touch is filtered **server-side** by `emailConditions`
(`subject contains "[sgt-{var:_sgtSessionId}]"` → an OData `$filter`), so no
step can ever see, move, or delete mail that this session did not create:

1. The one unfiltered read is the ARRANGE calibration fetch — **read-only**,
   no `moveToFolder`, no `deleteMessages`, no `markAsRead`.
2. Cleanup moves *only the session-filtered set* into the standing `sgt-bulk`
   staging folder (`get-emails-graph` applies `moveToFolder` to exactly what
   its filter returned).
3. `delete-emails-graph` — which is folder-scoped with **no subject filter**
   and would otherwise be catastrophic — is pointed exclusively at `sgt-bulk`,
   a folder that holds nothing but session-marked test mail. **Never Inbox.**

`envelope.exclusive: true` — two concurrent runs sharing the `sgt-bulk`
staging folder could purge each other's in-flight messages.

## Permutation matrix
| # | Permutation | Covered by | Check id / prediction id |
|---|---|---|---|
| 1 | plain-text body, unicode subject, send → session-filtered fetch | this triple | pred-both-delivered / pred-subject-exact |
| 2 | **body fidelity** — Graph returns real bodies (see notes) | this triple | pred-plain-body |
| 3 | HTML body survives as structural content | this triple | pred-html-body |
| 4 | `emailAccount` blank → the connection's `defaultUserUpn` is the sending mailbox | this triple | pred-sender-upn |
| 5 | server-side `emailConditions` `$filter` (subject contains) actually scopes the fetch | this triple | pred-clean-slate (0 before ACT) + pred-both-delivered (exactly 2 after) |
| 6 | `moveToFolder` moves exactly the filtered set | this triple | pred-inbox-purged |
| 7 | `delete-emails-graph` empties its target folder | this triple | pred-bulk-purged |
| 8 | priority/importance, cc/bcc, attachments through Graph | deferred: the IMAP `smtp-send-matrix` triple owns the send-matrix permutations; Graph's send surface has no attachments param |
| 9 | `unreadOnly` / `markAsRead` / `markAsUnread` on the Graph fetch | deferred: the IMAP `imap-flags-and-bulk-delete` triple owns the flags matrix |
| 10 | IMAP-vs-Graph parity of the same corpus | deferred: the two mailboxes are on different providers (Gmail can't speak Graph; the M365 box has no basic-auth IMAP), so per-family coverage is the achievable form — noted as a deviation from the playbook's cross-family ideal |

## Witnesses
- In-bot: `get-emails-graph` reads back what `send-email-graph` wrote — same
  plugin but different Graph endpoints (`/sendMail` vs `/messages`), and the
  body/subject/sender pins are compared against authored literals.
- Out-of-band: no harness mail reader exists (the email playbook explicitly
  plans none). The `$stepOut emailCount` values used by the purge predictions
  come from *server-side* `$filter` counts, which is the strongest external
  witness available here — Graph itself reports zero session messages remain.
- Probe calibration: pred-calibration — the unfiltered Inbox fetch must see
  real mail (`emailCount > 0`) before "zero session matches" can mean anything.

## Expected values derived from
First principles: the subjects/bodies are authored literals; the sender is the
UPN configured on the connection; zero-after-purge is the definition of a
successful delete. Not derived from runner code.

## Known gaps / notes
- **PRODUCT CONTRACT (the key Graph-vs-IMAP difference):** `get-emails-graph`
  `$select`s `body,bodyPreview` and **does** return message bodies, so body
  fidelity is assertable here (pred-plain-body / pred-html-body).
  `get-emails-imap` is envelope-only and returns an **empty** body — see the
  `imap-roundtrip` review. This asymmetry is a real behavioral difference
  between the two families and is now pinned on both sides.
- **Custom mail folders are addressed by ID, not display name.** Only the
  well-known names (Inbox, Archive, SentItems, DeletedItems, …) resolve as
  names; a custom folder needs its Graph id (or the picker's
  `Display Name ||| id` form). Passing `"sgt-bulk"` as a folder name silently
  no-ops the move (the step still passes with `ignoreErrors`) — that is how
  the first authoring run left two messages behind. The fixture therefore
  takes the id from `SGT_MAIL_GRAPH_BULK_FOLDER_ID`
  (→ `{var:mailGraphBulkFolderId}`), which keeps it portable across mailboxes.
  **FINDING:** a bad folder ref producing a silent no-op rather than an error
  is worth a product ruling (logged in the internal product backlog).
- `$stepOut emailCount` is a **string** (`"0"`, `"2"`), not a number — the
  runner does `setStepVariable(prefix, "emailCount", String(...))`. The DSL is
  type-strict, so the predictions compare against strings.

- 2026-07-13 svar conversion: infra references now flow through `{svar:sgt…}` shared variables (customer-configurable; harness seeds the same names from SGT_* env) with a require-shared-vars preflight gate. Witnesses and prediction values unchanged.

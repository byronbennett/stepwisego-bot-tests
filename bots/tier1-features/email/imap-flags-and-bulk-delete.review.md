# tier1-features/email/imap-flags-and-bulk-delete

> **Status: 12 of 13 predictions green; `pred-bulk-empty-after` is RED ON PURPOSE.**
> It encodes the *correct* behavior of `delete-emails-imap`, which today reports
> `deletedCount=N` while deleting nothing (or the wrong messages). Root cause,
> live repro and the one-line fix: **Known gaps #1**. Playbook §7.2 — a found
> defect is a campaign success, and the triple stays committed as the regression
> guard until the runner is fixed. (Note: `kind: "human-approve"` does **not**
> exempt a prediction from the gate in the current verifier — every prediction is
> evaluated the same. The only way to make this green without fixing the product
> would be to assert the buggy behavior as expected, which is not done here
> without Byron's explicit ruling.)

## Target
`delete-emails-imap` (action under test) plus the read-flag surface of
`get-emails-imap` (`markAsRead`, `unreadOnly`, `isRead`) and
`move-single-email-imap` used on two messages, against the live Gmail test
mailbox. Arc: send TWO session-marked messages → bounded poll until both are
visible → `unreadOnly=true` sees both (they are unread) → move both INBOX →
`sgt-bulk` → calibrate `unreadOnly` *inside* `sgt-bulk` → `markAsRead=true` fetch
of `sgt-bulk` → `unreadOnly=true` re-fetch returns nothing (the `\Seen` flag was
really written) → `delete-emails-imap(folder=sgt-bulk)` → re-fetch `sgt-bulk` and
assert it is empty → self-healing cleanup.

**SAFETY (hard rule, encoded in the bot):**
- `delete-emails-imap` is folder-scoped with **no subject filter** — it destroys
  *everything* in the folder it is given. It is pointed at `sgt-bulk` and
  **never** at INBOX, which holds the standing `[sgt-calibration]` /
  `[sgt-fixture-qp]` / `[sgt-fixture-b64]` messages the other email triples
  depend on. Every INBOX-side delete in this bot is a *targeted*
  `delete-single-email-imap` driven by a live `{s*:loopItem}` step token.
- `markAsRead=true` has the same shape of blast radius (it flips `\Seen` on
  every message the fetch returns, and there is no filter), so the flag flip is
  performed **inside `sgt-bulk`**, after the two session messages have been moved
  there. INBOX is only ever *read* with `markAsRead=false`. This is why the flag
  phase sits after the move rather than before it.

## Permutation matrix
| # | Permutation | Covered by | Check id / prediction id |
|---|---|---|---|
| 1 | two session-marked messages delivered; both visible to IMAP within the poll budget | this triple | pred-both-delivered |
| 2 | `markAsRead=false` (default) leaves messages unread (`isRead=false`) | this triple | pred-unread-on-arrival |
| 3 | `unreadOnly=true` returns the unread session messages, each reporting `isRead=false` | this triple | pred-unreadonly-sees-unread |
| 4 | `markAsRead=true` returns the messages **and** writes `\Seen`, so a subsequent `unreadOnly=true` fetch no longer returns them | this triple | pred-bulk-unread-calibrated / pred-markasread-fetch / pred-seen-flag-written |
| 5 | bulk staging: `move-single-email-imap` inside the scan loop, applied to two messages, INBOX → `sgt-bulk` | this triple | pred-moved-to-bulk / pred-bulk-staged |
| 6 | `delete-emails-imap(folder=sgt-bulk)` reports its `deletedCount` step output | this triple | pred-bulk-delete-reports |
| 7 | `delete-emails-imap` really removes every message in the folder (folder-scoped, unfiltered) | this triple — **RED, product bug** | pred-bulk-empty-after |
| 8 | `delete-emails-imap` with `unreadOnly=true` / `maxEmails=N` sub-filters | deferred: the same `search()` call is the root of the bug in #7 — these variants cannot be meaningfully asserted until it is fixed (and `unreadOnly` there would inherit the identical seq-vs-UID defect) | — |
| 9 | `delete-emails-imap` on an empty folder (pass, `deletedCount=0`) | deferred → `email/imap-error-paths` (error/edge permutations are batched per the playbook) | — |
| 10 | wrong password / dead host error paths | deferred → `email/imap-error-paths` | — |
| 11 | Graph-family parity (`delete-emails-graph`) | deferred: Graph family is covered by the `graph-*` triples as the M365 blocker clears | — |
| 12 | `markAsRead=true` against INBOX (i.e. with standing mail in the fetch window) | deferred **on purpose**: unfilterable blast radius — it would flip `\Seen` on the standing calibration/fixture messages and on other tracks' mail in the shared box | — |

## Witnesses
- **In-bot, cross-protocol:** SMTP (nodemailer) writes both messages, IMAP
  (imapflow) reads them back — the category's sanctioned dual-witness (there is
  no FP-4-style harness mail reader for email).
- **Cross-folder:** the moves are witnessed from both ends — both messages
  present in `sgt-bulk` (pred-bulk-staged, a fresh fetch of a different mailbox)
  and zero session messages left in INBOX (pred-inbox-left-clean).
- **Flag state, three independent readings:** `|isRead` on the fetched object
  (pred-unread-on-arrival), server-side `UNSEEN` search before the flip
  (pred-bulk-unread-calibrated), and the same search after the flip returning
  nothing (pred-seen-flag-written). The flag is therefore proven to live on the
  server, not just in the fetched DTO.
- **Action-vs-reality:** `delete-emails-imap`'s own `deletedCount` step output
  (pred-bulk-delete-reports, green) is deliberately checked *against* an
  independent re-fetch of the folder (pred-bulk-empty-after, red). The pair is
  what makes the "reports success, does nothing" signature legible: the action
  claims 2, the mailbox still holds 2.
- **Probe calibration (ARRANGE):** the fetcher must see the standing
  `[sgt-calibration]` message before any zero-match claim counts
  (pred-calibration). The `unreadOnly` filter is calibrated *positively* — first
  in INBOX, then again inside `sgt-bulk` immediately before the flip — so every
  later absence claim about it is meaningful.

## Expected values derived from
First principles + the IMAP RFC contract, not the runner source:
- A never-opened message carries no `\Seen` flag → `isRead=false`, and it must
  appear in an `UNSEEN` search. Setting `\Seen` must remove it from that search.
- `delete-emails-imap` is a folder-scoped delete with no filter → after it runs,
  the folder must hold zero messages. Two messages moved in, two must die, zero
  must remain; the action's reported `deletedCount` and an independent re-fetch
  must agree. The entire point of this triple is that they currently do not.
- Move semantics: IMAP `MOVE` is atomic copy+delete → the two messages must be in
  `sgt-bulk` and out of INBOX.

## Known gaps / notes

### 1. PRODUCT BUG — FOUND AND FIXED IN THIS TRACK — `delete-emails-imap` deleted nothing (or the WRONG messages) and reported success
`pred-bulk-empty-after` was authored RED against the broken runner and is now GREEN against the fix; it stands as the regression guard.

`packages/shared/src/plugins/email/runners/delete-emails-imap.runner.ts`:

```ts
const result = await client.search({ all: true });   // ← imapflow returns SEQUENCE numbers
uids = Array.isArray(result) ? result : [];
const uidRange = toDelete.join(",");
await client.messageFlagsAdd(uidRange, ["\\Deleted"], { uid: true });  // ← reads the range as UIDs
await client.messageDelete(uidRange, { uid: true });                   // ← same
deletedCount = toDelete.length;                                        // ← reported regardless
```

`ImapFlow.search()` returns **sequence numbers** unless called as
`search(query, { uid: true })`. The flag/delete calls are told `{ uid: true }`,
so they read that same list as **UIDs**. The two agree only while a folder's UIDs
still equal its sequence numbers — i.e. on a never-used folder. As soon as
`UIDNEXT` has drifted (after any prior delete/move), the action targets UIDs
belonging to *other messages, or to nothing at all*, and still reports
`deletedCount = <matches found>`.

Live repro against the test box (`sgt-bulk`, two messages, UIDs already drifted):

```
search({all:true})             = [1,2]     <-- sequence numbers (what the runner uses)
search({all:true}, {uid:true}) = [5,6]     <-- the actual UIDs
messageFlagsAdd("1,2", ["\Deleted"], {uid:true}) -> true      (no error!)
messageDelete("1,2",   {uid:true})               -> true      (no error!)
==> runner reports deletedCount = 2
==> messages actually remaining in sgt-bulk: 2  (uid 5, uid 6 — untouched)
==> after the CORRECT uid-based delete, sgt-bulk holds 0 messages
```

That is also why this triple passed on the very first run against a virgin
`sgt-bulk` (its two messages landed on UID 1,2 = seq 1,2 by coincidence) and has
been red on every run since. The failure mode is not merely a silent no-op:
**in a folder whose UID range overlaps its sequence range, it deletes the wrong
messages** — data-loss-grade.

Fix APPLIED in this track (one line, plus the same in the `unreadOnly` branch):

```ts
const result = await client.search({ all: true }, { uid: true });
const result = await client.search({ seen: false }, { uid: true });
```

Note the *fetch* path in `get-emails-imap.runner.ts` is accidentally safe:
`client.fetch(range, query)` takes no options argument there, so its range is
(correctly) treated as sequence numbers.

### 2. FIXED WHILE THIS TRIPLE WAS BEING AUTHORED — `get-emails-imap` + `markAsRead=true` used to deadlock
The runner used to call `client.messageFlagsAdd(...)` from *inside* the
`for await (const msg of client.fetch(...))` iterator. ImapFlow serializes
commands on one connection, so that command could never run: the step hung until
imapflow's 300 s socket timeout, and then the `ImapFlow` `'error'` event —
unhandled, see #3 — killed the **whole process**. It was found by this triple
(the first drafts crashed the probe) and fixed in
`get-emails-imap.runner.ts` (collect the fetched messages in phase 1, apply
`\Seen` / download attachments in phase 2). Permutation #4 above is the
regression guard for that fix: if anyone reintroduces an IMAP command inside a
fetch iterator, this triple hangs and then fails.

### 3. PRODUCT GAP — FOUND AND FIXED IN THIS TRACK — `createImapClient` never attached an `'error'` listener
`packages/shared/src/plugins/email/utils/imap-client.ts` constructs `ImapFlow`
and never does `client.on("error", …)`. Any transient IMAP socket error is
therefore an unhandled `'error'` event on an EventEmitter = **process death**,
not a failed step — every IMAP action in the plugin inherits this. That is what
turned bug #2 from "slow step" into "the Agent dies".
**Fixed:** `createImapClient` now attaches a no-op `'error'` listener — the
in-flight command still rejects and the runner's try/catch turns that into a
failed step, but the emitter no longer kills the process. Not asserted here (a
test that deliberately crashes the runner is a hostile gate citizen).

### 4. Notes
- `get-emails-imap` fetches `"1:*"` and stops after `maxEmails` (50) — the OLDEST
  50, not the newest. ~17 messages in the box today; once it grows past 50, every
  email triple stops seeing freshly delivered mail. Mailbox hygiene (or a
  `maxEmails` bump) is the mitigation.
- CLEANUP is self-healing (`ignoreErrors: true`): targeted
  `delete-single-email-imap` sweeps of any session-marked leftovers in INBOX
  *and* `sgt-bulk`. That sweep is also what keeps the box deterministic despite
  bug #1 — the bulk delete's no-op leaves the two messages behind and the
  targeted sweep removes them, so the triple behaves identically run to run.
- `serialGroup: "mail-gmail"` — subject markers isolate concurrent sessions,
  Gmail's rate limits do not. Observed end-to-end: ~29 s.
- Audit-CSV pattern intentionally omitted, matching the sibling live-service
  triples; the predictions carry all checks.

- 2026-07-13 svar conversion: infra references now flow through `{svar:sgt…}` shared variables (customer-configurable; harness seeds the same names from SGT_* env) with a require-shared-vars preflight gate. Witnesses and prediction values unchanged.

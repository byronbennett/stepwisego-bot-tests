# tier2-shapes/int-10-email-driven-file-processing

## Target
The INT-10 chain from the scenario catalog: send an email with a CSV
attachment (session-marked) → fetch → save the attachment to scratch →
`csv-read` → DataTable → loop → aggregate → `write-to-log` + summary file.
Live Gmail test mailbox; no DB.

## The chain, and what each seam pins
| Seam | Pinned by |
|---|---|
| authored CSV → SMTP attachment | `pred-bytes-exact` (base64 of the file handed to SMTP) |
| SMTP → IMAP → saved attachment | `pred-delivered`, `pred-bytes-exact` |
| saved attachment → `csv-read` → DataTable | `pred-parsed-rows` (3 data rows) |
| DataTable → loop aggregate | `pred-aggregate` (hand-computed total) |
| aggregate → summary file on disk | `pred-summary-file` (out-of-band file read) |
| mailbox hygiene | `pred-mailbox-clean` |

## Source CSV (authored in ARRANGE)
```
id,customer,amount
1,Acme,100.25
2,Ünïcødé 漢字,200.50
3,"Comma, Inc.",99.25
```
Unicode in a value, and a quoted field containing a comma — so a naive splitter
would produce 4 columns on row 3 and the parsed-row/aggregate assertions would
both go red.

## Witnesses
- **Out-of-band:** the harness reads the summary file directly off disk
  (`read_value`) — the aggregate is not taken on the bot's word.
- **Cross-protocol:** SMTP writes, IMAP reads (the email playbook's designated
  dual-witness for this category).
- **Byte fidelity:** base64 of the sent file vs base64 of the downloaded
  attachment, compared in-bot (no hash action exists in the product; byte-exact
  base64 comparison is the equivalent evidence).
- The aggregate is computed from the **downloaded** attachment, not the local
  original — so a corrupted attachment would surface as a wrong total, not just
  a byte mismatch.

## Expected values derived from
Hand computation: `100.25 + 200.50 + 99.25 = 400.00`. The engine's exact-decimal
arithmetic renders the sum as the string `"400"`, which is what the prediction
pins (the value is exact; only the rendering is being observed).

## Known gaps / notes
- **The DataTable loop publishes columns as `{prefix}-currentDataRow:<col>`**,
  not `{prefix}:<col>` — `{sag:amount}` silently resolves to nothing (an
  unknown token is a no-op passthrough, so the aggregate came out `0` with no
  error). The correct token is `{sag-currentDataRow:amount}`.
- **This triple depends on the `get-emails-imap` deadlock fix shipped in this
  track**: `downloadAttachments: true` used to hang forever (the runner issued
  `downloadMany` from inside the open `fetch()` iterator, and imapflow
  serializes commands per connection). The hang was un-cancellable and would
  wedge the whole gate run rather than fail one test. This scenario now guards
  that fix.
- The session message is deleted at the match point inside the scan loop; the
  CLEANUP loop is the self-healing backstop and legitimately finds zero
  (`pred-mailbox-clean`).

- 2026-07-13 svar conversion: infra references now flow through `{svar:sgt…}` shared variables (customer-configurable; harness seeds the same names from SGT_* env) with a require-shared-vars preflight gate. Witnesses and prediction values unchanged.

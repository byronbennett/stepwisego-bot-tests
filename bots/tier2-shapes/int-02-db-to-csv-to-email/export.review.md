# tier2-shapes/int-02-db-to-csv-to-email

## Target
The INT-02 chain from the scenario catalog: seed table → `db-sql-query` SELECT
→ `resultDT` → `csv-write-datatable` → `write-to-file` → `send-email` with the
CSV attached → fetch back through the **other protocol family** → attachment
content compared. Live PostgreSQL (Neon, `{var:devDbPg}`) + the live Gmail test
mailbox.

## The chain, and what each seam pins
| Seam | Pinned by |
|---|---|
| DB → DataTable | `pred-db-row-count` (harness reads the seeded table directly) |
| DataTable → CSV text | `pred-csv-decimal-and-date`, `pred-csv-unicode-and-quoting` (out-of-band read of the written file) |
| CSV file → SMTP attachment | `pred-bytes-exact` (base64 of the file handed to SMTP) |
| SMTP → IMAP → downloaded attachment | `pred-delivered`, `pred-attachment-count`, `pred-bytes-exact` |
| mailbox hygiene | `pred-mailbox-clean` |

## Fidelity corpus (seeded in ARRANGE)
Three rows chosen to break naive serialization:

| id | customer | amount | when_dt | note |
|---|---|---|---|---|
| 1 | `Acme` | `1234.56` | `2028-02-29` (leap day) | `plain` |
| 2 | `Ünïcødé 漢字` | `0.10` (trailing-zero decimal) | `2026-12-31` (year boundary) | **NULL** |
| 3 | `Comma, Inc.` | `-42.05` (negative) | `2026-01-01` | text with `"quotes"` and a comma |

## Witnesses
- **Out-of-band (dual-witness rule):** the harness reads the Postgres table
  *directly* (`count_rows_in`) and reads the exported CSV *directly* off disk
  (`read_value`) — neither goes through the bot.
- **Cross-protocol:** the CSV is written by SMTP (nodemailer) and read back by
  IMAP (imapflow) — two independent stacks, which is what the email playbook
  designates as the dual-witness for this category.
- **Byte fidelity:** base64 of the file handed to SMTP is compared in-bot,
  character-for-character, against base64 of the file the IMAP fetch downloaded.
  (No hash action/pipe function exists in the product, so byte-exact base64
  comparison is the equivalent evidence.)

## Expected values derived from
Hand-authored seed values (the table above) and the CSV quoting rules
(RFC 4180: a field containing a comma or quote is quoted). Not derived from
runner code. **`2026-02-29` was my first draft's leap day and it does not
exist** — 2026 is not a leap year; Postgres rejected it. The corpus uses
`2028-02-29`.

## Known gaps / notes
- **Teardown is the envelope's job, not the bot's.** The harness reaps
  `envelope.ephemeralDbTables` *after* predictions evaluate, so the bot must
  NOT drop its own table — an in-bot `DROP` in CLEANUP makes the out-of-band DB
  witness fail with "relation does not exist". The table name therefore keeps
  its dashes (a quoted identifier), because the prediction DSL expands
  `{var:_sgtSessionId}` in a table ref but cannot apply pipe functions like
  `|replace`.
- **This triple depends on the `get-emails-imap` deadlock fix shipped in this
  track** (attachment download used to hang forever — the runner issued
  `downloadMany` from inside the open `fetch()` iterator). Before that fix this
  scenario could not be written at all; it now guards the fix.
- NULL trichotomy at the CSV seam (DB NULL → DataTable null → CSV empty field)
  is exercised by row 2 but asserted only through the whole-file contains-checks
  — a dedicated empty-field pin belongs in the csv-datatable category triples.

- 2026-07-13 svar conversion: infra references now flow through `{svar:sgt…}` shared variables (customer-configurable; harness seeds the same names from SGT_* env) with a require-shared-vars preflight gate. Witnesses and prediction values unchanged.

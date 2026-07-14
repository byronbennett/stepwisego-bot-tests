# tier1-features/database/odbc-roundtrip

## Target

The ODBC trio — `db-sql-modify-odbc`, `db-sql-select-odbc`,
`db-stored-proc-odbc` — against the dev SQL Express VM through the real
unixODBC + msodbcsql18 stack (installed by
`packages/db-drivers/scripts/install-odbc-drivers.sh`).

FP-3 gated on `SGT_DEV_ODBC_CONNECTION_MSSQL` (raw ODBC connection string,
injected by the harness as the `odbcConnMssql` TEXT parm — Track 6 harness
extension) AND `SGT_DEV_DB_CONNECTION` (the non-ODBC reader connection used
for the out-of-band witness).

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | modify: DDL (DROP/CREATE TABLE, CREATE/DROP PROCEDURE) | this triple | arrange/cleanup steps all pass (expectComplete) |
| 2 | modify: INSERT with positional `?` binds (Int + NVarChar) | this triple | insert-bound-affected, oob-cell-bound-insert |
| 3 | modify: plain multi-row INSERT, affectedRows=2 | this triple | insert-plain-affected |
| 4 | select: `?` bind in WHERE, resultDT + rowCount outputs | this triple | select-bound-rowcount |
| 5 | stored proc: `{CALL schema.proc (?)}` with bind, recordset outputs | this triple | storedproc-rowcount |
| 6 | select failure: bad object name → runtime error with friendly prefix | this triple | buried step 9 + smoke expectErrorCount=0 |
| 7 | Output/InputOutput parameter directions | deferred: node-odbc binds output params via a different callProcedure path; needs its own fixture | — |
| 8 | non-SQL-Server ODBC DSNs | deferred: only the MSSQL driver is installed on this Mac | — |

## Witnesses

- In-bot: `db-sql-select-odbc` and `db-stored-proc-odbc` read back what
  `db-sql-modify-odbc` wrote — three different actions cross-checking.
- Out-of-band: harness `read_cell`/`count_rows_in` go through the
  **non-ODBC** dev reader (mssql driver), so ODBC writes are verified by an
  entirely independent client stack.

## Envelope / cleanup

- ODBC SQL text is NOT token-resolved by design (see the action's
  description), so the table/proc names are FIXED (`sgtester.sgt_t6_odbc`,
  `sgtester.sgt_t6_odbc_top`) — this fixture must not run concurrently with
  itself. DROP-first arrange steps make reruns idempotent after aborted runs.
- The proc is dropped in-bot (the reaper only handles tables); the table is
  registered in `envelope.ephemeralDbTables` and reaped after predictions.

## Expected values derived from

Runner sources (`db-*-odbc.runner.ts`, `packages/db-drivers/src/odbc.ts`):
positional binds resolve via `context.resolveTokens` per value; affectedRows
from odbc `count`; stored-proc rowCount from the returned recordset. Probe
reproduced affectedRows 1/2, both rowCounts=2, and resultDT
[[2,"Bob"],[3,"Cara"]] for select and proc.

## Known gaps / notes

- `db-stored-proc-odbc` reported `affectedRows: -1` with SET NOCOUNT ON —
  expected (no count reported); not asserted.
- Requires system ODBC driver — on a machine without msodbcsql18 the actions
  fail with the install-script hint (`friendlyOdbcError`); the FP-3 env gate
  keeps unconfigured machines at *skipped*, not failed.

- 2026-07-13 svar conversion: infra references now flow through `{svar:sgt…}` shared variables (customer-configurable; harness seeds the same names from SGT_* env) with a require-shared-vars preflight gate. Witnesses and prediction values unchanged.

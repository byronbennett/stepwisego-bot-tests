# INT-11 — vault-and-global-variable-flow

**Catalog:** `docs/testing/regression-suite/integration-scenarios.md` § INT-11
**Chain:** `{gbl-var:}` and `{svar:}` resolved into a rest-call bearer header, a
DB marker column, a file path segment, and an audit CSV row; secure-text
masking on write-to-log (agent CSV) and audit.csv (string-absence).
**Needs:** `SGT_DEV_DB_CONNECTION`; harness `sharedVarSeeds` for `{svar:}`.
**Playbooks:** logic-variables, engine-patterns, rest-connectors.

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|-------------|------------|----------|
| 1 | {gbl-var:} → rest-call bearer → echo auth header | this triple | gbl-var-rest-bearer |
| 2 | {gbl-var:} → db-sql-query INSERT + SELECT marker | this triple | gbl-var-db-select, oob-db-marker |
| 3 | {svar:} → create-folder + write-to-file path segment | this triple | svar-file-path |
| 4 | {gbl-var:} + {svar:} → audit.csv safe row | this triple | audit-row-safe-fields |
| 5 | secureText bot parm → write-to-log masking | this triple | secret-absent-from-agent-csv |
| 6 | secureText absent from audit.csv | this triple | secret-absent-from-audit-csv |
| 7 | {vlt-var:} cloud vault consumption | deferred — needs test-org vault fixture | — |

## Witnesses

- **In-bot:** rest-call body (`$var:authEcho`), SELECT `rowCount` (`$stepOut`).
- **Out-of-band:** `read_cell` on session table; `read_value` on marker file and
  audit.csv; agent-events.csv harvest (agent engine only).

## Harness notes (Track 11)

- `envelope.sharedVarSeeds` writes encrypted `.svar.json` files under the
  agent's `STEPWISE_DATA_DIR/shared-vars/` and injects `sharedParms` for the
  in-process engine. Password is the fixed harness constant — never the
  developer's keychain entry.
- `envelope.exclusive: true` because the agent reads shared vars from the
  per-run data dir (isolated), but the flag documents machine-store semantics.
- `{vlt-var:}` leg deferred; manifest `token:vlt-var` stays `deferred`.

## Deliberate scope cuts

- No missing-vault-key failure variant (would need cloud vault fixture).
- In-process write-to-log masking is covered by `secret-masking.test.ts`; this
  triple pins agent CSV absence via `agent-events.csv` when present.

- 2026-07-13 svar conversion: infra references now flow through `{svar:sgt…}` shared variables (customer-configurable; harness seeds the same names from SGT_* env) with a require-shared-vars preflight gate. Witnesses and prediction values unchanged.

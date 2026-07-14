# update-where

**Tier:** 1 (feature)
**Targets:** `db-sql-query`
**Pattern:** create ephemeral table → seed 3 rows → SELECT pre-update → UPDATE → SELECT post-update → drop

## Logic

1. Create `sgtester.{var:_sgtSessionId}_orders(id, customer, amount)`
2. Insert 3 rows: (1,'Alice',10.00), (2,'Bob',20.00), (3,'Cara',30.00)
3. SELECT amount WHERE id = 2 (pre-update read)
4. UPDATE amount = 99.99 WHERE id = 2
5. SELECT amount WHERE id = 2 (post-update read)
6. Drop the ephemeral table

## Predictions

- `pred-pre-update-rowcount` (round-trip): Pre-UPDATE SELECT returns 1 row.
- `pred-post-update-rowcount` (round-trip): Post-UPDATE SELECT still returns 1 row (UPDATE did not accidentally remove rows).

## Baseline

Not yet captured. To be added on first green CI run.

## Phase 1 coverage gap

These predictions confirm UPDATE preserved row count but do not verify the cell value
actually changed (a no-op UPDATE would still pass). Verifying the actual updated value
requires either (a) a richer DSL that compares `resultDT` shape (`{ columns, rows }`)
to a literal — currently blocked by plain-object-as-literal not being supported by the
DSL evaluator — or (b) restructuring the bot to leave the table in place so the
verifier-side reader can check the cell. Both options are follow-up work.

- 2026-07-13 svar conversion: infra references now flow through `{svar:sgt…}` shared variables (customer-configurable; harness seeds the same names from SGT_* env) with a require-shared-vars preflight gate. Witnesses and prediction values unchanged.

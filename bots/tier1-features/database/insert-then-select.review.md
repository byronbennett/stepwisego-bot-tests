# insert-then-select

**Tier:** 1 (feature)
**Targets:** `db-sql-query`
**Pattern:** create ephemeral table → seed 3 rows → SELECT WHERE id=2 → drop

## Logic

1. Create `sgtester.{var:_sgtSessionId}_orders(id, customer, amount)`
2. Insert 3 rows: (1,'Alice',10.00), (2,'Bob',20.00), (3,'Cara',30.00)
3. SELECT id, customer WHERE id = 2 (expects 1 row returned)
4. Drop the ephemeral table

## Predictions

- `pred-rowcount-equals-1` (round-trip): SELECT WHERE id=2 step's `rowCount` output equals 1.

## Baseline

Not yet captured. To be added on first green CI run.

## Notes

Tier 1, exercises `db-sql-query` SELECT WHERE clause; predicts rowCount = 1.
Hand-authored test verifying filtered SELECT returns the correct single row.

- 2026-07-13 svar conversion: infra references now flow through `{svar:sgt…}` shared variables (customer-configurable; harness seeds the same names from SGT_* env) with a require-shared-vars preflight gate. Witnesses and prediction values unchanged.

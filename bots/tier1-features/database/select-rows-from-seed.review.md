# select-rows-from-seed

**Tier:** 1 (feature)
**Targets:** `db-sql-query`
**Pattern:** create ephemeral table → seed 3 rows → SELECT → drop

## Logic

1. Create `sgtester.{var:_sgtSessionId}_orders(id, customer, amount)`
2. Insert 3 rows: (1,'Alice',10.00), (2,'Bob',20.00), (3,'Cara',30.00)
3. SELECT all rows ordered by id
4. Drop the ephemeral table

## Predictions

- `pred-final-table-rowcount` (round-trip): SELECT step's `rowCount` output equals 3.

## Baseline

Not yet captured. To be added on first green CI run.

## Notes

This test is **hand-authored** as the verifier's first proof of concept. It exercises the `db-sql-query` action's `non-query` and `select` modes. Once the synthesizer ships, this test can be regenerated to use richer round-trip patterns (e.g., `count_rows_in` against the live table before drop).

- 2026-07-13 svar conversion: infra references now flow through `{svar:sgt…}` shared variables (customer-configurable; harness seeds the same names from SGT_* env) with a require-shared-vars preflight gate. Witnesses and prediction values unchanged.

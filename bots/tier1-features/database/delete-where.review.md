# delete-where

**Tier:** 1 (feature)
**Targets:** `db-sql-query`
**Pattern:** create ephemeral table → seed 3 rows → COUNT pre-delete → DELETE → COUNT post-delete → drop

## Logic

1. Create `sgtester.{var:_sgtSessionId}_orders(id, customer, amount)`
2. Insert 3 rows: (1,'Alice',10.00), (2,'Bob',20.00), (3,'Cara',30.00)
3. SELECT count(*) AS n (pre-delete — should return rowCount = 3)
4. DELETE WHERE id = 1
5. SELECT count(*) AS n (post-delete — should return rowCount = 2)
6. Drop the ephemeral table

## Predictions

Two predictions, both round-trip:
- `pred-pre-count` (round-trip): Pre-DELETE SELECT count step's `rowCount` output equals 3.
- `pred-post-count` (round-trip): Post-DELETE SELECT count step's `rowCount` output equals 2.

## Baseline

Not yet captured. To be added on first green CI run.

## Notes

The two-prediction approach validates both the initial state (3 rows seeded correctly) and the post-DELETE state (1 row removed). This makes the test self-verifying without any external DB reads from the verifier. Both predictions use `rowCount` from the `select` query type, which is the count of rows returned by the SELECT (here always 1 row from count(*), not the count(*) value itself). If rowCount != 1 for either SELECT, the count(*) aggregation did not return exactly one result row — that would indicate a query error.

Note: `rowCount` here refers to the number of rows in the result set (always 1 for count(*)), not the value of the `n` column. The actual count value is in `resultDataTable`. These predictions are valid as long as the count(*) query returns exactly 1 result row, which it always does.

- 2026-07-13 svar conversion: infra references now flow through `{svar:sgt…}` shared variables (customer-configurable; harness seeds the same names from SGT_* env) with a require-shared-vars preflight gate. Witnesses and prediction values unchanged.

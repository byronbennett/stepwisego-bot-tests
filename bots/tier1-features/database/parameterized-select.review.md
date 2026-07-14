# parameterized-select — DEFERRED for Phase 1

This test was scheduled to exercise `db-sql-query`'s parameterized query path
(via the `params` clause of `queryConfig`). The action's parameterized form is
not trivial to invoke from a hand-authored .sgbot — the queryConfig schema
requires the same shape the visual query builder editor produces, including
parameter type binding metadata.

The test will be authored in Phase 3 by the synthesizer, which can ground
the queryConfig shape against the real action definition automatically.

## Phase 1 coverage gap

Parameterized SELECTs are not exercised by the four other tests in this
directory; that's a known gap.

# INT-14 — runfrom facet

See `full.review.md` in this directory — the three INT-14 run-scope triples share one review (identical step tree; only the run scope differs). The facet table there covers this triple's expected subset and predictions.

- 2026-07-13 svar conversion: infra references now flow through `{svar:sgt…}` shared variables (customer-configurable; harness seeds the same names from SGT_* env) with a require-shared-vars preflight gate. Witnesses and prediction values unchanged.

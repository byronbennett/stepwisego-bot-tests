# tier1-features/sharepoint/select-projection-and-download

## Target
`sp-select-items` projection/filter branches (the 3-bucket `$select` model)
plus `sp-download-list` raw-JSON mode, on a session list
(`sgt-{var:_sgtSessionId}-proj`, harness-reaped) seeded with three rows
covering set / empty-string / never-set states.

## Product bug this triple guards (found live in Track 15, fixed)
**sp-download-list all-fields mode blew IIS's maxQueryStringLength** — it
`$select`-ed every schema field (100+ on a real list, system noise included)
and SharePoint answers an over-long query string with a bare 401. The
runner now excludes `SP_SYSTEM_FIELDS` from the all-fields enumeration.
pred-download-full is the regression witness.

## Permutation matrix
| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | subset projection: ID prepended, exact column set, all rows | this triple | pred-subset-projection |
| 2 | all-fields select (no $select narrowing) | this triple | pred-all-fields |
| 3 | system-field projection (ID position honored, Modified computed) | this triple | pred-system-fields |
| 4 | numeric gt filter | this triple | pred-filter-gt |
| 5 | isNull on Number matches only the never-set row | this triple | pred-filter-isnull |
| 6 | zero-match filter → 0-row DT that keeps its columns | this triple | pred-zero-match-keeps-columns |
| 7 | download-list raw JSON: one object per item | this triple | pred-download-full |
| 8 | download-list maxItems cap | this triple | pred-download-capped |
| 9 | isEmpty/isNotEmpty vs isNull distinction | deferred: needs the pinned rendering decision for `""`-text (raw payload drops it — see the lifecycle triple's trichotomy) — a dedicated leg once the product ruling on empty-string round-tripping lands |
| 10 | orderBy + first-row integrity | deferred: needs a loop-capture leg; kept out to hold the triple at 4 actions |
| 11 | pagination >5000 items | deferred per playbook: standing large list not yet seeded (slow-tagged triple) |
| 12 | display names with spaces/unicode (`_x0020_` internal names) | deferred to the field-naming leg of the dates/standing-types work |
| 13 | download-list nested Person/Lookup objects | deferred: roster has no Person/Lookup (see lifecycle triple #8) |

## Witnesses
Projection/filter pins are $stepOut (rowCount / columns listOfTexts) — the
select IS the reader under test; download pins use `size_of($var)` on the
raw JSON arrays. The seeded rows' raw state is witnessed by the lifecycle
triple's Graph reads; this triple focuses on the query surface.

- 2026-07-13 svar conversion: infra references now flow through `{svar:sgt…}` shared variables (customer-configurable; harness seeds the same names from SGT_* env) with a require-shared-vars preflight gate. Witnesses and prediction values unchanged.

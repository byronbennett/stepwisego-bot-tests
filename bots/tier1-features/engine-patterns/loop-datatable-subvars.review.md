# tier1-features/engine-patterns/loop-datatable-subvars

## Target

Row-iterating loops and their column sub-variables — the `subvar:sa-col`
manifest pattern (the "Loop on Rows in DataTable updates column variables
each iteration" behavior the master spec's flagship integration scenario
depends on) — plus `json-parse` and `json-to-datatable` as arrange steps.

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | dataTable loop: {prefix-currentDataRow:col} per-iteration update | this triple | datatable-column-subvars |
| 2 | value fidelity through the seam (string "10.50" keeps trailing zero) | this triple | datatable-column-subvars |
| 3 | json-to-datatable union-mode column derivation + row order | this triple (indirectly via crumbs — see notes) | datatable-column-subvars |
| 4 | csv loop from variable content, hasHeaders=true | this triple | csv-column-subvars |
| 5 | csv headers step-output variable | this triple | csv-headers-output |
| 6 | csv from FILE path, delimiters, dynamic typing modes | deferred: csv-datatable Tier 1 campaign | — |
| 7 | dataTable loop from a step-output token ({sq:resultDT}) | covered elsewhere: database live-matrix triples | — |
| 8 | nulls/blanks/dates through SharePoint→DataTable→columns | deferred: Tier 2 INT-01 (blocked on Graph credentials) | — |

## Witnesses

- In-bot: crumbs concatenate multiple column sub-variables per iteration, so
  a stale (non-updating) column variable produces a repeated value and fails
  the order-exact check.
- Out-of-band: csv headers checked via `$stepOut` on the loop step; the
  DataTable's content/order is pinned through the crumbs (a wrongly built
  table cannot produce the exact expected crumb list).

## Expected values derived from

Source JSON/CSV literals in the bot (strings chosen so no numeric
reformatting is possible), `json-to-datatable` union-mode docs, loop action
outputVariables docs (currentDataRow with column children, headers).
Explicit `stepPrefix` (`sld`, `slv`) per the loop action's documented
authoring-trap guidance.

## Known gaps / notes

- Amounts are deliberately JSON strings ("10.50") to pin verbatim carriage;
  numeric-typed fidelity (lossless >2^53 etc.) is covered by the exact
  numerics campaign, not here.
- Prediction-DSL limitation (discovered here): object literals are not valid
  DSL expressions — only null/string/number/boolean/array. A direct
  deep-equal on the `dt` parm's {columns, rows} object is therefore not
  expressible today; candidate FP follow-up if table-shape assertions are
  needed elsewhere.

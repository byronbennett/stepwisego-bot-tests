# tier1-features/datatable/dt-core

## Target

`dt-get-column-names`, `dt-get-row-count`, `dt-get-value`, `dt-get-row`,
`dt-select-rows`, `dt-to-html` — the untested DataTable surface (`dt-to-csv`
lives in csv/csv-file-roundtrip; `csv-read`/`csv-write-datatable`/
`json-stringify` appear as builders/witnesses, asserted in their own
categories). One triple over one dynamically-typed table.

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | get-column-names in order | this triple | column-names |
| 2 | get-row-count returns a number | this triple | row-count-number |
| 3 | get-value by column name (case-insensitive lookup) | this triple | get-value-by-name |
| 4 | get-value by numeric column index | this triple | get-value-by-index-typed |
| 5 | dynamic typing survives into cells (42 the number) | this triple | get-value-by-index-typed + get-row-shape |
| 6 | get-row returns DataRow {columns, values} | this triple | get-row-shape |
| 7 | select-rows where + orderBy DESC (numeric ordering) | this triple | select-where-orderby |
| 8 | to-html structure + HTML escaping (&amp;) | this triple | to-html-escaped |
| 9 | get-value out-of-range row → error, buried, no overwrite | this triple | get-value-by-name + smoke |
| 10 | where-clause LIKE/IN/IS NULL/date literals | deferred: dedicated where-evaluator coverage would be its own triple; the evaluator has unit tests and the basic compare path is pinned here and in json-filter | — |
| 11 | select-rows into a step-output variable ({se:} routing) | deferred: step-output routing is engine-pattern territory (covered by step-output triples in Track 1) | — |
| 12 | multi-column orderBy | deferred: comma-split loop over the same term applier | — |

## Witnesses

- In-bot: scalars land in typed variables; the DataRow and the selected
  DataTable are flattened through `json-stringify` / `csv-write-datatable`
  (object literals inexpressible in the Prediction DSL). The buried
  out-of-range read reuses `cellByName` to prove failure-before-write.
- Out-of-band: constants hand-derived from the CSV fixture typed into the
  builder step; 42 vs 9 makes numeric (not lexicographic) DESC ordering
  load-bearing.

## Expected values derived from

First principles over the fixture; dt-to-html's exact emission (thead/tbody,
minimal escaping set &<>\") read from the runner's tiny escapeHtml.

## Known gaps / notes

- Pinned: dt-get-row-count stores a JSON number; consumers doing string
  comparison must convert.
- Pinned: dt-get-value resolves an all-digits column spec as an INDEX, never
  a name — a column literally named "2" would be unreachable by name.
- Pinned: dt-get-row snapshots (copies) the row; later table mutations would
  not reflect into the DataRow.

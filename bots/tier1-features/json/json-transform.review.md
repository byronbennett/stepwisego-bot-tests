# tier1-features/json/json-transform

## Target

`json-filter`, `json-to-csv`, `json-to-xml` (+ `json-parse` seeding,
`json-stringify` as flattener witness — both asserted elsewhere in this
directory). One triple because all three consume parsed JSON arrays/objects.

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | filter where + orderBy combined | this triple | filter-where-orderby-preserves-originals |
| 2 | numeric comparison in where (score > 5, not string compare) | this triple | filter-where-orderby-preserves-originals |
| 3 | matched rows are original objects (nested props survive) | this triple | filter-where-orderby-preserves-originals |
| 4 | orderBy only (empty where keeps all rows), DESC direction | this triple | orderby-only-desc |
| 5 | filter on non-array variable → runtime error, buried | this triple | smoke (expectErrorCount=0 proves burial) |
| 6 | to-csv defaults: comma, headers, key union, blank cells | this triple | csv-default-union-columns |
| 7 | to-csv delimiter keyword + includeHeaders=false | this triple | csv-semicolon-no-header |
| 8 | to-csv empty array → empty string + PASS | this triple | csv-empty-array-empty-string |
| 9 | to-xml attribute prefix, #text node, repeated array element | this triple | xml-attribute-text-repeat |
| 10 | to-xml pretty output | deferred: formatting-only (indentBy '  '); the structural mapping is pinned by 9 | — |
| 11 | filter where-clause LIKE / IN / IS NULL operators | deferred: the where evaluator is shared with dt-select-rows and pinned there (DataTable category) | — |
| 12 | to-csv cells containing delimiter/quote/newline (quoting) | deferred: quoting is Papa Parse's contract, exercised by csv-build-line in the CSV category | — |

## Witnesses

- In-bot: filter results are flattened through `json-stringify` (object
  literals are inexpressible in the Prediction DSL); CSV/XML outputs are
  plain strings asserted directly. Sentinel seeds on `csvDefault`/`csvEmpty`
  prove the writes happened.
- Out-of-band: predictions compare against hand-derived constants: the
  expected filter output follows from the where/orderBy semantics, the CSV
  from the documented key-union + `\n` newline contract, the XML from
  fast-xml-parser's builder mapping (`@_` → attribute, `#text` → text).

## Expected values derived from

First principles over seed data typed directly in the parse steps. Fixture
values chosen so numeric-vs-string comparison is load-bearing (score 9 vs 42:
string compare would sort "42" < "9" and "17" > "9" would fail the >5 test
differently), and so the ragged keys force the union path.

## Known gaps / notes

- Pinned: json-filter maps matched rows back to the ORIGINAL objects — nested
  values and extra properties survive the DataTable detour.
- Pinned: to-csv emits `\n` line endings and no trailing newline; empty array
  is a PASS with empty string.
- Pinned: to-xml default prefixes (`@_`, `#text`) round-trip fast-xml-parser
  conventions.

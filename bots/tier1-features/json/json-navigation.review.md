# tier1-features/json/json-navigation

## Target

`json-get-property`, `json-get-values`, `json-get-children`,
`json-stringify` (+ `json-parse` as the seeding action, already covered by
`engine-patterns/loop-datatable-subvars`). One triple because all four read
the same parsed document.

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | get-property multi-segment dot path to scalar | this triple | dot-path-scalar |
| 2 | get-property path that dead-ends → null + PASS | this triple | missing-path-null-and-passes |
| 3 | get-property returning an object subtree | this triple | stringify-pretty-exact (addr feeds it) |
| 4 | get-property on a non-object variable → runtime error, buried | this triple | smoke (expectErrorCount=0 proves burial) |
| 5 | get-values single JSONPath match → scalar unwrap | this triple | get-values-single-unwraps |
| 6 | get-values multi match → array in document order | this triple | get-values-multi-is-array |
| 7 | get-children of object → key names | this triple | children-of-object-are-keys |
| 8 | get-children of array → elements | this triple | children-of-array-are-elements |
| 9 | get-children of primitive → empty list + PASS | this triple | children-of-primitive-empty |
| 10 | stringify compact round-trips the parse | this triple | stringify-compact-exact |
| 11 | stringify pretty (2-space indent) | this triple | stringify-pretty-exact |
| 12 | get-values with zero matches (empty array result) | deferred: jsonpath-plus returns []; the multi/single unwrap boundary (5/6) is the load-bearing contract | — |
| 13 | stringify of a pipe'd numeric token (exact-numerics string drift) | deferred: pinned in the runner comment, belongs to the numerics track | — |

## Witnesses

- In-bot: every extraction lands in its own variable; sentinel seeds
  (`SENTINEL`) on `missingProp` and `primChildren` distinguish "wrote
  null/empty" from "never wrote"; `json-stringify` doubles as the flattener
  witness for the object subtree that `$var` predictions cannot express as a
  literal.
- Out-of-band: predictions compare against hand-derived constants from the
  seed document (typed directly in the parse step — the fixture is fully
  visible in the bot file).

## Expected values derived from

First principles over the seed document: dot-path navigation, JSONPath
matches, `Object.keys` declaration order, and the `JSON.stringify` contract
(compact vs `null, 2` pretty).

## Known gaps / notes

- Pinned: missing property path is a PASS that stores null (runner logs and
  continues) — only a non-object *target variable* is an error.
- Pinned: `json-get-values` unwraps single matches — consumers cannot rely on
  always getting a list.
- Pinned: `json-get-children` on an object returns key names (strings), not
  values.

# tier1-features/csv/csv-inmemory

## Target

`csv-read`, `csv-write-datatable`, `csv-to-json`, `csv-build-line` — the
in-memory CSV surface (`json-stringify` is the flattener witness, asserted in
the JSON category). One triple because read/write/convert all share the same
Papa Parse plumbing and one fixture exercises all of them.

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | csv-read with headers, quoted cell with embedded delimiter | this triple | read-write-round-trip |
| 2 | csv-write-datatable includeHeaders=true, Papa re-quoting | this triple | read-write-round-trip |
| 3 | csv-read hasHeaders=false → auto Column1..N names | this triple | headerless-generates-column-names |
| 4 | csv-to-json typingMode=string (cells stay text) | this triple | to-json-string-typing |
| 5 | csv-to-json typingMode=dynamic (numeric coercion) | this triple | to-json-dynamic-typing |
| 6 | csv-to-json empty content → [] + PASS | this triple | to-json-empty-content |
| 7 | csv-build-line splits + trims values | this triple | build-line-trim-and-append |
| 8 | csv-build-line appends to existing value with newline | this triple | build-line-trim-and-append |
| 9 | csv-write-datatable on non-DataTable variable → error, buried | this triple | smoke (expectErrorCount=0 proves burial) |
| 10 | typingMode=columns (per-column typing map) | deferred: same resolveDynamicTyping plumbing; string/dynamic are the two ends of the contract | — |
| 11 | delimiter variants (tab/pipe/semicolon) | covered for semicolon in json-transform's to-csv; keyword map is shared `resolveDelimiter` | — |
| 12 | csv-read of ragged rows / parse errors | deferred: Papa warning path only logs; no assertable contract without freezing Papa internals | — |

## Witnesses

- In-bot: DataTables are not directly assertable ($var can't express object
  literals), so every table travels back out through `csv-write-datatable`
  (itself under test — the two actions witness each other, and the byte-equal
  round trip can only pass if BOTH are faithful). JSON conversions are
  flattened via `json-stringify`.
- Out-of-band: constants hand-derived from the fixture text typed into the
  bot; the quoting rules are Papa Parse's documented behavior (only cells
  containing delimiter/quote/newline get quoted).

## Expected values derived from

First principles + Papa Parse contract: `\n` newlines, minimal quoting,
`Column1..N` generated names, dynamicTyping number coercion.

## Known gaps / notes

- Pinned: a required prop that is LITERALLY empty ("") fails pre-run
  validation — the empty-content permutation must arrive via a token that
  resolves empty at runtime.
- Pinned: csv-build-line APPENDS to the result variable across calls
  (newline-separated) rather than overwriting — it is a line accumulator.
- Pinned: csv-build-line trims whitespace around each split value.

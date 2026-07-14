# tier1-features/xml/xml-read

## Target

`xml-parse`, `xml-get-node`, `xml-get-children`, `xml-get-child-values`,
`xml-get-attribute`, `xml-to-json`, `xml-stringify` — the read-only XML
surface. One triple because all consume one parsed catalog document
(`json-stringify` appears only as the flattener witness for the to-json
object; it is asserted in the JSON category).

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | parse well-formed XML with attributes | this triple | (all checks depend on it) |
| 2 | get-node positional path (1-based book[2]) | this triple | get-node-positional |
| 3 | get-node attribute axis (@id) | this triple | get-node-attribute-axis |
| 4 | get-node XPath function (count()) | this triple | get-node-xpath-function |
| 5 | get-children → element tag names, text nodes excluded | this triple | children-are-tag-names |
| 6 | get-child-values → text contents, no numeric coercion | this triple | child-values-are-text |
| 7 | get-attribute present | this triple | get-attribute-value |
| 8 | get-attribute MISSING → hard error (not empty string), buried | this triple | get-attribute-value (non-overwrite) + smoke |
| 9 | to-json: attributes kept with @_ prefix, element text numeric-coerced, single child not array-forced | this triple | to-json-shape |
| 10 | stringify compact = byte-for-byte round-trip | this triple | stringify-round-trip |
| 11 | parse malformed XML → error | deferred: parse-failure path shares the buried-error pattern already exercised at 8; xmldom's error surface is env-sensitive | — |
| 12 | to-json ignoreAttributes / custom prefixes | deferred: option passthrough to fast-xml-parser; defaults are the load-bearing contract | — |
| 13 | stringify pretty | covered in xml-mutate? no — deferred: prettyPrintXml indentation has a known sibling-indent quirk; pinning it would freeze a cosmetic bug | — |

## Witnesses

- In-bot: every read lands in its own variable; the buried missing-attribute
  read (step 8) reuses `attrId` so the check proves failure-before-write.
- Out-of-band: predictions compare against constants hand-derived from the
  fixture typed into the parse step. `xml-to-json`'s object output is
  flattened through `json-stringify` (object literals are inexpressible in
  the Prediction DSL).

## Expected values derived from

First principles over the fixture: XPath 1.0 semantics (1-based positions,
string() coercion, count()), DOM childNodes filtering to ELEMENT_NODE, and
fast-xml-parser's documented defaults (`@_` prefix, parseAttributeValue,
trimValues).

## Known gaps / notes

- Pinned: reading a missing attribute is a HARD ERROR (`Attribute "lang" not
  found`), unlike JSON's null-and-pass for missing properties — asymmetry is
  intentional legacy behavior.
- Pinned: to-json coerces element text that looks numeric (9.99 → number) but
  leaves attribute values as strings when non-numeric ("b1"); a single
  repeated element does NOT become an array — consumers must handle both
  shapes.
- Pinned: XmlDocument variables are stored as a re-serialized string wrapper
  (`__type: "XmlDocument"`), so round-trip fidelity is serializer fidelity.

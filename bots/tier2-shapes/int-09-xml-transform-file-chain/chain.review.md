# tier2-shapes/int-09-xml-transform-file-chain/chain

## Target

**INT-09 — xml-transform-file-chain** (integration catalog): fixture XML →
`xml-open-document` → XPath reads → mutations (`xml-update-node`,
`xml-set-attribute`) → `xml-save-document` → raw byte compare →
`xml-to-json` → `json-get-property` spot checks → `json-to-csv` →
`csv-read` back into a DataTable. First committed Tier 2 triple — this
directory layout (`tier2-shapes/<scenario-id>/<facet>.*`) is the convention
for the rest of the catalog.

## Scenario check table → prediction map

| Catalog check | Prediction id(s) |
|---|---|
| Entity round-trip (`&amp;` not double-encoded) across save | saved-file-raw-bytes, no-double-encoding, xpath-namespace-entity, json-unicode-entity |
| Namespaces survive the mutate/save cycle | saved-file-raw-bytes (xmlns:aud decl + aud:note prefix byte-pinned) |
| XML→JSON→CSV preserves trichotomy + numeric strings | json-bigint-stays-string, json-amount-coerced (KNOWN-COERCION), csv-known-vector |
| Final CSV known-vector | csv-known-vector, chain-status-mutation-arrived, chain-bigint-end-to-end |

## Fidelity corpus carried

- exact decimal with trailing zeros (`1234.5600`), negative scale-2 (`-0.10`)
- big ints > 2^53, both odd (`…993`, `…995` — float collapse would be visible)
- unicode (umlaut + CJK + emoji), XML entity (`&amp;`)
- date matrix: leap day `2028-02-29` (valid — 2028 is a leap year), year-end
  datetime `2026-12-31T23:59:59`
- blank vs missing: A-2 has `<customer></customer>` (blank) and NO
  `aud:note` (missing). Pinned: both render as empty CSV fields — the CSV
  seam cannot distinguish them. True null (`xsi:nil`) is not expressible in
  this chain; noted as a gap.

## Witnesses

- In-bot: every seam is verified by a *different plugin* — the XML writer's
  output is re-read by `get-file-contents` (File), re-parsed by
  `xml-to-json`/fast-xml-parser (a second, independent XML parser — xmldom
  wrote it), and the final values come back through CSV (Papa Parse) and
  DataTable reads.
- Out-of-band: `read_value({file})` — the harness process reads the saved
  `out.xml` directly and compares the full serialization byte-for-byte
  (`saved-file-raw-bytes`, `no-double-encoding`).
- Probe calibration: not applicable — no boolean probes; every check is a
  value comparison against a hand-written constant.

## Expected values derived from

Fixture bytes are hand-written in the ARRANGE step. Expected XPath reads and
the saved serialization derive from XML/XPath semantics (string() of an
element = exact text content; xmldom serializes childless elements
self-closed, keeps the declaration, updates attributes in place — the same
behaviors already pinned by `tier1-features/xml/xml-mutate`). The CSV vector
derives from `json-to-csv`'s documented column-union + `String(c ?? "")`
rendering over the hand-derived JSON shape. Confirmed by probe under both
engines; no expected value was copied from a run.

## Known gaps / defect found

- **KNOWN-COERCION (human-approve `json-amount-coerced`, pending Byron):**
  `xml-to-json` hardcodes fast-xml-parser's numeric tag/attribute parsing
  (`parseAttributeValue: true`, `parseTagValue` default true) with no
  preserve-strings knob. `"1234.5600"` → number `1234.56`: trailing-zero
  decimal scale is silently lost at the XML→JSON seam, and leading-zero
  strings (`"007"`) would collapse to `7`. Big ints > 2^53 are protected
  (strnum keeps them strings) — pinned green. An internal product backlog item
  "xml-to-json numeric tag coercion loses decimal scale" carries the
  product decision. The prediction pins today's behavior as a
  characterization so the gate stays green; loosening/changing it is
  Byron's call, not a model's.
- `@_id` attribute ordering in the CSV column union (attributes after
  elements) is fast-xml-parser key-order behavior, pinned by the vector.
- Root-level `?xml` declaration key and `@_xmlns:aud`/`@_version` root
  attributes exist in the JSON but are not separately asserted (the raw
  byte compare already pins the source of truth).

- 2026-07-13 standalone bootstrap: added a session-bootstrap preflight (require-shared-vars, bootstrap-only mode) + create-folder ahead of the original steps, so this bot is runnable standalone (not only via RunAllRegressionTests). Witnesses and prediction values unchanged.

# tier1-features/xml/xml-mutate

## Target

`xml-new`, `xml-insert-node` (Child/Before/After), `xml-update-node` (update +
createIfNotExists), `xml-set-attribute`, `xml-delete-node`,
`xml-close-document` — the XML mutation surface (`xml-stringify` is the
snapshot witness, asserted in xml-read). One triple: a single document
accumulates all mutations and the final serialization pins the whole
sequence at once.

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | xml-new mode=root adds declaration + named root | this triple | final-document-exact |
| 2 | insert Child with EMPTY anchor targets the root | this triple | final-document-exact |
| 3 | insert Child under XPath anchor, with text value | this triple | final-document-exact |
| 4 | insert Before / After an anchor | this triple | final-document-exact |
| 5 | update-node replaces text content | this triple | final-document-exact (60, not 30) |
| 6 | update-node createIfNotExists builds a simple element chain | this triple | final-document-exact (audit/enabled appended) |
| 7 | set-attribute on root | this triple | final-document-exact (version="2") |
| 8 | delete-node removes exactly the target | this triple | final-document-exact (<first/> absent) |
| 9 | update-node missing xpath WITHOUT create → error, buried | this triple | smoke (expectErrorCount=0 proves burial) |
| 10 | close-document empties the variable | this triple | close-empties-variable |
| 11 | xml-new mode=xml (XML Editor source) | deferred: same parse path as xml-parse; root mode is the distinct contract | — |
| 12 | insert Before/After with empty anchor → error | deferred: representative error already covered at 9 | — |
| 13 | delete the root node → error | deferred: guard-rail branch, same buried-error pattern | — |

## Witnesses

- In-bot: the final `xml-stringify` snapshot is taken BEFORE the close, so
  both the accumulated document and the post-close empty string are
  observable in final parms.
- Out-of-band: the expected serialization is hand-derived by replaying the
  nine mutations on paper — each action leaves a distinct mark (element
  present/absent/position, text 60, attribute) so no single action could be
  skipped without failing the byte-for-byte compare.

## Expected values derived from

First principles / DOM semantics: appendChild ordering, insertBefore
positioning, textContent replacement, and the runner's documented
createMissingChain behavior (chain built relative to the existing root,
appended after existing children — hence audit lands AFTER <last/>).

## Known gaps / notes

- Pinned: xml-new (root mode) includes the `<?xml version="1.0"
  encoding="UTF-8"?>` declaration; xml-parse of declaration-less input does
  not add one (see xml-read) — serialization preserves what parsing saw.
- Pinned: createIfNotExists appends the missing chain at the END of the
  root's children, not adjacent to any anchor.
- Pinned: childless elements serialize self-closed (`<last/>`).
- Pinned: close-document sets the variable to `""` (not null, not deleted).

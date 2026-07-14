# Review — tier1-features/excel/search-format

## What this triple covers

The six search/transform/format actions: `xl-find`, `xl-find-and-replace`,
`xl-sort-range`, `xl-remove-duplicate-rows`, `xl-format-range`,
`xl-clear-formats`. Five isolated sheets (one per concern) inside a single
workbook variable; every mutation is read back with `xl-get-value(s)` /
`xl-get-formula` — readers that share no code with the writers under test.

## Permutation matrix

| Action | Permutation | Witness |
| --- | --- | --- |
| xl-find | defaults (partial, case-insensitive, searchBy=rows), LIST destination | `findAll` = all 5 addresses, row-major |
| xl-find | matchCase=true | `findCase` drops Alpha/ALPHABET |
| xl-find | matchWholeCell+matchCase | `findWhole` = exact-cell hits only |
| xl-find | numeric cell + text-locked cell both match "42" | `findNum` = [C2,B3] |
| xl-find | searchBy=columns | `findByCols` column-major order |
| xl-find | SCALAR destination → first match only | `findScalar` = "A1" |
| xl-find | range-restricted scan | `findRanged` |
| xl-find | no match → scalar gets "" (SENTINEL overwritten) | `findMiss` |
| xl-find-and-replace | defaults: partial + case-insensitive, substring inside word | `replacedA` (conCATenate → conbirdenate) |
| xl-find-and-replace | matchWholeCell + matchCase | `replacedB1` |
| xl-find-and-replace | searchIn=formulas rewrites formula TEXT | `frFormula` + `frComputed` (engine computes the rewritten MAX, not SUM) |
| xl-sort-range | letter key, ascending, hasHeaders default true, numeric compare | `sortedIds` (2,9,10 — not lexicographic), `sortedNames` (rows move together) |
| xl-sort-range | hasHeaders=false, NUMERIC column index key, 2-key sort w/ desc secondary | `sortedMulti` |
| xl-sort-range | descending over already-sorted data | `sortedDesc` |
| xl-sort-range | key column outside range → runtime error | buried, expectErrorCount 0 |
| xl-remove-duplicate-rows | hasHeaders default, whole-row JSON compare, case-sensitive | `deduped` exact compacted array |
| xl-format-range | mergeCells=true / =false | `mergedB1`="M" / `unmergedB1`="" |
| xl-format-range | font (bold/size) + solid fill | `styledC1` value preserved |
| xl-clear-formats | explicit range | `clearedC1` value preserved |
| xl-clear-formats | entire sheet (no range) | `afterSheetClear` value preserved |

## Dual witnessing

- All predictions are `$var` equality over values that crossed the
  workbook-parm serialization boundary at least once per action
  (deserialize → mutate → reserialize).
- No disk artifacts in this triple; the out-of-band leg is the harness
  asserting exact arrays/strings against the trace, independent of any
  in-bot conditional.
- Buried failure (`sortColumn1: "Z"` outside A1:B4) is runtime, not
  structural: pre-run validation passes (all required props present), the
  runner rejects it, `ignoreErrors` buries it, `expectErrorCount: 0`.

## Deliberate design notes

- **Merge as the format witness** — Fast mode has no style *reader*, so most
  of `xl-format-range` is unobservable by value. `mergeCells` is the
  exception: ExcelJS makes a merged slave cell mirror the master's value, so
  merge→read-slave→unmerge→read-slave gives a real behavioral pin. Font/fill
  and clear-formats are pinned as value-preserving invariants only.
- **Numeric sort pin** — ids 10/9/2 sort to 2,9,10 via the exact `toSw`/
  `swCompare` comparator (v0.1.903 exact-numerics boundary); a lexicographic
  sort would give 10,2,9.
- **Numeric sort-column index** — `sortColumn1: "4"` exercises
  `resolveSortColumn`'s 1-based-number branch (the legacy-migration fix for
  `letterToNumber("1") = -15`).
- **Case-sensitivity contrast** — find/replace default to case-INsensitive;
  remove-duplicate-rows compares rows case-SENSITIVELY (JSON.stringify), so
  the `A` row survives dedupe while `CAT` was matched by "cat".
- **Formula rewrite recompute** — after SUM→MAX in searchIn=formulas mode the
  cell has a formula with NO cached result; `xl-get-value` computing 9 (not
  14) proves both the text rewrite and the engine fallback branch of
  `_engine-read.ts` fire together.

## Known gaps

- Style attributes (font, fill, borders, alignment, numFmt) can't be read
  back by any Fast-mode action — covered only as "values survive styling"
  invariants. A Full-mode (COM) or serialized-xlsx-inspection witness would
  be needed to pin actual style bytes.
- `xl-find` `searchIn=formulas` permutation not exercised (find-and-replace
  covers the formulas branch of the shared scan bounds).
- Autofit rows/columns (width/height side effects) unobservable in Fast
  mode; not asserted.
- `expandToRegion` on find/sort/dedupe not repeated here — the shared
  `resolveEffectiveRange` expansion is already pinned in the range-geometry
  and data-exchange triples.

- 2026-07-13 standalone bootstrap: added a session-bootstrap preflight (require-shared-vars, bootstrap-only mode) + create-folder ahead of the original steps, so this bot is runnable standalone (not only via RunAllRegressionTests). Witnesses and prediction values unchanged.

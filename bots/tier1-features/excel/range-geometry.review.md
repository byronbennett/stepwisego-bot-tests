# tier1-features/excel/range-geometry

## Target

The nine geometry probes: `xl-get-last-used-row`, `xl-get-last-used-column`,
`xl-get-first-empty-row`, `xl-get-first-row-in-range`, `xl-get-used-range`,
`xl-get-number-rows-in-range`, `xl-get-number-columns-in-range`,
`xl-get-region-for-range`, `xl-column-number-to-letter`.

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | last-used-row over multi-island terrain | this triple | extent-probes |
| 2 | last-used-column returns a NUMBER string (not a letter) | this triple | extent-probes |
| 3 | first-empty-row finds an INTERIOR gap row | this triple | extent-probes |
| 4 | first-empty-row on a gapless sheet → lastRow+1 | deferred: same loop, exit branch pinned by #12's empty-sheet 1 = 0+1 | — |
| 5 | used-range = bounding box across islands (≠ CurrentRegion) | this triple | used-range-bounding-box |
| 6 | region-for-range from region corner and middle agree | this triple | current-region-semantics |
| 7 | region-for-range isolates an island behind an empty row | this triple | current-region-semantics |
| 8 | number-rows/columns explicit range | this triple | range-counts-explicit-and-expanded |
| 9 | number-rows/columns expandToRegion from a single cell | this triple | range-counts-explicit-and-expanded |
| 10 | first-row-in-range: multi-cell range and single cell (string property, no scan) | this triple | first-row-is-string-property |
| 11 | column-number-to-letter carry boundaries 1/26/27/703 | this triple | column-letter-boundaries |
| 12 | empty-sheet conventions: lastRow '0', usedRange '', firstEmpty '1' | this triple | empty-sheet-zero-geometry |
| 13 | column-number-to-letter 0 → runtime error, buried | this triple | column-letter-boundaries |
| 14 | column/row shorthand ranges ('B:C', '2:4') in count actions | deferred: those runners parse A1-style only (no expandShorthandRange call); shorthand is pinned where it's wired (structure triple's delete-row) | — |
| 15 | used-range inflation via formatting-only cells (styled but valueless) | deferred: no Fast-mode action writes style without value yet; xl-format-range pins its own range handling in search-and-format | — |
| 16 | Full (COM) branches | deferred: FP-7 Tier 3 hosted (xlcom-*) | — |

## Witnesses

- In-bot: the terrain is authored with xl-set-value/xl-set-values and probed
  by nine DIFFERENT geometry readers whose answers must be mutually
  consistent (used-range's F7 corner = last-used-row 7 + last-used-column 6
  → letter F; region B2:D4 row count = rowsExplicit 3 = rowsExpanded 3).
  That web of cross-agreements is the dual witness — each fact is asserted
  through at least two independent code paths.
- Out-of-band: pure in-variable computation, nothing lands on disk; all
  expected values are literals asserted directly in the DSL. SENTINEL
  defaults prove every probe executed (usedRange '' on the empty sheet is
  only meaningful against the SENTINEL default).

## Envelope / cleanup

No files. Sheet2 is deliberately never written — it's the empty-sheet
calibration surface.

## Expected values derived from

Runner sources: lastRow?.number ?? 0 / columnCount conventions; the
first-empty-row row-scan (formula-aware, breaks at first all-empty row);
used-range min/max scan with '' for empty; findContiguousRegion
(CurrentRegion 4-direction expansion); parseRange for first-row;
numberToLetter bijective base-26. Probe reproduced every value.

## Known gaps / notes

- Pinned: all geometry results are STRINGS ("7", "0"), including counts —
  in-bot numeric comparisons should rely on the engine's numeric coercion.
- Pinned: last-used-column returns the column NUMBER ("6"), not the letter;
  pair with xl-column-number-to-letter for display.
- Pinned: first-row-in-range never touches the sheet — it parses the range
  string (B2:D9 → 2 with rows 5..9 empty).
- ExcelJS columnCount is a sparse-aware upper bound; on this terrain it
  matched real data (6). Sheets that once held wider data may report
  inflated extents (excel.md special-attention trap) — not reproducible
  through Fast-mode writes alone.

- 2026-07-13 standalone bootstrap: added a session-bootstrap preflight (require-shared-vars, bootstrap-only mode) + create-folder ahead of the original steps, so this bot is runnable standalone (not only via RunAllRegressionTests). Witnesses and prediction values unchanged.

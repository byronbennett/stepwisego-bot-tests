# tier1-features/variables/list-hygiene

## Target

`remove-empty-values`, `clear-list`, `sort-email-list` — the three remaining
untested list-maintenance actions (the core add/remove/sort text-list surface
was covered by `engine-patterns/list-ops-calibration`).

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | remove-empty-values drops "", whitespace-only, null | this triple | remove-empty-keeps-falsy-string-zero |
| 2 | remove-empty-values keeps "0" (not JS-falsy semantics) | this triple | remove-empty-keeps-falsy-string-zero |
| 3 | remove-empty-values preserves survivor order | this triple | remove-empty-keeps-falsy-string-zero |
| 4 | clear-list → empty array | this triple | clear-list-empties |
| 5 | clear-list on undeclared variable — runtime error, buried | this triple | smoke (expectErrorCount=0 proves burial) |
| 6 | sort-email-list by subject asc — case-insensitive | this triple | sort-by-subject-asc-case-insensitive |
| 7 | sort-email-list by dateReceived desc — 1s granularity decides | this triple | sort-by-date-desc |
| 8 | sort-email-list by fromAddress / other fields | deferred: same comparator machinery × field selector; subject + date cover both string and date comparators | — |
| 9 | sort-email-list on empty list | deferred: trivially order-free; no observable contract beyond "passes" | — |

## Witnesses

- In-bot: sorted email order is flattened into text variables via
  `itemIndex:N|subject` pipe chains (email objects cannot be expressed as
  Prediction-DSL literals); `messy` and `clearable` are plain text lists so
  their final arrays are asserted directly.
- Out-of-band: predictions compare against hand-derived constants — the
  expected orders follow from the seeded subjects/timestamps, which were
  chosen so that case-sensitivity (permutation 6) and second-level
  granularity (permutation 7) are each load-bearing.

## Expected values derived from

First principles: emptiness for `remove-empty-values` means no non-whitespace
text — `"0"` is text and must survive; a case-insensitive subject sort puts
`alpha digest` before `Middle memo` (an ASCII/ordinal sort would reverse
that, since `M` < `a`); ISO-8601 timestamps one second apart order
deterministically.

## Known gaps / notes

- Pinned: `remove-empty-values` treats whitespace-only strings ("   ") as
  empty, and keeps `"0"`.
- Pinned: subject sort is case-insensitive (probe-observed; a change to
  ordinal comparison would flip check sort-by-subject-asc-case-insensitive).
- Email objects live in the list as plain records; only `subject` is read
  back — full email round-trip fidelity belongs to the Email category track.

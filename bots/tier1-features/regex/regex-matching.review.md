# tier1-features/regex/regex-matching

## Target

`regex-is-match`, `regex-match-all` — the two untested Regex actions
(`regex-match`/`regex-replace` were covered earlier). One triple; both wrap
JS RegExp over literal inputs.

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | is-match true / false with explicit flags | this triple | is-match-boolean-results |
| 2 | is-match default flags = i (case-insensitive) | this triple | default-flags-case-insensitive |
| 3 | is-match EXPLICIT empty flags = case-sensitive | this triple | default-flags-case-insensitive |
| 4 | is-match invalid pattern → error, buried | this triple | smoke (expectErrorCount=0 proves burial) |
| 5 | match-all whole matches (groupIndex 0) | this triple | match-all-whole-matches |
| 6 | match-all capture group N | this triple | match-all-group-1 |
| 7 | match-all groupIndex -1 = LAST group | this triple | match-all-last-group-append |
| 8 | match-all keepValues=true appends | this triple | match-all-last-group-append |
| 9 | match-all zero matches replaces with empty list | this triple | match-all-no-matches-replaces |
| 10 | match-all auto-adds g flag | implicit in 5-9 (multiple matches found without passing g) | match-all-whole-matches |
| 11 | groupIndex beyond group count → "" entries | deferred: degenerate input; pickGroup's fallback is a one-liner | — |

## Witnesses

- In-bot: every result lands in its own variable; seeded sentinels on
  `domains` ("seeded") and `noMatches` ("sentinel") make append-vs-replace
  observable.
- Out-of-band: expected values hand-derived from the literal inputs typed in
  the bot (e.g. `\\d+` over "a1 b22 c333" must yield exactly 1, 22, 333).

## Expected values derived from

First principles: JS RegExp semantics over fixed inputs; flag defaults read
from the runners (`i` for is-match, `gi` for match-all, `g` force-added).

## Known gaps / notes

- Pinned: is-match stores a real boolean, not "True"/"False" text.
- Pinned: the flags DEFAULT is case-insensitive but an explicitly empty flags
  string is case-sensitive — omitting the prop and sending "" differ.
- Pinned: without keepValues, a zero-match run CLEARS the target list
  (replace semantics) — it does not leave the old values.

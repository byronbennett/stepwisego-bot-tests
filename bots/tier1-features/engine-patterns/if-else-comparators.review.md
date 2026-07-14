# tier1-features/engine-patterns/if-else-comparators

## Target

`if` / `else` engine pattern (`if-else`, `nested-if` manifest patterns) and
the condition-evaluator comparator semantics that customer bots depend on for
branching over financial data.

## Permutation matrix

| # | Permutation | Covered by | Check id (crumb) |
|---|---|---|---|
| 1 | greaterThan numeric coercion ("10" > "9", lexically false) | this triple | num-gt |
| 2 | equals loose-numeric ("0.30" == "0.3") | this triple | loose-num-eq |
| 3 | equals case-insensitive ("CSV" == "csv") | this triple | ci-eq |
| 4 | equalsExact literal case-sensitive → else branch taken | this triple | exact-miss |
| 5 | equals date-instant ("2/12/2026" == "2026-02-12") | this triple | date-eq |
| 6 | isEmpty on "" | this triple | empty-yes |
| 7 | hasValue on "" → else | this triple | hasvalue-miss |
| 8 | multi-row and/or, left-to-right no precedence | this triple | andor-ltr |
| 9 | contains on list variable = item-wise membership (case-insensitive) | this triple | list-contains |
| 10 | nested if (outer true, inner false → inner else) | this triple | outer-then, inner-else |
| 11 | isNumber | this triple | isnum |
| 12 | ordering on non-numeric strings is false (NOT lexical) | this triple | str-gt-false |
| 13 | isBlank on whitespace-only "   " → TRUE (trim-aware) | this triple | spaces-blank |
| 14 | isEmpty on whitespace-only "   " → FALSE (not empty) → else | this triple | spaces-not-empty |
| 15 | hasValue on whitespace-only "   " → TRUE (it has a value) | this triple | spaces-hasvalue |
| 16 | isNotBlank on whitespace-only "   " → FALSE → else | this triple | spaces-notblank-false |
| 17 | isBlank on "" → TRUE (empty is blank as well) | this triple | empty-blank |
| 18 | isNotBlank on "0" → TRUE (a falsy-looking value is still a value) | this triple | zero-notblank |
| 19 | notEquals/notContains/startsWith/endsWith/matchesRegex/isDate/containsKey/containsValue/fileExists family | deferred: logic-variables Tier 1 campaign | — |

## Witnesses

- In-bot: every branch decision materializes as a breadcrumb from either the
  then-branch or an explicit `else` child — a wrong branch produces a wrong
  crumb, not a silent absence.
- Out-of-band: one deep-equal over the full ordered crumb list pins all 18
  decisions and their order in a single prediction.

## Expected values derived from

Comparator documentation in `packages/shared/src/types/condition.ts` and the
documented loose-equals contract (numeric, then date, then case-insensitive
string). The left-to-right no-precedence rule is the documented If-grid
behavior. Probe-confirmed before commit.

## Known gaps / notes

- Pinned: `equals` on "0.30"/"0.3" is TRUE (numeric loose equality). Bots
  needing literal comparison must use `equalsExact` — this is the
  financially-significant trap this triple guards.
- Pinned: ordering comparators refuse non-numeric/non-date operands (false),
  they do NOT fall back to lexical comparison.
- Date-instant equality interprets naive dates in the bot time zone; both
  operands here are date-only so the check is zone-stable.
- Pinned: the empty-vs-blank split. `isEmpty`/`hasValue` test for exactly `""`;
  `isBlank`/`isNotBlank` trim first, so a whitespace-only value is blank but
  NOT empty. Permutations 13–16 are the four-way contrast on the same `"   "`
  value — the case a bot hits when a cell, a CSV field, or a CRLF-split line
  looks empty to a human and isn't. Checks 13–18 are also the regression guard
  for the original defect: `isBlank`/`isNotBlank` were declared in the
  `Comparator` union but never implemented in `condition-evaluator`, so they
  silently evaluated FALSE and every one of these Ifs took the else branch. An
  unimplemented comparator now throws instead (covered by unit tests in
  `packages/shared/src/engine/__tests__/condition-evaluator.test.ts`, which a
  bot-level triple can't witness — a throwing step fails the run rather than
  leaving a crumb).
- There is no `isNull`: after token substitution every operand is a string, so
  a null variable and an empty one are indistinguishable. `isNull`/`isNotNull`
  were removed from the union rather than faked.

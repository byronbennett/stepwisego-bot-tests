# tier1-features/engine-patterns/list-ops-calibration

## Target

`add-to-list`, `check-value-in-list`, `sort-list`, `remove-from-list` — the
list operations every other engine-pattern triple uses as breadcrumb
witnesses. Per the authoring playbook, these probes must be calibrated before
anything else trusts them.

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | add-to-list position=end (x2, ordering) | this triple | crumbs-order |
| 2 | add-to-list position=beginning | this triple | crumbs-order |
| 3 | check-value-in-list: present item | this triple | found-b |
| 4 | check-value-in-list: absent item (result var pre-set true, must flip) | this triple | found-missing |
| 5 | check-value-in-list: matchCase=true, case mismatch | this triple | case-sensitive-miss |
| 6 | check-value-in-list: matchCase=false, case mismatch | this triple | case-insensitive-hit |
| 7 | sort-list asc (text, lexical) | this triple | sortable-final |
| 8 | remove-from-list by value, mode=first | this triple | sortable-final |
| 9 | remove-from-list by index (zero-based) | this triple | sortable-final |
| 10 | add-to-list token value, split-token list expansion | deferred: logic-variables Tier 1 campaign | — |
| 11 | sort-list desc / numbers / dates; remove mode=all; out-of-range index | deferred: logic-variables Tier 1 campaign | — |

## Witnesses

- In-bot: `check-value-in-list` results cross-check `add-to-list` contents;
  the absent-item check uses an inverted pre-set default so a no-op checker
  cannot fake a pass.
- Out-of-band: predictions compare full final list arrays (`$var` deep-equal
  against exact expected arrays), not membership flags alone.
- Probe calibration: this triple IS the calibration for the breadcrumb
  mechanism (playbook §4.2) — later engine-pattern triples cite it.

## Expected values derived from

First principles: insertion ordering semantics of end/beginning; lexical
ascending sort of ASCII strings; zero-based index documented in the
`remove-from-list` action definition ("Zero-based index of the item to
remove"). Not derived from runner code.

## Known gaps / notes

- Pinned: `remove-from-list` index is zero-based (action-def documented).
- Pinned: boolean parm finals surface as JSON `true`/`false` in the trace
  (not the strings "true"/"false").
- No baseline captured yet (baseline layer optional; capture during a later
  verify once FP-1 report tooling exists).

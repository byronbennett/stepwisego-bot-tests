# tier1-features/web/element-reads

## Target

`get-web-element` (innerText + attribute modes, found/not-found outputs) and
`get-all-web-elements` (multi-match list collection, count output, empty-pool
pass).

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | innerText round-trips multibyte unicode + emoji | this triple | unicode-inner-text |
| 2 | innerText collapses newlines/tabs/space-runs + trims | this triple | inner-text-collapses-whitespace |
| 3 | attribute mode reads data-* | this triple | data-attribute-read |
| 4 | attribute mode returns RAW attr text (href not resolved to file://) | this triple | href-attribute-is-raw |
| 5 | missing selector → found=false, result var untouched | this triple (buried) | missing-selector-found-false |
| 6 | ambiguous selector (2 matches) → fails; string selectors cannot heal | this triple (buried) | ambiguous-selector-fails-unhealed |
| 7 | get-all collects innerTexts in DOM order + count | this triple | get-all-collects-in-dom-order |
| 8 | get-all with zero matches PASSES with empty list | this triple | get-all-zero-matches-passes-empty |
| 9 | get-all attribute mode | deferred: same code path as innerText branch with getAttribute — cheap follow-up | — |
| 10 | XPath / Text / TestID / Role selector types | deferred: selector-type dispatch is selector-resolver.ts shared by all actions; a dedicated selector-types triple is the natural follow-up | — |
| 11 | framePath (iframe) reads | deferred: needs an iframe fixture; frame plumbing is shared via resolveFrameRoot | — |

## Witnesses

- Result vars pre-seeded with SENTINEL prove the failure paths never write.
- `count` step output cross-checks the list length.
- Baseline pins the two buried failures (`found` is their only output).

## Envelope / cleanup

`serialGroup: "web-browser"`; fixture `elements.html`; failing steps carry
`timeoutSeconds: 2` so the two buried failures don't burn the default 10s
budgets.

## Expected values derived from

`get-web-element.runner.ts` (innerText vs getAttribute, found=true/false),
`get-all-web-elements.runner.ts` (locator.all() + setListValues + count),
CSS white-space:normal collapsing rules for #spacey.

## Known gaps / notes

- The ambiguous case fails in the exact tier (`count()===1` never true) and
  cannot heal — the "(no fingerprint captured — string selectors cannot be
  healed)" branch. The heal-guard pair covers the fingerprint path.

- 2026-07-13 standalone bootstrap: added a session-bootstrap preflight (require-shared-vars, bootstrap-only mode) + create-folder ahead of the original steps, so this bot is runnable standalone (not only via RunAllRegressionTests). Witnesses and prediction values unchanged.

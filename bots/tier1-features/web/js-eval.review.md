# tier1-features/web/js-eval

## Target

`execute-javascript` — the result-marshaling contract between the page's JS
engine and bot variables.

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | string verbatim | this triple | string-marshals-verbatim |
| 2 | float64 arithmetic (0.1+0.2) | this triple | float64-binary-arithmetic |
| 3 | integer above 2^53 silently loses precision | this triple | above-2p53-precision-loss |
| 4 | object → JSON.stringify | this triple | object-json-stringified |
| 5 | array → JSON.stringify | this triple | array-json-stringified |
| 6 | null → "" (clobbers sentinel) | this triple | null-becomes-empty-string |
| 7 | boolean → "true"/"false" | this triple | boolean-stringified |
| 8 | returned Promise is awaited | this triple | promises-are-awaited |
| 9 | DOM reads work | this triple | dom-read |
| 10 | thrown page error → step fails, var untouched | this triple (buried) + baseline | throw-fails-step-var-untouched |
| 11 | undefined → "" | deferred: same branch as null in the runner (`?? / == null`), lower value | — |
| 12 | non-serializable results (functions, cycles) | deferred: Playwright returns undefined for functions; cycles throw — micro-triple candidates | — |

## Witnesses

Every case lands in its own SENTINEL-seeded parm; the two numeric pins are
deliberate documentation that execute-javascript results carry the PAGE's
float64 semantics, NOT StepwiseGO exact numerics (relevant to the Numerics
work — a bot must not launder page numbers through exact-decimal paths).

## Envelope / cleanup

`serialGroup: "web-browser"`; fixture `js-eval.html`.

## Expected values derived from

`execute-javascript.runner.ts` serialization ladder (null/undefined → "",
object → JSON.stringify, else String()); V8 float64 behavior.

## Known gaps / notes

- page.evaluate on a string evaluates it as an EXPRESSION; the throw case
  is wrapped in an IIFE for that reason.

- 2026-07-13 standalone bootstrap: added a session-bootstrap preflight (require-shared-vars, bootstrap-only mode) + create-folder ahead of the original steps, so this bot is runnable standalone (not only via RunAllRegressionTests). Witnesses and prediction values unchanged.

# tier1-features/functions/function-invocation

## Target

`function`, `run-function` — the Functions plugin: a function definition in
`Bot.functions` (with declared Input Variables) invoked from the main Steps
tree. One triple; the pair is meaningless separately.

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | literal binding | this triple (call 1 greeting) | three-successful-calls-in-order |
| 2 | whole-token binding resolves via getVariable in caller scope | this triple (call 1 who/items) | three-successful-calls-in-order + list-binding-carries-real-list |
| 3 | whole-token LIST binding hands over a real array (|count sees 2) | this triple | list-binding-carries-real-list |
| 4 | unbound input falls back to declared default | this triple (call 2, all three inputs) | three-successful-calls-in-order |
| 5 | EMPTY-STRING binding treated as unbound (default), not "" | this triple (call 3 items) | list-binding-carries-real-list |
| 6 | mixed-text binding resolves via resolveTokens in caller scope | this triple (call 3 who = "Dr. {var:person}") | three-successful-calls-in-order |
| 7 | function returns data by writing bot vars (inputs-only contract) | this triple | function-returns-via-bot-vars |
| 8 | multiple invocations of the same function (fn-var scope push/pop) | this triple (3 calls) | three-successful-calls-in-order |
| 9 | unknown functionGuid → runtime failure, buried | this triple (call 4) | smoke (expectErrorCount=0 proves burial; calls list proves no body ran) |
| 10 | binding does not mutate caller variables | this triple | caller-vars-untouched |
| 11 | body-step failure propagation through run-halt | deferred: identical to Loop/Section propagation pinned in engine-patterns/error-machinery | — |
| 12 | run-bot, run-bot-as-function | DEFERRED (manifest `deferred`): stub in the shared runner — requires the desktop/Agent host runtime and a second bot artifact; needs a harness story for multi-bot fixtures | — |

## Witnesses

- In-bot: the function body itself is the witness — each call appends the
  fn-var-resolved greeting to `calls` and the bound list's `|count` to
  `counts`, and writes `lastGreeting`, so binding resolution, defaults, and
  scope push/pop are all visible in final variable state.
- Out-of-band: expected strings hand-derived from the bindings typed in the
  bot ("Hello" + "Ada", defaults "Hi"/"world", "Hey" + "Dr. Ada"); counts
  2/0/0 from the seeded 2-item list vs the [] default.

## Expected values derived from

First principles from the runner + executor contracts: whole-token bindings
via `getVariable`, mixed text via `resolveTokens`, empty/missing bindings →
declared `defaultValue`, `{fn-var:}` parms scoped to the body only
(`functionInputStack` push/pop in `step-executor.ts`).

## Known gaps / notes

- Pinned: a whole-token binding of a `listOfTexts` variable passes the live
  array — `{fn-var:items|count}` sees 2, not a stringified blob.
- Pinned: an empty-string binding is UNBOUND (default applies); binding ""
  explicitly is not possible through `inputBindings`.
- Probe note: Functions is outside the sandbox safe-list — `sgt probe`
  needs `--allow Functions` (verify is unaffected).
- 12/13 steps pass: the 13th is the buried bad-guid call; the smoke
  `expectErrorCount: 0` plus the 3-entry `calls` list pin that the failure
  was contained and no ghost body-run happened.

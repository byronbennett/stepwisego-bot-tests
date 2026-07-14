# tier1-features/engine-patterns/token-substitution

## Target

Token substitution engine contract (`token:var` manifest pattern):
embedded resolution, verbatim storage, single-pass (no double-resolve),
pipe functions, and missing-variable behavior.

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | token embedded in text | this triple | embedded-token |
| 2 | valueSource=none stores verbatim | this triple | verbatim-storage |
| 3 | single-pass substitution (token-shaped data not re-resolved) | this triple | no-double-resolve |
| 4 | single pipe fn | this triple | pipe-single |
| 5 | chained pipe fns (left-to-right) | this triple | pipe-chained |
| 6 | missing variable → token left verbatim | this triple | missing-var-verbatim |
| 7 | {gbl-var:} / {vlt-var:} / {svar:} prefixes | deferred: need cloud/global + vault + shared-var env (manifest token:gbl-var, token:vlt-var stay untested) | — |
| 8 | nested tokens in pipe args ({var:list\|join:{var:sep}}) | deferred: logic-variables Tier 1 campaign | — |

## Witnesses

- In-bot: each behavior lands in its own result variable via set-variable —
  the values are the witnesses.
- Out-of-band: exact string equality per variable in the final-parms trace.

## Expected values derived from

set-variable action definition (valueSource contract) and pipe-function
registry docs (upper/lower/left). The two non-obvious contracts —
single-pass no-double-resolve (#3) and missing-var-left-verbatim (#6) —
were pinned from a probe run and asserted as current engine behavior; a
future change to either is a breaking change customer bots would feel.

## Known gaps / notes

- Pinned: unresolvable tokens pass through VERBATIM ("A{var:doesNotExist}B").
  Bots relying on blank-on-missing would break; the regression guard is
  deliberate.
- token:sa (step-output tokens) covered by the loop triples; subvar:sa-col
  by loop-datatable-subvars.

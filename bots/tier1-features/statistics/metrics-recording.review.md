# tier1-features/statistics/metrics-recording

## Target

`record-metric`, `increment-counter`, `record-amount`,
`record-transaction-outcome` — the Statistics (metrics) plugin. One triple;
all four write through `context.recordMetric`.

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | record-metric gauge with scale + unit | this triple | gauge-payload-exact |
| 2 | increment-counter default amount 1 | this triple | counter-payload-exact |
| 3 | record-amount USD scale 2 | this triple | money-payload-exact |
| 4 | record-transaction-outcome pass ×N feeds bot-level passCount | this triple | transaction-outcome-feeds-rollup |
| 5 | record-transaction-outcome fail ×1 feeds failCount | this triple | transaction-outcome-feeds-rollup |
| 6 | pure metric writers do NOT touch pass/fail counters | this triple (9/1 arithmetic would break) | transaction-outcome-feeds-rollup |
| 7 | record-metric non-decimal value → error, buried; records NOTHING | this triple | smoke (expectErrorCount=0) + bad-metric-not-recorded |
| 8 | tags on a metric writer (keyValuePairs → tags map) | this triple (env=dev on record-amount, read via `tags.env`) | money-payload-exact |
| 9 | metric payload fidelity (FixedDecimal exactness, money currency) | this triple (Track 8 `$metric` reader — exact decimal strings "12.5"/"12.34", no float round-trip) | gauge/counter/money-payload-exact |
| 10 | outcome metrics carry status + count alongside the rollup | this triple | outcome-payloads |

## Witnesses

- In-bot: pass/fail counter snapshots via the `passCount`/`failCount` pipe
  functions, before and after; the baseline (0/0) plus the delta arithmetic
  isolates record-transaction-outcome's contribution from the engine's
  per-step auto-increments.
- Out-of-band: hand-computed constants — 9 = 7 auto step-passes + 2 explicit,
  1 = explicit fail only; the smoke layer pins that all metric writes pass
  and the invalid-decimal failure stays buried.

## Expected values derived from

Engine source (`step-executor.ts` per-step passCount++; the runner's
`context.addToCounter(status, count)` — spec §7.1 Action 3 keeps the
bot-level rollup authoritative) plus the fixture's step arithmetic.

## Known gaps / notes

- Observability gap CLOSED (Track 8): `RunState.metrics` is now exposed in
  the sgtester trace (in-process: read off RunState; agent: via the
  final-state dump) and asserted through the `$metric` prediction-DSL reader.
  Counter/gauge/money payloads are pinned as EXACT decimal strings (pure
  string math from integer minor units — no Number() round-trip, no grouping
  separators), so "12.34" is byte-exact FixedDecimal fidelity.
- `$metric` pins per-field (`field: "value"`, `"currency"`, `"tags.env"`, …) —
  object literals are not expressible as DSL expected values.
- Pinned: record-metric rejects non-decimal values at parse time (SwNumber),
  failing loudly rather than recording garbage — and records NOTHING
  (bad-metric-not-recorded pins the null).
- Statistics is outside the sandbox safe-list — `sgt probe` needs
  `--allow Statistics` (verify is unaffected).

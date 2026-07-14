# INT-14 — scheduled-shape-smoke (agent-engine only)

**Catalog:** `docs/testing/regression-suite/integration-scenarios.md` § INT-14
**Shape:** one realistic mid-size bot (30 authored steps, ~36 executions
with loop iterations) spanning the five most-used categories — variables,
logic, file, csv, database — run **only** through the real Agent process.
This is the "does the shipped process still run a realistic bot" canary.

Three triples share the identical step tree (generated together; only
job name/guid differ) and differ in the **run scope**:

| facet | scope | target | expected subset |
|-------|-------|--------|-----------------|
| `full` | `bot` (default) | — | every phase A→E |
| `runfrom` | `runFromStep` | `…0007` (crumb b:start) | B→E only |
| `stepchildren` | `stepAndChildren` | `…0005` (Phase A list loop) | the loop subtree only |

## Harness extensions this scenario added (Track 7, in-scope like Track 6's devTextParms)

1. **`expectations.run { scope, targetStepGuid }`** — forwarded to the
   Agent CLI as `--scope` / `--target-step-guid` (already supported there)
   and to the in-process StepExecutor constructor.
2. **`envelope.engines: ["agent"]`** — engine gate; under the other engine
   the triple SKIPS with reason `engine-gated: …`. The FP-3 "missing env;
   not a pass!" summary warning now counts only env skips, so an expected
   engine gate stays quiet on gate runs.
3. **FP-1 event-CSV harvest** — after an agent run, the verifier copies
   the Agent's per-run EventLogger CSV (private data dir, run-id filename)
   into the test scratch dir as `agent-events.csv`, so predictions can
   `read_value` it. INT-14 asserts step-complete rows for in-scope steps
   plus the run-complete row.

## Check table → predictions

- scope variants execute exactly the expected step subsets → breadcrumb
  list `equals` per facet (`crumbs-*`), plus SENTINEL-default proofs that
  out-of-scope phases never ran (`phase-a-untouched`,
  `everything-else-untouched` — a skipped `set-variable` leaves the parm
  default in place, which is stronger than absence-of-crumb)
- exit codes → `smoke.expectComplete` + the agent-runner's exit handling
  (run-complete seen, no timeout)
- agent CSV event log contains expected step-complete rows →
  `agent-event-csv*` predictions on the harvested `agent-events.csv`
- wall-clock within budget → `smoke.maxDurationMs` (30s per triple)

## Notes / gotchas

- **List loops publish `loopItem`**, not `currentValue` (that name belongs
  to dictionary loops and db-sql-query loop mode). `{slla:currentValue}`
  resolves to nothing and prints literally — first authoring attempt
  pinned that the hard way.
- `stepchildren` declares **no `requiresEnv`**: its subtree never touches
  the DB, so it must run even on a host without DB env (the canary should
  not silently skip for an env it doesn't use). `full`/`runfrom` do
  require `SGT_DEV_DB_CONNECTION`.
- DB table is fixed-name (`sgtester.sgt_int14_shape`, drop-first ARRANGE)
  — same concurrency caveat as the tier1 live-* DB triples and INT-05.
- No date/time actions on purpose: the two-engine TZ seeding split is
  Tier 1 territory; the canary keeps its assertions TZ-free.

- 2026-07-13 svar conversion: infra references now flow through `{svar:sgt…}` shared variables (customer-configurable; harness seeds the same names from SGT_* env) with a require-shared-vars preflight gate. Witnesses and prediction values unchanged.

# tier1-features/user-interactions/pickers-headless

## Target

`choose-file-dialog` + `choose-folder-dialog` — headless contract: with no
host UI bridge (`host.pickFile`), both fail IMMEDIATELY and cleanly (no
prompt, no hang), and the run continues.

## Manifest honesty

Flipped to `pass` on the headless contract alone — **the interactive
exact-value legs (a real picker returning a path into the variable) are
Tier 3 manual-assisted, not yet witnessed.** Same convention as the ftp
protocol split.

## Engine gate

`engines: ["in-process"]`. The picker actions are `platforms: ["browser"]`
(they exist to run in the editor renderer via the desktop IPC bridge), so
the real Agent platform-SKIPS them — the no-bridge failure contract is only
reachable under the in-process engine (whose executor adds
`additionalPlatforms: ["agent"]` and hosts no pickFile). Same convention as
the INT-14 agent-only split, opposite direction.

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | no host.pickFile → immediate clean step failure (both pickers) | baseline | steps 1+2 pinned failed |
| 2 | store-to variables untouched (SENTINEL) | this triple | pickers-fail-clean |
| 3 | run continues past both buried pickers | this triple | run-continued |
| 4 | agent platform gate skips (documented, not asserted here) | engine gate | — |
| 5 | interactive picker legs (real file/folder selection) | Tier 3 manual-assisted (deferred) | — |

## Expected values derived from

`choose-file-dialog.runner.ts` / `choose-folder-dialog.runner.ts` (fail
fast when `context.host?.pickFile` is absent), both actions'
`platforms: ["browser"]` declaration.

- 2026-07-13 standalone bootstrap: added a session-bootstrap preflight (require-shared-vars, bootstrap-only mode) + create-folder ahead of the original steps, so this bot is runnable standalone (not only via RunAllRegressionTests). Witnesses and prediction values unchanged.

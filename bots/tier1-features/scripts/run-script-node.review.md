# tier1-features/scripts/run-script-node

## Target

`run-script` — inline script written to a temp file and executed by the
selected interpreter (node here), with user arguments, stdout/stderr capture
and exit codes.

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | scriptLanguage=node happy path, stdout capture (trimEnd) | this triple | stdout-captured |
| 2 | user `arguments` reach the script as argv | this triple | inbot-file-witness, oob-file-witness |
| 3 | token resolution inside arguments | this triple | oob-file-witness |
| 4 | nonzero exit → step fails, stderr + exitCode output still recorded | this triple | stderr-captured, exit-code-three |
| 5 | temp script file cleanup (finally unlink) | implicitly (no residue assertable — tmpdir path is random) | — |
| 6 | bash / powershell / batch interpreters | deferred: same temp-file+execFile pipeline; node is the only interpreter guaranteed on every host that can run the engine | — |
| 7 | python interpreter | deferred: see run-python (blocked-runner) — python3-on-PATH gating belongs there | — |
| 8 | timeout kill path | deferred: slow-test candidate | — |

## Witnesses

- In-bot: `get-file-contents` (File plugin) reads the file the script wrote
  via `process.argv[2]`.
- Out-of-band: harness `read_value({file})` on the same scratch file.

## Envelope / cleanup

Script writes only into `{var:_sgtScratchDir}` (FP-8). The runner's own temp
script file lands in os.tmpdir() and is unlinked in a finally — not
assertable (random name), trusted to the runner's unit scope.

## Expected values derived from

Runner source (`run-script.runner.ts`): INTERPRETERS.node → `node <tmpfile>
<args>`; stdout/stderr trimEnd'd (unlike run-command); exit code from
execFile error. **Shares the Track 6 `err.code` exit-code fix with
run-command** (was: every nonzero exit reported -1).

## Known gaps / notes

- `run-python` is NOT covered here: its runner calls the Runner local-api
  (`runnerEnsureVenv` → discoverRunner reads the Runner's lock file) — it
  cannot execute under sgtester without a live StepwiseGO Runner. Manifest
  status: deferred (human-owned), see the internal product backlog Track 6 note.

- 2026-07-13 standalone bootstrap: added a session-bootstrap preflight (require-shared-vars, bootstrap-only mode) + create-folder ahead of the original steps, so this bot is runnable standalone (not only via RunAllRegressionTests). Witnesses and prediction values unchanged.

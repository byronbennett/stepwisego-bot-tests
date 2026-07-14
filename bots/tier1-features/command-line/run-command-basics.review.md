# tier1-features/command-line/run-command-basics

## Target

`run-command` — direct executable execution (execFile, no shell wrapping;
quoted-arg splitting; stdout/stderr/exit-code capture).

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | PATH-resolved executable, stdout capture | this triple | stdout-captured |
| 2 | exit code 0 stored (number) | this triple | exit-code-zero |
| 3 | quoted argument splitting (`-c "…"` survives as one arg) | this triple | oob-file-witness (the redirect ran inside sh) |
| 4 | token resolution inside arguments (`{var:_sgtScratchDir}`) | this triple | oob-file-witness |
| 5 | nonzero exit → step fails, exit code + stderr still stored | this triple | exit-code-seven, exit-code-seven-stepout, stderr-captured |
| 6 | workingDirectory prop | deferred: cheap follow-up permutation | — |
| 7 | timeout kill path | deferred: needs a sleeping child; slow-test candidate | — |
| 8 | Windows (cmd/powershell targets) | deferred: fixture is POSIX (uses /bin/sh, printf) — suite currently runs on macOS | — |

## Witnesses

- In-bot: `get-file-contents` (File plugin) reads the file the `sh -c`
  redirect wrote.
- Out-of-band: harness `read_value({file})` reads the same scratch file
  directly.

## Envelope / cleanup

All file artifacts under `{var:_sgtScratchDir}` (FP-8, harness-reaped). No
other machine state touched. POSIX-only payloads (noted in the job name).

## Expected values derived from

Runner source (`run-command.runner.ts`): execFile → stdout verbatim (printf
emits no trailing newline, nothing trims); stderr verbatim ("oops\n" — echo
appends the newline); numeric exit code. **Product fix shipped with this
fixture:** the error path read `err.status`, which promisified execFile never
sets — real exit codes live on `err.code`; both this runner and run-script
stored -1 for every nonzero exit before Track 6.

## Known gaps / notes

- splitArgs strips quotes anywhere (not only at token boundaries) — good
  enough here; exotic quoting is the action's own documented limitation.

- 2026-07-13 standalone bootstrap: added a session-bootstrap preflight (require-shared-vars, bootstrap-only mode) + create-folder ahead of the original steps, so this bot is runnable standalone (not only via RunAllRegressionTests). Witnesses and prediction values unchanged.

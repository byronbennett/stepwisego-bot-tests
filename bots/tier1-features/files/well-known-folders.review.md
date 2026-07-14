# tier1-features/files/well-known-folders

## Target

`get-appdata-folder`, `get-desktop-folder`, `get-documents-folder` — the
special-folder trio. Read-only, environment-dependent outputs, so this triple
asserts SHAPE and RELATIONS, never literal machine paths (portability per the
Track 4 handoff).

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | get-appdata-folder returns per-app path ending in 'stepwisego' | this triple | appdata-shape |
| 2 | get-desktop-folder leaf = Desktop | this triple | desktop-shape |
| 3 | get-documents-folder leaf = Documents | this triple | documents-shape |
| 4 | all three are absolute paths | this triple | shape regexes (`^([A-Za-z]:\\|/)`) |
| 5 | Desktop and Documents share a parent (home dir) | this triple | cross-consistency |
| 6 | three paths pairwise distinct | this triple | cross-consistency |
| 7 | per-OS appdata base (Roaming vs Application Support vs .config) | deferred: single-OS harness; the regex accepts any base, the 'stepwisego' leaf is the cross-OS invariant | — |
| 8 | folders physically exist on disk | deliberately NOT asserted: Desktop/Documents need not exist on server/CI images, and the actions are pure path builders (no fs access in the runner) | — |

## Witnesses

- Out-of-band: absolute-path + leaf-name regexes on the raw values.
- Second-action witness: each leaf re-derived in-bot by `get-filename` and
  compared exactly out-of-band ("stepwisego"/"Desktop"/"Documents") — two
  different code paths (runner's path.join vs path.basename) must agree.
- Relational witness (in-bot, since literal homes are machine-specific):
  `get-folder-path` of Desktop equalsExact that of Documents, plus pairwise
  distinctness → single crumb, asserted as exact array.

## Envelope / cleanup

Nothing touches disk — all five actions are pure path computation (FP-8
SAFE_ACTIONS; no --allow needed for this fixture, no scratch usage beyond
the injected parms).

## Expected values derived from

Runner source (`get-special-folder.runner.ts`): appdata = platform base +
"stepwisego" (legacy GetAppDataPath contract); desktop/documents =
os.homedir() + fixed leaf. No fs calls — hence no existence assertions.

## Known gaps / notes

- Pinned: get-appdata-folder returns the STEPWISEGO app-data folder, not the
  bare OS AppData root — the 'stepwisego' leaf is the contract.
- Windows drive-letter form is accepted by the regexes but exercised only
  when the suite runs on Windows.

- 2026-07-13 standalone bootstrap: added a session-bootstrap preflight (require-shared-vars, bootstrap-only mode) + create-folder ahead of the original steps, so this bot is runnable standalone (not only via RunAllRegressionTests). Witnesses and prediction values unchanged.

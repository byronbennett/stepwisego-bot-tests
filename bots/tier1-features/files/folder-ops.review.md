# tier1-features/files/folder-ops

## Target

`create-folder`, `delete-folder`, `get-files`, `get-folders` — directory
lifecycle and enumeration.

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | create-folder nested path, parents auto-created | this triple | create-folder-nested-and-idempotent |
| 2 | create-folder on existing path → idempotent success | this triple | create-folder-nested-and-idempotent + smoke |
| 3 | get-files non-recursive (top level only) | this triple | get-files-counts, in-bot-membership |
| 4 | get-files recursive walks subtree | this triple | get-files-counts, in-bot-membership |
| 5 | get-files fileConditions extension filter | this triple | get-files-counts (csv=2 pre-append) |
| 6 | get-files maxFiles cap | this triple | get-files-counts |
| 7 | get-files keepExistingItems=true appends | this triple | get-files-counts (2+2=4) |
| 8 | get-files fileName/size/date condition axes | deferred: extension pins the fileConditions pipeline; other axes are unit-level (file-filter.ts) | — |
| 9 | get-folders non-recursive | this triple | get-folders-counts |
| 10 | get-folders recursive | this triple | get-folders-counts |
| 11 | get-folders glob pattern (name-match only, no inheritance) | this triple | get-folders-counts (s* → 1) |
| 12 | delete-folder non-recursive on empty folder | this triple | delete-empty-folder |
| 13 | delete-folder non-recursive on non-empty → ENOTEMPTY, buried, nothing destroyed | this triple | non-recursive-refuses-non-empty |
| 14 | delete-folder recursive removes subtree | this triple | recursive-delete-subtree |
| 15 | delete-folder missing path, default → success | this triple | smoke (step passes) |
| 16 | delete-folder missing path, throwIfNotExist=true → error, buried | this triple | smoke expectErrorCount=0 |
| 17 | delete-folder protected-path guard | deferred: guard paths live outside the scratch jail; unit-tested in path-helpers | — |
| 18 | get-files on a missing folder → error | deferred: same readdir-ENOENT surface as get-file-contents-missing (crud triple) | — |

## Witnesses

- Counts (order-independent, out-of-band): `size_of` on every listing var —
  readdir order is platform-dependent so exact array equality is deliberately
  avoided.
- Membership (in-bot): 8 contains/notContains conditions using the engine's
  item-wise list membership against token-built session paths (positive AND
  negative: non-recursive must NOT contain sub/c.txt; pattern s* must NOT
  contain made). Single crumb, asserted as exact array.
- Deletion dual witness: in-bot file-exists transitions + harness
  `file_exists({file})` on the folder and its deepest file.
- Collateral-damage witness: after all deletes, a.txt still exists and b.csv
  still has its exact content (out-of-band read).

## Envelope / cleanup

Everything under `{var:_sgtScratchDir}/fo/` — the delete actions themselves
remove made/nested and the whole sub/ subtree as actions-under-test; the
harness reaps the remainder (a.txt, b.csv, made/) with the scratch dir.

## Expected values derived from

Runner source: mkdir recursive (idempotent); rmdir for non-recursive
(ENOTEMPTY on non-empty), fs.rm recursive; ENOENT swallowed unless
throwIfNotExist; glob→regex is name-only per directory entry; fileConditions
extension axis compares dot-stripped case-insensitive.

## Known gaps / notes

- Pinned: file-exists (fs.access) answers for directories too — usable as
  the folder-existence witness; there is no separate folder-exists action.
- Pinned: maxFiles caps during the walk (first N in readdir order), not
  post-filter.
- Pinned: get-folders pattern matches each folder's NAME (not path), and
  recursion descends into non-matching folders.

- 2026-07-13 standalone bootstrap: added a session-bootstrap preflight (require-shared-vars, bootstrap-only mode) + create-folder ahead of the original steps, so this bot is runnable standalone (not only via RunAllRegressionTests). Witnesses and prediction values unchanged.

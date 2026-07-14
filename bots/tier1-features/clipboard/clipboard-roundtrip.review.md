# tier1-features/clipboard/clipboard-roundtrip

## Target

All five Clipboard actions in one self-contained bot: `set-clipboard`,
`get-clipboard`, `check-clipboard-data`, `set-datatable-to-clipboard`,
`clear-clipboard`.

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | set → get plain-text round-trip | this triple | set-get-roundtrip |
| 2 | check with data present → boolean true | this triple | check-after-set |
| 3 | DataTable → clipboard (comma delimiter, includeHeaders=true) | this triple | datatable-csv-rendering |
| 4 | clear → check reports false | this triple | check-after-clear |
| 5 | DataTable delimiters tab/pipe/semicolon, includeHeaders=false | deferred: same `unparseRows` path pinned by the CSV plugin fixtures; one representative rendering pinned here | — |
| 6 | multiline / unicode payloads | deferred: pbcopy/pbpaste byte-fidelity candidate for a follow-up permutation | — |
| 7 | browser (`navigator.clipboard`) branch | deferred: FP-7 — needs a desktop/hosted host; this triple exercises the Node shell fallback | — |

## Witnesses

- In-bot: writers and readers are different actions (`set-clipboard` ↔
  `get-clipboard` ↔ `check-clipboard-data`), and the DataTable arrange uses
  `csv-read` (CSV plugin) — no action verifies itself.
- Out-of-band: none possible — the OS clipboard has no harness-side reader
  primitive. The dual-witness rule is satisfied action-to-action; noted as a
  deliberate deviation (same class as the wait-until timing fixtures).

## Envelope / cleanup

**Machine-state side effect:** this bot uses the REAL OS clipboard. Whatever
the user had on the clipboard before the run is lost, and the bot leaves the
clipboard EMPTY (clear-clipboard is the cleanup). Nothing is saved/restored
by design — restoring would need the same clipboard APIs under test.
`envelope.exclusive` (FP-6) does not exist yet; when it ships, this fixture
is a prime candidate.

## Expected values derived from

Runner sources + `unparseRows` (Papa.unparse, newline "\n", no trailing
newline). Node hosts use the Track 6 shell fallback (`clipboard-shell.ts`:
pbcopy/pbpaste on macOS, PowerShell on Windows, xclip/xsel/wl-copy on
Linux) — before that fix, 4 of these 5 actions failed on the agent with
"Clipboard access requires desktop runtime". `check-clipboard-data` stores a
real boolean (not a string). Probe reproduced every value.

## Known gaps / notes

- Linux CI would need xclip/xsel/wl-clipboard installed; macOS and Windows
  have their tools built in. There is no env gate because the actions
  themselves are the feature under test — a missing tool is a real failure.
- get-clipboard after clear returns "" (pbpaste of an emptied clipboard);
  asserted indirectly via check-after-clear=false.

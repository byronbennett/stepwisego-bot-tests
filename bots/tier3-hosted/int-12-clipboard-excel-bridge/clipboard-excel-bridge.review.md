# tier3-hosted/int-12-clipboard-excel-bridge/clipboard-excel-bridge

INT-12 (scenario catalog) — a DataTable crosses the REAL Windows OS clipboard
into a second workbook; null-cell seam, paste anchoring, and the bot-scoped
xl-clipboard design contract, with clipboard-restore etiquette.

**Run protocol:** vm-agent-shim over SSH; `envelope.exclusive: true` (machine
clipboard is global state — never run alongside a human using the VM desktop).
First witnessed green 2026-07-12. 17 steps / 10 actions — over the Tier 1
batching guideline, justified as a flagship Tier 2 integration scenario (like
INT-01/INT-08).

| # | permutation | covered by | prediction |
|---|-------------|------------|------------|
| 1 | DataTable → OS clipboard, tab delimiter, includeHeaders (exact rendering pinned live: LF row joins, no trailing newline, null → empty field) | this triple | datatable-clipboard-rendering |
| 2 | null cell (never-written B2) through the whole seam: DataTable → clipboard → paste → csv | this triple | datatable-clipboard-rendering / paste-region-lands-at-anchor |
| 3 | xl-paste-from-clipboard anchored at B2 (region offset pinned; ExcelJS csv drops the leading empty row, LF joins) | this triple | paste-region-lands-at-anchor |
| 4 | xl-copy-to-clipboard is BOT-SCOPED (v0.2.147 design: OS clipboard untouched; internal `__xl_clipboard` marker replayed by paste) | this triple | xl-copy-is-bot-scoped |
| 5 | DataTable shape through the bridge (1 data row × 3 cols) | this triple | datatable-shape |
| 6 | comma/pipe/semicolon delimiters, 100KB payload, unicode round-trip | deferred: Tier 1 clipboard triples on the Mac gate host own the raw set/get matrix; this scenario owns the Excel bridge |

Etiquette: ARRANGE captures the operator's clipboard (`ignoreErrors`, the VM
clipboard may be empty), CLEANUP restores it. Note: restoring an EMPTY capture
fails benignly (`set-clipboard` rejects empty content — pre-existing contract,
buried by ignoreErrors).

## Product bug found AND fixed by this scenario (the reason INT-12 exists)

**`set-clipboard`/`set-datatable-to-clipboard` destroyed multiline content on
Windows.** `clipboard-shell.ts` piped stdin lines into
`Set-Clipboard -Value $input` — PowerShell binds `$input` as an array and
$OFS-joins it, so EVERY newline became a single space: a 2-row DataTable
landed on the clipboard as one space-joined line
(`"hcol\thmid\thnum vone\t\t99"`). Any real bot pasting multi-row data on
Windows was corrupted. Fixed (same track) by reading raw stdin bytes +
UTF-8 decode into ONE string on the write side, and `Get-Clipboard -Raw` +
UTF-8 output encoding on the read side (exact newline preservation, unicode
survives the pipe). Prediction #1's byte-exact vector guards the regression.

- 2026-07-13 standalone bootstrap: added a session-bootstrap preflight (require-shared-vars, bootstrap-only mode) + create-folder ahead of the original steps, so this bot is runnable standalone (not only via RunAllRegressionTests). Witnesses and prediction values unchanged.

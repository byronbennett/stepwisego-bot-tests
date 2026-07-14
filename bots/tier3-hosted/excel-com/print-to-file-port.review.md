# tier3-hosted/excel-com/print-to-file-port

xlcom-print — unattended PrintOut witnessed end-to-end via a printer bound to
a file port, plus the loud-failure contract for unknown printers.

**Run protocol:** vm-agent-shim over SSH (see save-as-roundtrip.review.md).
First witnessed green 2026-07-12.

**One-time VM setup (documented internally):**
- `Add-PrinterPort -Name "<sgtHostedPrintDir>\out.pdf"` +
  `Add-Printer -Name "SGT-PDF" -DriverName "Microsoft Print to PDF" -PortName <that path>`
  — the file-port trick makes the driver write the PDF to the port path with
  no dialog. `<sgtHostedPrintDir>` is the `{svar:sgtHostedPrintDir}` shared
  variable — configurable per machine.
- `LegacyDefaultPrinterMode=1` (HKCU) + default printer = SGT-PDF. Without
  this, "let Windows manage my default printer" re-points the default at the
  most-recently-used device — during authoring that was a REAL HP OfficeJet,
  and the print job went to it (see bug note below).

| # | permutation | covered by | prediction |
|---|-------------|------------|------------|
| 1 | explicit printer, whole workbook, FULL-session variable input | this triple | print-produced-pdf-harness / print-produced-pdf-in-bot |
| 2 | unknown printer → step FAILS loudly, nothing spooled | this triple | bad-printer-fails-loudly |
| 3 | sheet-scoped print, copies>1 | deferred: same PrintOut call shape; copies is spooler-side and not assertable through the file port |

Notes / product bugs found by this triple (both fixed in this track):
- **Silent wrong-printer fallback (FIXED):** the sidecar swallowed a failed
  `ActivePrinter` assignment, so `printer:"X"` silently printed to the
  DEFAULT printer — real hardware during authoring. `Set-ActivePrinter` now
  probes Excel's `"<name> on NeXX:"` alias forms (Excel rejects bare names
  and spooler port names) and THROWS if the printer is not assignable.
  Prediction #2 guards the contract.
- The spool job is asynchronous: the triple waits 10s, then `move-file`
  relocates the port file into scratch — which both witnesses the print and
  resets the port for the next run (self-cleaning).
- The port path is VM-specific by nature (hosted triples are host-bound); the
  bot references it via the `{svar:sgtHostedPrintDir}` shared variable, set
  once per machine.

- 2026-07-13 svar conversion: infra references now flow through `{svar:sgt…}` shared variables (customer-configurable; harness seeds the same names from SGT_* env) with a require-shared-vars preflight gate. Witnesses and prediction values unchanged.

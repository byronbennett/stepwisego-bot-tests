# tier3-hosted/excel-com/save-as-pdf-export

xlcom-save-as-pdf — ExportAsFixedFormat via real Excel: whole workbook from a
live Full-mode session, single sheet from a literal path.

**Run protocol:** vm-agent-shim over SSH (see save-as-roundtrip.review.md).
First witnessed green 2026-07-12.

| # | permutation | covered by | prediction |
|---|-------------|------------|------------|
| 1 | whole workbook from FULL-session variable | this triple | pdf-magic-harness / pdf-magic-in-bot |
| 2 | sheet=Sheet2 from literal path | this triple | pdf-magic-harness |
| 3 | page-content assertion ("pdf-page-two" text inside the PDF) | deferred: no PDF text-extraction capability exists in the platform (no pdf plugin) — witness stops at %PDF magic + nonzero size, per the excel playbook's stated fallback |
| 4 | missing sheet name (error contract) | deferred: generic Worksheets.Item error path, shared with xlcom-print |

Notes:
- Both PDFs are read twice: in-bot (`get-file-contents`) and out-of-band by
  the harness (`read_value` on the pulled-back scratch artifact) — the dual
  witness crosses the VM boundary.

- 2026-07-13 standalone bootstrap: added a session-bootstrap preflight (require-shared-vars, bootstrap-only mode) + create-folder ahead of the original steps, so this bot is runnable standalone (not only via RunAllRegressionTests). Witnesses and prediction values unchanged.

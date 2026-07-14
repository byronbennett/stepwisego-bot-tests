# StepwiseGO Bot Tests

This repository contains the regression test suite the StepwiseGO team runs
against every release — 136 self-checking bots covering step
actions, engine patterns, and integration chains across the product. Run
them on your own machine to:

- **Smoke-test your installation** after installing or upgrading StepwiseGO.
- **Prove out your infrastructure wiring.** When the database tests pass,
  your connection string, permissions, and driver stack are proven — not
  assumed. Same for SharePoint, email, and AI providers.
- **Study real-world bot patterns.** Every bot here arranges its own
  preconditions, verifies its results with independent witnesses, and cleans
  up after itself (ARRANGE → ACT → ASSERT → CLEANUP).

**28 of the bots need no external infrastructure at all**
— files, Excel, JSON/XML/CSV, regex, logic, scripting; the FTP and HTTP
tests spin up local servers on the fly. You can clone this repo and get a
meaningful first run with zero configuration.

## Compatibility

Each release of this suite targets a specific StepwiseGO version. The
`VERSION` file (and the git tag on this repository) says which one — this
copy targets **StepwiseGO v0.2.192**. Use the suite version that matches
your installed StepwiseGO version, or the closest one below it. Bots may use
actions introduced in the stated version; on older installations those tests
will error rather than skip.

## Quick start

### Option A — the installer bot (recommended)

This repository ships an installer bot you paste straight into the editor —
it downloads the suite from here and sets everything up in the right place.

1. Install the StepwiseGO desktop app and open it.
2. In **Settings → Storage**, note your **Bot Files Folder** (set one if you
   haven't).
3. On GitHub, open
   [`install/InstallRegressionTests.stepwise-steps.txt`](install/InstallRegressionTests.stepwise-steps.txt)
   and copy the entire file (use the **Copy raw file** button — the copy
   icon in the file toolbar).
4. In StepwiseGO, create a new bot, click once on the **Steps** panel so it
   has focus, and press **Ctrl+V** (macOS: **Cmd+V**). The installer's steps
   and variables appear in the tree.
5. Save the bot **into your Bot Files Folder** (e.g. as
   `InstallRegressionTests`) — the installer creates `RegressionTests` next
   to wherever it is saved. (Run it unsaved and it falls back to your
   Documents folder.)
6. Run the bot. It downloads the newest suite from this repository into
   `RegressionTests` and cleans up after itself. Re-running it later
   **upgrades the suite in place** — it replaces the suite's folders but
   never touches your `.runs` results or your own files.
7. Create the suite's shared variables — see
   [Create the variables](#create-the-variables-copypaste) below.
8. Open any test bot and run it — or run `RunAllRegressionTests.sgbot` to
   execute the whole suite. The master runner writes a `results.csv` (one
   row per test: PASS / FAIL / SKIPPED) into a `.runs/<run-id>/suite/`
   folder under `RegressionTests` and logs a summary line at the end.

If you've already downloaded this repository, `install/InstallRegressionTests.sgbot`
is the same installer as an importable bot file.

### Option B — manual copy

1. Create a folder named `RegressionTests` inside your Bot Files Folder.
2. Copy the **contents** of this repository's `bots/` folder into
   `RegressionTests` — you should end up with
   `RegressionTests/RunAllRegressionTests.sgbot`,
   `RegressionTests/tier1-features/`, and so on. (Copy the contents, not the
   repo root — the editor lists bots only a few folder levels deep.)
3. Continue from step 7 above.

## Shared variables

All external connections flow through StepwiseGO **Shared Variables** —
encrypted, machine-local, never written into the bots themselves. The bots
reference them as `{svar:name}` tokens; you supply the values once, in the
editor.

### Create the variables (copy/paste)

1. In StepwiseGO, open the **Shared Variables** page (the key icon in the
   activity bar).
2. First time only: click **Set Password** and choose a Shared Variable
   Password — it encrypts every value at rest on your machine.
3. On GitHub, open
   [`starter-bundle/shared-variables.json`](starter-bundle/shared-variables.json)
   and copy the entire file (**Copy raw file** button).
4. Back in StepwiseGO, click the **Import** (upload) icon, choose the
   **Paste JSON** tab, paste, and click **Import**.
5. The variables appear in a yellow **Pending imports** panel — click
   **Save All**. If you already have variables with the same names, you'll
   be asked per variable whether to overwrite or skip.
6. Every suite variable now exists under the **Regression Tests** category,
   kept separate from your own variables (use the category filter to hide or
   show them). Variables with no value yet show an **orange &#42;** next to
   their name — they are not configured, and tests that need them will
   **skip** (not fail) until you fill them in.
7. Fill in values for the resources you have (see the table below and the
   guides in `docs/`): double-click a variable to edit it —
   connection-typed variables (database, SharePoint, email) open a
   structured form. The orange &#42; disappears once a value is saved.
8. Leave the rest empty — tests that need them will **skip with a warning**
   naming exactly what is missing.

Alternative: click **Import** → **Bundle file** and select
`starter-bundle/stepwisego-bot-tests.svarbundle` (bundle password
`stepwisego`, not your Shared Variable Password) — same variables, same
pending-imports flow.

### The variables

| Name | Type | Used by | What to put in it |
|---|---|---|---|
| `sgtDbMssql` | dbConnection | database, int-03, int-05, int-11, int-14 | SQL Server connection for the database tests. Point it at a scratch database — tests create and drop their own session-named tables. |
| `sgtDbPg` | dbConnection | database (live-pg), int-02 | PostgreSQL connection for the database tests. Scratch database only. |
| `sgtDbMysql` | dbConnection | database (live-mysql) | MySQL connection for the database tests. Scratch database only. |
| `sgtOdbcMssql` | text (secure) | database (odbc-roundtrip) | Full DSN-less ODBC connection string for SQL Server (requires the Microsoft ODBC driver installed locally). |
| `sgtSharePoint` | sharepointConnection | sharepoint, int-01, int-08 | SharePoint Online connection (Microsoft Entra app registration) pointed at a dedicated TEST site — the tests create and delete lists, items, files, and folders on it. Certificate auth unlocks the SP-REST-backed actions; client-secret-only covers the Graph-backed ones. |
| `sgtMailGraph` | emailConnection | email (graph-*) | Microsoft 365 / Graph mail connection (app registration with Mail permissions) for the Graph email tests. Use a dedicated test mailbox. |
| `sgtMailGraphUpn` | text | email (graph-*) | UPN (email address) of the Graph test mailbox — must match the mailbox sgtMailGraph points at. |
| `sgtMailGraphBulkFolderId` | text | email (graph-roundtrip bulk leg) | Graph folder ID of a staging folder in the test mailbox used by the folder-scoped bulk-delete leg. Graph addresses custom folders by ID, not display name. Create a folder (e.g. 'bot-tests-bulk') and look up its ID via Graph Explorer. |
| `sgtMailAccount` | text | email (imap-*/smtp-*), int-02, int-10 | Address of a DEDICATED IMAP/SMTP test mailbox. The tests send mail to it, move messages, flag them, and DELETE them — never point this at a personal or production inbox. |
| `sgtMailPassword` | text (secure) | email (imap-*/smtp-*), int-02, int-10 | App password for the test mailbox (e.g. a Gmail app password). Never a real account password. |
| `sgtMailImapHost` | text | email (imap-*), int-02, int-10 | IMAP host of the test mailbox. |
| `sgtMailImapPort` | text | email (imap-*), int-02, int-10 | IMAP port (TLS). |
| `sgtMailSmtpHost` | text | email (smtp-*), int-02 | SMTP host of the test mailbox. |
| `sgtMailSmtpPort` | text | email (smtp-*), int-02 | SMTP port (TLS). |
| `sgtAiOpenAi` | text (secure) | ai | OpenAI credential for the AI tests, as a JSON payload. The tests make a handful of small completions per run (pennies of usage). |
| `sgtAiOllama` | text | ai (local-model legs) | Local Ollama credential for the AI tests, as a JSON payload. Optional — only needed if you want the local-model legs. |
| `sgtHostedPrintDir` | text | tier3-hosted (excel-com print-to-file-port) | Windows folder the tier-3 Excel print-to-file test writes its PDF into. Windows + desktop Excel only. |
| `sgtPathToken` | text | int-11 | Fixture value for the shared-variable mechanics test (int-11). Not a credential — keep the pre-filled value. |

Notes:

- `sgtPathToken` ships pre-filled — it is a fixture value for the
  shared-variable mechanics test, not a credential. Keep it as-is.
- Secure values (passwords, API keys) are encrypted at rest with your Shared
  Variable Password and never leave your machine.

## Setting up each resource

Short versions below; full walkthroughs live in `docs/`.

- **Databases** (`docs/setup-database.md`) — point `sgtDbMssql` / `sgtDbPg`
  / `sgtDbMysql` at a **scratch database**. The tests create their own
  session-named tables (`sgt_*`) and drop them afterwards; the account needs
  CREATE/DROP TABLE rights. Never point them at production data.
- **SharePoint** (`docs/setup-sharepoint.md`) — a dedicated test site plus a
  Microsoft Entra app registration. The tests create and delete their own
  lists, items, files, and folders on that site.
- **Email** (`docs/setup-email.md`) — a **dedicated test mailbox**. The
  tests send mail to it, move, flag, and **delete** messages. IMAP/SMTP
  family (e.g. Gmail app password) and Microsoft 365 Graph family are
  configured separately; set up either or both.
- **AI providers** (`docs/setup-ai.md`) — an OpenAI API key (a run costs
  pennies) and, optionally, a local Ollama model.
- **FTP / HTTP / files / Excel** — no setup. These tests are fully
  self-contained.

## How skipping works

Every test that needs external infrastructure begins with a **Require
Shared Variables** step. If any required variable is missing or empty, the
bot logs an amber warning naming exactly what is missing, records itself as
skipped, and completes cleanly — **a skipped test is never reported as a
failure.** Fill in the variables later and re-run; nothing else changes.

## Running the whole suite

1. Open `RunAllRegressionTests.sgbot` (at the root of `RegressionTests`).
2. Run it. It discovers every test bot in the folder tree and runs them one
   at a time (child-bot fixtures, previous run outputs, and the
   Windows-only `tier3-hosted` bots are excluded automatically).
3. When it finishes, open the `results.csv` it names in its summary log
   line. Columns: `botFile`, `outcome` (PASS / FAIL / SKIPPED),
   `preflightStatus` (which variables a skipped test was missing).
4. For any failure, open that bot in the editor and run it alone — each
   bot's log and audit CSV pinpoint the failing check. The co-located
   `.review.md` file explains what the test proves and how its expected
   values were derived.

Notes: a handful of tests (name contains "fail", e.g. `end-bot-fail`,
`require-shared-vars-fail`) are **designed to fail** — they prove the
failure path itself works, and a FAIL for one of them is expected, not a
problem. The run ends **failed** overall when any test failed (so
schedulers notice);
the `tier2-shapes/int-14-*` bots are excluded from discovery (they exist to
test specific run scopes) — run them individually if you like; on Windows
with desktop Excel installed you can run the `tier3-hosted` bots
individually. Three dialog-driven tests under `tier1-features/user-interactions/`
(Choose From List, Confirm Dialog, Input Dialog) are also excluded — they
wait for a UI response and would hang an unattended run. Run them
individually in the editor (where you can answer the dialog) if you want
to see them.

## Repository layout

```
bots/
  RunAllRegressionTests.sgbot   the master runner
  tier1-features/<category>/    one folder per action category
  tier2-shapes/int-NN-*/        integration chains (multi-action scenarios)
  tier3-hosted/                 Windows + desktop Excel only
install/                        the installer bot (paste payload + .sgbot)
starter-bundle/                 the variables to import (paste JSON + bundle)
docs/                           per-resource setup + troubleshooting + test index
VERSION                         the StepwiseGO version this suite targets
```

Each test is a **triple**: the runnable `<name>.sgbot`, a
`<name>.expectations.json` (the machine-checked assertions our internal
harness runs), and a `<name>.review.md` (a human record of what the test
proves, its permutation matrix, and how expected values were derived). You
only need the `.sgbot` files to run the suite — the other two are shipped
as documentation of exactly what each test verifies. `fixtures/` folders
hold child bots and seed data used by their test; they are not tests
themselves.

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Test errors instead of skipping | StepwiseGO older than this suite's `VERSION` — upgrade, or check out the matching suite tag |
| Ctrl+V doesn't paste the installer | Click the Steps panel first (focus must not be in a text field or dialog), and copy the **entire** payload file — the text must start with `STEPWISE_CLIPBOARD_V1:` |
| No "Paste JSON" tab in the import dialog | StepwiseGO older than this suite's `VERSION` — upgrade, or use the bundle file instead |
| A variable shows an orange &#42; | It has no value yet — double-click to configure it, or leave it empty (tests that need it skip) |
| Bundle import rejects the password | Use the bundle password `stepwisego` (not your Shared Variable Password) |
| Bots missing from the editor's list | The repo root was copied instead of `bots/` **contents** — the extra folder level pushes bots past the editor's folder depth |
| Database tests fail on permissions | The account can't CREATE/DROP tables in the scratch database |
| SharePoint tests fail with 401/403 | App registration is missing consent, or the site URL doesn't point at your test site; SP-REST actions additionally need certificate auth |
| Email tests fail to connect | Wrong host/port, or the mailbox needs an app password (Gmail: enable 2FA, then create one) |
| A test both passed and "skipped" appears in results | That's two different tests — check the `botFile` column |
| Running a Choose From List / Confirm Dialog / Input Dialog test directly seems to hang | Expected outside the editor — it's waiting for a UI response with no host to answer it. Run it in the editor (you'll see the real dialog), or set `STEPWISE_PROMPT_TIMEOUT_SECONDS=30` before a direct CLI run to see the timeout path instead |

## Contributing & license

This suite is developed in the StepwiseGO monorepo and mirrored here, so
pull requests against the bots can't be merged directly — changes flow from
the canonical suite. Issues are very welcome: a test that fails on your
setup (and shouldn't) is exactly the feedback this repo exists for.

Licensed under the terms in `LICENSE`.

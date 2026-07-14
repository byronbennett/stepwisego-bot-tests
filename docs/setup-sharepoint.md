# SharePoint setup

The SharePoint tests create and delete their own lists, list items, files,
and folders. Give them a **dedicated test site** — never a site with real
content.

## What you need

1. **A test site**, e.g. `https://yourtenant.sharepoint.com/sites/BotTests`.
2. **A Microsoft Entra app registration** (client-credentials / app-only):
   1. Azure Portal → Microsoft Entra ID → App registrations → New.
   2. Note the **Tenant ID** and **Application (client) ID**.
   3. Grant **Microsoft Graph → Application → `Sites.Selected`** (or
      `Sites.ReadWrite.All` for the simple-but-broad option) and admin-consent.
      With `Sites.Selected`, also grant the app write access to the test
      site specifically.
3. **Credential material** — two options:
   - **Certificate (recommended — unlocks everything):** create a
     self-signed cert, upload the public half to the app registration, and
     select certificate auth in the `sgtSharePoint` connection editor.
     SharePoint's REST endpoints reject app-only tokens minted with a client
     secret, and several actions (select/update/delete/download/create-list)
     go through SP REST — secret-only setups will see those tests fail
     with "Unsupported app only token".
   - **Client secret (Graph-backed actions only):** quicker to set up; the
     Graph-backed tests (insert items, upload, folders) work, the SP-REST
     ones don't.

## Fill in the variable

1. On the Shared Variables page, double-click `sgtSharePoint`.
2. Enter tenant ID, client ID, the certificate (or secret), and the test
   site URL.
3. Run `tier1-features/sharepoint/list-lifecycle-roundtrip` to prove the
   wiring end to end (it creates a list, writes rows, reads them back, and
   deletes the list).

Used by `tier1-features/sharepoint/` and the int-01 / int-08 chains.

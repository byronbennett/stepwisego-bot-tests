# Email setup

**Use a dedicated test mailbox.** The email tests send messages to the
mailbox, then search, move, flag, and **delete** them. Session markers keep
them from touching anything they didn't create, but a dedicated mailbox is
the rule regardless — never a personal or production inbox.

There are two independent families; set up either or both.

## IMAP/SMTP family — `sgtMail*`

Any provider with IMAP + SMTP works. Gmail example:

1. Create a fresh Gmail account for testing.
2. Enable 2-factor auth, then create an **app password**
   (Account → Security → App passwords).
3. Fill in the variables:
   - `sgtMailAccount` — the address, e.g. `my-bot-tests@gmail.com`
   - `sgtMailPassword` — the app password
   - `sgtMailImapHost` / `sgtMailImapPort` — `imap.gmail.com` / `993`
   - `sgtMailSmtpHost` / `sgtMailSmtpPort` — `smtp.gmail.com` / `465`
4. Run `tier1-features/email/imap-roundtrip` to prove the wiring (sends a
   message to the mailbox, finds it, verifies sender/recipients, deletes it).

Used by `tier1-features/email/imap-*` and `smtp-*`, plus the int-02 and
int-10 chains.

## Microsoft 365 / Graph family — `sgtMailGraph*`

Needs an Entra app registration with **application** Mail permissions
(`Mail.ReadWrite` + `Mail.Send`, admin-consented) and a test mailbox in
your tenant. The same app registration as SharePoint works fine.

1. Fill `sgtMailGraph` (tenant ID, client ID, client secret, default
   mailbox UPN).
2. `sgtMailGraphUpn` — the test mailbox address (must match).
3. `sgtMailGraphBulkFolderId` — create a folder in that mailbox (e.g.
   `bot-tests-bulk`) and put its Graph **folder ID** here. Graph addresses
   custom folders by ID; find it with Graph Explorer:
   `GET /users/{upn}/mailFolders` → copy the folder's `id`.
   The folder-scoped bulk-delete test only ever points at this folder.
4. Run `tier1-features/email/graph-roundtrip`.

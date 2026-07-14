# tier1-features/sharepoint/library-files-folders

## Target
`sp-manage-folder` (Create / List / Delete) + `sp-upload-file` (single,
overwrite matrix) against the live Tester site's Documents library, app-only
client-credentials auth via the harness-injected `{var:devGraphSp}`
connection. These two actions are the pure-Graph half of the SharePoint
plugin (no SP REST involved), which is why they were live-verifiable before
the tenant's certificate landed.

## Safety design
- Everything happens inside a session folder `sgt-{var:_sgtSessionId}-fld`
  created at the library root and deleted in CLEANUP (the delete removes the
  uploaded file with it). No standing folder or file is ever named.
- `envelope.exclusive: true` per the category playbook (tenant throttling on
  parallel gate runs).

## Product bugs this triple guards (found live, fixed in this track)
1. **Drive URL construction** — both runners built drive endpoints as
   `{siteColonPath}/drives/{driveId}/…`; Graph rejects that with
   `400 "Url specified is invalid"` for path-addressed sites (i.e. every
   `/sites/<name>` site). Fixed to the global `{GRAPH_BASE}/drives/{driveId}/…`
   form the attachment helpers already used. Every step of this triple
   exercises the fixed form; the Create step is the regression witness
   (it fails first if the site-prefixed form comes back).
2. **Client-credentials scope** — `acquireToken` requested permission-style
   scopes (`…/Sites.ReadWrite.All …/Files.ReadWrite.All`) which Azure rejects
   for client-credentials flows (`AADSTS1002012`); now `.default` for
   secret/certificate auth, mirroring the email plugin. Any step here fails
   at token acquisition if that regresses.

## Permutation matrix
| # | Permutation | Covered by | Check id / prediction id |
|---|---|---|---|
| 1 | Create folder (root-level path) → success + URL | this triple | pred-folder-created |
| 2 | Upload fresh file, unicode filename (`sgt-ūpløad-源.txt`), overwrite=false | this triple | pred-upload-published-id |
| 3 | Re-upload same name, overwrite=true → in-place replace (same driveItem id, not a duplicate) | this triple | pred-overwrite-replaces-in-place |
| 4 | Re-upload same name, overwrite=false → pinned conflict (`Upload failed (409)` / `nameAlreadyExists`) | this triple | pred-conflict-is-specific |
| 5 | List folders at library root → session folder present (DataTable loop scan) | this triple | pred-folder-visible-in-list |
| 6 | Delete folder → success; children removed with it | this triple | pred-delete-succeeded + pred-oob-folder-gone |
| 7 | Double-delete → pinned `Folder not found` | this triple | pred-double-delete-not-found |
| 8 | Uploaded *content* byte-fidelity readback (v2 REPLACED body) | deferred: needs the SP REST half (select `downloadAttachments`) or a harness drive-content reader — post-certificate follow-up |
| 9 | `fieldMappings` metadata on upload | deferred to the library-metadata permutation of the field-type triples (needs select to read back) |
| 10 | Batch upload (`uploadMode: "batch"`) | deferred: same readback dependency |
| 11 | Nested folder paths (`parent/child`) + `loopVariable` bulk create | deferred: nested-path leg worth adding once content readback exists so the triple stays ≤8 actions |

## Witnesses
- In-bot: `sp-manage-folder List` reads back the folder Create through a
  different Graph endpoint (`/children?$filter=folder ne null` vs POST
  `/children`); upload replacement is pinned by driveItem-id equality across
  the two uploads.
- Out-of-band: Graph reader `read_rows(Documents, {FileLeafRef: <session
  folder>})` witnesses **absence** after cleanup. Presence is witnessed
  in-bot (List step) because predictions run post-run, after CLEANUP has
  removed the folder — same witness-destruction constraint the DB fixtures
  solve with harness-side reaping; a library-item reaper doesn't exist (and
  isn't needed while cleanup stays in-bot).
- Error legs D-style: both failure permutations are buried inside Error
  Handler steps whose `errorMessage` step-outs the predictions pin, so the
  run itself stays green (`expectErrorCount: 2`).

## Known gaps / notes
- The List action's documented `parentFolder` prop is dead — the runner
  scopes listing by `folderPath` (a `/` lists the root). Logged in the internal product backlog
  under Plugins — SharePoint; this triple uses `folderPath: "/"` per actual
  behavior.
- Content fidelity (permutation 8) is the headline follow-up once the
  certificate unblocks SP REST.

- 2026-07-13 svar conversion: infra references now flow through `{svar:sgt…}` shared variables (customer-configurable; harness seeds the same names from SGT_* env) with a require-shared-vars preflight gate. Witnesses and prediction values unchanged.

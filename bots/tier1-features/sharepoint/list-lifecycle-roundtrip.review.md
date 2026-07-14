# tier1-features/sharepoint/list-lifecycle-roundtrip

## Target
The full list lifecycle on a live site: `sp-create-list` (7-column field-type
roster incl. Choice-with-choices) → `sp-insert-item` ×3 (typed row, trichotomy
row, sacrificial row) → `sp-select-items` DataTable readback → `sp-update-item`
partial patch → `sp-delete-item` (exact + no-match). Session list
`sgt-{var:_sgtSessionId}-life`, reaped by the harness via
`envelope.sharePointSandboxLists` AFTER predictions evaluate — this is the
first triple to exercise that reaper.

## Product bugs this triple guards (found live in Track 15, all fixed)
1. **List-identity props never token-resolved** — all 7 runners read
   `listName`/`listId`/`listInternalName` raw; a tokenized name (standard for
   session-scoped fixtures AND common in real bots) landed braces in the URL,
   which Graph rejects with an opaque 400 "Invalid request". Every step of
   this triple uses tokenized list refs.
2. **`fields/add` is not an SP REST endpoint** — column creation 404'd
   ("Cannot find resource for the request add"); the method for
   `SP.FieldCreationInformation` is `addfield`. `fieldsCreated: 7` pins it.
3. **create-list dropped `choices`/`required`** from field specs (helper
   supported them, runner didn't pass them through). SgtChoice's Red/Green/
   Blue + the "Green" insert pin it.
4. **listId GUID precedence** — the documented contract ("listId takes
   precedence over listName") is now honored; inserts here pass
   `{scl:listId}`.
Also hardened (defensive, kept): create-list blocks until a canary write
streak proves the list Graph-writable (schema propagation), and single
inserts retry the opaque propagation 400.

## Permutation matrix
| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | create list + Text/Note/Number/Currency/Boolean/DateTime/Choice roster | this triple | pred-list-created (fieldsCreated=7) |
| 2 | typed single insert, unicode text, exact decimals, boolean, UTC instant, choice | this triple | pred-dt-rendering-row-a + pred-update-partial-patch |
| 3 | DataTable rendering: ID string, numbers verbatim (1234.56), boolean true, choice string, re-zoned DateTime | this triple | pred-dt-rendering-row-a (live-pinned) |
| 4 | trichotomy row-B: `""` text + never-set fields both ABSENT from raw Graph payload; select renders both as null | this triple | pred-trichotomy-row-b (raw) — DT null rendering witnessed in ssel outs |
| 5 | partial update: one field patched, all others byte-identical raw | this triple | pred-update-partial-patch (5 raw read_cell pins) |
| 6 | delete by filter: exactly one row; double-run deletes zero without error | this triple | pred-delete-exact |
| 7 | survivors witnessed raw, then harness reaps the list | this triple | pred-oob-survivor-count |
| 8 | MultiChoice / URL / User / Lookup field types | deferred: need structured payloads + (Lookup) a target list GUID — standing-types list follow-up |
| 9 | date-only display fields + midnight-UTC date-shift under two --time-zone values | deferred to the dates triple (sp-create-list cannot set DateOnly display format; needs the standing list) |
| 10 | choice value not in the list | deferred (observed accepted-by-SP on a choices-less column pre-fix; re-pin against a real choice column) |

## Witnesses
Dual per the playbook: in-bot select DataTable + $stepOut counters, and
out-of-band Graph readers (`read_cell`/`read_rows`/`count_rows_in`) against
the raw `fields` payload. The session list survives until predictions
evaluate; `sharePointSandboxLists` then deletes it (guarded: templates
without `{var:_sgtSessionId}` are refused).

## Notes
- `count_rows_in` is 1-arg (no where) — filtered counts use
  `size_of(read_rows(...))`.
- Probe (`sgt probe`) runs do NOT reap session lists (adhoc has no envelope)
  — clean up stray `sgt-*` lists via the Graph reader's `deleteList` when
  iterating.
- SgtWhen DT rendering is re-zoned ISO with offset — not pinned in-bot here
  (agent-engine --time-zone runs would shift it); the raw pin
  (`2026-06-01T14:30:00Z`) is the stable witness.

- 2026-07-13 svar conversion: infra references now flow through `{svar:sgt…}` shared variables (customer-configurable; harness seeds the same names from SGT_* env) with a require-shared-vars preflight gate. Witnesses and prediction values unchanged.

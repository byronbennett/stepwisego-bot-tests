# tier1-features/variables/dictionary-ops

## Target

`set-dictionary-value`, `remove-from-dictionary`, `clear-dictionary` — the
full Dictionary mutation surface, one triple because the three actions share
one state object and each mutation's contract is best pinned relative to the
previous one.

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | set new key (literal key + literal value) | this triple | keys-insertion-order-no-duplicate |
| 2 | set second key — insertion order preserved | this triple | keys-insertion-order-no-duplicate |
| 3 | set existing key — overwrite, no duplicate entry | this triple | keys-insertion-order-no-duplicate + overwrite-wins |
| 4 | set with token key AND token value | this triple | keys-insertion-order-no-duplicate (gamma from {var:seedKey}) |
| 5 | remove existing key | this triple | remove-deletes-only-target |
| 6 | remove missing key — passes as no-op | this triple | remove-missing-key-noop |
| 7 | clear dictionary → zero keys | this triple | clear-empties-dictionary |
| 8 | set-dictionary-value on undeclared variable — runtime error, buried | this triple | smoke (expectErrorCount=0 proves burial) |
| 9 | numeric / structured values in dictionary slots | deferred: values travel as ParmValue strings; typed-value fidelity belongs to the exact-numerics track | — |

## Witnesses

- In-bot: dictionary state is snapshotted after every mutation into plain text
  variables via the dictionary pipe functions (`keys|join`, `key:name`,
  `hasKey:name`, `keys|count`) — dictionary entries live in `parm.values`
  (ParmValue[]), which `$var` cannot see directly, so the pipes are the
  observation channel.
- Out-of-band: predictions compare each snapshot against hand-derived
  constants (insertion order alpha;beta;gamma etc.). The clear-check variable
  starts at `SENTINEL` so a lazy/no-op pipe cannot fake the "0".

## Expected values derived from

First principles: a dictionary keyed on strings must preserve insertion
order (legacy C# Dictionary behavior the engine mirrors), overwrite in place,
treat remove-of-missing as a no-op, and be empty after clear. Boolean pipe
output formatting (`True`/`False`) calibrated by probe and consistent with
`hasKey`'s implementation.

## Known gaps / notes

- Pinned: `remove-from-dictionary` on a missing key PASSES (no-op), while the
  same action on a missing *variable* is a runtime error.
- Pinned: `hasKey` renders engine booleans as `True`/`False` (C#-style), not
  lowercase JSON booleans.
- Dictionary contents are not directly assertable via `$var` (stored in
  `parm.values`, and the Prediction DSL cannot express object literals) — all
  assertions go through the pipe-function snapshots.

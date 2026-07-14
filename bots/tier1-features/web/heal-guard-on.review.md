# tier1-features/web/heal-guard-on

## Target

The heal ladder's ON path: `healAutoApprove: "always"` heals the SAME stale
webElement selectors that heal-guard-off proves fail under exactOnly, via
the deterministic FUZZY tier (no AI involved), and the healed actions
actually land on the page.

## Heal score math (why fuzzy wins deterministically)

- `targetBtn` (captured `#old-submit-id`, live `#new-submit-id`): pool =
  getByRole("button") → exactly the one live button. accessibleName
  "Submit order" ≡ live (0.4·1) + visibleText ≡ live (0.4·1) + attrs 1/2
  (id drifted, type=submit survives → 0.2·0.5) = **0.90** ≥ 0.5 bar,
  unique → fuzzy heal.
- `targetField` (captured `#old-name-field`, live `#new-name-field`): pool
  = getByRole("textbox") → the one live input. Fingerprint deliberately
  carries NO accessibleName/visibleText (inputs have neither), so weights
  renormalize onto attrs alone: 2/3 survive (placeholder, type; id
  drifted) = **0.667** ≥ 0.5, unique → fuzzy heal. (Would NOT clear the
  0.8 highConfidence bar — this triple pins the `always` gate.)

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | click heals + lands (counter 0→1) | this triple | healed-click-landed |
| 2 | send-keys heals + fills the renamed input | this triple | healed-fill-landed |
| 3 | wait-for-element heals + reports success | this triple | healed-wait-succeeds |
| 4 | anchor tier (fuzzy tie-break / rescue) | deferred: needs a fixture with 2+ same-role near-twins; separate triple | — |
| 5 | visual tier (dHash) | deferred: needs a stored screenshotCrop with entropy; recorder-captured fixture required | — |
| 6 | highConfidence gate (0.8 bar: btn heals, field files-and-fails) | deferred: pairs 0.90 vs 0.667 scores above — natural follow-up triple | — |
| 7 | AI tier | out of scope: harness runs with no aiHealOptions armed | — |

## Witnesses

Page state, not runner claims: the click counter increments, the input
value reads back "healed-input" via execute-javascript, plus success
outputs on all three steps.

## Envelope / cleanup

`serialGroup: "web-browser"`; fixture `heal.html`. The exact tier polls the
FULL budget before healing (by design — waiting beats healing an unrendered
element), so each heal step burns its whole timeout first: 3s + 10s
(send-keys fixed) + 3s ≈ 16s minimum runtime.

## Expected values derived from

`resolve-target.ts` (pool by fingerprint.role, fuzzyScore weights
0.4/0.4/0.2 with renormalization, unique-above-bar wins),
`fuzzy-score.ts`, `runner-resolve.ts` (gate `always` → reportFix
kind:"applied", healed locator used in-run).

## Known gaps / notes

- Found + fixed while authoring this pair: the page-side `describeAllInPage`
  extraction crashed with `ReferenceError: __name is not defined` under
  esbuild-transformed runtimes (tsx / electron-vite dev) — esbuild's
  keep-names helper is injected into the serialized function source but
  doesn't exist in the page. `resolve-target.ts` now shims `__name` on the
  page's globalThis. Every heal-tier resolution under the in-process
  engine was broken before this.

- 2026-07-13 standalone bootstrap: added a session-bootstrap preflight (require-shared-vars, bootstrap-only mode) + create-folder ahead of the original steps, so this bot is runnable standalone (not only via RunAllRegressionTests). Witnesses and prediction values unchanged.

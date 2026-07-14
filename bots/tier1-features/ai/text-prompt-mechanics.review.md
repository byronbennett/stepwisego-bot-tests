# tier1-features/ai/text-prompt-mechanics

## Target
`ai-text-prompt` — the plumbing under the prompt: credential resolution,
prompt/parameter transmission, token substitution into the prompt, response
parsing into the result variable, token accounting, and the invalid-model
error path. Provider: OpenAI (blocker #4 decision — see the category
playbook note in `docs/testing/regression-suite/categories/ai.md`), model
`gpt-4o-mini` (harness default from `SGT_AI_OPENAI_MODEL`).

**Never asserts on free text** (playbook core principle) — every check is
structure, mechanics, or trivially-forced content.

## Permutation matrix
| # | Permutation | Covered by | Check id / prediction id |
|---|---|---|---|
| 1 | forced-output prompt at temperature 0 (the sanctioned near-exact check) | this triple | pred-apple |
| 2 | `{var:}` token substituted into the prompt before send (forced echo) | this triple | pred-echo |
| 3 | token accounting step outputs populated | this triple | pred-token-accounting |
| 4 | invalid model → provider error, no output written | this triple | pred-bad-model-no-output + smoke.expectErrorCount=1 |
| 5 | maxTokens / temperature transmitted (structural: call succeeds at 0) | this triple | implicit in pred-apple (temperature 0, maxTokens 16) |
| 6 | system-vs-user prompt fields | deferred: covered structurally by structured-extract-schema's systemPrompt slot |
| 7 | long prompt (10k chars), unicode prompt | deferred: cost control (playbook trap #4 — tiny fixtures); no plumbing path differs |
| 8 | bad credential / dead endpoint | deferred: the credential id is harness-injected, so a bad-credential permutation would test the harness, not the product |

## Witnesses
- In-bot: the result variable holds the model's response; step outputs carry
  token accounting.
- Out-of-band: none — AI responses have no external state to read back. The
  forced-output prompt IS the evidence the prompt reached a real model and the
  response came back (playbook: this is the sanctioned exception).
- Probe calibration: pred-token-accounting doubles as the calibration — a
  non-zero totalTokens proves a real round trip happened, so a passing
  pred-apple can't be a stub returning a canned string.

## Expected values derived from
First principles: `APPLE` is forced by the prompt; the echo marker is an
authored literal; totalTokens > 0 is the definition of a completed call; an
unknown model id must fail at the provider. Not derived from runner code.

## Known gaps / notes
- **PRODUCT BUG FOUND AND FIXED (this track):** both `ai-text-prompt` and
  `ai-structured-extract` sent `conversation.messages` as the outbound list,
  but `appendToConversation` only records the current user prompt *after* the
  response arrives — so the model never received the current turn's prompt. On
  a first turn it saw only an empty system message and answered nothing in
  particular (observed: a stray "my knowledge cutoff is October 2023" reply to
  an APPLE prompt). Fixed in both runners by appending the current prompt to
  the outbound message list. Without this fix pred-apple and pred-echo are red
  — they are the regression guards.
- `smoke.expectErrorCount: 1` is by design (the invalid-model step, with
  `ignoreErrors: true`).
- `engines: ["in-process"]` — the AI credential comes from the harness's
  `resolveCredentialById` override (`sgt-ai-openai`), which the spawned Agent
  has no path to. Agent-engine AI coverage needs a real vault credential and
  is out of campaign scope.
- Cost per run: ~1k tokens on `gpt-4o-mini`. Ollama (`llama3.1:8b`, local) is
  wired as `sgt-ai-ollama` for a zero-cost text rides-along if the gate ever
  needs it.

- 2026-07-13 svar conversion: infra references now flow through `{svar:sgt…}` shared variables (customer-configurable; harness seeds the same names from SGT_* env) with a require-shared-vars preflight gate. Witnesses and prediction values unchanged.

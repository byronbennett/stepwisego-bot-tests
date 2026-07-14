# tier1-features/ai/image-audio-artifacts

## Target
`ai-image-generate` + `ai-audio-generate` — content is unassertable, so the
mechanics are: the request reaches the provider with the declared model/size/
voice, the response bytes are decoded, the artifact lands at `savePath`, and
the file carries the right **magic bytes** for the requested format. Provider:
OpenAI (`gpt-image-1-mini` for image, `tts-1` for audio).

## Permutation matrix
| # | Permutation | Covered by | Check id / prediction id |
|---|---|---|---|
| 1 | image generated, saved to `savePath`, is a real PNG (magic `iVBORw0KGgo` = `89 50 4E 47`) | this triple | pred-image-magic |
| 2 | audio generated, saved to `savePath`, is a real MP3 (ID3 tag or MPEG frame sync) | this triple | pred-audio-magic |
| 3 | model param transmitted (a wrong model is rejected by the provider) | this triple | implicit — `gpt-image-1-mini` / `tts-1` are explicit overrides; a bad model 400s (proved during authoring, see notes) |
| 4 | imageSize param transmitted | this triple | 1024x1024 (the action's default option) |
| 5 | voice param transmitted | this triple | `alloy` |
| 6 | every supported image size / voice, one request each | deferred: cost control (playbook trap #4 — each image is a paid request); the size/voice params ride the same code path |
| 7 | invalid voice / invalid size → pinned provider errors | deferred: same cost reason; the invalid-model error path is already pinned in text-prompt-mechanics |

## Witnesses
- In-bot: `file-exists` (Files plugin) proves the artifact hit disk;
  `get-file-base64` (Files plugin) re-reads the bytes — a different plugin
  than the one under test.
- Out-of-band: the magic-byte pins are computed from the re-read bytes, not
  from anything the AI plugin reported about itself.
- Probe calibration: the two file-exists reads are themselves the calibration
  (both start false — the scratch dir is fresh per session — and only turn
  true after the ACT step).

## Expected values derived from
The format specs: a PNG file starts `89 50 4E 47 0D 0A 1A 0A`, whose base64
prefix is `iVBORw0KGgo`. An MP3 starts either with an `ID3` tag (base64
`SUQz`) or a raw MPEG frame sync `FF Fx` (base64 `//` + one more char). Not
derived from runner code.

## Known gaps / notes
- **PRODUCT BUG FOUND AND FIXED (this track):** `makeOpenAICompatibleClient`
  unconditionally sent `response_format: "b64_json"` on
  `/images/generations`. Current OpenAI **rejects** that parameter with
  `HTTP 400 Unknown parameter: 'response_format'` — so *every*
  `ai-image-generate` against OpenAI was failing in the field. Fixed in
  `packages/shared/src/plugins/ai/providers/openai-compatible.ts`: the param
  is now sent only for non-`gpt-image-*` models (DALL·E still needs it — those
  default to a hosted URL; `gpt-image-*` always returns b64 and rejects it).
  This triple is the regression guard.
- **FINDING (not fixed, needs a ruling):** `ai-image-generate`'s `imageSize`
  options are the DALL·E-3 set (`1024x1024`, `1024x1792`, `1792x1024`).
  `gpt-image-*` accepts `1024x1024`, `1024x1536`, `1536x1024`, `auto` — so two
  of the three offered sizes 400 against the current default-era models. Only
  `1024x1024` is safe across both families (used here). Logged in the internal product backlog.
- **FINDING (not fixed):** the `savePath` write in both runners is wrapped in a
  try/catch that only logs a warning — a failed write leaves the step
  **passing** with no artifact. That is why this triple asserts `file-exists`
  rather than trusting the step verdict. Logged in the internal product backlog.
- `dall-e-2` no longer exists on the test account (`model does not exist`);
  the current cheap image model is `gpt-image-1-mini`.
- `engines: ["in-process"]` — harness credential override (`sgt-ai-openai`),
  which the spawned Agent has no path to.
- Cost per run: one `gpt-image-1-mini` image + one short `tts-1` clip.

- 2026-07-13 svar conversion: infra references now flow through `{svar:sgt…}` shared variables (customer-configurable; harness seeds the same names from SGT_* env) with a require-shared-vars preflight gate. Witnesses and prediction values unchanged.

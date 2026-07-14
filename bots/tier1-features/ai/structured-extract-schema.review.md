# tier1-features/ai/structured-extract-schema

## Target
`ai-structured-extract` — the financially-relevant one. Under test: JSON-schema
transmission (`response_format: json_schema`), response parsing into a typed
`json` variable, schema conformance of the result, and downstream property
access. Provider: OpenAI `gpt-4o-mini`, temperature 0.

## Permutation matrix
| # | Permutation | Covered by | Check id / prediction id |
|---|---|---|---|
| 1 | strict schema (3 required string props, `additionalProperties: false`) round-trips as parseable JSON | this triple | pred-invoice-number / pred-vendor / pred-total-contains (all three read via `json-get-property`, which only works if the value parsed) |
| 2 | unambiguous literal extraction (invoice number appears verbatim once) — exact-asserted | this triple | pred-invoice-number |
| 3 | judgment-dependent field (trailing sentence period on the vendor name) — structure, not exact | this triple | pred-vendor (contains) |
| 4 | numeric field with a thousands separator — the model returned `"1,234.56 USD"` | this triple | pred-total-contains (contains `234.56`; the normalization is model-dependent, see notes) |
| 5 | token accounting on the extract step | this triple | pred-schema-tokens |
| 6 | optional vs required schema fields; nested schema; array extraction | deferred: cost control + the plumbing path (schema → response_format) is identical; add if the schema surface changes |
| 7 | invalid schema (pinned error); input exceeding context | deferred: same reason as #6 |

## Witnesses
- In-bot: three `json-get-property` reads against the result variable — a
  different plugin (JSON) verifying the AI plugin's output. If the response
  hadn't parsed as JSON, all three would be empty.
- Out-of-band: none available (see the ai playbook's verification-patterns
  note — structure-validation in-bot is the sanctioned form here).
- Probe calibration: pred-schema-tokens (non-zero totalTokens proves a real
  provider round trip, so the extracted values can't be a stub).

## Expected values derived from
Hand-read from the fixture string `"Invoice INV-88412 from Acme Corp. Total
due: 1,234.56 USD."` — `INV-88412` is the only invoice-number-shaped token in
it; `Acme Corp` is the only vendor. Not derived from runner code.

## Known gaps / notes
- **Depends on the same conversation-history fix as text-prompt-mechanics**
  (the current prompt was never being sent — see that review). Before the fix
  this triple extracted nothing.
- **`totalAmount` normalization is a product contract this triple deliberately
  does NOT pin exactly.** The model returned `"1,234.56 USD"` (unit included,
  separator preserved). The playbook calls for a `human-approve` pin here;
  pinning it exactly today would encode one model's formatting choice as the
  contract. Left as a contains-check with this note — Byron's call whether the
  extraction contract should normalize (TODOS candidate).
- `engines: ["in-process"]` — harness credential override, see the sibling
  review.

- 2026-07-13 svar conversion: infra references now flow through `{svar:sgt…}` shared variables (customer-configurable; harness seeds the same names from SGT_* env) with a require-shared-vars preflight gate. Witnesses and prediction values unchanged.

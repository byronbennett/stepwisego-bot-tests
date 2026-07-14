# tier1-features/cryptography/aes-roundtrip

## Target

`aes-encrypt-string`, `aes-decrypt-string` — AES-256-CBC with PBKDF2 key
derivation (`regex-is-match` appears as the format witness, asserted in the
Regex category). One triple; the two actions are inverse operations.

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | encrypt + decrypt round-trip, multi-byte UTF-8 | this triple | roundtrip-exact |
| 2 | ciphertext format: salt/IV/data as space-separated base64 | this triple | ciphertext-format |
| 3 | fresh random salt+IV per call (nondeterministic ciphertext) | this triple | nondeterministic-ciphertext |
| 4 | decrypt with wrong password → error, output untouched | this triple | failed-decrypts-leave-output-untouched + smoke |
| 5 | decrypt malformed input (2 parts) → format error | this triple | failed-decrypts-leave-output-untouched + smoke |
| 6 | empty text / empty password → validation errors | deferred: required-prop pre-run validation, not runner behavior | — |
| 7 | cross-run decryption (ciphertext from an old run) | deferred: needs a pinned fixture ciphertext; current format check + round trip pin everything the fixture would | — |

## Witnesses

- In-bot: the format regex and the round-tripped plaintext are the only
  stable observables — ciphertext bytes are random by design. The sentinel on
  `decrypted2` proves both buried failures never wrote output.
- Out-of-band: the expected plaintext constant; `not_equals` on the two
  ciphertexts is DSL-native (no in-bot comparison needed).

## Expected values derived from

First principles: a correct AES round trip must reproduce the exact UTF-8
input; CBC with random salt/IV must produce distinct ciphertexts for
identical inputs; the runner's declared output format (`salt iv data`
base64, space-separated).

## Known gaps / notes

- Deliberately NOT pinned: ciphertext bytes, lengths, or KDF parameters
  (100k PBKDF2 iterations) — those are implementation details a security
  upgrade may change; the round trip + 3-part format is the compatibility
  contract.
- Pinned: wrong-password decrypt surfaces the friendly "incorrect password
  or corrupted data" path (bad-decrypt detection), not a raw OpenSSL error.

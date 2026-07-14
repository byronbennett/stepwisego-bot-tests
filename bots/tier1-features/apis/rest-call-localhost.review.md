# tier1-features/apis/rest-call-localhost

## Target

`rest-call` — HTTP client action, exercised against a hermetic loopback
listener the bot launches itself (no external network, fully deterministic).

## Architecture

A `run-script` node launcher spawns a DETACHED `node -e` child hosting an
http server on `127.0.0.1:0` (ephemeral port). The child writes its port to
`{var:_sgtScratchDir}/port.txt` once listening; the launcher blocks until
that file exists, so the bot only proceeds when the server is up. The server
self-terminates after 25s as a backstop; the bot's final step GETs
`/shutdown` to end it deterministically. Routes: `GET /hello` → 200 json,
`POST /echo` → 200 `echo:<body>`, `GET /shutdown` → 200 "bye", anything
else → 404 "nope".

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | GET, 2xx, body stored as raw text | this triple | get-json-body |
| 2 | responseCode step output (string "200") | this triple | get-status-200 |
| 3 | POST bodyType=raw (text/plain body bytes) | this triple | post-raw-echo |
| 4 | non-2xx → step fails but responseCode + body still stored | this triple | buried-404-code, buried-404-body |
| 5 | token-composed URL ({var:port}) | this triple | all — every URL carries the ephemeral port |
| 6 | auth types (basic/bearer/apiKey/oauth1/oauth2) | deferred: header composition is runner-local string work; a header-echo permutation on this same listener is the natural follow-up | — |
| 7 | bodyType json/xml/formUrlEncoded/formData/binary/graphql | deferred: same listener could echo content-type + body; follow-up permutations | — |
| 8 | params grid (replace/urlParam/header/cookie/getPost/file) | deferred: as above | — |
| 9 | timeout / abort path | deferred: needs a stalling route; slow-test candidate | — |
| 10 | followRedirects | deferred: needs a 3xx route; cheap follow-up | — |

## Witnesses

- In-bot: the server's echo responses ARE the independent witness — bytes
  travel through a real TCP socket and a second process; `get-file-contents`
  (File plugin) independently supplies the port.
- Out-of-band: no persistent artifact to read — the witness is the
  round-trip itself plus `launchOut`/`bodyDown` proving orderly start and
  shutdown.

## Envelope / cleanup

- Port file in scratch (FP-8). The spawned server exits via `/shutdown`
  (asserted) with the 25s self-exit backstop guarding aborted runs — no
  lingering process either way.
- Hermetic: binds 127.0.0.1 only, ephemeral port, no external hosts.

## Expected values derived from

Runner source (`rest-call.runner.ts`): responseCode stored as
`String(response.status)`; body always `response.text()` into
resultVariable BEFORE the ok check (so 404 still stores); bodyType=raw sets
text/plain. Probe reproduced every value including the 404 buried step.

## Known gaps / notes

- Under the agent engine the launcher/server spawn as grandchildren of the
  agent process — same behavior, verified under both engines.
- `use-connector` (Connectors category) remains untested: it needs a real
  external SaaS credential; out of Track 6 scope.

- 2026-07-13 standalone bootstrap: added a session-bootstrap preflight (require-shared-vars, bootstrap-only mode) + create-folder ahead of the original steps, so this bot is runnable standalone (not only via RunAllRegressionTests). Witnesses and prediction values unchanged.

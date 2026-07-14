# tier1-features/web/page-data

## Target

`get-page-data` — all five dataTypes: PageTitle, PageUrl, PageSource,
InnerText, VisibleText.

## Permutation matrix

| # | Permutation | Covered by | Check id |
|---|---|---|---|
| 1 | PageTitle round-trips unicode | this triple | page-title-unicode |
| 2 | PageUrl is the post-navigation URL | this triple | page-url |
| 3 | PageSource serializes the whole document (incl. hidden markup + title tag) | this triple | page-source-serializes-document |
| 4 | InnerText collapses whitespace AND excludes display:none | this triple | inner-text-is-rendered-only |
| 5 | VisibleText (textContent) preserves raw whitespace AND includes display:none | this triple | visible-text-is-raw-text-content |

## Witnesses

The fixture is built so InnerText and VisibleText give OPPOSITE answers on
the same two probes (`alpha   beta` space-run, `hidden-text` visibility) —
pinning the semantic difference between page.innerText("body") and
page.textContent("body"), which is the naming trap in this action
("VisibleText" is actually textContent and INCLUDES hidden text).

## Envelope / cleanup

`serialGroup: "web-browser"`; fixture `page-data.html`; session closed in-bot.

## Expected values derived from

`get-page-data.runner.ts` dataType switch; CSS text rendering rules
(innerText) vs raw DOM text (textContent).

## Known gaps / notes

- The VisibleText-includes-hidden behavior is legacy-compatible but
  surprising given the name; pinned here so any future rename/fix shows up
  as an intentional break.

- 2026-07-13 standalone bootstrap: added a session-bootstrap preflight (require-shared-vars, bootstrap-only mode) + create-folder ahead of the original steps, so this bot is runnable standalone (not only via RunAllRegressionTests). Witnesses and prediction values unchanged.

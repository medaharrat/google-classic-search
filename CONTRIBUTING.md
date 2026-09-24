# Contributing

Thanks for considering a contribution to Hide AI Overview for Google. This project intentionally stays small — please read [README.md](README.md) for the scope before proposing new features.

## Bug reports

Please include:

- The Google domain and locale (e.g. `google.com`, English; `google.de`, German)
- A screenshot or DOM snippet of what should have been hidden (or shouldn't have been)
- Whether the issue is "AI Overview not hidden" or "something else was incorrectly hidden" — the latter is more serious and should be flagged as such

## Google DOM changes

Google changes its search results markup periodically. When `findAIOverviews()` in `src/content.js` stops matching:

1. Open a Google search that reliably triggers an AI Overview.
2. Inspect the AI Overview container in DevTools. Look for stable attributes (`data-attrid`, `role="heading"` text, etc.) rather than generated class names, which change often.
3. Add a new entry to `AI_OVERVIEW_CONTAINER_SELECTORS` or `AI_OVERVIEW_LABELS` in `src/content.js`. Prefer *adding* a new selector/label over replacing an existing one, since Google often rolls markup changes out gradually and multiple versions can be live at once.
4. Test using the checklist below.

## Pull requests

- Keep changes scoped to detection/hiding of the AI Overview. This is not the place for new features, redesigns, or unrelated cleanups.
- Plain JavaScript and CSS only — no frameworks, bundlers, or new dependencies.
- Explain *why* a selector or heuristic is needed in a short comment if it isn't obvious.

## Testing expectations

For any change to `findAIOverviews()`, `hideAIOverview()`, or the selector/label lists, manually verify all of the following before submitting:

1. **AI Overview present** → it is hidden.
2. **AI Overview absent** → the page is unchanged (nothing hidden, no layout shift).
3. **Organic results** → titles, snippets, and links are all unchanged and clickable.
4. **Images / News / Video / Shopping / Maps** results on the same query → unaffected.
5. **Dynamic navigation** between searches (e.g. clicking a related search or a new query) → still works, no stale hidden state.
6. **Page refresh** → still works.
7. **Back/forward navigation** (including bfcache restores) → still works.
8. **Different Google locale/domain**, where available → check whether new label text is needed.
9. **Mobile-sized viewport** in desktop DevTools → still works, nothing extra hidden.
10. Confirm no legitimate result was ever hidden by diffing the visible results with/without the extension enabled.

Run the small automated test suite as a sanity check on the pure helper logic:

```bash
node tests/detection.test.js
```

It does not replace the manual checklist above — it only covers label-matching logic, since full DOM behavior needs a real browser.

## Code style

- Match the existing style in `src/content.js`: small named functions, comments explaining *why*, no unnecessary abstraction.
- No TypeScript, no build step, no new npm dependencies.

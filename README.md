<div align="center">

<img src="icons/icon128.png" width="96" height="96" alt="" />

# Hide AI Overview for Google

[![CI](https://github.com/medaharrat/google-classic-search/actions/workflows/ci.yml/badge.svg)](https://github.com/medaharrat/google-classic-search/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> Hide Google's AI answers and get back to the links.

</div>

Runs entirely in your browser. It does not collect, transmit, or store your searches or browsing activity.

## Why?

Some people prefer to scan traditional search results and check sources themselves rather than have an AI-generated summary placed above them. This extension doesn't argue that AI-generated answers are bad — it just gives people who'd rather skip them a way to do that, without changing anything else about how Google Search works.

## Features

- Hides Google AI Overviews
- Keeps organic results, ads, images, news, video, maps, and shopping intact
- Lightweight — one content script, no build step
- No tracking, no analytics, no telemetry
- No external network requests
- No account, no telemetry
- Tiny popup to enable/disable and get help — nothing else to configure
- Open source (MIT licensed)

## Installation

Not yet on the Chrome Web Store. Install it in developer mode:

1. Clone or download this repository.
2. Open `chrome://extensions` in Chrome.
3. Enable **Developer mode** (top right).
4. Click **Load unpacked**.
5. Select the `google-classic-search` project directory.
6. Search Google — any AI Overview on the results page is hidden automatically.

A Chrome Web Store listing can be added later once the extension has been broadly tested.

## Development

No dependencies, no build step:

```bash
git clone https://github.com/medaharrat/google-classic-search.git
cd google-classic-search
```

Then load it unpacked as described above. After editing `src/content.js` or `src/styles.css`, click the reload icon for the extension on `chrome://extensions` and refresh the Google Search tab.

Run the (small, dependency-free) test suite:

```bash
node tests/detection.test.js
```

## How detection works

`src/content.js` exposes two small, independently testable functions:

- `findAIOverviews()` — locates AI Overview elements on the page using two layered strategies:
  1. A list of known structural selectors/attributes Google currently uses for the AI Overview container.
  2. A fallback that looks for a heading whose text matches a known "AI Overview" label (in a growing list of locales), then walks up the DOM to find the smallest enclosing block — stopping as soon as it would include an organic result's `<h3>` title link, so it can never swallow real search results.
- `hideAIOverview(element)` — hides a single located element via a CSS class (`.gcs-hidden { display: none !important }`) rather than inline styles, marks it so it's never processed twice, and calls `collapseEmptyAncestors()` to also hide any purely-decorative wrapper ("card") left empty above it, so no blank space remains.

A `MutationObserver` watches for DOM changes (Google renders results progressively) and coalesces bursts of mutations into at most one scan per animation frame, so the extension does no polling and negligible work once the page is idle.

`src/styles.css` also pre-hides the known container selectors directly via CSS injected at `document_start`, which applies before the page paints — this avoids a brief flash of the AI Overview that would otherwise be visible before the JS-driven path (which can only act once the element exists and the observer fires) catches up. This only covers strategy 1 above; the heading-text fallback can't be expressed in CSS, so it still depends on the JS path.

Google's AI Overview frequently loads *after* the rest of the results are already visible, which no amount of fast detection can prevent — the element simply doesn't exist yet. The **Prevent flash** popup setting (under "Advanced", off by default) works around this by hiding the whole results column up front and revealing it once the page's DOM activity actually settles down — rather than after one fixed guessed delay, since a fixed delay is either too short (AI Overview still flashes if it loads slower than the delay) or unnecessarily long. It's bounded by a hard cap so a page that never goes quiet doesn't stay hidden indefinitely (see the `REDUCE_FLASH_*` constants in `src/content.js`). This is a deliberate, opt-in trade-off — a small delay on every search, even ones without an AI Overview — rather than the default behavior.

## Popup

Clicking the toolbar icon opens a small popup:

- **Hide AI Overviews** — the main on/off toggle. Off means the extension leaves the page completely alone.
- **Prevent flash** — opt-in, off by default, under "Advanced". See above.
- **Help & feedback** — a link to this repository's issue tracker.

Both toggle states are the only things the extension stores, via `chrome.storage.local` (see [Permissions](#permissions)). Flipping either takes effect immediately in any open Google Search tab, no reload needed.

## Permissions

- **`storage`** — stores two booleans (the popup's two toggles) locally on your device with `chrome.storage.local`. Nothing else is stored, and these values never leave your device (`storage.local`, not `storage.sync`).
- The content script's own `matches` patterns in `manifest.json`, which limit it to Google Search result pages on a few domains.

No `host_permissions`, `tabs`, or `webRequest` — none of these are needed for DOM-only hiding.

Supporting more country-specific Google domains (e.g. `google.co.uk`, `google.de`) is just a matter of adding more `matches` patterns — no new permissions required, since each pattern is still scoped to that domain's `/search` path.

## Limitations

Google changes its search results page markup periodically, sometimes without notice. When that happens, `findAIOverviews()` may stop finding the AI Overview block (fail open — nothing is hidden) or, in rare cases, need a selector correction. If you notice an AI Overview that isn't being hidden, please open an issue or a pull request — see [CONTRIBUTING.md](CONTRIBUTING.md).

## Testing checklist

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full manual testing checklist expected before submitting detection changes.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Privacy

See [PRIVACY.md](PRIVACY.md).

## License

[MIT](LICENSE)

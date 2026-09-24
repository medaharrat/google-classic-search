# Privacy Policy

Hide AI Overview for Google is a local-only browser extension.

It does **not**:

- Collect your searches or search queries
- Collect the URLs you visit
- Collect your browsing history
- Contact any external server
- Use analytics or telemetry of any kind
- Use advertising or advertising identifiers
- Store any personal data, locally or remotely
- Require an account or sign-in
- Sync anything to your Google/Chrome account

## What the extension actually does

A content script runs on Google Search result pages (`google.com/search` and a small set of other Google country domains, see `manifest.json`). It inspects the page's DOM to find Google's AI Overview element, if present, and hides it using CSS. A small popup (opened from the toolbar icon) lets you flip that behavior on or off, and optionally enable a "reduce flash" mode. That's the entire behavior. No data leaves your browser, and nothing is written to disk beyond the two settings described below.

## Permissions

- **`storage`** — used only to remember the popup's two toggles (on/off, and the opt-in "reduce flash" mode), via `chrome.storage.local`. These are two booleans, stored on-device only (not `storage.sync`, so nothing syncs to your Google account or any other device). No searches, URLs, or browsing activity are ever stored.
- No `tabs`, `history`, `webRequest`, `cookies`, or `host_permissions`. Its only other capability is running a content script on the specific Google Search URLs listed in `manifest.json`.

## Changes to this policy

If the extension's behavior ever changes in a way that affects this policy, this file will be updated accordingly, and the change will be noted in [CHANGELOG.md](CHANGELOG.md).

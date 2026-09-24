# Changelog

## 0.2.2

- Fix: re-enabling the toggle could leave an empty wrapper "card" visible where the AI Overview used to be. `hideAIOverview()` now also hides any ancestor element that exists purely to wrap already-hidden AI Overview content.

## 0.2.1

- Rename extension to "Hide AI Overview for Google" for Chrome Web Store discoverability
- Add CI workflow (manifest validation + test suite on every push/PR)

## 0.2.0

- Add toolbar popup with an enable/disable toggle and a help/feedback link
- Add `storage` permission, used only to remember the toggle locally (`chrome.storage.local`)
- Redesign extension icon

## 0.1.0

- Initial release
- Hide Google AI Overviews
- Local-only operation
- No analytics or external requests

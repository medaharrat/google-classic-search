# Changelog

## 0.2.12

- Fix: even with the AI Overview text itself fully hidden, its "Show more" pill (and gradient fade-overlay behind it) remained visible — pointless UI since the content it expands is always hidden. Added `.Jzkafd`, the class shared by both elements, to detection and the static CSS pre-hide.

## 0.2.11

- Fix: the AI Overview could still flash briefly even with detection matching `#m-x-content`, because Google's own script only assigns that id via JS well after the element first exists in the DOM (confirmed by reading that script directly from a user-supplied page dump). Added `.D5ad8b` — the stable class already present on the element from creation — to both the JS selector list and the static CSS pre-hide, closing the timing gap without needing to wait on Google's JS to run at all.

## 0.2.10

- Fix: 0.2.9's fixed ~600ms delay was still too short whenever the AI Overview loaded a bit slower than that, so it would still flash once the delay elapsed. "Prevent flash" now reveals the results column adaptively — once DOM activity actually settles down (min 400ms, 350ms of quiet, capped at 1.8s) — instead of guessing one fixed number.
- Renamed the popup setting to "Prevent flash", dropped its explanatory subtext, and moved it under a separate "Advanced" section with a divider, so it reads at a glance and isn't crowded against the main toggle.

## 0.2.9

- Add an opt-in "Reduce AI Overview flash" popup setting (off by default). Google's AI Overview often loads after the rest of the results are already visible, so 0.2.8's pre-hide CSS can't help when the element doesn't exist yet at paint time. This setting hides the results column up front and reveals it after a fixed ~600ms grace period, giving a late-arriving AI Overview a chance to load and get classified before anything is shown — a deliberate delay/flash-risk trade-off, opted into rather than the default.

## 0.2.8

- Fix: the AI Overview could flash visible for a moment before being hidden, since content.js can only act after the element exists in the DOM and its MutationObserver callback fires. The known container selectors are now also pre-hidden via static CSS injected at document_start, which applies before the page paints — no JS delay. The heading-text fallback strategy still depends on JS (text can't be matched in CSS), so it can still show a brief flash in cases only that strategy catches.

## 0.2.7

- The blank-gap fix in 0.2.5 only cleared inline `max-height`/`height`, which didn't help if Google sizes the collapse wrapper via a CSS class or a `grid-template-rows` collapse animation instead. `clearFixedSizing()` now forces `max-height`, `height`, `min-height`, `grid-template-rows`, and `overflow` back to content-driven with `!important`, so it wins regardless of which mechanism is in play.

## 0.2.6

- Use the full artwork consistently at every icon size (16/32/48/128), instead of falling back to a plain simplified glyph at 16-48px. That simplified fallback was visually close enough to the previous icon that it read as "unchanged" at a glance.

## 0.2.5

- Fix: a large blank gap could remain above AI Overview's own "Show more" control after hiding. Google sizes that collapsible wrapper with an inline max-height/height for the pre-hidden text, which doesn't shrink just because the text is now `display:none`. `collapseEmptyAncestors()` now clears that stale inline sizing on the nearest ancestor it can't fully hide (because it still holds real content like that control).

## 0.2.4

- Replace the icon artwork with the provided source image, composited into a rounded-square badge with true alpha transparency (verified against a compositing bug where a CSS-based drop shadow left a dark ring baked into the PNG). 128px and the store master use the full artwork; 16/32/48px use a simplified glyph since the full detail wasn't legible at toolbar size.

## 0.2.3

- Fix: icon had an opaque square canvas instead of real transparency, so it rendered as a hard-edged square in the toolbar and README instead of a rounded badge. Rebuilt as vector art with true alpha transparency outside the rounded badge, plus a simplified variant for the 16/32px sizes where the full detail turned to mush.

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

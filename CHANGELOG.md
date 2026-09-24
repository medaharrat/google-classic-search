# Changelog

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

/**
 * Hide AI Overview for Google
 *
 * Hides Google's AI Overview block on search result pages while leaving
 * everything else (organic results, ads, images, news, etc.) untouched.
 *
 * This file intentionally has no dependencies and makes no network
 * requests. It only reads and mutates the DOM of the current tab.
 */

/**
 * Known DOM signals for Google's AI Overview container.
 *
 * Google changes its markup periodically, so this list is the first place
 * to look when detection breaks. Keep entries specific enough that they
 * cannot accidentally match organic results, ads, or other SERP features.
 *
 * When updating: open a search that shows an AI Overview, inspect the
 * container in DevTools, and add the new attribute/selector here rather
 * than replacing the old ones (Google rolls markup changes out gradually,
 * so multiple versions can be live at once).
 *
 * This same list is mirrored as static CSS in src/styles.css so these
 * specific containers can be pre-hidden instantly at document_start,
 * before this script's own MutationObserver could ever react — keep both
 * lists in sync.
 */
const AI_OVERVIEW_CONTAINER_SELECTORS = [
  '[data-attrid="AIOverview"]',
  '[data-attrid="wholepage-ai-overview"]',
  'div[data-mpvis="AIOverview"]',
  '#m-x-content',
  // Google's own script assigns id="m-x-content" to this element via JS,
  // well after it first exists in the DOM — that gap is what let it flash
  // visible even with the CSS pre-hide in place. `.D5ad8b` is the stable
  // class already present on it from the moment it's created, confirmed by
  // reading Google's own collapse/expand script (which does
  // `document.querySelector(".D5ad8b")` before assigning the id), so this
  // selector matches instantly instead of waiting on Google's JS to run.
  '.D5ad8b',
  // The "Show more" pill that expands the (permanently hidden) AI Overview
  // content, plus the gradient fade-overlay behind it — both carry this
  // class and share the same jsaction trigger, so this one selector covers
  // both. Since we always keep the content itself hidden, a control that
  // exists only to expand it is pure visual noise, not useful UI to leave
  // behind. Present in the server-rendered HTML from the start (unlike
  // #m-x-content above), so no timing gap here.
  '.Jzkafd',
];

/**
 * Localized text used for the AI Overview section heading. Used only as a
 * fallback signal (see findOverviewContainer) and always combined with a
 * structural check, so a stray match can't hide an unrelated block.
 *
 * Add more locales as they are confirmed. Keep entries lowercase; matching
 * normalizes case and whitespace.
 */
const AI_OVERVIEW_LABELS = new Set([
  'ai overview',
  'ai overviews',
  'generative ai is experimental',
  'übersicht mit ki',
  "aperçu généré par l'ia",
  'resumen generado por ia',
  'panoramica generata dall’ia',
  'mesterséges intelligencia áttekintés',
]);

/** Container element attribute marking an element as a known AI Overview. */
const OVERVIEW_MARKER = 'data-gcs-overview';

/**
 * Tag names that render nothing and take no layout space. Google injects
 * inline <style>/<script> tags as direct children throughout the AI
 * Overview's ancestor chain (confirmed in a real page dump — an ancestor
 * with an inline min-height had a <style> tag as a sibling of the actual
 * content wrapper). Without this, collapseEmptyAncestors's "does this
 * ancestor have other content" check treats those as real content and
 * stops climbing before it ever reaches the ancestor that's actually
 * reserving the blank space.
 */
const NON_RENDERING_TAGS = new Set(['STYLE', 'SCRIPT', 'LINK', 'META', 'TEMPLATE']);

/** Storage key for the popup's enable/disable toggle (see src/popup.js). */
const STORAGE_KEY = 'enabled';

/** Elements identified as AI Overviews on this page, whether or not they're currently hidden. */
const knownOverviews = new Set();

/** Whether hiding is currently turned on (controlled from the popup). Defaults on until storage says otherwise. */
let enabled = true;

function normalizeText(text) {
  return (text || '').trim().toLowerCase();
}

/**
 * Given a heading element whose text matches a known AI Overview label,
 * find the ancestor element that represents the whole AI Overview block.
 *
 * We climb from the heading toward `searchRoot`, stopping at the first
 * ancestor that does NOT contain an organic-result title link (`h3 a`).
 * Organic results are always titled with an `<h3>`; Google's AI Overview
 * citations are not, so this keeps the fallback from ever swallowing a
 * real result.
 */
function findOverviewContainer(heading, searchRoot) {
  const MAX_DEPTH = 8;
  let candidate = heading;
  let best = null;

  for (let depth = 0; depth < MAX_DEPTH && candidate && candidate !== searchRoot; depth++) {
    if (!candidate.querySelector('h3 a[href]')) {
      best = candidate;
    } else {
      break;
    }
    candidate = candidate.parentElement;
  }

  return best;
}

/**
 * Locate AI Overview elements within `root`. Returns an array of elements
 * to hide. Safe to call repeatedly; does not mutate the DOM itself.
 */
function findAIOverviews(root = document) {
  const found = new Set();

  for (const selector of AI_OVERVIEW_CONTAINER_SELECTORS) {
    root.querySelectorAll(selector).forEach((el) => found.add(el));
  }

  const searchRoot = root.querySelector('#search') || root.querySelector('#rso');
  if (searchRoot) {
    const headings = searchRoot.querySelectorAll('[role="heading"]');
    for (const heading of headings) {
      if (!AI_OVERVIEW_LABELS.has(normalizeText(heading.textContent))) continue;
      const container = findOverviewContainer(heading, searchRoot);
      if (container) found.add(container);
    }
  }

  return [...found];
}

/**
 * Marks and hides a single AI Overview element. Uses a CSS class (see
 * styles.css) rather than inline styles so behavior is easy to
 * inspect/override, and marks the element so we never re-process it.
 * Visibility itself still follows the `enabled` flag, so this is a no-op
 * while disabled. Returns true if this element was newly marked (false if
 * it was already known, e.g. from a previous scan).
 *
 * Deliberately does NOT climb ancestors here — see scan() for why that has
 * to happen in a separate pass after every match in a batch is marked.
 */
function markOverview(element) {
  if (element.hasAttribute(OVERVIEW_MARKER)) return false;
  element.setAttribute(OVERVIEW_MARKER, 'true');
  knownOverviews.add(element);
  applyVisibility(element);
  return true;
}

/**
 * Google often wraps the AI Overview in a styled "card" element (padding,
 * background, rounded corners) that sits one or more levels above the
 * container we actually matched. Hiding only the inner match left that
 * outer card visibly present but empty. To fix that, walk up from the
 * hidden element and also hide any ancestor whose only element children
 * are themselves already-known AI Overview elements — i.e. an ancestor
 * that exists purely to wrap the overview and nothing else. Stops as soon
 * as an ancestor has any other content, or at the results container, so
 * it can never remove organic results or other page structure.
 */
function collapseEmptyAncestors(element) {
  const boundary = document.querySelector('#search') || document.body;
  let node = element.parentElement;

  while (node && node !== boundary && node !== document.body) {
    const hasOtherContent = [...node.children].some(
      (child) => !child.hasAttribute(OVERVIEW_MARKER) && !NON_RENDERING_TAGS.has(child.tagName)
    );
    if (hasOtherContent) {
      // This wrapper still holds real content (e.g. AI Overview's own
      // "Show more" expand control, or unrelated refinement chips) so we
      // stop here rather than hiding it. But Google sizes these
      // collapsible wrappers for the pre-hidden text — via inline height,
      // a CSS class, or a grid-template-rows collapse animation — none of
      // which shrink just because the text inside is now display:none.
      // Force every likely sizing mechanism back to content-driven so the
      // wrapper collapses to fit whatever real content is actually left.
      clearFixedSizing(node);
      break;
    }

    node.setAttribute(OVERVIEW_MARKER, 'true');
    knownOverviews.add(node);
    applyVisibility(node);
    node = node.parentElement;
  }
}

/**
 * Force an element back to sizing itself from its actual content, overriding
 * whatever mechanism Google used to size it for the pre-hidden text — inline
 * style, a CSS class, or a grid-template-rows collapse animation are all
 * common techniques for this kind of expand/collapse UI. `!important` is
 * needed because a plain inline-style write can't outrank a stylesheet rule.
 */
function clearFixedSizing(element) {
  const style = element.style;
  style.setProperty('max-height', 'none', 'important');
  style.setProperty('height', 'auto', 'important');
  style.setProperty('min-height', '0', 'important');
  style.setProperty('grid-template-rows', 'none', 'important');
  style.setProperty('overflow', 'visible', 'important');
}

/** Show or hide a known AI Overview element based on the current `enabled` flag. */
function applyVisibility(element) {
  element.classList.toggle('gcs-hidden', enabled);
}

function scan() {
  const found = findAIOverviews();
  const newlyMarked = [];
  for (const el of found) {
    if (markOverview(el)) newlyMarked.push(el);
  }

  // Only climb ancestors after every match from this pass is marked. Some
  // of Google's AI Overview UI (the collapse wrapper, a gradient overlay,
  // and the "Show more" button) are siblings rather than nested inside one
  // another — climbing per-element as soon as it's found meant the first
  // one processed would check its parent for "other content", find its
  // not-yet-matched siblings, and stop one level too early, permanently
  // leaving that parent's stale sizing in place. Doing this as a second
  // pass means every sibling in the batch is already marked by the time
  // any of them climbs, so the shared parent is correctly recognized as
  // AI-overview-only and collapsed too.
  for (const el of newlyMarked) {
    collapseEmptyAncestors(el);
  }
}

/**
 * Google's result page loads content progressively, so we watch for DOM
 * changes instead of polling. Mutation bursts are coalesced with
 * requestAnimationFrame so a scan runs at most once per frame no matter
 * how many mutation records arrive.
 */
let scanScheduled = false;
function scheduleScan() {
  if (scanScheduled) return;
  scanScheduled = true;
  requestAnimationFrame(() => {
    scanScheduled = false;
    scan();
  });
}

const observer = new MutationObserver(scheduleScan);

function start() {
  // The observer runs regardless of `enabled`: it's cheap (see
  // scheduleScan) and keeping it live means flipping the popup toggle can
  // take effect instantly, without needing a page reload.
  scan();
  observer.observe(document.documentElement, { childList: true, subtree: true });
}

/**
 * Mirrors `enabled` onto <html> as a class so the static CSS pre-hide rules
 * in styles.css (see html:not(.gcs-disabled) there) can be switched off
 * when the extension is actually disabled. That CSS applies instantly at
 * document_start assuming "enabled" (its default), since reading the real
 * value from storage is async — this reconciles it as soon as we know.
 */
function updateDisabledClass() {
  document.documentElement.classList.toggle('gcs-disabled', !enabled);
}

chrome.storage.local.get({ [STORAGE_KEY]: true }, (result) => {
  enabled = result[STORAGE_KEY];
  updateDisabledClass();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
});

// React live when the popup toggle changes, so open tabs update without a reload.
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'local' || !(STORAGE_KEY in changes)) return;
  enabled = changes[STORAGE_KEY].newValue;
  updateDisabledClass();
  knownOverviews.forEach(applyVisibility);
});

// Re-scan when a page is restored from the back/forward cache, since the
// DOM is reused as-is and no new mutations or load events fire.
window.addEventListener('pageshow', (event) => {
  if (event.persisted) scan();
});

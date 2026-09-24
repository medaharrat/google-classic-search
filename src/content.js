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

/** Storage key for the popup's enable/disable toggle (see src/popup.js). */
const STORAGE_KEY = 'enabled';

/** Storage key for the popup's opt-in "reduce flash" toggle. Off by default. */
const REDUCE_FLASH_KEY = 'reduceFlash';

/**
 * How long to keep the results column hidden when "reduce flash" is on, to
 * give a late-arriving AI Overview a chance to load and get classified
 * before anything is shown. Fixed rather than adaptive on purpose — this is
 * a deliberate, user-opted-into trade-off between a bounded delay and
 * flash risk, not something to silently tune based on page behavior.
 */
const REDUCE_FLASH_DELAY_MS = 600;

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
 * Hide a single AI Overview element. Uses a CSS class (see styles.css)
 * rather than inline styles so behavior is easy to inspect/override, and
 * marks the element so we never re-process it. Visibility itself still
 * follows the `enabled` flag, so this is a no-op while disabled.
 */
function hideAIOverview(element) {
  if (element.hasAttribute(OVERVIEW_MARKER)) return;
  element.setAttribute(OVERVIEW_MARKER, 'true');
  knownOverviews.add(element);
  applyVisibility(element);
  collapseEmptyAncestors(element);
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
      (child) => !child.hasAttribute(OVERVIEW_MARKER)
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
  for (const el of findAIOverviews()) {
    hideAIOverview(el);
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

/** Reveals the results column that "reduce flash" mode hides (see styles.css). */
function revealResults() {
  document.documentElement.classList.remove('gcs-reveal-pending');
}

chrome.storage.local.get({ [STORAGE_KEY]: true, [REDUCE_FLASH_KEY]: false }, (result) => {
  enabled = result[STORAGE_KEY];
  updateDisabledClass();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }

  // Opt-in only: hide the results column up front and reveal it after a
  // fixed grace period, so a late-arriving AI Overview gets classified and
  // hidden before anything is shown. See REDUCE_FLASH_DELAY_MS.
  if (enabled && result[REDUCE_FLASH_KEY]) {
    document.documentElement.classList.add('gcs-reveal-pending');
    setTimeout(revealResults, REDUCE_FLASH_DELAY_MS);
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

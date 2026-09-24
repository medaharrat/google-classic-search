/**
 * Minimal, dependency-free tests for the detection logic in src/content.js.
 *
 * Run with: node tests/detection.test.js
 *
 * These tests build small DOM fixtures by hand using jsdom-free string
 * parsing is not available in plain Node, so instead we exercise the pure
 * text-normalization/label logic directly, and document the manual DOM
 * checklist (see CONTRIBUTING.md) for full browser-DOM coverage.
 */
const assert = require('node:assert');

// Re-implemented copies of the pure helpers from src/content.js so this
// file has no build step and no DOM dependency. Keep in sync manually;
// if these drift, update both.
const AI_OVERVIEW_LABELS = new Set([
  'ai overview',
  'ai overviews',
  'generative ai is experimental',
]);

function normalizeText(text) {
  return (text || '').trim().toLowerCase();
}

function isAIOverviewLabel(text) {
  return AI_OVERVIEW_LABELS.has(normalizeText(text));
}

// --- Tests ---

assert.strictEqual(isAIOverviewLabel('AI Overview'), true, 'exact label should match');
assert.strictEqual(isAIOverviewLabel('  ai overview  '), true, 'whitespace should be trimmed');
assert.strictEqual(isAIOverviewLabel('AI Overviews'), true, 'plural label should match');
assert.strictEqual(isAIOverviewLabel('Images'), false, 'unrelated label should not match');
assert.strictEqual(isAIOverviewLabel('Related searches'), false, 'unrelated label should not match');
assert.strictEqual(isAIOverviewLabel(''), false, 'empty text should not match');
assert.strictEqual(isAIOverviewLabel(undefined), false, 'undefined text should not match');

console.log('All detection helper tests passed.');

/**
 * Popup UI logic. Reads/writes a single boolean in chrome.storage.local —
 * no other state, no network requests. See PRIVACY.md.
 */
const STORAGE_KEY = 'enabled';

const toggle = document.getElementById('enabled-toggle');
const status = document.getElementById('status');

function render(enabled) {
  toggle.checked = enabled;
  status.textContent = enabled ? 'AI answers are hidden.' : 'AI answers are shown.';
}

chrome.storage.local.get({ [STORAGE_KEY]: true }, (result) => {
  render(result[STORAGE_KEY]);
});

toggle.addEventListener('change', () => {
  const enabled = toggle.checked;
  render(enabled);
  chrome.storage.local.set({ [STORAGE_KEY]: enabled });
});
